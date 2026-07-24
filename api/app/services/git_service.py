import os
import shutil
import re
import zipfile
import io
import httpx
from typing import Dict, Any

class GitService:
    @staticmethod
    def parse_repo_url(repo_url: str) -> Dict[str, str]:
        """Extract owner and repo name from GitHub URL or shorthand owner/repo."""
        clean_url = repo_url.strip().rstrip('/')
        match = re.search(r'github\.com/([^/]+)/([^/]+?)(?:\.git)?$', clean_url)
        if match:
            return {"owner": match.group(1), "repo": match.group(2), "full_name": f"{match.group(1)}/{match.group(2)}"}
        
        parts = clean_url.split('/')
        if len(parts) == 2:
            return {"owner": parts[0], "repo": parts[1], "full_name": clean_url}
        
        repo_name = parts[-1].replace('.git', '')
        owner = parts[-2] if len(parts) > 1 else "github"
        return {"owner": owner, "repo": repo_name, "full_name": f"{owner}/{repo_name}"}

    @staticmethod
    def clone_repository(repo_url: str, target_dir: str) -> Dict[str, Any]:
        """Download GitHub repository to target_dir via HTTP Zip archive."""
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir, ignore_errors=True)
            
        repo_info = GitService.parse_repo_url(repo_url)
        os.makedirs(target_dir, exist_ok=True)
        
        cloned_successfully = False

        # Try downloading repository ZIP archive directly via HTTP
        for branch in ["main", "master"]:
            zip_url = f"https://github.com/{repo_info['full_name']}/archive/refs/heads/{branch}.zip"
            try:
                with httpx.Client(follow_redirects=True, timeout=25.0) as client:
                    resp = client.get(zip_url)
                    if resp.status_code == 200:
                        with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
                            z.extractall(target_dir)
                            subdirs = [os.path.join(target_dir, d) for d in os.listdir(target_dir) if os.path.isdir(os.path.join(target_dir, d))]
                            if subdirs:
                                nested_dir = subdirs[0]
                                for item in os.listdir(nested_dir):
                                    shutil.move(os.path.join(nested_dir, item), os.path.join(target_dir, item))
                                shutil.rmtree(nested_dir, ignore_errors=True)
                        cloned_successfully = True
                        break
            except Exception as zip_err:
                print(f"Zip download failed for {branch}: {zip_err}")

        if not cloned_successfully:
            raise Exception(f"Unable to download repository '{repo_info['full_name']}'. Please check URL visibility.")
            
        total_files = 0
        total_loc = 0
        file_tree = []
        ignored_dirs = {'.git', 'node_modules', 'venv', '.venv', '__pycache__', 'dist', 'build', '.next', '.target'}
        
        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith('.')]
            for f in files:
                if f.startswith('.') or f.endswith(('.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.exe', '.lock')):
                    continue
                file_path = os.path.join(root, f)
                rel_path = os.path.relpath(file_path, target_dir)
                total_files += 1
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as fp:
                        lines = sum(1 for _ in fp)
                        total_loc += lines
                except Exception:
                    pass
                file_tree.append(rel_path)

        return {
            "owner": repo_info["owner"],
            "repo_name": repo_info["repo"],
            "full_name": repo_info["full_name"],
            "target_dir": target_dir,
            "total_files": total_files,
            "total_loc": total_loc,
            "file_tree": file_tree
        }
