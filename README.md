# RepoMind AI

## Project Overview
RepoMind AI is a lightweight code‑analysis and chat assistant that lets you explore a GitHub repository, run AI‑powered searches, and ask detailed questions about the codebase.

## Features
- Minimal, blocky dark UI with pure black background.
- AI‑driven code search using vector embeddings.
- Interactive chat with follow‑up questions, rendering markdown nicely.
- Serverless backend deployed on Vercel (Python FastAPI).
- Sample repositories endpoint for quick demos.

## Quick Start (Local Development)
```bash
# Clone the repository
git clone https://github.com/dipak-chh12/repomindai.git
cd repomindai

# Backend setup (Python)
python -m venv venv
source venv/bin/activate
pip install -r api/requirements.txt
uvicorn api/app/main:app --reload

# Frontend setup (Node.js)
cd frontend
npm install
npm run dev
```

## Deployment (Vercel)
The backend lives in the `api/` directory and is automatically bundled as a Vercel serverless function. Deploy with:
```bash
npx vercel deploy --prod --yes
```
The frontend is a standard Vite app and is also deployed by Vercel.

## API Endpoints
- `POST /api/analyze` – start analysis of a GitHub repo.
- `GET /api/status/{task_id}` – check analysis progress.
- `POST /api/search` – query code embeddings.
- `POST /api/chat` – ask questions about the repo.
- `GET /api/sample-repos` – list example repositories.

## License
MIT License – see [LICENSE](LICENSE) for details.
