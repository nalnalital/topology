// File: mobius.js - Ruban de Möbius surface topologique
// Desc: En français, dans l'architecture, je suis un ruban de Möbius avec structure 2D universelle
// Version 1.2.0 (ajout fonction mathématique + scale)
// Author: DNAvatar.org - Arnaud Maignan
// Date: [December 15, 2024] [21:15 UTC+1]
// Logs:
//   - v1.2.0: Ajout fonction mathématique mobius() + scale optimal + configuration
//   - v1.1.0: Structure 2D universelle appliquée
//   - v1.0.0: Icône topologique initiale

// Icône topologique avec flèches directionnelles
// Möbius [+ -] : bord horizontal avec torsion
export const topologyIcon = {
  center: '♾️',
  top: '',
  left: '🔽',
  right: '🔼',
  bottom: ''
};

// Configuration spécifique mobius
export const config = {
  scale: 140,                    // Scale optimal pour mobius
  defaultRotation: { x: 30, y: 45 }, // Vue 3/4 légèrement inclinée
  name: 'Ruban de Möbius',
  emoji: '♾️',
  slider: {
    // ... existing code ...
  }
};

// Structure d'identification pour le carré fondamental
export const identification = [
    { edge1: 'left', edge2: 'right', orientation: 'opposite' }
];

// Fonction mathématique du ruban de Möbius
export function mobius(u, v) {
  u *= 2 * Math.PI;
  v = (v - 0.5) * 2;
  return {
    x: Math.cos(u) + v * Math.cos(u/2) * Math.cos(u),
    y: Math.sin(u) + v * Math.cos(u/2) * Math.sin(u),
    z: v * Math.sin(u/2)
  };
}

// Fonction Three.js (legacy)
export function createSurface() {
  const geometry = new THREE.ParametricGeometry((u, t, target) => {
    u *= Math.PI * 2;
    t = t * 2 - 1;
    const x = Math.cos(u) + t * Math.cos(u / 2) * Math.cos(u);
    const y = Math.sin(u) + t * Math.cos(u / 2) * Math.sin(u);
    const z = t * Math.sin(u / 2);
    target.set(x, y, z);
  }, 100, 15);
  const material = new THREE.MeshStandardMaterial({ color: 0x9900cc, side: THREE.DoubleSide });
  return new THREE.Mesh(geometry, material);
}
