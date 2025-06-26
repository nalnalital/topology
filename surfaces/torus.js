// File: torus.js - Tore surface topologique
// Desc: En français, dans l'architecture, je suis un tore avec structure 2D universelle
// Version 1.2.0 (ajout fonction mathématique + scale)
// Author: DNAvatar.org - Arnaud Maignan
// Date: [December 15, 2024] [21:05 UTC+1]
// Logs:
//   - v1.2.0: Ajout fonction mathématique torus() + scale optimal + configuration
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
  scale: 120,                    // Scale optimal pour torus (plus petit que défaut 150)
  defaultRotation: { x: 0, y: 135 }, // Vue 3/4 par défaut
  name: 'Tore',
  emoji: '🍩'
};

// Fonction mathématique du torus
export function torus(u, v) {
  const phi = u * 2 * Math.PI;
  const theta = v * 2 * Math.PI;
  const R = 2; // Rayon majeur
  const r = 0.8; // Rayon mineur
  
  return {
    x: (R + r * Math.cos(theta)) * Math.cos(phi),
    y: r * Math.sin(theta),
    z: (R + r * Math.cos(theta)) * Math.sin(phi)
  };
}

// Fonction Three.js (legacy)
export function createSurface() {
  const geometry = new THREE.TorusGeometry(1, 0.4, 32, 64);
  const material = new THREE.MeshStandardMaterial({ color: 0x3399ff });
  return new THREE.Mesh(geometry, material);
}
