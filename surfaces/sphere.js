// File: sphere.js - Sphere surface
// Desc: En français, dans l'architecture, je suis une sphère simple
// Version 1.0.0 (création initiale)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 16, 2024 00:45 UTC+1
// Logs:
//   - v1.0.0: Initial sphere implementation with UV mapping

// Icône topologique simple
// Sphère : surface fermée sans flèches directionnelles
export const topologyIcon = {
  center: '🌍'
};

export function sphere(u, v) {
  // Paramètres sphériques standards
  // u = longitude (0 à 1 → 0 à 2π)
  // v = latitude (0 à 1 → 0 à π)
  
  const phi = u * 2 * Math.PI;      // Longitude: 0 à 2π
  const theta = v * Math.PI;        // Latitude: 0 à π
  
  const radius = 2.5;               // Rayon de la sphère
  
  return {
    x: radius * Math.sin(theta) * Math.cos(phi),
    y: radius * Math.cos(theta),    // Y = hauteur (pôle nord en haut)
    z: radius * Math.sin(theta) * Math.sin(phi)
  };
}

// Configuration spécifique sphère
export const config = {
  scale: 120,                       // Scale optimal pour sphère
  defaultRotation: { x: 25, y: 45 }, // Vue 3/4 par défaut
  name: 'Sphère',
  emoji: '🌍'
};

// Fonction Three.js (legacy - pour homogénéité)
export function createSurface() {
  const geometry = new THREE.SphereGeometry(2.5, 30, 20);
  const material = new THREE.MeshStandardMaterial({ color: 0x3399ff });
  return new THREE.Mesh(geometry, material);
} 