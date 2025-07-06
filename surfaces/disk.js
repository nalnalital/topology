// File: disk.js - Disk surface with boundary
// Desc: En français, dans l'architecture, je suis un disque avec projection stéréographique
// Version 1.3.0 (mapping UV corrigé pour projection stéréographique)
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [16:30 UTC+1]
// Logs:
//   - v1.3.0: Correction mapping UV - textureU=rayon, textureV=angle pour projection stéréographique correcte
//   - v1.2.0: Projection stéréographique inverse - centre=pôle nord, bord=pôle sud
//   - v1.1.0: Ajout createSurface() et config pour homogénéité avec autres surfaces

// Icône topologique simple
// Disque : surface simple sans flèches directionnelles
export const topologyIcon = {
  shape: 'circle',
  center: '💿',
  segments: [0] // 1 seul segment, pas de dégradé
};

// Invariants algébriques complets
export const algebraicInvariants = {
  name: 'D²',      // Nom algébrique
  pi1: '{∅}',     // Groupe fondamental π₁
  H1: '{∅}',      // Premier groupe d'homologie H₁
  chi: 1,         // Caractéristique d'Euler χ
  H2: '{∅}',      // Deuxième groupe d'homologie H₂
  orientable: '○' // Orientabilité
};

// Décalage texture spécifique disque (offset paramétrique)
export function getTextureOffsetU() { return 0; }
export function getTextureOffsetV() { return 0; }

export function createSurface(u, v) {
  // Décalage offset si besoin (wrap uniquement sur u)
  u = u + getTextureOffsetU();
  if (u > 1.0) u -= 1.0; if (u < 0) u += 1.0;

  // Correction :
  // u = angle (0..1), v = rayon (0..1)
  const theta = u * 2 * Math.PI; // Angle [0, 2π]
  const r = v; // Rayon direct du disque
  const x = r * Math.cos(theta) * 2.5; // Échelle pour visibilité
  const y = r * Math.sin(theta) * 2.5; // Plan XY (disque horizontal)
  const z = 0; // Hauteur constante

  // Texture UV
  const textureU = u; // Longitude (angle)
  const textureV = 1 - v; // Latitude (1 au centre, 0 au bord)

  return {
    x: x,
    y: y,
    z: z,
    textureU: textureU,
    textureV: textureV,
    gridU: textureU,
    gridV: textureV
  };
}

// Configuration spécifique disk
export const config = {
  scale: 70,
  rotX: 30,
  rotY: 15,
  rotZ: 120
};

// Gestion du drag spécifique disque
export function handleDrag(deltaX, deltaY, angles, config) {
  angles.rotY += deltaX * config.mouseSensitivity * 0.01;
  angles.rotX += deltaY * config.mouseSensitivity * 0.01;
  angles.rotX = Math.max(-Math.PI, Math.min(Math.PI, angles.rotX));
} 