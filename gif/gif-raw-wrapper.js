// File: gif-raw-wrapper.js - Wrapper pour données GIF brutes
// Desc: Utilise les données GIF brutes pour créer un canvas, sans décodage LZW
// Version 1.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.0.0: Création wrapper pour données GIF brutes

// Wrapper pour données GIF brutes
(function() {
  'use strict';
  
  let isLoaded = false;
  const loadCallbacks = [];
  
  // Fonction pour notifier que le chargement est terminé
  function notifyLoaded() {
    isLoaded = true;
    loadCallbacks.forEach(callback => callback());
    loadCallbacks.length = 0;
  }
  
  // Fonction pour attendre le chargement
  window.waitForGifDecoder = function(callback) {
    if (isLoaded) {
      callback();
    } else {
      loadCallbacks.push(callback);
    }
  };
  
  // Fonction pour créer un canvas à partir des données GIF brutes
  window.createGifCanvas = function(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    
    // Créer un blob et une URL pour l'image
    const blob = new Blob([data], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = function() {
        // Créer un canvas avec les dimensions du GIF
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Dessiner l'image
        ctx.drawImage(img, 0, 0);
        
        // Nettoyer l'URL
        URL.revokeObjectURL(url);
        
        console.log(`[RAW] Canvas créé: ${img.width}x${img.height}`);
        resolve(canvas);
      };
      
      img.onerror = function() {
        URL.revokeObjectURL(url);
        reject(new Error('Erreur chargement image GIF'));
      };
      
      img.src = url;
    });
  };
  
  // Exposer les fonctions pour compatibilité avec gif.js
  window.parseGIF = function(arrayBuffer) {
    // Retourner un objet simple pour compatibilité
    return {
      width: 0,
      height: 0,
      frames: []
    };
  };
  
  window.decompressFrames = function(parsedGif, buildImagePatches) {
    // Retourner un tableau vide pour compatibilité
    return [];
  };
  
  console.log('[RAW] Wrapper données GIF brutes chargé et exposé globalement');
  notifyLoaded();
})(); 