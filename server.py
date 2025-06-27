# File: server.py - Simple HTTP server for topology project
# Desc: En français, dans l'architecture, je suis un serveur HTTP simple pour éviter les problèmes CORS
# Version 1.1.0
# Author: DNAvatar.org - Arnaud Maignan
# Date: June 08, 2025 14:30 UTC+1
# Logs:
#   - API list-textures: Endpoint pour scanner dynamiquement le répertoire cartes/
#   - Initial server setup for CORS issue resolution

import http.server
import socketserver
import webbrowser
import os
import json
import urllib.parse

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_GET(self):
        # API endpoint pour lister les textures
        if self.path == '/api/list-textures':
            self.handle_list_textures()
        else:
            # Comportement normal pour les autres requêtes
            super().do_GET()
    
    def handle_list_textures(self):
        try:
            cartes_dir = os.path.join(os.getcwd(), 'cartes')
            if not os.path.exists(cartes_dir):
                self.send_error(404, "Répertoire cartes/ non trouvé")
                return
            
            # Lister tous les fichiers dans cartes/
            files = []
            for filename in os.listdir(cartes_dir):
                filepath = os.path.join(cartes_dir, filename)
                if os.path.isfile(filepath):
                    files.append(filename)
            
            # Trier par nom pour cohérence
            files.sort()
            
            # Réponse JSON
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response_data = json.dumps(files, ensure_ascii=False)
            self.wfile.write(response_data.encode('utf-8'))
            
            print(f"📁 API list-textures: {len(files)} fichiers retournés")
            
        except Exception as e:
            print(f"❌ Erreur API list-textures: {e}")
            self.send_error(500, f"Erreur serveur: {str(e)}")

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