// File: disk.js - Disk surface with boundary
// Desc: En français, dans l'architecture, je suis un disque avec bord
// Version 1.1.0 (homogénéisation architecture)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 15, 2024 23:25 UTC+1
// Logs:
//   - v1.1.0: Ajout createSurface() et config pour homogénéité avec autres surfaces

// Icône topologique simple
// Disque : surface simple sans flèches directionnelles
export const topologyIcon = {
  center: '💿'
};

export function disk(u, v) {
  const r = u; // Rayon de 0 à 1
  const theta = v * 2 * Math.PI;
  
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  
  return {
    x: r * cosTheta * 2.5,
    y: 0,
    z: r * sinTheta * 2.5
  };
}

// Configuration spécifique disk
export const config = {
  scale: 162,                    // Scale optimal pour disque
  defaultRotation: { x: 5, y: 0 }, // Vue par défaut
  name: 'Disque',
  emoji: '💿'
};

// Fonction Three.js (legacy - pour homogénéité)
export function createSurface() {
  const geometry = new THREE.CircleGeometry(2.5, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0x3399ff });
  return new THREE.Mesh(geometry, material);
} 