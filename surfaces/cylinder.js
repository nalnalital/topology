// File: cylinder.js - Cylindre surface topologique
// Desc: En français, dans l'architecture, je suis un cylindre avec miroir X pour cohérence texture
// Version 1.2.0 (ajout fonction mathématique + scale)
// Author: DNAvatar.org - Arnaud Maignan
// Date: [December 15, 2024] [21:00 UTC+1]
// Logs:
//   - v1.2.0: Ajout fonction mathématique cylinder() + scale optimal + configuration
//   - v1.1.0: Correction miroir X (sens rotation inversé)
//   - v1.0.0: Icône topologique initiale

// Icône topologique avec flèches directionnelles  
// Cylindre [+ +] : bords horizontaux dans même sens
export const topologyIcon = {
  center: '🫙',
  top: '',
  left: '🔼',
  right: '🔼', 
  bottom: ''
};

// Configuration spécifique cylindre
export const config = {
  scale: 180,                    // Scale optimal pour cylindre (plus grand que défaut 150)
  defaultRotation: { x: 35, y: 250, z: -45 }, // Vue historique (config.js)
  name: 'Cylindre',
  emoji: '🫙',
  slider: {
    // ... existing code ...
  }
};

// Fonction mathématique du cylindre
export function cylinder(u, v) {
  const phi = (1 - u) * 2 * Math.PI; // INVERSION X : sens de rotation inversé (1-u)
  const h = ((1 - v) - 0.5) * 3; // INVERSION Y : même logique que 2D (1-v)
  return {
    x: Math.cos(phi),
    y: h,
    z: Math.sin(phi)
  };
}

// Fonction Three.js (legacy)
export function createSurface() {
  const geometry = new THREE.CylinderGeometry(0.7, 0.7, 1.5, 32, 1, true);
  const material = new THREE.MeshStandardMaterial({ color: 0xff9933, side: THREE.DoubleSide });
  return new THREE.Mesh(geometry, material);
}

// Structure d'identification pour le carré fondamental
export const identification = [
  { edge1: 'left', edge2: 'right', orientation: 'same' }
];
