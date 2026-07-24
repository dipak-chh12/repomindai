import logging
import httpx
from typing import List, Dict, Any, Optional
from app.services.vector_service import VectorService
from app.config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, PRIMARY_MODEL, FALLBACK_MODEL

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self, vector_service: VectorService):
        self.vector_service = vector_service
        self.api_key = OPENROUTER_API_KEY
        self.system_instruction = (
            "You are an expert AI Codebase Explainer and Staff Software Engineer. "
            "You are provided with a user query, a high-level repository summary, and retrieved code chunks from a repository. "
            "Your job is to answer the user's question accurately, comprehensively, and gracefully. "
            "Do NOT mention that you are a Gemini model. You are the 'AI Codebase Assistant'. "
            "CRITICAL: Take your time, think step-by-step, and produce a highly detailed, extremely high-quality response. "
            "CRITICAL: Heavily use Markdown formatting! Use headings (##), bold text (**), bullet points, and code blocks to structure your answer nicely. "
            "Do not output raw unstructured text. Make it look like a beautifully written technical documentation page. "
            "Always cite your sources if you reference specific files or lines from the context.\n\n"
            "CRITICAL FORMAT REQUIREMENT: At the very end of your response, ALWAYS append a section starting exactly with the delimiter:\n"
            "---FOLLOW_UP_QUESTIONS---\n"
            "Followed by 3 short, relevant, intelligent follow-up questions the user might want to ask next about this codebase (one per line, starting with '- ')."
        )

    def _call_openrouter(self, prompt: str) -> str:
        if not self.api_key or self.api_key.startswith("your_"):
            return "I am currently disconnected from the AI engine due to missing API keys."

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://repomind.ai",
            "X-Title": "RepoMind AI",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": PRIMARY_MODEL,
            "messages": [
                {"role": "system", "content": self.system_instruction},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 2048
        }

        try:
            with httpx.Client(timeout=55.0) as client:
                res = client.post(f"{OPENROUTER_BASE_URL}/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    # Try fallback model
                    logger.warning(f"Primary model failed ({res.status_code}): {res.text[:300]}")
                    payload["model"] = FALLBACK_MODEL
                    res2 = client.post(f"{OPENROUTER_BASE_URL}/chat/completions", headers=headers, json=payload)
                    if res2.status_code == 200:
                        return res2.json()["choices"][0]["message"]["content"]
                    else:
                        err_body = res2.text[:500]
                        logger.error(f"Both models failed. Last error: {err_body}")
                        return f"AI provider error ({res2.status_code}): {err_body}"
        except Exception as e:
            logger.error(f"OpenRouter API call exception in ChatService: {e}")
            return f"Connection error calling AI provider: {str(e)}"

    def answer_chat(self, question: str, repo_url: str, repo_summary: str = "") -> Dict[str, Any]:
        logger.info(f"Chat query for {repo_url}: {question}")
        
        try:
            retrieved = self.vector_service.search(question, top_k=5)
        except Exception as e:
            logger.error(f"Error retrieving context for chat: {e}")
            retrieved = []

        context_parts = []
        citations = []
        search_result_items = []
        
        for i, (chunk, score) in enumerate(retrieved):
            file_path = chunk.file_path
            start = chunk.start_line
            end = chunk.end_line
            c_text = chunk.code_content
            
            context_parts.append(
                f"--- [Source {i+1}] {file_path} (Lines {start}-{end}) ---\n"
                f"{c_text}\n"
            )
            
            citations.append({
                "source_id": i + 1,
                "file_path": file_path,
                "start_line": start,
                "end_line": end,
                "github_url": f"{repo_url}/blob/main/{file_path}#L{start}-L{end}"
            })
            
            search_result_items.append({
                "file_path": file_path,
                "language": chunk.language,
                "chunk_type": chunk.chunk_type,
                "class_name": chunk.class_name or "",
                "function_name": chunk.function_name or "",
                "start_line": start,
                "end_line": end,
                "score": score,
                "code_content": c_text,
                "summary": chunk.summary,
                "github_url": f"{repo_url}/blob/main/{file_path}#L{start}-L{end}"
            })

        context_str = "\n".join(context_parts)
        if not context_str:
            context_str = "No specific vector code chunks matched this exact query keyword."

        full_prompt = f"User Query: {question}\n\n"
        if repo_summary:
            full_prompt += f"High-Level Repository Overview:\n{repo_summary[:4000]}\n\n"

        full_prompt += (
            f"Retrieved Code Context Chunks:\n"
            f"{context_str}\n\n"
            f"INSTRUCTIONS:\n"
            f"1. Provide a comprehensive, highly insightful answer to the user's query.\n"
            f"2. Use the Repository Overview and Code Context Chunks provided above.\n"
            f"3. Thoroughly explain the relevant code concepts, file interactions, and functionality!\n"
            f"4. Structure your output with clear Markdown headers (##), bold key terms, lists, and code blocks.\n"
            f"5. End your output with the '---FOLLOW_UP_QUESTIONS---' delimiter and 3 bulleted follow-up questions."
        )

        answer_text = self._call_openrouter(full_prompt)

        return {
            "answer": answer_text,
            "citations": citations,
            "retrieved_chunks": search_result_items
        }

    def search(self, query: str, repo_url: str, top_k: int = 5) -> List[Dict[str, Any]]:
        retrieved = self.vector_service.search(query, top_k=top_k)
        results = []
        for chunk, score in retrieved:
            results.append({
                "file_path": chunk.file_path,
                "language": chunk.language,
                "chunk_type": chunk.chunk_type,
                "class_name": chunk.class_name or "",
                "function_name": chunk.function_name or "",
                "start_line": chunk.start_line,
                "end_line": chunk.end_line,
                "score": score,
                "code_content": chunk.code_content,
                "summary": chunk.summary,
                "github_url": f"{repo_url}/blob/main/{chunk.file_path}#L{chunk.start_line}-L{chunk.end_line}"
            })
        return results
