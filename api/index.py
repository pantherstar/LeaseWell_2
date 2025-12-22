"""
Vercel Serverless Function Entry Point
Using BaseHTTPRequestHandler for compatibility
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import asyncio

# Add backend to path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Try to import backend components
db_module = None
auth_module = None
router_imported = False

try:
    from app.core.database import get_db, check_db_health
    from app.core.config import settings
    db_module = True
except Exception as e:
    db_error = str(e)
    db_module = False


class handler(BaseHTTPRequestHandler):
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        path = self.path.split('?')[0]

        if path == '/api' or path == '/api/':
            self.send_json({
                "status": "ok",
                "service": "LeaseWell API",
                "version": "2.0.0",
                "backend_loaded": db_module
            })
        elif path == '/api/health':
            if db_module:
                try:
                    db_url = settings.DATABASE_URL[:50] + "..." if len(settings.DATABASE_URL) > 50 else settings.DATABASE_URL
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    db_ok = loop.run_until_complete(check_db_health())
                    loop.close()
                    self.send_json({
                        "status": "ok" if db_ok else "degraded",
                        "database": "ok" if db_ok else "error",
                        "db_url_preview": db_url
                    })
                except Exception as e:
                    import traceback
                    self.send_json({
                        "status": "error",
                        "error": str(e),
                        "traceback": traceback.format_exc()[:500]
                    })
            else:
                self.send_json({"status": "error", "error": db_error if 'db_error' in dir() else "Unknown"})
        else:
            self.send_json({
                "error": "Endpoint not implemented in minimal mode",
                "path": path,
                "note": "Full API requires FastAPI/Mangum which has compatibility issues with Vercel Python runtime"
            }, 501)

    def do_POST(self):
        self.send_json({"error": "POST not implemented in minimal mode"}, 501)

    def do_PUT(self):
        self.send_json({"error": "PUT not implemented in minimal mode"}, 501)

    def do_DELETE(self):
        self.send_json({"error": "DELETE not implemented in minimal mode"}, 501)
