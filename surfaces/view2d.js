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
export function createSurface(u, v) {
  // Inversion de l'ordre des tuiles en Y comme demandé
  const vInversed = 1 - v;
  // Inversion droite/gauche en X comme demandé
  const uInversed = 1 - u;
  
  u = u + getTextureOffsetU();
  if (u > 1.0) u -= 1.0; if (u < 0) u += 1.0;
  v = v + getTextureOffsetV();
  if (v > 1.0) v -= 1.0; if (v < 0) v += 1.0;
  
  return {
    x: (uInversed - 0.5) * 6, // Étalement horizontal avec inversion X (droite/gauche)
    y: (vInversed - 0.5) * 4, // Étalement vertical avec inversion Y
    z: 0                      // Complètement plat (Z=0)
  };
}

// Configuration spécifique 2D
export const config = {
  scale: 108,
  rotX: 0,
  rotY: 135,
  rotZ: 0
};

// Décalage texture spécifique 2D (offset paramétrique)
export function getTextureOffsetU() { return 0; }
export function getTextureOffsetV() { return 0; }

// Groupe de Poincaré (premier groupe d'homotopie)
// View2D = surface 2D plate → groupe trivial
export const quotientGroup = '{∅}';

// Invariants algébriques complets
export const algebraicInvariants = {
  pi1: '{∅}',     // Groupe fondamental π₁
  H1: '{0}',      // Premier groupe d'homologie H₁
  chi: 1,         // Caractéristique d'Euler χ
  H2: '{0}',      // Deuxième groupe d'homologie H₂
  orientable: '○' // Orientabilité
};

// Export par défaut pour compatibilité
export default createSurface; 