// File: mobius.js - Ruban de Möbius surface topologique
// Desc: En français, dans l'architecture, je suis un ruban de Möbius avec structure 2D universelle
// Version 1.2.0 (ajout fonction mathématique + scale)
// Author: DNAvatar.org - Arnaud Maignan
// Date: [December 15, 2024] [21:15 UTC+1]
// Logs:
//   - v1.2.0: Ajout fonction mathématique mobius() + scale optimal + configuration
//   - v1.1.0: Structure 2D universelle appliquée
//   - v1.0.0: Icône topologique initiale

// Icône topologique pour la bande de Möbius
export const topologyIcon = {
  shape: 'square',
  center: '♾️',
  top: '',
  left: '🔽',
  right: '🔼',
  bottom: ''
};

// Configuration spécifique mobius
export const config = {
  scale: 90,
  rotX: 27,
  rotY: -9,
  rotZ: -45
};

// Invariants algébriques complets
export const algebraicInvariants = {
  name: 'M',       // Nom algébrique
  pi1: 'ℤ/2ℤ',    // Groupe fondamental π₁
  H1: 'ℤ/2ℤ',     // Premier groupe d'homologie H₁
  chi: 0,         // Caractéristique d'Euler χ
  H2: '{∅}',      // Deuxième groupe d'homologie H₂
  orientable: '⊗' // Orientabilité
};

// Décalage texture spécifique ruban de Möbius (offset paramétrique)
export function getTextureOffsetU() { return 0; }
export function getTextureOffsetV() { return 0; }

// Fonction mathématique du ruban de Möbius
export function createSurface(u, v) {
  u = u + getTextureOffsetU();
  if (u > 1.0) u -= 1.0;if (u<0) u+=1.0
  v = v + getTextureOffsetV();
  if (v > 1.0) v -= 1.0;if (v < 0) v += 1.0;
  u *= 2 * Math.PI;
  v = (v - 0.5) * 2;
  return {
    x: Math.cos(u) + v * Math.cos(u/2) * Math.cos(u),
    y: Math.sin(u) + v * Math.cos(u/2) * Math.sin(u),
    z: v * Math.sin(u/2)
  };
}

// Gestion du drag spécifique ruban de Möbius
export function handleDrag(deltaX, deltaY, angles, config) {
  angles.rotY += deltaX * config.mouseSensitivity * 0.01;
  angles.rotX += deltaY * config.mouseSensitivity * 0.01;
  angles.rotX = Math.max(-Math.PI, Math.min(Math.PI, angles.rotX));
}
