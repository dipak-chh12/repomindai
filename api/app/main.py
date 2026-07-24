from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.repo_router import router as repo_router

app = FastAPI(
    title="RepoMind AI Backend API",
    description="AI-Powered GitHub Codebase Explainer API powering RAG retrieval, AST parsing, and codebase architecture insights.",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount with /api prefix — Vercel forwards the full path (e.g. /api/analyze) to this Lambda
app.include_router(repo_router, prefix="/api")
# Also mount without prefix for local development convenience
app.include_router(repo_router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "app": "RepoMind AI Backend",
        "version": "1.0.0"
    }
