import sys
import os

# Add the api/ directory itself to sys.path so relative imports like "app.main" work
# Both locally (when CWD is project root) and on Vercel (where CWD is /var/task)
api_dir = os.path.dirname(os.path.abspath(__file__))
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

from app.main import app

__all__ = ["app"]
