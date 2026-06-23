# DevBrain

Understand any GitHub repo with AI. Paste a repository URL, index the codebase, and ask natural-language questions grounded in retrieved source files.

DevBrain uses a **RAG (Retrieval-Augmented Generation)** pipeline: chunk code → embed with Sentence Transformers → store vectors in **ChromaDB** → retrieve relevant chunks per question → generate answers with **Groq**.

## Features

- Index public GitHub repositories via URL
- Semantic search over code chunks with ChromaDB
- Code-aware Q&A with cited sources (file path, score, preview)
- Multi-turn chat with conversation history
- Persistent vector index on disk (survives Python restarts)

## Architecture

```text
┌──────────────┐     ┌─────────────────────┐     ┌──────────────────────────┐
│   React UI   │────▶│  Node.js / Express  │────▶│  Python / FastAPI        │
│   (Vite)     │     │  :5000              │     │  :8000                   │
└──────────────┘     │                     │     │                          │
                     │  GitHub API fetch   │     │  Sentence Transformers   │
                     │  Chunking           │     │  ChromaDB (Persistent)   │
                     │  Groq LLM           │     │  POST /index, /search    │
                     └─────────────────────┘     └──────────────────────────┘
```

### Analyze flow

1. Node fetches and filters files from the GitHub API
2. Files are split into ~1000-character chunks (200-char overlap)
3. Chunks are sent to Python `POST /index`
4. Python embeds each chunk (`all-MiniLM-L6-v2`) and stores text + vectors in Chroma

### Ask flow

1. Node sends the question to Python `POST /search`
2. Chroma returns the most similar chunks (cosine similarity)
3. Node applies path-based re-ranking heuristics
4. Top chunks are passed as context to Groq for a grounded answer

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React, Vite, Tailwind CSS |
| API | Node.js, Express |
| Embeddings & vectors | Python, FastAPI, Sentence Transformers, ChromaDB |
| LLM | Groq API |
| External | GitHub API |

## Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- [Groq API key](https://console.groq.com/)
- [GitHub personal access token](https://github.com/settings/tokens) (for rate limits)

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd DevBrain
```

### 2. Python embedding service

```bash
cd python-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

On first run, the embedding model (`all-MiniLM-L6-v2`) downloads from Hugging Face.

Verify: [http://localhost:8000/health](http://localhost:8000/health)

### 3. Node backend

In a new terminal:

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key
GITHUB_TOKEN=your_github_token
EMBED_SERVICE_URL=http://localhost:8000
```

Start the server:

```bash
node server.js
```

API runs at [http://localhost:5000](http://localhost:5000)

### 4. React frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

UI runs at [http://localhost:5173](http://localhost:5173) and proxies `/api` to the backend.

## Usage

1. Open the frontend in your browser
2. Paste a GitHub repo URL (e.g. `https://github.com/owner/repo`)
3. Click **Analyze** and wait for indexing to finish
4. Ask a question about the codebase
5. Review the answer and **Sources** panel for retrieved file chunks

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/repo/analyze` | Fetch, chunk, and index a repo into Chroma |
| `POST` | `/api/repo/ask` | Search Chroma and generate an answer |

### Analyze request

```json
{
  "repoUrl": "https://github.com/owner/repo"
}
```

### Analyze response

```json
{
  "message": "Repo analyzed successfully",
  "repoId": "owner_repo",
  "totalChunks": 120
}
```

### Ask request

```json
{
  "question": "How does authentication work?",
  "repoId": "owner_repo",
  "history": [
    { "question": "What is this project?", "answer": "..." }
  ]
}
```

### Python service endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/index` | Embed and store chunks in Chroma |
| `POST` | `/search` | Vector similarity search |
| `GET` | `/health` | Service health check |
| `GET` | `/stats/{repo_id}` | Chunk count for a collection |

## Environment variables

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `GROQ_API_KEY` | Node | Yes | Groq API key for answer generation |
| `GITHUB_TOKEN` | Node | Recommended | GitHub API token for higher rate limits |
| `EMBED_SERVICE_URL` | Node | No | Python service URL (default: `http://localhost:8000`) |
| `CHROMA_PATH` | Python | No | Chroma persistence directory (default: `./chroma_data`) |
| `INDEX_BATCH_SIZE` | Python | No | Chroma insert batch size (default: `64`) |

## Project structure

```text
DevBrain/
├── frontend/           # React UI (Vite)
├── backend/            # Express API, GitHub + Groq orchestration
│   ├── controllers/    # analyzeRepo, askQuestion
│   └── services/       # embedding, LLM, similarity, repo store
└── python-service/     # FastAPI, embeddings, ChromaDB
    ├── main.py
    ├── requirements.txt
    └── chroma_data/    # Local vector store (gitignored)
```

## How indexing works

- **Allowed extensions:** `.js`, `.py`, `.jsx`, `.tsx`, `.java`, `.cpp`, `.json`, `.md`
- **Max file size:** 50 KB
- **Chunk size:** 1000 characters with 200-character overlap
- **Collection naming:** one Chroma collection per repo (`repo_{owner}_{repo}`)
- Re-analyzing a repo replaces the previous index for that `repoId`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ECONNREFUSED` on analyze | Start the Python service first; confirm `/health` responds |
| `ModuleNotFoundError: chromadb` | Install deps inside `python-service/venv`: `pip install -r requirements.txt` |
| `Vector indexing service unavailable` | Check Python terminal for errors during `POST /index` |
| `No repo analyzed yet` | Run Analyze before Ask; ensure `repoId` matches |
| Index lost after restart | Chroma data should persist in `python-service/chroma_data/` — avoid deleting that folder |

## License

ISC
