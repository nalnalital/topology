// File: torus.js - Tore surface topologique
// Desc: En français, dans l'architecture, je suis un tore avec structure 2D universelle
// Version 1.3.0 (correction pôle sud intérieur)
// Author: DNAvatar.org - Arnaud Maignan
// Date: [December 16, 2024] [00:02 UTC+1]
// Logs:
//   - v1.3.0: CORRECTION PÔLE SUD: theta = (v + 0.5) * 2π pour pôle sud à l'intérieur du tore
//   - v1.1.0: Structure 2D universelle appliquée
//   - v1.0.0: Icône topologique initiale

// Icône topologique avec flèches directionnelles
// Tore [+ +] : bords verticaux et horizontaux dans même sens
export const topologyIcon = {
  center: '🍩',
  top: '▶️',
  left: '⏫', 
  right: '⏫',
  bottom: '▶️'
};

// Configuration spécifique torus
export const config = {
  scale: 65,
  rotX: -46,
  rotY: 142,
  rotZ: -7
};

// Décalage texture spécifique tore (offset paramétrique)
export function getTextureOffsetU() { return 0; }
export function getTextureOffsetV() { return 0.5; }

// Fonction mathématique du torus
export function createSurface(u, v) {
  u = u + getTextureOffsetU();
  if (u > 1.0) u -= 1.0; if (u < 0) u += 1.0;
  v = v + getTextureOffsetV();
  if (v > 1.0) v -= 1.0; if (v < 0) v += 1.0;
  u *= 2 * Math.PI;
  v *= 2 * Math.PI;
  const R = 2.2;
  const r = 0.8;
  return {
    x: (R + r * Math.cos(v)) * Math.cos(u),
    y: (R + r * Math.cos(v)) * Math.sin(u),
    z: r * Math.sin(v)
  };
}

// Structure d'identification pour le carré fondamental
export const identification = [
  { edge1: 'left', edge2: 'right', orientation: 'same' },
  { edge1: 'top', edge2: 'bottom', orientation: 'same' }
];

// Groupe de Poincaré (premier groupe d'homotopie)
export const quotientGroup = 'ℤ²';

// Invariants algébriques complets
export const algebraicInvariants = {
  pi1: 'ℤ²',      // Groupe fondamental π₁
  H1: 'ℤ²',       // Premier groupe d'homologie H₁
  chi: 0,         // Caractéristique d'Euler χ
  H2: '{0}',      // Deuxième groupe d'homologie H₂
  orientable: '○' // Orientabilité
};

// Gestion du drag spécifique tore
export function handleDrag(deltaX, deltaY, angles, config) {
  // dragX = rotY (normal)
  angles.rotY += deltaX * config.mouseSensitivity * 0.01;
  // dragY = rotX + rotZ (effet combiné)
  angles.rotX += deltaY * config.mouseSensitivity * 0.5 * 0.01;
  angles.rotZ += deltaY * config.mouseSensitivity * 0.5 * 0.01;
}
