// File: klein.js - Klein bottle surface
// Desc: En français, dans l'architecture, je suis la bouteille de Klein [+ -]
// Version 1.0.0 (création)
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 16:15 UTC+1
// Logs:
//   - Initial Klein bottle implementation with self-intersection

// Icône topologique avec flèches directionnelles
// Bouteille de Klein [+ -] : bords verticaux opposés
export const topologyIcon = {
  center: '🖇️',
  top: '▶️',
  left: '⏫',
  right: '⏫', 
  bottom: '◀️'
};

// Décalage texture spécifique Klein (offset paramétrique)
export function getTextureOffsetU() { return 0; }
export function getTextureOffsetV() { return 0; }

export function createSurface(u, v) {
  u = u + getTextureOffsetU();
  if (u > 1.0) u -= 1.0; if (u < 0) u += 1.0;
  v = v + getTextureOffsetV();
  if (v > 1.0) v -= 1.0; if (v < 0) v += 1.0;
  u *= Math.PI * 2;
  v *= Math.PI * 2;

  let x, y, z;
  if (u < Math.PI) {
    x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(u) * Math.cos(v);
    y = 8 * Math.sin(u) + (2 * (1 - Math.cos(u) / 2)) * Math.sin(u) * Math.cos(v);
    z = (2 * (1 - Math.cos(u) / 2)) * Math.sin(v);
  } else {
    x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(v + Math.PI);
    y = 8 * Math.sin(u);
    z = (2 * (1 - Math.cos(u) / 2)) * Math.sin(v);
  }
  // Mise à l'échelle pour correspondre à l'affichage
  return { x: x * 0.12, y: y * 0.12, z: z * 0.12 };
}

// Structure d'identification pour le carré fondamental
export const identification = [
    { edge1: 'top', edge2: 'bottom', orientation: 'same' },
    { edge1: 'left', edge2: 'right', orientation: 'opposite' }
];

// Configuration spécifique bouteille de Klein
export const config = {
  scale: 190,
  rotX: -40,
  rotY: 65,
  rotZ: 0
};

// Gestion du drag spécifique Klein
export function handleDrag(deltaX, deltaY, angles, config) {
  angles.rotY += deltaX * config.mouseSensitivity * 0.01;
  angles.rotX += deltaY * config.mouseSensitivity * 0.01;
  angles.rotX = Math.max(-Math.PI, Math.min(Math.PI, angles.rotX));
}
