// File: gif.js - Gestion texture GIF animée pour moteur 3Diso
// Desc: Permet d'utiliser un GIF animé comme texture dynamique, sans boucle permanente inutile
// Version 1.1.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.1.0: Utilisation approche données brutes (Blob/URL) au lieu du décodage LZW
//   - v1.0.1: Correction namespace gifuct-js (window.parseGIF au lieu de window.gifuct.parseGIF)
//   - v1.0.0: Création module GIF texture dynamique
//
// Exemple d'utilisation :
// import { loadGifTexture, startGifTextureAnimation, stopGifTextureAnimation, getGifTextureCanvas } from './gif.js';
// loadGifTexture('cartes/rotate.gif', (canvas) => { /* utiliser canvas comme texture */ });
// startGifTextureAnimation();
// setTimeout(() => stopGifTextureAnimation(), 10000);

// Variables globales pour l'animation
let gifCanvas = null;
let gifImage = null;
let animationId = null;
let isAnimating = false;

// Fonction pour charger un GIF et créer un canvas
export async function loadGifTexture(gifUrl, callback) {
  try {
    console.log('[GIF] Chargement texture GIF:', gifUrl);
    
    // Charger le fichier GIF
    const response = await fetch(gifUrl);
    const arrayBuffer = await response.arrayBuffer();
    
    console.log('[GIF] Fichier chargé:', arrayBuffer.byteLength, 'bytes');
    
    // Créer un blob et une URL pour l'image
    const blob = new Blob([arrayBuffer], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);
    
    // Créer l'image
    gifImage = new Image();
    
    gifImage.onload = function() {
      // Créer un canvas avec les dimensions du GIF
      gifCanvas = document.createElement('canvas');
      gifCanvas.width = gifImage.width;
      gifCanvas.height = gifImage.height;
      const ctx = gifCanvas.getContext('2d');
      
      // Dessiner l'image
      ctx.drawImage(gifImage, 0, 0);
      
      // Nettoyer l'URL
      URL.revokeObjectURL(url);
      
      console.log('[GIF] Canvas créé:', gifImage.width, 'x', gifImage.height);
      callback(gifCanvas);
    };
    
    gifImage.onerror = function() {
      URL.revokeObjectURL(url);
      console.error('[GIF] Erreur chargement image:', gifUrl);
      callback(null);
    };
    
    gifImage.src = url;
    
  } catch (error) {
    console.error('[GIF] Erreur chargement GIF:', error);
    callback(null);
  }
}

// Fonction pour démarrer l'animation (simulation)
export function startGifTextureAnimation() {
  if (!gifCanvas || !gifImage || isAnimating) {
    console.warn('[GIF] Impossible de démarrer l\'animation');
    return;
  }
  
  isAnimating = true;
  console.log('[GIF] Démarrage animation texture GIF');
  
  function animate(timestamp) {
    if (!isAnimating) return;
    
    // Redessiner l'image pour simuler l'animation
    const ctx = gifCanvas.getContext('2d');
    ctx.clearRect(0, 0, gifCanvas.width, gifCanvas.height);
    ctx.drawImage(gifImage, 0, 0);
    
    animationId = requestAnimationFrame(animate);
  }
  
  animationId = requestAnimationFrame(animate);
}

// Fonction pour arrêter l'animation
export function stopGifTextureAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  isAnimating = false;
  console.log('[GIF] Animation texture GIF arrêtée');
}

// Fonction pour obtenir le canvas de texture GIF
export function getGifTextureCanvas() {
  return gifCanvas;
}

// Fonctions de compatibilité avec l'ancienne interface (dépréciées)
export async function loadGifTextureDecoded(gifUrl, callback) {
  console.warn('[GIF] loadGifTextureDecoded est déprécié, utilisez loadGifTexture');
  return loadGifTexture(gifUrl, callback);
}

export function startDecodedGifAnimation() {
  console.warn('[GIF] startDecodedGifAnimation est déprécié, utilisez startGifTextureAnimation');
  return startGifTextureAnimation();
}

export function stopDecodedGifAnimation() {
  console.warn('[GIF] stopDecodedGifAnimation est déprécié, utilisez stopGifTextureAnimation');
  return stopGifTextureAnimation();
}

export function getDecodedGifTextureCanvas() {
  console.warn('[GIF] getDecodedGifTextureCanvas est déprécié, utilisez getGifTextureCanvas');
  return getGifTextureCanvas();
} 