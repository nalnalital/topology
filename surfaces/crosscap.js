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

export function crosscap(u, v) {
  u *= Math.PI;
  v *= 2 * Math.PI;
  
  const sinU = Math.sin(u);
  const cosU = Math.cos(u);
  const cosV = Math.cos(v);
  const sinV = Math.sin(v);
  const cos2V = Math.cos(2 * v);
  
  return {
    x: sinU * cosV * 2,
    y: sinU * sinV * 2,
    z: cosU * cos2V
  };
}

// Configuration spécifique crosscap
export const config = {
  scale: 180,                    // Scale optimal pour cross-cap
  defaultRotation: { x: 0, y: -90 }, // Vue par défaut
  name: 'Cross-cap',
  emoji: '🪢'
};

// Fonction Three.js (legacy - pour homogénéité)
export function createSurface() {
  // Géométrie approximative pour cross-cap
  const geometry = new THREE.SphereGeometry(2, 16, 16);
  const material = new THREE.MeshStandardMaterial({ color: 0x3399ff });
  return new THREE.Mesh(geometry, material);
} 