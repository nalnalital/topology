#!/usr/bin/env python3
# File: extract_frames.py - Extract GIF frames to numbered PNG files
# Desc: Script pour extraire les frames d'un GIF en PNG numérotés
# Version 1.0.0
# Author: DNAvatar.org - Arnaud Maignan
# Date: [June 08, 2025] [HH:MM UTC+1]
# Logs:
#   - Initial version

import sys
import os
from PIL import Image

def extract_gif_frames(gif_path, output_dir="anim"):
    """
    Extrait toutes les frames d'un GIF en PNG numérotés
    """
    try:
        # Ouvrir le GIF
        gif = Image.open(gif_path)
        
        # Créer le dossier de sortie s'il n'existe pas
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            print(f"📁 Dossier créé: {output_dir}")
        
        frame_count = 0
        
        # Extraire chaque frame
        for frame_index in range(gif.n_frames):
            # Aller à la frame spécifique
            gif.seek(frame_index)
            
            # Convertir en RGBA si nécessaire
            frame = gif.convert('RGBA')
            
            # Nom du fichier de sortie
            output_filename = f"{output_dir}/frame_{frame_index:03d}.png"
            
            # Sauvegarder la frame
            frame.save(output_filename, 'PNG')
            frame_count += 1
            
            print(f"🎬 Frame {frame_index:03d} sauvegardée: {output_filename}")
        
        print(f"\n✅ Extraction terminée: {frame_count} frames extraites dans {output_dir}/")
        print(f"📊 Informations du GIF: {gif.n_frames} frames, {gif.size[0]}x{gif.size[1]} pixels")
        
        # Afficher les durées des frames si disponibles
        if hasattr(gif, 'info') and 'duration' in gif.info:
            print(f"⏱️ Durée par frame: {gif.info['duration']}ms")
        
        return frame_count
        
    except Exception as e:
        print(f"❌ Erreur lors de l'extraction: {e}")
        return 0

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_frames.py <gif_file> [output_dir]")
        print("Exemple: python extract_frames.py ../cartes/rotate.gif rotate_anim")
        sys.exit(1)
    
    gif_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "anim"
    
    if not os.path.exists(gif_file):
        print(f"❌ Fichier GIF introuvable: {gif_file}")
        sys.exit(1)
    
    print(f"🎬 Extraction des frames de: {gif_file}")
    print(f"📁 Dossier de sortie: {output_dir}")
    print("-" * 50)
    
    frame_count = extract_gif_frames(gif_file, output_dir)
    
    if frame_count > 0:
        print(f"\n🎯 {frame_count} frames prêtes à être utilisées !")
        print(f"📂 Dossier: {output_dir}/")

if __name__ == "__main__":
    main() 