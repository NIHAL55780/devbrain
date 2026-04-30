from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()
model = SentenceTransformer("all-MiniLM-L6-v2")


class EmbedRequest(BaseModel):
    texts: list[str]


@app.post("/embed")
def embed(req: EmbedRequest):
    if not req.texts:
        raise HTTPException(status_code=400, detail="texts is required")
    embeddings = model.encode(req.texts).tolist()
    return {"embeddings": embeddings}


@app.get("/health")
def health():
    return {"status": "ok"}
