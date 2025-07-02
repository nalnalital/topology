// File: sphere.js - Sphere surface
// Desc: En français, dans l'architecture, je suis une sphère simple
// Version 1.0.1 (inversion X)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 16, 2024 01:15 UTC+1
// Logs:
//   - v1.0.1: X coordinate inverted for correct texture projection
//   - v1.0.0: Initial sphere implementation with UV mapping

// Icône topologique simple
// Sphère : surface fermée sans flèches directionnelles
export const topologyIcon = {
  center: '🌍'
};

// Décalage texture spécifique sphère (offset paramétrique)
export function getTextureOffsetU() { return 0; }
export function getTextureOffsetV() { return 0; }

export function createSurface(u, v) {
  u = u + getTextureOffsetU();
  if (u > 1.0) u -= 1.0; if (u < 0) u += 1.0;
  v = v + getTextureOffsetV();
  if (v > 1.0) v -= 1.0; if (v < 0) v += 1.0;
  // Paramètres sphériques standards
  // u = longitude (0 à 1 → 0 à 2π)
  const phi = u * 2 * Math.PI;      // Longitude: 0 à 2π
  const theta = v * Math.PI;        // Latitude: 0 à π
  
  const radius = 2.5;               // Rayon de la sphère
  
  return {
    x: -radius * Math.sin(theta) * Math.cos(phi), // X inversé pour projection correcte
    y: radius * Math.cos(theta),    // Y = hauteur (pôle nord en haut)
    z: radius * Math.sin(theta) * Math.sin(phi)
  };
}

// Configuration spécifique sphère
export const config = {
  scale: 70,
  rotX: 25,
  rotY: 45,
  rotZ: 0
};

// Gestion du drag spécifique sphère
export function handleDrag(deltaX, deltaY, angles, config) {
  angles.rotY += deltaX * config.mouseSensitivity * 0.01;
  angles.rotX += deltaY * config.mouseSensitivity * 0.01;
  angles.rotX = Math.max(-Math.PI, Math.min(Math.PI, angles.rotX));
} 