// File: crosscap.js - Cross-cap surface 
// Desc: En français, dans l'architecture, je suis un cross-cap [- -] non-orientable
// Version 1.1.0 (homogénéisation architecture)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 15, 2024 23:25 UTC+1
// Logs:
//   - v1.1.0: Ajout createSurface() et config pour homogénéité avec autres surfaces

// Icône topologique avec flèches directionnelles
// Cross-cap [- -] : surface non-orientable avec singularité
export const topologyIcon = {
  center: '🪢',
  top: '▶️',
  left: '⏬',
  right: '⏫',
  bottom: '◀️'
};

// Décalage texture spécifique crosscap (offset paramétrique)
export function getTextureOffsetU() { return 0; }
export function getTextureOffsetV() { return 0; }

export function createSurface(u, v) {
  u = u + getTextureOffsetU();
  if (u > 1.0) u -= 1.0; if (u < 0) u += 1.0;
  v = v + getTextureOffsetV();
  if (v > 1.0) v -= 1.0; if (v < 0) v += 1.0;
  u *= Math.PI;
  v *= 2 * Math.PI;

  // Paramétrisation standard du crosscap
  const x = Math.sin(u) * Math.sin(v);
  const y = Math.sin(2 * u) * Math.cos(v) / 2;
  const z = Math.cos(u);
  // Mise à l'échelle pour affichage
  return { x: x * 2.2, y: y * 2.2, z: z * 2.2 };
}

// Structure d'identification pour le carré fondamental
// Note: C'est la même que le plan projectif
export const identification = [
    { edge1: 'top', edge2: 'bottom', orientation: 'opposite' },
    { edge1: 'left', edge2: 'right', orientation: 'opposite' }
];

// Configuration spécifique crosscap
export const config = {
  scale: 70,
  rotX: -100,
  rotY: -60,
  rotZ: 0
};

// Gestion du drag spécifique crosscap
export function handleDrag(deltaX, deltaY, angles, config) {
  angles.rotY += deltaX * config.mouseSensitivity * 0.01;
  angles.rotX += deltaY * config.mouseSensitivity * 0.01;
  angles.rotX = Math.max(-Math.PI, Math.min(Math.PI, angles.rotX));
} 