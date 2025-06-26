// File: surfaces/2D.js - Surface 2D avec projections neutres
// Desc: En français, dans l'architecture, je suis une surface 2D plate pour morphing avec inversion Y des tuiles
// Version 1.2.0 (homogénéisation architecture)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 15, 2024 23:25 UTC+1
// Logs:
//   - v1.2.0: Ajout createSurface() et config pour homogénéité avec autres surfaces
//   - v1.0.0: Surface 2D plate avec coordonnées neutres et inversion Y

/**
 * Surface 2D - grille plate pour morphing 2D ↔ 3D
 * @param {number} u - Paramètre U normalisé [0,1]
 * @param {number} v - Paramètre V normalisé [0,1] (inversé pour Y)
 * @returns {Object} Point 3D {x, y, z}
 */
export function surface2D(u, v) {
  // Inversion de l'ordre des tuiles en Y comme demandé
  const vInversed = 1 - v;
  // Inversion droite/gauche en X comme demandé
  const uInversed = 1 - u;
  
  return {
    x: (uInversed - 0.5) * 6, // Étalement horizontal avec inversion X (droite/gauche)
    y: (vInversed - 0.5) * 4, // Étalement vertical avec inversion Y
    z: 0                      // Complètement plat (Z=0)
  };
}

// Configuration spécifique 2D
export const config = {
  scale: 108,                    // Scale optimal pour 2D
  defaultRotation: { x: 0, y: 135 }, // Vue par défaut
  name: 'Vue 2D',
  emoji: '🔄'
};

// Fonction Three.js (legacy - pour homogénéité)
export function createSurface() {
  const geometry = new THREE.PlaneGeometry(6, 4, 30, 20);
  const material = new THREE.MeshStandardMaterial({ color: 0x3399ff, wireframe: true });
  return new THREE.Mesh(geometry, material);
}

// Export par défaut pour compatibilité
export default surface2D; 