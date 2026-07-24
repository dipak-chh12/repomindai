import os
import uuid
import threading
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any, List

from app.config import TEMP_REPOS_DIR, SAMPLE_REPOSITORIES
from app.services.git_service import GitService
from app.services.code_parser import CodeParser
from app.services.vector_service import VectorService
from app.services.ai_analyzer import AIAnalyzer
from app.services.chat_service import ChatService

router = APIRouter()

# Global state for current active repository report & task statuses
global_state = {
    "active_repo_url": None,
    "report": None,
    "vector_service": None,
    "chat_service": None,
    "tasks": {} # task_id -> {status, progress, stage, error, result}
}

class AnalyzeRequest(BaseModel):
    repo_url: str

class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5

class ChatRequest(BaseModel):
    question: str

def run_analysis_pipeline(task_id: str, repo_url: str):
    try:
        # Stage 1: Cloning Repository
        global_state["tasks"][task_id] = {
            "status": "processing",
            "progress": 15,
            "stage": "Cloning repository from GitHub...",
            "error": None
        }
        
        target_dir = os.path.join(TEMP_REPOS_DIR, task_id)
        git_info = GitService.clone_repository(repo_url, target_dir)

        # Stage 2: AST & Code Parsing
        global_state["tasks"][task_id] = {
            "status": "processing",
            "progress": 35,
            "stage": "Parsing files, AST trees & functions...",
            "error": None
        }
        
        parse_results = CodeParser.parse_repository(target_dir, git_info["repo_name"])
        chunks = parse_results["chunks"]

        # Stage 3: Embedding & FAISS Vector Indexing
        global_state["tasks"][task_id] = {
            "status": "processing",
            "progress": 60,
            "stage": "Generating embeddings & indexing FAISS vector store...",
            "error": None
        }
        
        vec_service = VectorService(dimension=256)
        vec_service.index_chunks(chunks)

        # Stage 4: AI Repository Pattern Analysis
        global_state["tasks"][task_id] = {
            "status": "processing",
            "progress": 85,
            "stage": "Analyzing architecture, tech stack & code insights...",
            "error": None
        }
        
        analyzer = AIAnalyzer()
        report = analyzer.analyze_repository(git_info, parse_results, chunks)

        # Stage 5: Finalize
        chat_svc = ChatService(vector_service=vec_service)
        
        global_state["active_repo_url"] = repo_url
        global_state["report"] = report
        global_state["vector_service"] = vec_service
        global_state["chat_service"] = chat_svc

        global_state["tasks"][task_id] = {
            "status": "completed",
            "progress": 100,
            "stage": "Analysis Complete!",
            "error": None,
            "report": report
        }
        
    except Exception as e:
        global_state["tasks"][task_id] = {
            "status": "failed",
            "progress": 0,
            "stage": "Failed to analyze repository",
            "error": str(e)
        }

@router.post("/analyze")
def analyze_repository(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    repo_url = req.repo_url.strip()
    if not repo_url:
        raise HTTPException(status_code=400, detail="Repository URL is required.")

    task_id = str(uuid.uuid4())[:8]
    global_state["tasks"][task_id] = {
        "status": "queued",
        "progress": 5,
        "stage": "Initializing repository analysis...",
        "error": None
    }

    background_tasks.add_task(run_analysis_pipeline, task_id, repo_url)
    
    return {
        "task_id": task_id,
        "message": "Analysis started in background."
    }

@router.get("/status/{task_id}")
def get_task_status(task_id: str):
    if task_id not in global_state["tasks"]:
        raise HTTPException(status_code=404, detail="Task not found.")
    return global_state["tasks"][task_id]

@router.get("/repository")
def get_repository_report():
    if not global_state["report"]:
        raise HTTPException(status_code=404, detail="No repository has been analyzed yet.")
    return global_state["report"]

@router.post("/search")
def search_code(req: SearchRequest):
    if not global_state["chat_service"]:
        raise HTTPException(status_code=400, detail="No active indexed repository found. Please analyze a repository first.")
    
    results = global_state["chat_service"].search(
        query=req.query,
        repo_url=global_state.get("active_repo_url", "https://github.com/repository"),
        top_k=req.top_k or 5
    )
    return {"query": req.query, "results": results}

@router.post("/chat")
def chat_with_repo(req: ChatRequest):
    if not global_state["chat_service"]:
        raise HTTPException(status_code=400, detail="No active indexed repository found. Please analyze a repository first.")
        
    repo_summary = ""
    if global_state.get("report") and "overview" in global_state["report"]:
        repo_summary = global_state["report"]["overview"].get("ai_summary", "")

    answer = global_state["chat_service"].answer_chat(
        question=req.question,
        repo_url=global_state.get("active_repo_url", "https://github.com/repository"),
        repo_summary=repo_summary
    )
    return answer

@router.delete("/repository")
def reset_repository():
    global_state["active_repo_url"] = None
    global_state["report"] = None
    global_state["vector_service"] = None
    global_state["chat_service"] = None
    return {"message": "Repository cleared successfully."}

@router.get("/sample-repos")
def get_sample_repositories():
    return {"samples": SAMPLE_REPOSITORIES}
