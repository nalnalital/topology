// File: gifuct-module-wrapper.js - Wrapper module pour gifuct-js
// Desc: Charge les modules gifuct-js individuellement et expose parseGIF et decompressFrames globalement
// Version 1.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.0.0: Création wrapper module pour éviter problème canvas webpack

// Wrapper pour charger les modules gifuct-js individuellement
(function() {
  'use strict';
  
  // Fonction pour charger un module CommonJS via fetch
  async function loadModule(url) {
    const response = await fetch(url);
    const code = await response.text();
    
    // Créer un contexte d'exécution avec exports
    const exports = {};
    const module = { exports: exports };
    
    // Créer une fonction require qui retourne des modules vides
    const require = function(path) {
      console.log('[WRAPPER] Require appelé pour:', path);
      return {};
    };
    
    // Exécuter le code du module
    try {
      const func = new Function('exports', 'module', 'require', code);
      func(exports, module, require);
      return module.exports;
    } catch (error) {
      console.error('[WRAPPER] Erreur exécution module:', error);
      return {};
    }
  }
  
  // Charger les modules nécessaires
  async function loadGifuctModules() {
    try {
      console.log('[WRAPPER] Chargement des modules gifuct-js...');
      
      // Charger le module principal
      const mainModule = await loadModule('https://unpkg.com/gifuct-js@2.1.2/lib/index.js');
      
      if (mainModule.parseGIF && mainModule.decompressFrames) {
        window.parseGIF = mainModule.parseGIF;
        window.decompressFrames = mainModule.decompressFrames;
        console.log('[WRAPPER] gifuct-js chargé et exposé globalement via modules');
        return true;
      } else {
        console.error('[WRAPPER] Fonctions parseGIF/decompressFrames non trouvées dans le module principal');
        return false;
      }
    } catch (error) {
      console.error('[WRAPPER] Erreur chargement modules:', error);
      return false;
    }
  }
  
  // Démarrer le chargement
  loadGifuctModules();
})(); 