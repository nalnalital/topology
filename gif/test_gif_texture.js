// File: test_gif_texture.js - Test affichage GIF animé sur canvas via gif.js
// Desc: Teste le module gif.js pour afficher et animer un GIF sur un canvas HTML5
// Version 1.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.0.0: Test minimal du module gif.js

import { loadGifTexture, startGifTextureAnimation, stopGifTextureAnimation, getGifTextureCanvas } from './gif.js';

console.log('[TEST] Chargement du GIF animé...');
loadGifTexture('cartes/rotate.gif', (canvas) => {
  console.log('[TEST] Canvas GIF prêt, ajout au DOM');
  document.body.appendChild(canvas);
  startGifTextureAnimation();
  console.log('[TEST] Animation GIF démarrée');
  setTimeout(() => {
    stopGifTextureAnimation();
    console.log('[TEST] Animation GIF stoppée après 10s');
  }, 10000);
}); 