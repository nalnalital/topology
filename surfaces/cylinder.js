// File: cylinder.js - Cylindre surface topologique
// Desc: En français, dans l'architecture, je suis un cylindre avec miroir X pour cohérence texture
// Version 1.2.0 (ajout fonction mathématique + scale)
// Author: DNAvatar.org - Arnaud Maignan
// Date: [December 15, 2024] [21:00 UTC+1]
// Logs:
//   - v1.2.0: Ajout fonction mathématique cylinder() + scale optimal + configuration
//   - v1.1.0: Correction miroir X (sens rotation inversé)
//   - v1.0.0: Icône topologique initiale

// Icône topologique avec flèches directionnelles  
// Cylindre [+ +] : bords horizontaux dans même sens
export const topologyIcon = {
  center: '🫙',
  top: '',
  left: '🔼',
  right: '🔼', 
  bottom: ''
};

// Configuration spécifique cylindre
export const config = {
  scale: 100,
  rotX: 35,
  rotY: 250,
  rotZ: -45
};

// Décalage texture spécifique cylindre (offset paramétrique)
export function getTextureOffsetU() { return 0; }
export function getTextureOffsetV() { return 0; }

// Fonction mathématique du cylindre
export function createSurface(u, v) {
  const uOrig = u;
  const vOrig = v;
  u = u + getTextureOffsetU();
  if (u > 1.0) u -= 1.0; if (u < 0) u += 1.0;
  v = v + getTextureOffsetV();
  if (v > 1.0) v -= 1.0; if (v < 0) v += 1.0;
  const phi = (1 - u) * 2 * Math.PI;
  const h = ((1 - v) - 0.5) * 3;
  // v = v * 2 - 1; // (désactivé pour debug)
  const x = Math.cos(phi);
  const y = h;
  const z = Math.sin(phi);
  if (Math.random() < 0.01) {
    console.log(`[CYLINDER DEBUG] u=${u.toFixed(3)}, v=${v.toFixed(3)}, phi=${phi.toFixed(3)}, h=${h.toFixed(3)}, x=${x.toFixed(3)}, y=${y.toFixed(3)}, z=${z.toFixed(3)}`);
    // Log UV mapping
    console.log(`[UV DEBUG][cylinder.js] uOrig=${uOrig.toFixed(3)}, vOrig=${vOrig.toFixed(3)}, uTex=${u.toFixed(3)}, vTex=${v.toFixed(3)}`);
  }
  return { x, y, z };
}

// Structure d'identification pour le carré fondamental
export const identification = [
  { edge1: 'left', edge2: 'right', orientation: 'same' }
];

// Gestion du drag spécifique cylindre
export function handleDrag(deltaX, deltaY, angles, config) {
  // dragX = rotY (inversé), dragY = rien
  angles.rotY += deltaX * config.mouseSensitivity * -1 * 0.01;
  // dragY ignoré
}
