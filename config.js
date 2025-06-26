// File: config.js - Configuration for topology morphing animation
// Desc: En français, dans l'architecture, je suis la configuration des animations morphing
// Version 1.9.0 (scale 2D ajusté)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 15, 2024 23:05 UTC+1
// Logs:
//   - SCALE 2D AJUSTÉ: Scale vue 2D 109 → 108 pour alignement parfait
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
  
  // ANGLES PRIVILÉGIÉS PAR TOPOLOGIE (X°, Y°, Z°, Scale)
  privilegedAngles: {
    'view2d': { rotX: 0, rotY: 135, rotZ: 0, scale: 108 },        // 2D : 0° 135° 0° 108
    'plane': { rotX: 35, rotY: 120, rotZ: 45, scale: 100 },       // Plan : 35° 120° 45° 100
    'disk': { rotX: 5, rotY: 0, rotZ: -5, scale: 162 },           // Disque : 5° 0° -5° 162
    'cylinder': { rotX: 35, rotY: 250, rotZ: -45, scale: 100 },   // Cylindre : 35° 250° -45° 100
    'mobius': { rotX: 27, rotY: -9, rotZ: -45, scale: 100 },      // Möbius : 27° -9° -45° 100
    'torus': { rotX: 40, rotY: -60, rotZ: -60, scale: 95 },       // Tore : 40° -60° -60° 95
    'klein': { rotX: 0, rotY: -25, rotZ: -75, scale: 40 },        // Klein : 0° -25° -75° 40
    'crosscap': { rotX: 0, rotY: -90, rotZ: -45, scale: 180 },    // Cross : 0° -90° -45° 180
    'projective': { rotX: 10, rotY: 20, rotZ: 0, scale: 150 }     // Projectif (à voir après)
  },
  
  // Icônes alternatives intéressantes pour les surfaces topologiques
  // 💠 - étoile à six branches (géométrie complexe)
  // 🌌 - galaxie spirale (cosmos, infini)
  // 🪐 - planète avec anneaux (géométrie toroïdale)
}; 