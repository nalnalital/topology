// File: disk.js - Disk surface with boundary
// Desc: En français, dans l'architecture, je suis un disque avec projection stéréographique
// Version 1.2.0 (projection stéréographique inverse)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 16, 2024 01:00 UTC+1
// Logs:
//   - v1.2.0: Projection stéréographique inverse - centre=pôle nord, bord=pôle sud
//   - v1.1.0: Ajout createSurface() et config pour homogénéité avec autres surfaces

// Icône topologique simple
// Disque : surface simple sans flèches directionnelles
export const topologyIcon = {
  center: '💿'
};

export function disk(u, v) {
  // Projection stéréographique inverse
  // u = rayon de 0 à 1 (centre vers bord)
  // v = angle de 0 à 1 (0 à 2π)
  
  const r = u; // Rayon dans le plan du disque
  const theta = v * 2 * Math.PI; // Angle autour du centre
  
  // Projection stéréographique inverse : disque → hémisphère sud
  // Centre du disque (r=0) → pôle nord (0, 1, 0)
  // Bord du disque (r=1) → pôle sud (0, -1, 0) tout autour
  
  const radius = 2.5; // Rayon de la sphère de référence
  
  if (r < 0.001) {
    // Centre : pôle nord
    return {
      x: 0,
      y: radius,
      z: 0
    };
  }
  
  // Projection stéréographique inverse
  // Formule : (x, y) → (2x/(1+x²+y²), 2y/(1+x²+y²), (x²+y²-1)/(1+x²+y²))
  const x_plane = r * Math.cos(theta);
  const z_plane = r * Math.sin(theta);
  const denom = 1 + x_plane * x_plane + z_plane * z_plane;
  
  return {
    x: (2 * x_plane / denom) * radius,
    y: ((1 - x_plane * x_plane - z_plane * z_plane) / denom) * radius,
    z: (2 * z_plane / denom) * radius
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