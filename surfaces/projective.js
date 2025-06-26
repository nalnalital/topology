// File: projective.js - Projective plane surface
// Desc: En français, dans l'architecture, je suis le plan projectif avec projection stéréographique
// Version 1.1.0 (homogénéisation architecture)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 15, 2024 23:25 UTC+1
// Logs:
//   - v1.1.0: Ajout createSurface() et config pour homogénéité avec autres surfaces

// Icône topologique avec flèches directionnelles
// Plan projectif : géométrie complexe avec croisements
export const topologyIcon = {
  center: '🪩',
  top: '▶️',
  left: '⏬',
  right: '🔼',
  bottom: '⏪'
};

export function projective(u, v) {
  u *= Math.PI;
  v *= 2 * Math.PI;
  
  const sinU = Math.sin(u);
  const cosU = Math.cos(u);
  const cosV = Math.cos(v);
  const sinV = Math.sin(v);
  
  // Paramètres sur la sphère
  const x = sinU * cosV;
  const y = sinU * sinV;
  const z = cosU;
  
  // Projection stéréographique modifiée
  const denom = 1 + Math.abs(z);
  
  return {
    x: x / denom * 3,
    y: y / denom * 3,
    z: Math.sign(z) * (1 - 1/denom) * 2
  };
}

// Configuration spécifique projective
export const config = {
  scale: 150,                    // Scale optimal pour plan projectif
  defaultRotation: { x: 10, y: 20 }, // Vue par défaut
  name: 'Plan projectif',
  emoji: '🌎'
};

// Fonction Three.js (legacy - pour homogénéité)
export function createSurface() {
  // Géométrie approximative pour plan projectif
  const geometry = new THREE.SphereGeometry(3, 16, 16);
  const material = new THREE.MeshStandardMaterial({ color: 0x3399ff, transparent: true, opacity: 0.8 });
  return new THREE.Mesh(geometry, material);
} 