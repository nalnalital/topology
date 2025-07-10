// File: config.js - Configuration for topology morphing animation
// Desc: En français, dans l'architecture, je suis la configuration des animations morphing
// Version 1.10.0 (angles tore + projectif)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 16, 2024 00:08 UTC+1
// Logs:
//   - ANGLES TORE: -140° 90° -60° 90 (pôle sud intérieur visible)
//   - ANGLES PROJECTIF: 40° 5° 160° 85 (vue optimale plan projectif)
//   - Added drag control configuration
//   - Support for 8 topology types

// === CONFIGURATION ANIMATION ===
export const config = {
  // Coefficient barycentrique pour l'interpolation
  // 0.0 = transition instantanée, 0.99 = très lent
  bary: 0.85,
  
  // Seuil de convergence (en unités 3D)
  convergenceThreshold: 0.03,
  
  // Vitesse d'animation (ms entre frames)
  animationSpeed: 16, // ~60 FPS
  
  // Auto-animation (morphing automatique entre surfaces)
  autoMorph: false,
  autoMorphDelay: 3000, // 3 secondes par surface
  
  // Debug
  showConvergence: false,
  
  // Raytracing faces cachées
  hiddenFacesDebugInterval: 30, // Affichage debug toutes les N frames
  
  // Rotations par défaut (en degrés)
  defaultRotationX: 0,   // 0° vue horizontale
  defaultRotationY: 135, // 135° rotation optimale
  
  // Sensibilité souris
  mouseSensitivity: 0.5,  // Facteur de sensibilité pour drag
}; 