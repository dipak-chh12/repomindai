import os
import ast
import re
from typing import List, Dict, Any, Optional

class CodeChunk:
    def __init__(
        self,
        repository: str,
        file_path: str,
        language: str,
        chunk_type: str, # "function", "class", "module", "section"
        class_name: Optional[str],
        function_name: Optional[str],
        start_line: int,
        end_line: int,
        code_content: str,
        summary: Optional[str] = None
    ):
        self.repository = repository
        self.file_path = file_path
        self.language = language
        self.chunk_type = chunk_type
        self.class_name = class_name
        self.function_name = function_name
        self.start_line = start_line
        self.end_line = end_line
        self.code_content = code_content
        self.summary = summary or ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "repository": self.repository,
            "file_path": self.file_path,
            "language": self.language,
            "chunk_type": self.chunk_type,
            "class_name": self.class_name or "",
            "function_name": self.function_name or "",
            "start_line": self.start_line,
            "end_line": self.end_line,
            "code_content": self.code_content,
            "summary": self.summary
        }

class CodeParser:
    SUPPORTED_EXTENSIONS = {
        '.py': 'python',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.go': 'go',
        '.rs': 'rust',
        '.java': 'java',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'c',
        '.html': 'html',
        '.css': 'css',
        '.md': 'markdown',
        '.json': 'json',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.sql': 'sql',
        'Dockerfile': 'dockerfile'
    }

    @staticmethod
    def detect_language(file_path: str) -> str:
        basename = os.path.basename(file_path)
        if basename in CodeParser.SUPPORTED_EXTENSIONS:
            return CodeParser.SUPPORTED_EXTENSIONS[basename]
        ext = os.path.splitext(file_path)[1].lower()
        return CodeParser.SUPPORTED_EXTENSIONS.get(ext, 'text')

    @staticmethod
    def parse_python_file(repo_name: str, rel_path: str, content: str) -> List[CodeChunk]:
        chunks = []
        lines = content.splitlines()
        
        try:
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    start = getattr(node, 'lineno', 1)
                    end = getattr(node, 'end_lineno', len(lines))
                    chunk_code = "\n".join(lines[start-1:end])
                    doc = ast.get_docstring(node) or ""
                    chunks.append(CodeChunk(
                        repository=repo_name,
                        file_path=rel_path,
                        language="python",
                        chunk_type="class",
                        class_name=node.name,
                        function_name=None,
                        start_line=start,
                        end_line=end,
                        code_content=chunk_code,
                        summary=f"Class {node.name}. {doc[:100]}"
                    ))
                elif isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                    start = getattr(node, 'lineno', 1)
                    end = getattr(node, 'end_lineno', len(lines))
                    chunk_code = "\n".join(lines[start-1:end])
                    doc = ast.get_docstring(node) or ""
                    
                    # Find parent class if any
                    parent_class = None
                    for parent in ast.walk(tree):
                        if isinstance(parent, ast.ClassDef):
                            if any(child is node for child in ast.walk(parent)):
                                parent_class = parent.name
                                break

                    chunks.append(CodeChunk(
                        repository=repo_name,
                        file_path=rel_path,
                        language="python",
                        chunk_type="function",
                        class_name=parent_class,
                        function_name=node.name,
                        start_line=start,
                        end_line=end,
                        code_content=chunk_code,
                        summary=f"Function {node.name}. {doc[:100]}"
                    ))
        except Exception:
            pass

        # Fallback/Module level chunking if no ast nodes found or file is small
        if not chunks:
            chunks = CodeParser.fallback_line_chunker(repo_name, rel_path, "python", lines)

        return chunks

    @staticmethod
    def parse_js_ts_file(repo_name: str, rel_path: str, language: str, content: str) -> List[CodeChunk]:
        chunks = []
        lines = content.splitlines()
        
        # Regex heuristics for JS/TS functions, classes, exports
        func_pattern = re.compile(r'^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)|^(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(')
        class_pattern = re.compile(r'^(?:export\s+)?class\s+([A-Za-z0-9_]+)')
        
        current_type = None
        current_name = None
        start_line = 1
        
        for idx, line in enumerate(lines, 1):
            class_match = class_pattern.search(line)
            func_match = func_pattern.search(line)
            
            if class_match:
                name = class_match.group(1)
                chunks.append(CodeChunk(
                    repository=repo_name,
                    file_path=rel_path,
                    language=language,
                    chunk_type="class",
                    class_name=name,
                    function_name=None,
                    start_line=idx,
                    end_line=min(idx + 40, len(lines)),
                    code_content="\n".join(lines[idx-1:min(idx+40, len(lines))]),
                    summary=f"Class {name} in {rel_path}"
                ))
            elif func_match:
                name = func_match.group(1) or func_match.group(2)
                chunks.append(CodeChunk(
                    repository=repo_name,
                    file_path=rel_path,
                    language=language,
                    chunk_type="function",
                    class_name=None,
                    function_name=name,
                    start_line=idx,
                    end_line=min(idx + 30, len(lines)),
                    code_content="\n".join(lines[idx-1:min(idx+30, len(lines))]),
                    summary=f"Function {name} in {rel_path}"
                ))

        if not chunks:
            chunks = CodeParser.fallback_line_chunker(repo_name, rel_path, language, lines)
            
        return chunks

    @staticmethod
    def fallback_line_chunker(repo_name: str, rel_path: str, language: str, lines: List[str], chunk_size: int = 40) -> List[CodeChunk]:
        chunks = []
        total_lines = len(lines)
        if total_lines == 0:
            return chunks
            
        for i in range(0, total_lines, chunk_size):
            start = i + 1
            end = min(i + chunk_size, total_lines)
            chunk_code = "\n".join(lines[i:end])
            chunks.append(CodeChunk(
                repository=repo_name,
                file_path=rel_path,
                language=language,
                chunk_type="section",
                class_name=None,
                function_name=None,
                start_line=start,
                end_line=end,
                code_content=chunk_code,
                summary=f"Code section from line {start} to {end} in {rel_path}"
            ))
        return chunks

    @staticmethod
    def parse_repository(repo_dir: str, repo_name: str) -> Dict[str, Any]:
        all_chunks: List[CodeChunk] = []
        stats = {
            "files_indexed": 0,
            "functions_detected": 0,
            "classes_detected": 0,
            "languages": {}
        }
        
        ignored_dirs = {'.git', 'node_modules', 'venv', '.venv', '__pycache__', 'dist', 'build', '.next', '.target'}

        for root, dirs, files in os.walk(repo_dir):
            dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith('.')]
            for file in files:
                if file.startswith('.') or file.endswith(('.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.exe', '.lock', '.svg', '.min.js', '.min.css')):
                    continue
                    
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, repo_dir)
                lang = CodeParser.detect_language(rel_path)
                
                stats["languages"][lang] = stats["languages"].get(lang, 0) + 1
                stats["files_indexed"] += 1
                
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
                    if lang == 'python':
                        file_chunks = CodeParser.parse_python_file(repo_name, rel_path, content)
                    elif lang in ('typescript', 'javascript'):
                        file_chunks = CodeParser.parse_js_ts_file(repo_name, rel_path, lang, content)
                    else:
                        lines = content.splitlines()
                        file_chunks = CodeParser.fallback_line_chunker(repo_name, rel_path, lang, lines)

                    for chunk in file_chunks:
                        if chunk.chunk_type == 'function':
                            stats["functions_detected"] += 1
                        elif chunk.chunk_type == 'class':
                            stats["classes_detected"] += 1
                        all_chunks.append(chunk)

                except Exception:
                    pass

        return {
            "chunks": all_chunks,
            "stats": stats
        }
