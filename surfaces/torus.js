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
  scale: 120,                    // Scale optimal pour torus (plus petit que défaut 150)
  defaultRotation: { x: 0, y: 135 }, // Vue 3/4 par défaut
  name: 'Tore',
  emoji: '🍩'
};

// Fonction mathématique du torus
export function torus(u, v) {
  const phi = u * 2 * Math.PI;
  // CORRECTION PÔLE SUD: Décaler theta de π/2 pour que pôle sud soit à l'intérieur
  const theta = (v + 0.5) * 2 * Math.PI; // v=0 → theta=π (pôle sud intérieur)
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

// Structure d'identification pour le carré fondamental
export const identification = [
    { edge1: 'top', edge2: 'bottom', orientation: 'same' },
    { edge1: 'left', edge2: 'right', orientation: 'same' }
];
