# Module GIF - Gestion des textures GIF animées

Ce dossier contient tous les fichiers liés à la gestion des GIF animés pour le moteur 3Diso.

## Structure des fichiers

### 🎯 Fichier principal
- **`gif.js`** - Module principal pour charger et animer les GIF (version 1.1.0)

### 🔧 Wrappers et décodeurs
- **`gif-simple-decoder.js`** - Décodeur GIF simple basé sur la spécification GIF
- **`gif-simple-wrapper.js`** - Wrapper pour le décodeur simple
- **`gif-raw-wrapper.js`** - Wrapper utilisant les données GIF brutes (Blob/URL)
- **`gif-canvas-wrapper.js`** - Wrapper utilisant l'API Canvas native
- **`gif-animated-wrapper.js`** - Wrapper pour animation GIF native avec contrôles
- **`gif-frame-extractor.js`** - Extracteur de frames pour analyse des GIF

### 🧪 Tests et exemples
- **`test_gif_texture.html`** - Test du module principal gif.js
- **`test_gif_final.html`** - Test final avec approche données brutes
- **`test_gif_raw.html`** - Test de l'approche données brutes
- **`test_gif_canvas.html`** - Test de l'approche Canvas native
- **`test_gif_animated.html`** - Test avec contrôles play/pause/stop
- **`test_gif_frames.html`** - Test d'extraction et visualisation des frames
- **`test_gif_texture.js`** - Script de test pour textures

### 🔄 Wrappers gifuct-js (dépréciés)
- **`gifuct-wrapper.js`** - Premier wrapper pour gifuct-js
- **`gifuct-simple-wrapper.js`** - Wrapper simple pour gifuct-js
- **`gifuct-module-wrapper.js`** - Wrapper module pour gifuct-js

## Approches développées

### 1. Approche données brutes (✅ Recommandée)
**Fichiers :** `gif.js`, `gif-raw-wrapper.js`, `test_gif_raw.html`
- **Principe :** Données GIF brutes → Blob → URL → Image → Canvas
- **Avantages :** Simple, fiable, performant, pas de décodage complexe
- **Limitation :** Pas d'accès aux frames individuelles

### 2. Animation GIF native
**Fichiers :** `gif-animated-wrapper.js`, `test_gif_animated.html`
- **Principe :** Image GIF native → Canvas avec copie en temps réel
- **Avantages :** Animation GIF native du navigateur
- **Contrôle :** Play/Pause/Stop avec boutons

### 3. Décodeur GIF simple
**Fichiers :** `gif-simple-decoder.js`, `gif-simple-wrapper.js`
- **Principe :** Décodage basé sur la spécification GIF standard
- **Avantages :** Contrôle total, pas de dépendances externes
- **Limitation :** Décodage LZW non implémenté

### 4. Extracteur de frames
**Fichiers :** `gif-frame-extractor.js`, `test_gif_frames.html`
- **Principe :** Analyse complète de la structure GIF
- **Usage :** Diagnostic et analyse des GIF

## Utilisation

### Chargement simple d'un GIF
```javascript
import { loadGifTexture, startGifTextureAnimation, stopGifTextureAnimation } from './gif/gif.js';

// Charger un GIF
await loadGifTexture('cartes/rotate.gif', (canvas) => {
  // Utiliser le canvas comme texture
  document.body.appendChild(canvas);
});

// Contrôler l'animation
startGifTextureAnimation();
setTimeout(() => stopGifTextureAnimation(), 10000);
```

### Animation avec contrôles
```javascript
// Utiliser le wrapper animation native
window.loadAnimatedGif('cartes/rotate.gif', (canvas) => {
  document.body.appendChild(canvas);
});

// Contrôles
window.startAnimatedGif();  // Play
window.stopAnimatedGif();   // Pause
```

## Tests

Pour tester les différentes approches :

1. **Test principal :** `test_gif_final.html`
2. **Test animation native :** `test_gif_animated.html`
3. **Test extraction frames :** `test_gif_frames.html`
4. **Test données brutes :** `test_gif_raw.html`

## Évolution

- **v1.0.0** : Première version avec gifuct-js
- **v1.0.1** : Correction namespace gifuct-js
- **v1.1.0** : Refactorisation avec approche données brutes

## Notes

- Les wrappers gifuct-js sont dépréciés à cause de problèmes de dépendances
- L'approche données brutes est la plus fiable et performante
- L'extracteur de frames permet de diagnostiquer les problèmes d'animation 