// File: gifuct-simple-wrapper.js - Wrapper simple pour gifuct-js
// Desc: Charge le build webpack de gifuct-js et expose parseGIF et decompressFrames globalement
// Version 1.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.0.0: Création wrapper simple pour build webpack gifuct-js

// Wrapper simple pour exposer gifuct-js globalement
(function() {
  'use strict';
  
  // Créer un script pour charger le build webpack
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/gifuct-js@2.1.2/demo/demo.build.js';
  
  script.onload = function() {
    // Le build webpack crée un module avec les exports
    // On doit accéder aux fonctions via le module webpack
    if (typeof window.webpackJsonp !== 'undefined') {
      // Chercher le module gifuct-js dans les modules webpack
      const modules = window.webpackJsonp[0][1];
      for (const moduleId in modules) {
        const module = modules[moduleId];
        if (module && module.exports && module.exports.parseGIF) {
          window.parseGIF = module.exports.parseGIF;
          window.decompressFrames = module.exports.decompressFrames;
          console.log('[WRAPPER] gifuct-js chargé et exposé globalement via webpack');
          return;
        }
      }
    }
    
    // Fallback: essayer d'accéder directement aux exports
    if (typeof window.exports !== 'undefined' && window.exports.parseGIF) {
      window.parseGIF = window.exports.parseGIF;
      window.decompressFrames = window.exports.decompressFrames;
      console.log('[WRAPPER] gifuct-js chargé et exposé globalement via exports');
    } else {
      console.error('[WRAPPER] Impossible de trouver les fonctions gifuct-js');
    }
  };
  
  script.onerror = function() {
    console.error('[WRAPPER] Erreur chargement build webpack gifuct-js');
  };
  
  // Ajouter le script au DOM
  document.head.appendChild(script);
})(); 