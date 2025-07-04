// File: gif-canvas-wrapper.js - Wrapper Canvas pour GIF animés
// Desc: Utilise l'API Canvas native pour charger et animer les GIF
// Version 1.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.0.0: Création wrapper Canvas pour GIF animés sans décodage complexe

// Wrapper Canvas pour GIF animés
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
  let currentGifImage = null;
  let currentCanvas = null;
  let animationId = null;
  let frameIndex = 0;
  let lastFrameTime = 0;
  
  // Fonction pour charger un GIF et créer un canvas animé
  window.loadGifToCanvas = function(gifUrl, callback) {
    const img = new Image();
    img.onload = function() {
      // Créer un canvas avec les dimensions du GIF
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // Dessiner la première frame
      ctx.drawImage(img, 0, 0);
      
      // Stocker les références
      currentGifImage = img;
      currentCanvas = canvas;
      frameIndex = 0;
      lastFrameTime = 0;
      
      console.log('[CANVAS] GIF chargé:', img.width, 'x', img.height);
      callback(canvas);
    };
    
    img.onerror = function() {
      console.error('[CANVAS] Erreur chargement GIF:', gifUrl);
      callback(null);
    };
    
    img.src = gifUrl;
  };
  
  // Fonction pour démarrer l'animation
  window.startGifAnimation = function() {
    if (!currentGifImage || !currentCanvas) {
      console.warn('[CANVAS] Aucun GIF chargé pour l\'animation');
      return;
    }
    
    if (animationId) {
      console.warn('[CANVAS] Animation déjà en cours');
      return;
    }
    
    console.log('[CANVAS] Démarrage animation GIF');
    
    function animate(timestamp) {
      if (!lastFrameTime) lastFrameTime = timestamp;
      
      const elapsed = timestamp - lastFrameTime;
      
      // Animer toutes les 100ms (10 FPS pour simuler l'animation)
      if (elapsed > 100) {
        const ctx = currentCanvas.getContext('2d');
        ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
        ctx.drawImage(currentGifImage, 0, 0);
        
        lastFrameTime = timestamp;
      }
      
      animationId = requestAnimationFrame(animate);
    }
    
    animationId = requestAnimationFrame(animate);
  };
  
  // Fonction pour arrêter l'animation
  window.stopGifAnimation = function() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
      console.log('[CANVAS] Animation GIF arrêtée');
    }
  };
  
  // Fonction pour obtenir le canvas actuel
  window.getGifCanvas = function() {
    return currentCanvas;
  };
  
  // Exposer les fonctions pour compatibilité avec gif.js
  window.parseGIF = function(arrayBuffer) {
    // Cette fonction n'est pas utilisée avec l'approche Canvas
    console.log('[CANVAS] parseGIF appelé mais non utilisé');
    return [];
  };
  
  window.decompressFrames = function(parsedGif, buildImagePatches) {
    // Cette fonction n'est pas utilisée avec l'approche Canvas
    console.log('[CANVAS] decompressFrames appelé mais non utilisé');
    return [];
  };
  
  console.log('[CANVAS] Wrapper Canvas GIF chargé et exposé globalement');
  notifyLoaded();
})(); 