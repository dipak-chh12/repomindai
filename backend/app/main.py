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

app.include_router(repo_router, prefix="/api")

@app.get("/")
def health_check():
    return {
        "status": "online",
        "app": "RepoMind AI Backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
