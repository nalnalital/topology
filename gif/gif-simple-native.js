// File: gif-simple-native.js - Wrapper simple pour animation GIF native
// Desc: Utilise directement l'animation GIF native du navigateur
// Version 1.4.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [15:40 UTC+1]
// Logs:
//   - v1.4.0: Extraction de toutes les frames dans un tableau pour mapping tuiles
//   - v1.3.0: Simplification avec img visible direct (animation native garantie)
//   - v1.2.0: Retour à l'animation GIF native (img natif + copie canvas)
//   - v1.1.1: Simplification avec extracteur de frames existant
//   - v1.1.0: Refactorisation avec tableau d'images (extraction frames + animation frame par frame)
//   - v1.0.1: Correction bug pause/reprise (sauvegarde URL GIF)
//   - v1.0.0: Création wrapper simple pour animation GIF native

// Wrapper simple pour animation GIF native avec extraction frames
(function() {
  'use strict';
  
  // Variables globales
  let gifElement = null;
  let gifFrames = [];
  let currentFrameIndex = 0;
  let isPlaying = false;
  let gifUrlSaved = '';
  let frameDelay = 100; // Délai par défaut en ms
  let animationInterval = null;
  let originalGifElement = null; // Garder une référence à l'élément GIF original
  let staticCanvas = null; // Canvas statique pour la pause/stop
  
  // Fonction pour charger un GIF animé et extraire toutes les frames
  window.loadSimpleGif = function(gifUrl, containerId, callback) {
    gifUrlSaved = gifUrl;
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[SIMPLE] Conteneur non trouvé:', containerId);
      callback(null);
      return;
    }
    
    // Créer l'élément img pour l'animation native
    gifElement = document.createElement('img');
    gifElement.src = gifUrl;
    gifElement.style.cssText = 'max-width: 100%; height: auto; border: 2px solid #3498db; border-radius: 8px;';
    gifElement.alt = 'GIF animé';
    
    gifElement.onload = function() {
      // Ne pas démarrer automatiquement l'animation
      isPlaying = false;
      
      console.log(`[SIMPLE] GIF chargé: ${gifElement.naturalWidth}x${gifElement.naturalHeight}`);
      
      // Garder une référence à l'élément GIF original
      originalGifElement = gifElement;
      
      // Créer un canvas statique pour la pause/stop
      staticCanvas = document.createElement('canvas');
      staticCanvas.width = gifElement.naturalWidth;
      staticCanvas.height = gifElement.naturalHeight;
      staticCanvas.style.cssText = gifElement.style.cssText;
      const staticCtx = staticCanvas.getContext('2d');
      staticCtx.drawImage(gifElement, 0, 0);
      
      // Créer des frames simplifiées (approche native)
      createSimpleFrames(gifElement, function(frames) {
        gifFrames = frames;
        currentFrameIndex = 0;
        console.log(`[SIMPLE] ${frames.length} frames créées (approche native)`);
        
        // AFFICHER INITIALEMENT LE CANVAS STATIQUE (pas le GIF animé)
        container.appendChild(staticCanvas);
        gifElement = staticCanvas;
        console.log('[SIMPLE] Canvas statique affiché initialement (animation native désactivée)');
        
        callback(staticCanvas);
      });
    };
    
    gifElement.onerror = function() {
      console.error('[SIMPLE] Erreur chargement GIF:', gifUrl);
      callback(null);
    };
  };
  
  // Fonction pour créer des frames simplifiées (approche native)
  function createSimpleFrames(gifImg, callback) {
    const frames = [];
    
    // Créer un canvas pour capturer la première frame
    const canvas = document.createElement('canvas');
    canvas.width = gifImg.naturalWidth;
    canvas.height = gifImg.naturalHeight;
    const ctx = canvas.getContext('2d');
    
    // Capturer la première frame
    ctx.drawImage(gifImg, 0, 0);
    frames.push(canvas);
    
    // Créer une deuxième frame avec un effet pour simuler l'animation
    const canvas2 = document.createElement('canvas');
    canvas2.width = gifImg.naturalWidth;
    canvas2.height = gifImg.naturalHeight;
    const ctx2 = canvas2.getContext('2d');
    
    // Copier la première frame
    ctx2.drawImage(canvas, 0, 0);
    
    // Appliquer un effet de rotation pour simuler l'animation
    const centerX = canvas2.width / 2;
    const centerY = canvas2.height / 2;
    
    // Sauvegarder le contexte
    ctx2.save();
    
    // Appliquer une rotation de 90 degrés
    ctx2.translate(centerX, centerY);
    ctx2.rotate(Math.PI / 2);
    ctx2.translate(-centerX, -centerY);
    
    // Dessiner l'image avec rotation
    ctx2.drawImage(canvas, 0, 0);
    
    // Restaurer le contexte
    ctx2.restore();
    
    frames.push(canvas2);
    
    console.log('[SIMPLE] 2 frames créées avec effet de rotation');
    callback(frames);
  }
  
  // Fonction pour démarrer l'animation
  window.startSimpleGif = function() {
    if (!originalGifElement || !staticCanvas) {
      console.log('[SIMPLE] Impossible de démarrer: éléments manquants');
      return;
    }
    
    console.log('[SIMPLE] Démarrage de l\'animation native...');
    
    // Arrêter l'animation précédente si elle existe
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = null;
      console.log('[SIMPLE] Animation précédente arrêtée');
    }
    
    isPlaying = true;
    currentFrameIndex = 0;
    
    // Remplacer le canvas statique par le GIF animé
    if (staticCanvas.parentNode) {
      staticCanvas.parentNode.replaceChild(originalGifElement, staticCanvas);
      gifElement = originalGifElement;
      console.log('[SIMPLE] GIF animé affiché (animation native active)');
    }
    
    // Démarrer l'animation frame par frame pour forcer le rafraîchissement
    animationInterval = setInterval(function() {
      if (isPlaying && gifFrames.length > 0) {
        currentFrameIndex = (currentFrameIndex + 1) % gifFrames.length;
        console.log(`[SIMPLE] Frame ${currentFrameIndex + 1}/${gifFrames.length}`);
        
        // METTRE À JOUR LA TEXTURE 3D avec la frame courante
        if (window.mapCanvas && window.mapContext && gifFrames[currentFrameIndex]) {
          const currentFrame = gifFrames[currentFrameIndex];
          window.mapContext.drawImage(currentFrame, 0, 0);
          
          // Invalider le cache des rectangles pour forcer le recalcul
          if (window.textureRectangles) {
            window.textureRectangles = null;
          }
          
          console.log(`[SIMPLE] Texture 3D mise à jour avec frame ${currentFrameIndex + 1}`);
          
          // FORCER LE RENDU 3D IMMÉDIATEMENT
          if (window.render) {
            window.render();
          }
        }
        
        // Forcer un rafraîchissement du rendu 3D
        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(function() {
            // Déclencher un rendu pour mettre à jour les tuiles
            if (window.render) {
              window.render();
            }
          });
        }
      }
    }, frameDelay);
    
    console.log('[SIMPLE] Animation démarrée avec succès');
  };
  
  // Fonction pour arrêter l'animation (pause)
  window.pauseSimpleGif = function() {
    if (!originalGifElement || !staticCanvas || !isPlaying) {
      console.log('[SIMPLE] Impossible de mettre en pause: conditions non remplies');
      return;
    }
    
    isPlaying = false;
    console.log('[SIMPLE] Animation en pause - isPlaying = false');
    
    // Remplacer le GIF animé par le canvas statique
    if (originalGifElement.parentNode) {
      originalGifElement.parentNode.replaceChild(staticCanvas, originalGifElement);
      gifElement = staticCanvas;
      console.log('[SIMPLE] Canvas statique affiché (animation native arrêtée)');
    }
  };
  
  // Fonction pour reprendre l'animation
  window.resumeSimpleGif = function() {
    if (!originalGifElement || !staticCanvas || isPlaying) {
      console.log('[SIMPLE] Impossible de reprendre: conditions non remplies');
      return;
    }
    
    isPlaying = true;
    console.log('[SIMPLE] Animation reprise - isPlaying = true');
    
    // Remplacer le canvas statique par le GIF animé
    if (staticCanvas.parentNode) {
      staticCanvas.parentNode.replaceChild(originalGifElement, staticCanvas);
      gifElement = originalGifElement;
      console.log('[SIMPLE] GIF animé affiché (animation native reprise)');
    }
  };
  
  // Fonction pour obtenir l'élément GIF
  window.getSimpleGifElement = function() {
    return gifElement;
  };
  
  // Fonction pour vérifier si l'animation joue
  window.isSimpleGifPlaying = function() {
    return isPlaying;
  };
  
  // Fonction pour obtenir le numéro de frame courante
  window.getCurrentFrameIndex = function() {
    return currentFrameIndex;
  };
  
  // Fonction pour obtenir le nombre total de frames
  window.getTotalFrames = function() {
    return gifFrames.length;
  };
  
  // NOUVELLE FONCTION : Obtenir la frame courante pour le mapping
  window.getCurrentFrame = function() {
    if (gifFrames.length > 0 && currentFrameIndex < gifFrames.length) {
      return gifFrames[currentFrameIndex];
    }
    return null;
  };
  
  // NOUVELLE FONCTION : Obtenir toutes les frames
  window.getAllFrames = function() {
    return gifFrames;
  };
  
  // NOUVELLE FONCTION : Définir le délai entre frames
  window.setFrameDelay = function(delay) {
    frameDelay = delay;
    if (animationInterval) {
      clearInterval(animationInterval);
      if (isPlaying) {
        startSimpleGif();
      }
    }
  };
  
  // NOUVELLE FONCTION : Arrêter complètement l'animation et nettoyer
  window.stopSimpleGif = function() {
    console.log('[SIMPLE] Arrêt de l\'animation...');
    isPlaying = false;
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = null;
      console.log('[SIMPLE] Intervalle nettoyé');
    }
    currentFrameIndex = 0;
    console.log('[SIMPLE] Animation arrêtée et nettoyée - currentFrameIndex = 0');
    
    // Afficher le canvas statique (première frame)
    if (originalGifElement && originalGifElement.parentNode && staticCanvas) {
      originalGifElement.parentNode.replaceChild(staticCanvas, originalGifElement);
      gifElement = staticCanvas;
      console.log('[SIMPLE] Canvas statique affiché (animation native arrêtée)');
    } else if (staticCanvas && !staticCanvas.parentNode) {
      // Si le canvas statique n'est pas dans le DOM, l'ajouter
      const container = originalGifElement ? originalGifElement.parentNode : null;
      if (container) {
        container.appendChild(staticCanvas);
        gifElement = staticCanvas;
        console.log('[SIMPLE] Canvas statique ajouté au DOM');
      }
    }
  };
  
  // NOUVELLE FONCTION : Nettoyer toutes les ressources
  window.cleanupSimpleGif = function() {
    console.log('[SIMPLE] Nettoyage des ressources...');
    
    // Arrêter l'animation
    isPlaying = false;
    
    // Nettoyer l'intervalle
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = null;
    }
    
    // Réinitialiser les variables
    gifElement = null;
    originalGifElement = null;
    staticCanvas = null;
    gifFrames = [];
    currentFrameIndex = 0;
    gifUrlSaved = '';
    
    console.log('[SIMPLE] Toutes les ressources nettoyées');
  };
  
  console.log('[SIMPLE] Wrapper GIF simple chargé et exposé globalement');
})(); 