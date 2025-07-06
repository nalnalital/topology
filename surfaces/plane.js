// File: plane.js - Plane surface
// Desc: En français, dans l'architecture, je suis un plan simple
// Version 1.2.0 (homogénéisation architecture)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 15, 2024 23:25 UTC+1
// Logs:
//   - v1.2.0: Ajout createSurface() et config pour homogénéité avec autres surfaces
//   - v1.0.0: Initial plane implementation

// Icône topologique simple
// Plan : surface simple sans flèches directionnelles
export const topologyIcon = {
  shape: 'square',
  center: '🔷'
};

// Groupe de Poincaré (premier groupe d'homotopie)
export const quotientGroup = '{∅}';

// Invariants algébriques complets
export const algebraicInvariants = {
  pi1: '{∅}',     // Groupe fondamental π₁
  H1: '{0}',      // Premier groupe d'homologie H₁
  chi: 1,         // Caractéristique d'Euler χ
  H2: '{0}',      // Deuxième groupe d'homologie H₂
  orientable: '○' // Orientabilité
};

// Décalage texture spécifique plan (offset paramétrique)
export function getTextureOffsetU() { return 0; }
export function getTextureOffsetV() { return 0; }

export function createSurface(u, v) {
  u = u + getTextureOffsetU();
  if (u > 1.0) u -= 1.0; if (u < 0) u += 1.0;
  v = v + getTextureOffsetV();
  if (v > 1.0) v -= 1.0; if (v < 0) v += 1.0;
  // IDENTIQUE à 2D : mêmes inversions et axes
  const vInversed = 1 - v;    // INVERSION Y comme 2D
  const uInversed = 1 - u;    // INVERSION X comme 2D
  
  u *= 2 * Math.PI;
  v *= Math.PI;
  return {
    x: (uInversed - 0.5) * 6,  // X inversé comme 2D
    y: (vInversed - 0.5) * 4,  // Y inversé comme 2D (pas Z!)
    z: 0                       // Complètement plat comme 2D
  };
}

// Configuration spécifique plane
export const config = {
  scale: 150,
  rotX: 35,
  rotY: 120,
  rotZ: 0
};

// Gestion du drag spécifique plan
export function handleDrag(deltaX, deltaY, angles, config) {
  angles.rotY += deltaX * config.mouseSensitivity * 0.01;
  angles.rotX += deltaY * config.mouseSensitivity * 0.01;
  angles.rotX = Math.max(-Math.PI, Math.min(Math.PI, angles.rotX));
} 