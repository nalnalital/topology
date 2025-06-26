// File: config.js - Configuration for topology morphing animation
// Desc: En français, dans l'architecture, je suis la configuration des animations morphing
// Version 1.7.0 (angles privilégiés par topologie)
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 22:30 UTC+1
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
  
  // ANGLES PRIVILÉGIÉS PAR TOPOLOGIE (en degrés)
  privilegedAngles: {
    'view2d': { rotX: 0, rotY: 135 },     // Vue 2D optimale
    'plane': { rotX: 0, rotY: 135 },      // Plan identique à 2D
    'cylinder': { rotX: 0, rotY: 90 },    // Cylindre vue de profil
    'torus': { rotX: 15, rotY: 45 },      // Tore vue 3/4
    'mobius': { rotX: 30, rotY: 60 },     // Möbius vue perspective
    'klein': { rotX: 20, rotY: 30 },      // Klein vue détaillée
    'disk': { rotX: -10, rotY: 0 },       // Disque vue légèrement inclinée
    'crosscap': { rotX: 25, rotY: 45 },   // Cross-cap vue 3D
    'projective': { rotX: 10, rotY: 20 }  // Projectif vue douce
  },
  
  // Icônes alternatives intéressantes pour les surfaces topologiques
  // 💠 - étoile à six branches (géométrie complexe)
  // 🌌 - galaxie spirale (cosmos, infini)
  // 🪐 - planète avec anneaux (géométrie toroïdale)
}; 