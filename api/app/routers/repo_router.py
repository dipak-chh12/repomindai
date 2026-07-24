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

# Module-level store — valid within a single Lambda invocation
# (i.e., works if analyze + chat happen in same warm container)
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
    repo_url: Optional[str] = None  # if provided, will re-index if no state


class ChatRequest(BaseModel):
    question: str
    repo_url: Optional[str] = None  # if provided, will re-index if no state
    repo_summary: Optional[str] = ""


def _ensure_state(repo_url: str):
    """Re-run analysis pipeline if current state is for a different (or no) repo."""
    if _store["chat_service"] and _store["active_repo_url"] == repo_url:
        return  # already indexed

    task_id = str(uuid.uuid4())[:8]
    target_dir = os.path.join(TEMP_REPOS_DIR, task_id)
    git_info = GitService.clone_repository(repo_url, target_dir)
    parse_results = CodeParser.parse_repository(target_dir, git_info["repo_name"])
    chunks = parse_results["chunks"]
    vec_service = VectorService(dimension=256)
    vec_service.index_chunks(chunks)
    chat_svc = ChatService(vector_service=vec_service)

    _store["active_repo_url"] = repo_url
    _store["vector_service"] = vec_service
    _store["chat_service"] = chat_svc


class SummarizeRequest(BaseModel):
    repo_url: str
    file_tree: list
    primary_lang: str
    total_loc: int
    target_dir: str = ""
    full_name: str = ""


@router.post("/analyze")
def analyze_repository(req: AnalyzeRequest):
    """
    Synchronously runs the full analysis pipeline and returns the report.
    AI summary is generated separately via /summarize to stay within timeout.
    """
    repo_url = req.repo_url.strip()
    if not repo_url:
        raise HTTPException(status_code=400, detail="Repository URL is required.")

    task_id = str(uuid.uuid4())[:8]
    target_dir = os.path.join(TEMP_REPOS_DIR, task_id)

    try:
        git_info = GitService.clone_repository(repo_url, target_dir)
        parse_results = CodeParser.parse_repository(target_dir, git_info["repo_name"])
        chunks = parse_results["chunks"]

        vec_service = VectorService(dimension=256)
        vec_service.index_chunks(chunks)

        # Generate report WITHOUT AI summary (fast path, stays within timeout)
        analyzer = AIAnalyzer()
        report = analyzer.analyze_repository_fast(git_info, parse_results, chunks)

        chat_svc = ChatService(vector_service=vec_service)

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


@router.post("/summarize")
def generate_ai_summary(req: AnalyzeRequest):
    """
    Separate endpoint that generates the AI summary for a repo_url.
    Called by the frontend AFTER /analyze returns, as a second async fetch.
    This runs in its own Lambda invocation with the full 60s budget.
    """
    repo_url = req.repo_url.strip()
    if not repo_url:
        raise HTTPException(status_code=400, detail="Repository URL is required.")

    task_id = str(uuid.uuid4())[:8]
    target_dir = os.path.join(TEMP_REPOS_DIR, task_id)

    try:
        git_info = GitService.clone_repository(repo_url, target_dir)
        parse_results = CodeParser.parse_repository(target_dir, git_info["repo_name"])
        chunks = parse_results["chunks"]
        analyzer = AIAnalyzer()
        return analyzer.generate_ai_summary(git_info, parse_results, chunks)
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"{str(e)}\n{traceback.format_exc()}")


@router.get("/status/{task_id}")
def get_task_status(task_id: str):
    raise HTTPException(
        status_code=410,
        detail="Polling not needed. The /analyze endpoint returns the full report directly."
    )


@router.get("/repository")
def get_repository_report():
    if not _store["report"]:
        raise HTTPException(status_code=404, detail="No repository has been analyzed yet.")
    return _store["report"]


@router.post("/search")
def search_code(req: SearchRequest):
    # If repo_url provided and no current state, re-index (slow but correct)
    if req.repo_url and not _store["chat_service"]:
        try:
            _ensure_state(req.repo_url)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to index repo for search: {e}")

    if not _store["chat_service"]:
        raise HTTPException(
            status_code=400,
            detail="No active indexed repository. Please analyze a repository first."
        )

    results = _store["chat_service"].search(
        query=req.query,
        repo_url=_store.get("active_repo_url", req.repo_url or ""),
        top_k=req.top_k or 5
    )
    return {"query": req.query, "results": results}


@router.post("/chat")
def chat_with_repo(req: ChatRequest):
    # If repo_url provided and no current state, re-index (slower but stateless-safe)
    if req.repo_url and not _store["chat_service"]:
        try:
            _ensure_state(req.repo_url)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to index repo for chat: {e}")

    if not _store["chat_service"]:
        raise HTTPException(
            status_code=400,
            detail="No active indexed repository. Please analyze a repository first, or pass 'repo_url' in the request body."
        )

    repo_summary = req.repo_summary or ""
    if not repo_summary and _store.get("report") and "overview" in _store["report"]:
        repo_summary = _store["report"]["overview"].get("ai_summary", "")

    answer = _store["chat_service"].answer_chat(
        question=req.question,
        repo_url=_store.get("active_repo_url", req.repo_url or ""),
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
