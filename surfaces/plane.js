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
  center: '🔷'
};

export function plane(u, v) {
  // IDENTIQUE à 2D : mêmes inversions et axes
  const vInversed = 1 - v;    // INVERSION Y comme 2D
  const uInversed = 1 - u;    // INVERSION X comme 2D
  
  return {
    x: (uInversed - 0.5) * 6,  // X inversé comme 2D
    y: (vInversed - 0.5) * 4,  // Y inversé comme 2D (pas Z!)
    z: 0                       // Complètement plat comme 2D
  };
}

// Configuration spécifique plane
export const config = {
  scale: 150,                    // Scale optimal pour plan
  defaultRotation: { x: 35, y: 120 }, // Vue 3/4 par défaut
  name: 'Plan',
  emoji: '🔷'
};

// Fonction Three.js (legacy - pour homogénéité)
export function createSurface() {
  const geometry = new THREE.PlaneGeometry(6, 4, 30, 20);
  const material = new THREE.MeshStandardMaterial({ color: 0x3399ff });
  return new THREE.Mesh(geometry, material);
} 