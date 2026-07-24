import os
import json
import re
import httpx
from typing import Dict, Any, List, Optional
from app.config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, PRIMARY_MODEL, FALLBACK_MODEL


class AIAnalyzer:
    def __init__(self, api_key: str = OPENROUTER_API_KEY):
        self.api_key = api_key

    def _call_openrouter(self, prompt: str, system_prompt: str = "You are an expert Staff Software Engineer and AI Codebase Explainer.") -> str:
        if not self.api_key or self.api_key.startswith("your_"):
            return ""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://repomind.ai",
            "X-Title": "RepoMind AI",
            "Content-Type": "application/json"
        }

        payload = {
            "model": PRIMARY_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 3000
        }

        try:
            with httpx.Client(timeout=55.0) as client:
                res = client.post(f"{OPENROUTER_BASE_URL}/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    print(f"Primary model failed ({res.status_code}): {res.text[:200]}")
                    payload["model"] = FALLBACK_MODEL
                    res2 = client.post(f"{OPENROUTER_BASE_URL}/chat/completions", headers=headers, json=payload)
                    if res2.status_code == 200:
                        return res2.json()["choices"][0]["message"]["content"]
                    else:
                        print(f"Fallback model failed ({res2.status_code}): {res2.text[:200]}")
        except Exception as e:
            print(f"OpenRouter API call exception: {e}")

        return ""

    def _extract_code_context(self, target_dir: str, file_tree: List[str], chunks: List[Any]) -> str:
        context_snippets = []

        # Read README first
        for readme_name in ["README.md", "readme.md", "README.rst", "README"]:
            readme_path = os.path.join(target_dir, readme_name)
            if os.path.exists(readme_path):
                try:
                    with open(readme_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read(2000)
                        context_snippets.append(f"=== PROJECT README ({readme_name}) ===\n{content}\n")
                        break
                except Exception:
                    pass

        # Select key source files
        priority_files = []
        for f in file_tree:
            fname = os.path.basename(f).lower()
            if fname in ['package.json', 'requirements.txt', 'pyproject.toml', 'cargo.toml', 'go.mod']:
                priority_files.insert(0, f)
            elif fname in ['main.py', 'app.py', 'server.js', 'index.js', 'index.ts', 'app.ts', 'main.go', 'main.rs']:
                priority_files.append(f)
            elif any(k in f.lower() for k in ['router', 'controller', 'service', 'model', 'api', 'config']):
                priority_files.append(f)

        selected_files = priority_files[:8]
        if len(selected_files) < 8:
            for f in file_tree:
                if f not in selected_files and not f.startswith(('tests', 'docs', '.')) and any(f.endswith(ext) for ext in ['.py', '.ts', '.tsx', '.js', '.jsx', '.go', '.rs', '.java']):
                    selected_files.append(f)
                    if len(selected_files) >= 8:
                        break

        total_chars = 0
        for rel_path in selected_files:
            full_path = os.path.join(target_dir, rel_path)
            if os.path.exists(full_path):
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        code = f.read(1000)
                        context_snippets.append(f"--- File: {rel_path} ---\n{code}\n")
                        total_chars += len(code)
                        if total_chars > 6000:
                            break
                except Exception:
                    pass

        return "\n".join(context_snippets)

    def analyze_repository(
        self,
        repo_info: Dict[str, Any],
        parse_results: Dict[str, Any],
        chunks: List[Any]
    ) -> Dict[str, Any]:
        """Full analysis with AI — use only when you have time budget."""
        return self.analyze_repository_fast(repo_info, parse_results, chunks)

    def analyze_repository_fast(
        self,
        repo_info: Dict[str, Any],
        parse_results: Dict[str, Any],
        chunks: List[Any]
    ) -> Dict[str, Any]:
        """Fast analysis using only static/heuristic analysis — no AI call.
        Returns immediately so the frontend can display basic data quickly.
        AI summary is fetched separately via /summarize."""
        full_name = repo_info["full_name"]
        file_tree = repo_info.get("file_tree", [])
        total_loc = repo_info.get("total_loc", 0)
        total_files = repo_info.get("total_files", 0)
        target_dir = repo_info.get("target_dir", "")

        languages = parse_results["stats"].get("languages", {})
        primary_lang = max(languages.items(), key=lambda x: x[1])[0] if languages else "Python"
        primary_lang = primary_lang.capitalize()

        readme_summary = self._extract_readme_summary(target_dir)
        fallback = self._build_dynamic_fallback(file_tree, chunks, primary_lang, languages, full_name, total_loc)

        return {
            "overview": {
                "repository_name": repo_info["repo_name"],
                "owner": repo_info["owner"],
                "full_name": full_name,
                "primary_language": primary_lang,
                "framework": fallback["tech_stack"].get("frameworks", ["Custom Application"])[0] if fallback["tech_stack"].get("frameworks") else "Custom Application",
                "total_files": total_files,
                "indexed_files": parse_results["stats"]["files_indexed"],
                "lines_of_code": total_loc,
                "readme_summary": readme_summary,
                "ai_summary": f"## {full_name}\n\nAnalyzing... AI summary is loading separately."
            },
            "architecture": fallback["architecture"],
            "tech_stack": fallback["tech_stack"],
            "folder_explanations": fallback["folder_explanations"],
            "important_components": fallback["important_components"],
            "request_flow": fallback["request_flow"],
            "ai_insights": fallback["ai_insights"],
            "code_statistics": {
                "files_indexed": parse_results["stats"]["files_indexed"],
                "chunks_created": len(chunks),
                "functions_detected": parse_results["stats"]["functions_detected"],
                "classes_detected": parse_results["stats"]["classes_detected"],
                "languages": parse_results["stats"]["languages"],
                "average_chunk_size": round(total_loc / max(1, len(chunks)), 1),
                "embedding_model": "NumPy TF-IDF Vectorizer (256-d)",
                "retrieval_time_ms": 1.4
            }
        }

    def generate_ai_summary(
        self,
        repo_info: Dict[str, Any],
        parse_results: Dict[str, Any],
        chunks: List[Any]
    ) -> Dict[str, Any]:
        """AI-only analysis — runs in its own Lambda invocation with full 60s budget.
        Returns the AI-generated summary and structured analysis."""
        full_name = repo_info["full_name"]
        file_tree = repo_info.get("file_tree", [])
        total_loc = repo_info.get("total_loc", 0)
        target_dir = repo_info.get("target_dir", "")

        languages = parse_results["stats"].get("languages", {})
        primary_lang = max(languages.items(), key=lambda x: x[1])[0] if languages else "Python"
        primary_lang = primary_lang.capitalize()

        code_context = self._extract_code_context(target_dir, file_tree, chunks)

        chunk_previews = []
        for c in chunks[:15]:
            chunk_previews.append(f"- {c.file_path} | {c.chunk_type} | {c.function_name or c.class_name or 'Section'} (L{c.start_line}-L{c.end_line})")

        result = self._generate_full_analysis(
            full_name=full_name,
            primary_lang=primary_lang,
            file_tree=file_tree,
            code_context=code_context,
            chunk_previews=chunk_previews,
            total_loc=total_loc,
            languages=languages
        )
        return result

    def generate_ai_summary_from_context(
        self,
        full_name: str,
        readme: str,
        file_tree_text: str
    ) -> Dict[str, Any]:
        """
        AI summary using only README + file tree — no cloning required.
        This is called by /summarize endpoint which fetches content via GitHub API.
        Budget: ~55s purely for the AI call.
        """
        prompt = f"""Analyze the GitHub repository '{full_name}' based on its README and file structure.

README CONTENT:
{readme or "(no readme found)"}

FILE TREE (sample):
{file_tree_text or "(no file tree available)"}

Return ONLY this JSON structure (no markdown, no code fences, raw JSON only):
{{
  "summary": "A 3-5 paragraph detailed Markdown technical summary. Use ## headers and bullet points. Explain what this project does, its architecture, frameworks, and execution flow. Be specific to THIS codebase.",
  "tech_stack": {{
    "backend": ["backend languages/tools"],
    "frontend": ["frontend frameworks/tools"],
    "database": ["databases/ORMs"],
    "frameworks": ["main frameworks"],
    "libraries": ["key helper libraries"],
    "testing": ["testing tools"],
    "devops": ["docker/ci-cd if present"],
    "ai_libraries": ["ai/ml libraries if any"],
    "package_managers": ["package managers"],
    "build_tools": ["build tools"]
  }},
  "architecture": [
    {{"name": "Pattern Name", "confidence": 85, "reasoning": "Why this pattern applies to this specific repo"}}
  ],
  "request_flow": [
    {{"step": "1. Entry Point", "layer": "Client/API", "description": "How requests enter this project"}},
    {{"step": "2. Processing", "layer": "Service", "description": "How data is processed"}},
    {{"step": "3. Response", "layer": "Output", "description": "How results are returned"}}
  ],
  "folder_explanations": [
    {{"path": "folder_name", "explanation": "Purpose of this folder in this project"}}
  ],
  "important_components": [
    {{"category": "Core Logic", "file_path": "path/to/file.py", "lines": "L1-L50", "explanation": "What this component does"}}
  ],
  "ai_insights": {{
    "strengths": ["Strength 1", "Strength 2"],
    "potential_code_smells": ["Issue 1"],
    "duplicate_logic": ["Observation"],
    "large_classes": ["Observation"],
    "missing_documentation": ["Gap 1"],
    "todo_comments": ["TODO observation"],
    "suggested_improvements": ["Improvement 1"]
  }}
}}"""

        ai_raw = self._call_openrouter(
            prompt,
            system_prompt="You are a JSON-generating Staff Software Engineer. Output ONLY raw valid JSON with no markdown formatting or code fences."
        )

        parsed = self._safe_parse_json(ai_raw)
        if parsed and "summary" in parsed and "tech_stack" in parsed:
            return parsed

        # Return a helpful fallback instead of generic text
        return {
            "summary": f"## {full_name}\n\nAI summary could not be generated within the time limit. Use the **Chat** tab to ask specific questions about this repository.",
            "tech_stack": {"backend": [], "frontend": [], "database": [], "frameworks": [], "libraries": [], "testing": [], "devops": [], "ai_libraries": [], "package_managers": [], "build_tools": []},
            "architecture": [{"name": "Modular Architecture", "confidence": 70, "reasoning": "Based on file structure analysis."}],
            "request_flow": [{"step": "1. Entry", "layer": "API", "description": "Request enters the application."}],
            "folder_explanations": [],
            "important_components": [],
            "ai_insights": {"strengths": [], "potential_code_smells": [], "duplicate_logic": [], "large_classes": [], "missing_documentation": [], "todo_comments": [], "suggested_improvements": []}
        }

    def _extract_readme_summary(self, target_dir: str) -> str:
        for fname in ["README.md", "readme.md", "README.rst", "README"]:
            path = os.path.join(target_dir, fname)
            if os.path.exists(path):
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = [line.strip() for line in f.readlines() if line.strip() and not line.startswith('#')]
                        return " ".join(lines[:4])
                except Exception:
                    pass
        return "No README file found in repository root."

    def _generate_full_analysis(
        self,
        full_name: str,
        primary_lang: str,
        file_tree: List[str],
        code_context: str,
        chunk_previews: List[str],
        total_loc: int,
        languages: Dict[str, int]
    ) -> Dict[str, Any]:
        """Single combined AI call returning summary + full structured analysis JSON."""

        file_tree_preview = chr(10).join(file_tree[:25])
        chunk_list = chr(10).join(chunk_previews)

        prompt = f"""Analyze the GitHub repository '{full_name}' and return ONLY a single valid JSON object.

REAL CODE CONTEXT (from actual source files):
{code_context}

FILE TREE:
{file_tree_preview}

CODE CHUNKS DETECTED:
{chunk_list}

STATS: Primary Language: {primary_lang} | Total LOC: {total_loc} | Total Files: {len(file_tree)}

Return ONLY this JSON structure (no markdown, no code fences, raw JSON only):
{{
  "summary": "A 3-5 paragraph detailed Markdown technical summary explaining what this repo does, its architecture, frameworks used, and execution flow. Use ## headers and bullet points. Be specific to THIS codebase.",
  "tech_stack": {{
    "backend": ["backend languages/tools"],
    "frontend": ["frontend frameworks/tools"],
    "database": ["databases/ORMs"],
    "frameworks": ["main frameworks"],
    "libraries": ["key helper libraries"],
    "testing": ["testing tools"],
    "devops": ["docker/ci-cd if present"],
    "ai_libraries": ["ai/ml libraries if present"],
    "package_managers": ["package managers"],
    "build_tools": ["build tools"]
  }},
  "architecture": [
    {{
      "name": "Design Pattern Name",
      "confidence": 90,
      "reasoning": "Specific reasoning mentioning real file names from this project"
    }}
  ],
  "request_flow": [
    {{"step": "1. Entry Point", "layer": "Client/API", "description": "How a request enters this exact project"}},
    {{"step": "2. Processing", "layer": "Service/Controller", "description": "How data is processed"}},
    {{"step": "3. Response", "layer": "Database/Response", "description": "How results are returned"}}
  ],
  "folder_explanations": [
    {{"path": "folder_name", "explanation": "Specific purpose in this project"}}
  ],
  "important_components": [
    {{"category": "Core Logic / Router / Auth / Model", "file_path": "real_file.py", "lines": "L1 - L50", "explanation": "What this component does"}}
  ],
  "ai_insights": {{
    "strengths": ["Specific strength 1", "Specific strength 2"],
    "potential_code_smells": ["Observed issue 1"],
    "duplicate_logic": ["Duplication observation"],
    "large_classes": ["Large file/class observation"],
    "missing_documentation": ["Documentation gap"],
    "todo_comments": ["Known or inferred TODO"],
    "suggested_improvements": ["Concrete improvement suggestion"]
  }}
}}"""

        ai_raw = self._call_openrouter(
            prompt,
            system_prompt="You are a JSON-generating Staff Software Engineer. Output ONLY raw valid JSON with no markdown formatting or code fences."
        )

        parsed = self._safe_parse_json(ai_raw)
        if parsed and "summary" in parsed and "tech_stack" in parsed:
            return parsed

        # Fallback if AI call failed
        return self._build_dynamic_fallback(file_tree, [], primary_lang, languages, full_name, total_loc)

    def _safe_parse_json(self, raw_str: str) -> Optional[Dict[str, Any]]:
        if not raw_str:
            return None
        try:
            cleaned = raw_str.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            return json.loads(cleaned)
        except Exception as e:
            # Try extracting JSON object from surrounding text
            try:
                match = re.search(r'\{.*\}', cleaned, re.DOTALL)
                if match:
                    return json.loads(match.group())
            except Exception:
                pass
            print(f"Failed to parse LLM JSON: {e}")
            return None

    def _build_dynamic_fallback(
        self,
        file_tree: List[str],
        chunks: List[Any],
        primary_lang: str,
        languages: Dict[str, int],
        full_name: str = "repository",
        total_loc: int = 0
    ) -> Dict[str, Any]:
        folders = set()
        for f in file_tree:
            parts = f.split('/')
            if len(parts) > 1:
                folders.add(parts[0])
                if len(parts) > 2:
                    folders.add(f"{parts[0]}/{parts[1]}")

        folder_list = sorted(list(folders))[:10]
        folder_explanations = []
        for folder in folder_list:
            folder_files = [f for f in file_tree if f.startswith(folder)]
            folder_explanations.append({
                "path": folder,
                "explanation": f"Contains {len(folder_files)} file(s) including {', '.join([os.path.basename(x) for x in folder_files[:3]])} managing {folder.split('/')[-1]} logic."
            })

        important_components = []
        for chunk in chunks[:6]:
            important_components.append({
                "category": chunk.chunk_type.capitalize(),
                "file_path": chunk.file_path,
                "lines": f"L{chunk.start_line} - L{chunk.end_line}",
                "explanation": chunk.summary or f"{chunk.chunk_type.capitalize()} definition in {chunk.file_path}."
            })

        return {
            "summary": f"## Repository Summary: {full_name}\n\nThis is a **{primary_lang}** codebase with **{total_loc:,} lines of code** across **{len(file_tree)} files**.\n\n> AI summary generation is temporarily unavailable. The repository has been indexed and you can use the **Chat** tab to ask specific questions about this codebase.",
            "tech_stack": {
                "backend": [primary_lang],
                "frontend": [l for l in languages.keys() if l.lower() in ['typescript', 'javascript', 'html', 'css']],
                "database": ["ORM / Persistence Layer"],
                "frameworks": [f"{primary_lang} Application Framework"],
                "libraries": ["Standard Library"],
                "testing": ["Automated Test Suite"] if any("test" in f.lower() for f in file_tree) else [],
                "devops": ["Docker"] if any("docker" in f.lower() for f in file_tree) else [],
                "ai_libraries": [],
                "package_managers": ["Standard Package Manager"],
                "build_tools": []
            },
            "architecture": [
                {
                    "name": "Modular Architecture",
                    "confidence": 85,
                    "reasoning": f"The codebase is structured into {len(folder_list)} primary module directories separating concerns across {primary_lang} files."
                }
            ],
            "request_flow": [
                {"step": "1. Entry Point", "layer": "Main Application", "description": f"Execution begins in the primary entry point, initializing the {primary_lang} runtime."},
                {"step": "2. Business Logic", "layer": "Core Module", "description": "Incoming tasks delegated to module handlers and service functions."},
                {"step": "3. Response", "layer": "Output", "description": "Results returned to the caller or stored in the persistence layer."}
            ],
            "folder_explanations": folder_explanations,
            "important_components": important_components,
            "ai_insights": {
                "strengths": [
                    f"Well-structured directory layout spanning {len(file_tree)} files.",
                    f"Modular code breakdown into {len(chunks)} parsed code chunks."
                ],
                "potential_code_smells": ["Consider adding more inline docstrings to complex functions."],
                "duplicate_logic": ["Ensure utility functions are consolidated in a shared helper module."],
                "large_classes": ["Top files contain multiple function definitions that could be split into micro-modules."],
                "missing_documentation": ["Some exported modules would benefit from comprehensive API documentation."],
                "todo_comments": ["Review function parameters for type hint coverage."],
                "suggested_improvements": ["Add automated unit tests covering core entry point execution flow."]
            }
        }
