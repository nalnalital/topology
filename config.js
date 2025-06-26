// File: config.js - Configuration for topology morphing animation
// Desc: En français, dans l'architecture, je suis la configuration des animations morphing
// Version 1.6.0 (défaut rotY=135° optimal pour 2D)
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 16:15 UTC+1
// Logs:
//   - Updated default rotation to rx=0°, ry=22°
//   - Added drag control configuration
//   - Support for 8 topology types

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
  showConvergence: false,
  
  // Raytracing faces cachées
  hiddenFacesDebugInterval: 30, // Affichage debug toutes les N frames
  
  // Rotations par défaut (en degrés)
  defaultRotationX: 0,   // 0° vue horizontale
  defaultRotationY: 135, // 135° rotation optimale
  
  // Sensibilité souris
  mouseSensitivity: 0.5,  // Facteur de sensibilité pour drag
  
  // Icônes alternatives intéressantes pour les surfaces topologiques
  // 💠 - étoile à six branches (géométrie complexe)
  // 🌌 - galaxie spirale (cosmos, infini)
  // 🪐 - planète avec anneaux (géométrie toroïdale)
}; 