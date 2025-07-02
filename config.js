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
  
  // ANGLES PRIVILÉGIÉS PAR TOPOLOGIE (X°, Y°, Z°, Scale)
  privilegedAngles: {
    'view2d': { rotX: 0, rotY: 135, rotZ: 0, scale: 108 },        // 2D : 0° 135° 0° 108
    'sphere': { rotX: 3, rotY: 223, rotZ: -45, scale: 60 },       // Sphère : 3° 223° -45° 60
    'disk': { rotX: 5, rotY: 0, rotZ: -5, scale: 162 },           // Disque : 5° 0° -5° 162
    'cylinder': { rotX: 35, rotY: 250, rotZ: -45, scale: 100 },   // Cylindre : 35° 250° -45° 100
    'mobius': { rotX: 27, rotY: -9, rotZ: -45, scale: 100 },      // Möbius : 27° -9° -45° 100
    'torus': { rotX: -140, rotY: 90, rotZ: -60, scale: 90 },      // Tore : -140° 90° -60° 90
    'klein': { rotX: 0, rotY: -25, rotZ: -75, scale: 40 },        // Klein : 0° -25° -75° 40
    'crosscap': { rotX: 0, rotY: -90, rotZ: -45, scale: 180 },    // Cross : 0° -90° -45° 180
    'projective': { rotX: 40, rotY: 5, rotZ: 160, scale: 85 }     // Projectif : 40° 5° 160° 85
  },
  // NOTE : La seule source de vérité pour les angles et échelles est 'privilegedAngles'.
}; 