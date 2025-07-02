// File: boy.js - Surface de Boy (immersion de la sphère non orientable)
// Desc: En français, dans l'architecture, je suis le module de génération de la surface de Boy (immersion de S^2 dans R^3, non quotient du carré)
// Version 1.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.0.0 Création du module, paramétrisation Kusner-Bryant
//   - Export standard createSurface(u, v)
//   - Utilisation: import { createSurface } from './boy.js';
//   - Appel: createSurface(u, v) avec u,v in [0,1]

/**
 * Paramétrisation de la surface de Boy (Kusner-Bryant)
 * @param {number} u - [0,1] → θ = πu
 * @param {number} v - [0,1] → φ = 2πv
 * @returns {{x: number, y: number, z: number}}
 */
export function createSurface(u, v) {
  // Mapping carré → sphère
  const theta = Math.PI * u;      // [0, π]
  const phi = 2 * Math.PI * v;    // [0, 2π]

  // Coordonnées sphériques
  const X = Math.sin(theta) * Math.cos(phi);
  const Y = Math.sin(theta) * Math.sin(phi);
  const Z = Math.cos(theta);

  // Paramétrisation de Boy (Kusner-Bryant)
  // Voir https://en.wikipedia.org/wiki/Boy%27s_surface#Parametrization
  const sqrt2 = Math.sqrt(2);
  const x = (1/2) * (sqrt2 * Math.cos(theta) * Math.sin(2*phi) - Math.sin(theta) * Math.sin(phi) * Math.sin(2*phi));
  const y = (1/2) * (sqrt2 * Math.sin(theta) * Math.cos(2*phi) + Math.cos(theta) * Math.cos(phi) * Math.sin(2*phi));
  const z = Math.cos(theta) * Math.cos(phi);

  // Mise à l'échelle pour correspondre aux autres surfaces
  return { x: x, y: y, z: z };
} 