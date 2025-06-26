// File: plane.js - Plane surface
// Desc: En français, dans l'architecture, je suis un plan simple
// Version 1.1.0 (identique à 2D)
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 21:40 UTC+1
// Logs:
//   - v1.1.0: Plan identique à 2D (mêmes inversions X/Y, axe Y au lieu de Z)
//   - v1.0.0: Initial plane implementation

// Icône topologique simple
// Plan : surface simple sans flèches directionnelles
export const topologyIcon = {
  center: '🔷'
};

export function plane(u, v) {
  // IDENTIQUE à 2D : mêmes inversions et axes
  const vInversed = 1 - v;    // INVERSION Y comme 2D
  const uInversed = 1 - u;    // INVERSION X comme 2D
  
  return {
    x: (uInversed - 0.5) * 6,  // X inversé comme 2D
    y: (vInversed - 0.5) * 4,  // Y inversé comme 2D (pas Z!)
    z: 0                       // Complètement plat comme 2D
  };
} 