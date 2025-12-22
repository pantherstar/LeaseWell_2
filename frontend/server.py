#!/usr/bin/env python3
"""
Simple SPA server for LeaseWell frontend.
Serves index.html for all routes except static files.
"""

import http.server
import socketserver
import os

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Serve static files normally
        if self.path.startswith('/static/') or self.path == '/favicon.ico':
            return super().do_GET()

        # For all other routes, serve index.html (SPA routing)
        self.path = '/index.html'
        return super().do_GET()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), SPAHandler) as httpd:
        print(f"LeaseWell frontend running at http://localhost:{PORT}")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")
