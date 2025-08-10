#!/usr/bin/env python3
"""
Simple development server for the Timex Datalink Web Client
Serves files with proper MIME types for ES6 modules
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

PORT = 8000

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add proper MIME type for JavaScript modules
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')
        super().end_headers()

def main():
    # Change to the project root directory
    os.chdir(Path(__file__).parent)
    
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"Serving Timex Datalink Web Client at http://localhost:{PORT}")
        print(f"Web App: http://localhost:{PORT}/web/")
        print(f"Tests: http://localhost:{PORT}/tests/test-runner.html")
        print("Press Ctrl+C to stop the server")
        
        # Optionally open browser
        try:
            webbrowser.open(f"http://localhost:{PORT}/web/")
        except:
            pass
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    main()