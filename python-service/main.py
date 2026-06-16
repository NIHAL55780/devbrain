import json
import os
import re

import chromadb
from chromadb.config import Settings
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()
model = SentenceTransformer("all-MiniLM-L6-v2")

CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_data")
INDEX_BATCH_SIZE = int(os.getenv("INDEX_BATCH_SIZE", "64"))

client = chromadb.PersistentClient(
    path=CHROMA_PATH,
    settings=Settings(anonymized_telemetry=False),
)


class ChunkItem(BaseModel):
    name: str
    path: str
    chunk: str
    chunkIndex: int


class IndexRequest(BaseModel):
    repoId: str
    repoUrl: str
    chunks: list[ChunkItem]


class SearchRequest(BaseModel):
    repoId: str
    question: str
    topK: int = 8


def collection_name(repo_id: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9_]", "_", repo_id)
    safe = re.sub(r"_+", "_", safe).strip("_")
    if not safe:
        safe = "default"
    name = f"repo_{safe}"
    return name[:63]


def get_collection(repo_id: str):
    name = collection_name(repo_id)
    return client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},
    )


def ensure_text(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    if value is None:
        return ""
    return str(value)


def sanitize_text(value) -> str:
    """Strip invalid Unicode that breaks the HuggingFace tokenizer."""
    text = ensure_text(value)
    text = text.replace("\x00", "")
    # Lone surrogates (e.g. from mis-encoded binary) cause TextEncodeInput errors.
    text = text.encode("utf-8", errors="surrogatepass").decode("utf-8", errors="replace")
    return text.strip()


def embed_texts(texts: list[str]) -> list[list[float]]:
    embeddings: list[list[float]] = []
    for text in texts:
        clean = sanitize_text(text)
        if not clean:
            raise ValueError("empty text after sanitization")
        vector = model.encode(clean, convert_to_numpy=True)
        embeddings.append(vector.tolist())
    return embeddings


@app.post("/index")
def index_repo(req: IndexRequest):
    if not req.chunks:
        raise HTTPException(status_code=400, detail="chunks is required")
    if not req.repoId.strip():
        raise HTTPException(status_code=400, detail="repoId is required")

    name = collection_name(req.repoId)
    try:
        client.delete_collection(name)
    except Exception:
        pass

    collection = client.create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},
    )

    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict] = []

    for item in req.chunks:
        text = sanitize_text(item.chunk)
        if not text:
            continue
        ids.append(f"{item.path}:{item.chunkIndex}")
        documents.append(text)
        metadatas.append(
            {
                "name": item.name,
                "path": item.path,
                "chunkIndex": item.chunkIndex,
                "repoUrl": req.repoUrl,
            }
        )

    if not documents:
        raise HTTPException(status_code=400, detail="No valid text chunks to index")

    indexed_ids: list[str] = []
    indexed_docs: list[str] = []
    indexed_meta: list[dict] = []
    indexed_embeddings: list[list[float]] = []

    for doc_id, doc, meta in zip(ids, documents, metadatas):
        try:
            embedding = embed_texts([doc])[0]
        except Exception as exc:
            print(f"Skipping chunk {doc_id}: {exc}")
            continue
        indexed_ids.append(doc_id)
        indexed_docs.append(doc)
        indexed_meta.append(meta)
        indexed_embeddings.append(embedding)

    if not indexed_docs:
        raise HTTPException(status_code=400, detail="No valid text chunks to index")

    for start in range(0, len(indexed_docs), INDEX_BATCH_SIZE):
        end = start + INDEX_BATCH_SIZE
        collection.add(
            ids=indexed_ids[start:end],
            embeddings=indexed_embeddings[start:end],
            documents=indexed_docs[start:end],
            metadatas=indexed_meta[start:end],
        )

    return {"indexed": len(indexed_ids), "repoId": req.repoId, "collection": name}


@app.post("/search")
def search(req: SearchRequest):
    if not req.repoId.strip():
        raise HTTPException(status_code=400, detail="repoId is required")
    question = sanitize_text(req.question)
    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    name = collection_name(req.repoId)
    try:
        collection = client.get_collection(name)
    except Exception:
        raise HTTPException(status_code=404, detail="No repo indexed for this repoId")

    if collection.count() == 0:
        raise HTTPException(status_code=404, detail="No chunks indexed for this repoId")

    query_embedding = model.encode([question], convert_to_numpy=True).tolist()
    candidate_count = min(max(req.topK * 4, req.topK), 50, collection.count())

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=candidate_count,
        include=["documents", "metadatas", "distances"],
    )

    seen_paths: set[str] = set()
    selected: list[dict] = []

    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        path = meta["path"]
        if path in seen_paths:
            continue
        seen_paths.add(path)
        score = 1 - dist
        selected.append(
            {
                "path": path,
                "name": meta["name"],
                "chunk": doc,
                "chunkIndex": meta["chunkIndex"],
                "score": score,
            }
        )
        if len(selected) >= req.topK:
            break

    return {"chunks": selected, "repoId": req.repoId}


@app.get("/health")
def health():
    return {"status": "ok", "chroma_path": CHROMA_PATH}


@app.get("/stats/{repo_id}")
def stats(repo_id: str):
    name = collection_name(repo_id)
    try:
        collection = client.get_collection(name)
    except Exception:
        raise HTTPException(status_code=404, detail="No repo indexed for this repoId")

    return {"repoId": repo_id, "collection": name, "chunkCount": collection.count()}
