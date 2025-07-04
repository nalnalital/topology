// File: gif-animated-wrapper.js - Wrapper pour animation GIF native
// Desc: Utilise l'élément img natif pour l'animation GIF, puis copie sur canvas
// Version 1.1.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [14:30 UTC+1]
// Logs:
//   - v1.1.0: Correction pour utiliser vraiment l'animation GIF native
//   - v1.0.0: Création wrapper pour animation GIF native

// Wrapper pour animation GIF native
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
  
  // Variables globales pour l'animation
  let gifImage = null;
  let gifCanvas = null;
  let animationId = null;
  let isAnimating = false;
  let gifContainer = null;
  
  // Fonction pour charger un GIF animé
  window.loadAnimatedGif = function(gifUrl, callback) {
    // Créer un conteneur caché pour l'animation native
    gifContainer = document.createElement('div');
    gifContainer.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px; overflow: hidden;';
    document.body.appendChild(gifContainer);
    
    // Créer un élément img pour l'animation native
    gifImage = new Image();
    gifImage.style.cssText = 'width: 100%; height: 100%;';
    gifContainer.appendChild(gifImage);
    
    gifImage.onload = function() {
      // Créer un canvas avec les dimensions du GIF
      gifCanvas = document.createElement('canvas');
      gifCanvas.width = gifImage.naturalWidth || gifImage.width;
      gifCanvas.height = gifImage.naturalHeight || gifImage.height;
      const ctx = gifCanvas.getContext('2d');
      
      // Dessiner la première frame
      ctx.drawImage(gifImage, 0, 0);
      
      console.log(`[ANIMATED] GIF animé chargé: ${gifCanvas.width}x${gifCanvas.height}`);
      callback(gifCanvas);
    };
    
    gifImage.onerror = function() {
      console.error('[ANIMATED] Erreur chargement GIF animé:', gifUrl);
      callback(null);
    };
    
    gifImage.src = gifUrl;
  };
  
  // Fonction pour démarrer l'animation
  window.startAnimatedGif = function() {
    if (!gifCanvas || !gifImage || isAnimating) {
      console.warn('[ANIMATED] Impossible de démarrer l\'animation');
      return;
    }
    
    isAnimating = true;
    console.log('[ANIMATED] Démarrage animation GIF native');
    
    function animate() {
      if (!isAnimating) return;
      
      // Copier l'image animée native sur le canvas
      const ctx = gifCanvas.getContext('2d');
      ctx.clearRect(0, 0, gifCanvas.width, gifCanvas.height);
      ctx.drawImage(gifImage, 0, 0);
      
      // Continuer l'animation
      animationId = requestAnimationFrame(animate);
    }
    
    // Démarrer l'animation immédiatement
    animate();
  };
  
  // Fonction pour arrêter l'animation
  window.stopAnimatedGif = function() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    isAnimating = false;
    console.log('[ANIMATED] Animation GIF native arrêtée');
  };
  
  // Fonction pour obtenir le canvas
  window.getAnimatedGifCanvas = function() {
    return gifCanvas;
  };
  
  // Fonction pour nettoyer
  window.cleanupAnimatedGif = function() {
    stopAnimatedGif();
    if (gifContainer && gifContainer.parentNode) {
      gifContainer.parentNode.removeChild(gifContainer);
    }
    gifImage = null;
    gifCanvas = null;
    gifContainer = null;
  };
  
  // Exposer les fonctions pour compatibilité avec gif.js
  window.parseGIF = function(arrayBuffer) {
    return { width: 0, height: 0, frames: [] };
  };
  
  window.decompressFrames = function(parsedGif, buildImagePatches) {
    return [];
  };
  
  console.log('[ANIMATED] Wrapper animation GIF native chargé et exposé globalement');
  notifyLoaded();
})(); 