# File: server.py - Simple HTTP server for topology project
# Desc: En français, dans l'architecture, je suis un serveur HTTP simple pour éviter les problèmes CORS
# Version 1.0.0
# Author: DNAvatar.org - Arnaud Maignan
# Date: June 08, 2025 14:30 UTC+1
# Logs:
#   - Initial server setup for CORS issue resolution

import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 Serveur lancé sur http://localhost:{PORT}")
        print(f"📂 Dossier servi : {os.getcwd()}")
        print("🌐 Ouverture automatique du navigateur...")
        
        # Ouvrir automatiquement le navigateur
        webbrowser.open(f'http://localhost:{PORT}/untitled.html')
        
        print("⏹️  Appuyez sur Ctrl+C pour arrêter le serveur")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n�� Serveur arrêté") 