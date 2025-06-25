// File: config.js - Configuration for topology morphing animation
// Desc: En français, dans l'architecture, je suis la configuration des animations morphing
// Version 1.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 15:45 UTC+1
// Logs:
//   - Animation configuration for barycentric interpolation

// === CONFIGURATION ANIMATION ===
export const config = {
  // Coefficient barycentrique pour l'interpolation
  // 0.0 = transition instantanée, 0.99 = très lent
  bary: 0.95,
  
  // Seuil de convergence (en unités 3D)
  convergenceThreshold: 0.01,
  
  // Vitesse d'animation (ms entre frames)
  animationSpeed: 16, // ~60 FPS
  
  // Auto-animation (morphing automatique entre surfaces)
  autoMorph: false,
  autoMorphDelay: 3000, // 3 secondes par surface
  
  // Debug
  showConvergence: false
}; 