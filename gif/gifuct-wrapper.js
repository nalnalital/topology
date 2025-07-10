// File: gifuct-wrapper.js - Wrapper pour gifuct-js
// Desc: Charge gifuct-js et expose parseGIF et decompressFrames globalement
// Version 1.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.0.0: Création wrapper pour gifuct-js

// Wrapper pour charger gifuct-js et exposer les fonctions globalement
(function() {
  'use strict';
  
  // Fonction pour charger un module CommonJS via fetch
  async function loadCommonJSModule(url) {
    try {
      const response = await fetch(url);
      const code = await response.text();
      
      // Créer un contexte d'exécution avec exports
      const exports = {};
      const module = { exports: exports };
      
      // Créer une fonction qui simule require
      const require = function(path) {
        // Pour les dépendances internes, on retourne des objets vides
        // car on ne charge que le module principal
        if (path.includes('js-binary-schema-parser')) {
          return {
            parse: function() { return {}; },
            buildStream: function() { return {}; }
          };
        }
        if (path.includes('deinterlace')) {
          return { deinterlace: function() { return []; } };
        }
        if (path.includes('lzw')) {
          return { lzw: function() { return []; } };
        }
        return {};
      };
      
      // Exécuter le code dans le contexte
      const func = new Function('exports', 'module', 'require', code);
      func(exports, module, require);
      
      return module.exports;
    } catch (error) {
      console.error('Erreur chargement gifuct-js:', error);
      return null;
    }
  }
  
  // Charger gifuct-js et exposer globalement
  loadCommonJSModule('https://unpkg.com/gifuct-js@2.1.2/lib/index.js')
    .then(function(gifuct) {
      if (gifuct && gifuct.parseGIF && gifuct.decompressFrames) {
        window.parseGIF = gifuct.parseGIF;
        window.decompressFrames = gifuct.decompressFrames;
        console.log('[WRAPPER] gifuct-js chargé et exposé globalement');
      } else {
        console.error('[WRAPPER] Fonctions gifuct-js non trouvées');
      }
    })
    .catch(function(error) {
      console.error('[WRAPPER] Erreur chargement gifuct-js:', error);
    });
})(); 