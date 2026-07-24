import os
from pydantic import BaseModel
from typing import List, Dict

# Load environment variables from root or backend .env if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
PRIMARY_MODEL = "google/gemini-2.5-flash"
FALLBACK_MODEL = "google/gemini-2.0-flash-001"

# Directory where repositories are temporarily cloned
TEMP_REPOS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_repos")
os.makedirs(TEMP_REPOS_DIR, exist_ok=True)

# Sample Repositories for quick exploration
SAMPLE_REPOSITORIES = [
    {
        "id": "fastapi-demo",
        "name": "fastapi/fastapi",
        "url": "https://github.com/fastapi/fastapi",
        "description": "FastAPI framework, high performance, easy to learn, fast to code, ready for production",
        "language": "Python",
        "stars": "75k+",
        "framework": "FastAPI"
    },
    {
        "id": "express-demo",
        "name": "expressjs/express",
        "url": "https://github.com/expressjs/express",
        "description": "Fast, unopinionated, minimalist web framework for Node.js",
        "language": "TypeScript / JavaScript",
        "stars": "65k+",
        "framework": "Express.js"
    },
    {
        "id": "flask-demo",
        "name": "pallets/flask",
        "url": "https://github.com/pallets/flask",
        "description": "The Python micro framework for building web applications",
        "language": "Python",
        "stars": "68k+",
        "framework": "Flask"
    },
    {
        "id": "shadcn-ui-demo",
        "name": "shadcn-ui/ui",
        "url": "https://github.com/shadcn-ui/ui",
        "description": "Beautifully designed components that you can copy and paste into your apps.",
        "language": "TypeScript",
        "stars": "70k+",
        "framework": "React / Next.js"
    }
]
