// File: gif-simple-wrapper.js - Wrapper simple pour décodeur GIF maison
// Desc: Utilise le décodeur GIF simple au lieu de gifuct-js
// Version 1.0.1
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.0.1: Amélioration gestion asynchrone et robustesse
//   - v1.0.0: Création wrapper pour décodeur GIF simple

// Wrapper simple pour exposer les fonctions de décodage GIF
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
  
  // Charger le décodeur GIF simple
  const script = document.createElement('script');
  script.src = 'gif-simple-decoder.js';
  
  script.onload = function() {
    // Attendre un peu pour s'assurer que le script est exécuté
    setTimeout(() => {
      // Exposer les fonctions globalement pour compatibilité avec gif.js
      window.parseGIF = function(arrayBuffer) {
        try {
          const decoder = new window.SimpleGifDecoder();
          const frames = decoder.decode(arrayBuffer);
          console.log('[WRAPPER] GIF décodé avec succès:', frames.length, 'frames');
          return frames;
        } catch (error) {
          console.error('[WRAPPER] Erreur décodage GIF:', error);
          throw error;
        }
      };
      
      window.decompressFrames = function(parsedGif, buildImagePatches) {
        try {
          // Le décodeur simple retourne déjà les frames décompressées
          const frames = parsedGif.map(frame => ({
            pixels: frame.imageData,
            dims: {
              top: frame.top,
              left: frame.left,
              width: frame.width,
              height: frame.height
            },
            delay: frame.delay,
            disposalType: frame.disposalMethod,
            colorTable: frame.colorTable,
            transparentIndex: frame.transparentIndex
          }));
          console.log('[WRAPPER] Frames décompressées:', frames.length);
          return frames;
        } catch (error) {
          console.error('[WRAPPER] Erreur décompression frames:', error);
          throw error;
        }
      };
      
      console.log('[WRAPPER] Décodeur GIF simple chargé et exposé globalement');
      notifyLoaded();
    }, 100);
  };
  
  script.onerror = function() {
    console.error('[WRAPPER] Erreur chargement décodeur GIF simple');
  };
  
  // Ajouter le script au DOM
  document.head.appendChild(script);
})(); 