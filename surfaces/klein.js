// File: klein.js - Klein bottle surface
// Desc: En français, dans l'architecture, je suis la bouteille de Klein [+ -]
// Version 1.0.0 (création)
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 16:15 UTC+1
// Logs:
//   - Initial Klein bottle implementation with self-intersection

// Icône topologique avec flèches directionnelles
// Bouteille de Klein [+ -] : bords verticaux opposés
export const topologyIcon = {
  center: '🖇️',
  top: '▶️',
  left: '⏫',
  right: '⏫', 
  bottom: '◀️'
};

export function klein(u, v) {
  u *= 2 * Math.PI;
  v *= 2 * Math.PI;
  
  const a = 1.5;
  const cosU = Math.cos(u);
  const sinU = Math.sin(u);
  const cosV = Math.cos(v);
  const sinV = Math.sin(v);
  
  if (u < Math.PI) {
    return {
      x: (2.5 + 1.5 * cosV) * cosU,
      y: (2.5 + 1.5 * cosV) * sinU,
      z: -2.5 * sinV
    };
  } else {
    return {
      x: (2.5 + 1.5 * cosV) * cosU,
      y: (2.5 + 1.5 * cosV) * sinU,
      z: 2.5 * sinV
    };
  }
}

export function createSurface() {
  const geometry = new THREE.ParametricGeometry((u, v, target) => {
    u *= Math.PI * 2;
    v *= Math.PI * 2;
    let x, y, z;
    const r = 0.5;
    if (u < Math.PI) {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v) * Math.cos(u);
      y = 3 * Math.sin(u) * (1 + Math.sin(u)) + r * Math.cos(v) * Math.sin(u);
    } else {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v + Math.PI) * Math.cos(u);
      y = 3 * Math.sin(u) * (1 + Math.sin(u)) + r * Math.cos(v + Math.PI) * Math.sin(u);
    }
    z = r * Math.sin(v);
    target.set(x * 0.1, y * 0.1, z * 0.1);
  }, 100, 30);
  const material = new THREE.MeshStandardMaterial({ color: 0x009999, side: THREE.DoubleSide });
  return new THREE.Mesh(geometry, material);
}

// Configuration spécifique bouteille de Klein
export const config = {
  scale: 100,                       // Scale adapté à la géométrie Klein
  defaultRotation: { x: 30, y: 60 }, // Vue 3/4 optimale pour Klein
  name: 'Bouteille de Klein',
  emoji: '🖇️'
};
