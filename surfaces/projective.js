// File: projective.js - Projective plane surface
// Desc: En français, dans l'architecture, je suis le plan projectif avec pôle SUD à l'infini (projection sphérique douce)
// Version 1.7.0 (Restored from faulty Steiner refactor)
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 09, 2025] [HH:MM UTC+1]
// Logs:
//   - v1.7.0: Reverted faulty refactoring. Function is 'projective', config name is 'Steiner'.
//   - v1.6.0: Retrait inversion X/Y - pas d'effet visuel en projection isométrique
//   - v1.4.0: Inversion paramétrisation - pôle SUD à l'infini au lieu du pôle NORD (u_inverted = π - u)
//   - v1.3.0: Transition ultra-douce - fréquence 0.5 + racine carrée pour meilleure progression aux pôles
//   - v1.2.0: Projection sphérique douce - fini l'effet soucoupe aux pôles !
//   - v1.1.0: Ajout createSurface() et config pour homogénéité avec autres surfaces

// Icône topologique avec flèches directionnelles
// Plan projectif [+- -+] : bords opposés identifiés avec torsion
export const topologyIcon = {
  shape: 'square',
  center: '🍎',
  top: '▶️',
  left: '⏬',
  right: '🔼',
  bottom: '⏪'
};

// Décalage texture spécifique projectif (offset paramétrique)
export function getTextureOffsetU() { return 0; }
export function getTextureOffsetV() { return 0; }

export function createSurface(u, v) {
  u = u + getTextureOffsetU();
  if (u > 1.0) u -= 1.0; if (u < 0) u += 1.0;
  v = v + getTextureOffsetV();
  if (v > 1.0) v -= 1.0; if (v < 0) v += 1.0;
  u *= Math.PI;
  v *= 2 * Math.PI;
  
  // INVERSION : Pôle SUD à l'infini au lieu du pôle NORD
  const u_inverted = Math.PI - u; // Inverser la paramétrisation
  
  const sinU = Math.sin(u_inverted);
  const cosU = Math.cos(u_inverted);
  const cosV = Math.cos(v);
  const sinV = Math.sin(v);
  
  // Paramètres sur la sphère (maintenant u=0 → pôle sud, u=π → pôle nord)
  const x = sinU * cosV;
  const y = sinU * sinV;
  const z = cosU;
  
  // PROJECTION SPHÉRIQUE ULTRA-DOUCE (transition graduelle aux pôles)
  // Facteur de fréquence plus lent et transition plus douce
  const polarFactor = Math.sin(u_inverted * 0.5); // Utiliser u_inverted pour cohérence
  const smoothTransition = Math.sqrt(polarFactor); // Racine carrée au lieu de carré pour transition plus douce
  const heightScale = 0.2 + 0.8 * smoothTransition; // Transition plus graduelle (0.1→0.2, éviter trop bas)
  
  // Projection avec transition ultra-douce - forme vraiment sphérique
  const radius = 2.6; // Légèrement réduit pour compenser
  const heightVariation = Math.cos(u_inverted) * heightScale;
  
  // DEBUG pour voir les valeurs aux pôles (plus fréquent pour vérifier)
  if (Math.random() < 0.002) { // 1 chance sur 500 pour debug
    console.log(`🍎 [projective] u=${u.toFixed(2)} u_inv=${u_inverted.toFixed(2)} → polarFactor=${polarFactor.toFixed(3)} smooth=${smoothTransition.toFixed(3)} heightScale=${heightScale.toFixed(3)} z=${(heightVariation * 2.0).toFixed(3)}`);
  }
  
  return {
    x: x * radius,
    y: y * radius,
    z: heightVariation * 2.0
  };
}

// Structure d'identification pour le carré fondamental
export const identification = [
    { edge1: 'top', edge2: 'bottom', orientation: 'opposite' },
    { edge1: 'left', edge2: 'right', orientation: 'opposite' }
];

// Groupe de Poincaré (premier groupe d'homotopie)
export const quotientGroup = 'ℤ/2ℤ';

// Type de surface pour distinction
export const surfaceType = 'Plan projectif (standard)';

// Invariants algébriques complets
export const algebraicInvariants = {
  pi1: 'ℤ/2ℤ',    // Groupe fondamental π₁
  H1: 'ℤ/2ℤ',     // Premier groupe d'homologie H₁
  chi: 1,         // Caractéristique d'Euler χ
  H2: '{0}',      // Deuxième groupe d'homologie H₂
  orientable: '⊗' // Orientabilité
};

// Configuration spécifique
export const config = {
  scale: 75,
  rotX: -50,
  rotY: -45,
  rotZ: -10
};

// Gestion du drag spécifique projectif
export function handleDrag(deltaX, deltaY, angles, config) {
  angles.rotShape += deltaX * config.mouseSensitivity * 0.01;
  angles.rotX -= deltaY * config.mouseSensitivity * 0.01;
  angles.rotX = Math.max(-Math.PI, Math.min(Math.PI, angles.rotX));
} 