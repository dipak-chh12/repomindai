import os
import uuid
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from app.config import TEMP_REPOS_DIR, SAMPLE_REPOSITORIES
from app.services.git_service import GitService
from app.services.code_parser import CodeParser
from app.services.vector_service import VectorService
from app.services.ai_analyzer import AIAnalyzer
from app.services.chat_service import ChatService

router = APIRouter()

# In-memory store: works within a single Lambda invocation's lifetime
# For stateless Vercel serverless, analyze returns the full report directly
_store: Dict[str, Any] = {
    "active_repo_url": None,
    "report": None,
    "vector_service": None,
    "chat_service": None,
}

class AnalyzeRequest(BaseModel):
    repo_url: str

class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5

class ChatRequest(BaseModel):
    question: str


@router.post("/analyze")
def analyze_repository(req: AnalyzeRequest):
    """
    Synchronously runs the full analysis pipeline and returns the report.
    Vercel Serverless is stateless across requests, so we run everything in
    one shot and return the complete result — no polling needed.
    """
    repo_url = req.repo_url.strip()
    if not repo_url:
        raise HTTPException(status_code=400, detail="Repository URL is required.")

    task_id = str(uuid.uuid4())[:8]
    target_dir = os.path.join(TEMP_REPOS_DIR, task_id)

    try:
        # Step 1: Clone / download repository
        git_info = GitService.clone_repository(repo_url, target_dir)

        # Step 2: Parse AST + code chunks
        parse_results = CodeParser.parse_repository(target_dir, git_info["repo_name"])
        chunks = parse_results["chunks"]

        # Step 3: Build vector index
        vec_service = VectorService(dimension=256)
        vec_service.index_chunks(chunks)

        # Step 4: AI architecture analysis
        analyzer = AIAnalyzer()
        report = analyzer.analyze_repository(git_info, parse_results, chunks)

        # Step 5: Initialise chat service
        chat_svc = ChatService(vector_service=vec_service)

        # Cache in module-level store so chat/search work in SAME invocation
        _store["active_repo_url"] = repo_url
        _store["report"] = report
        _store["vector_service"] = vec_service
        _store["chat_service"] = chat_svc

        return {
            "task_id": task_id,
            "status": "completed",
            "progress": 100,
            "stage": "Analysis Complete!",
            "report": report,
            "message": "Analysis completed successfully."
        }

    except Exception as e:
        import traceback
        detail = f"{str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=detail)


@router.get("/status/{task_id}")
def get_task_status(task_id: str):
    # With synchronous analysis, status is always returned directly from /analyze
    # This endpoint exists for backwards-compat but can return 404
    raise HTTPException(status_code=404, detail="Status polling not needed; use the /analyze response directly.")


@router.get("/repository")
def get_repository_report():
    if not _store["report"]:
        raise HTTPException(status_code=404, detail="No repository has been analyzed yet.")
    return _store["report"]


@router.post("/search")
def search_code(req: SearchRequest):
    if not _store["chat_service"]:
        raise HTTPException(status_code=400, detail="No active indexed repository. Please analyze a repository first.")

    results = _store["chat_service"].search(
        query=req.query,
        repo_url=_store.get("active_repo_url", "https://github.com/repository"),
        top_k=req.top_k or 5
    )
    return {"query": req.query, "results": results}


@router.post("/chat")
def chat_with_repo(req: ChatRequest):
    if not _store["chat_service"]:
        raise HTTPException(status_code=400, detail="No active indexed repository. Please analyze a repository first.")

    repo_summary = ""
    if _store.get("report") and "overview" in _store["report"]:
        repo_summary = _store["report"]["overview"].get("ai_summary", "")

    answer = _store["chat_service"].answer_chat(
        question=req.question,
        repo_url=_store.get("active_repo_url", "https://github.com/repository"),
        repo_summary=repo_summary
    )
    return answer


@router.delete("/repository")
def reset_repository():
    _store["active_repo_url"] = None
    _store["report"] = None
    _store["vector_service"] = None
    _store["chat_service"] = None
    return {"message": "Repository cleared successfully."}


@router.get("/sample-repos")
def get_sample_repositories():
    return {"samples": SAMPLE_REPOSITORIES}
