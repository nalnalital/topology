// File: projective.js - Projective plane surface  
// Desc: En français, dans l'architecture, je suis le plan projectif avec pôle SUD à l'infini (projection sphérique douce)
// Version 1.6.0 (retrait inversion X/Y)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 16, 2024 02:42 UTC+1
// Logs:
//   - v1.6.0: Retrait inversion X/Y - pas d'effet visuel en projection isométrique
//   - v1.4.0: Inversion paramétrisation - pôle SUD à l'infini au lieu du pôle NORD (u_inverted = π - u)
//   - v1.3.0: Transition ultra-douce - fréquence 0.5 + racine carrée pour meilleure progression aux pôles
//   - v1.2.0: Projection sphérique douce - fini l'effet soucoupe aux pôles !
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
    console.log(`🪩 [projective] u=${u.toFixed(2)} u_inv=${u_inverted.toFixed(2)} → polarFactor=${polarFactor.toFixed(3)} smooth=${smoothTransition.toFixed(3)} heightScale=${heightScale.toFixed(3)} z=${(heightVariation * 2.0).toFixed(3)}`);
  }
  
  return {
    x: x * radius,
    y: y * radius,
    z: heightVariation * 2.0
  };
}

// Configuration spécifique projective
export const config = {
  scale: 80,                     // Scale réduit pour plan projectif
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