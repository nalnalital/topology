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
  center: '💿'
};

// Décalage texture spécifique disque (offset paramétrique)
export function getTextureOffsetU() { return 0; }
export function getTextureOffsetV() { return 0; }

export function createSurface(u, v) {
  // Décalage offset si besoin (optionnel, wrap uniquement sur v)
  // u = u + getTextureOffsetU();
  // u = Math.max(0, Math.min(1, u));
  v = v + getTextureOffsetV();
  if (v > 1.0) v -= 1.0; if (v < 0) v += 1.0;

  // u = rayon [0,1] (centre = pôle nord, bord = pôle sud)
  // v = angle [0,1] (0 à 2π)
  const r = u; // Rayon dans le plan du disque
  const theta = v * 2 * Math.PI; // Angle autour du centre

  // Calcul stéréographique pour la latitude
  const R = 1;
  const r_sphere = u * R;
  const phi = Math.PI / 2 - 2 * Math.atan(r_sphere / 2); // latitude sphérique
  const lat = phi / Math.PI; // normalisé [0,1] du pôle nord (1) au sud (0)

  // Disque plat : Y=0, XZ dans le plan
  // Mapping UV stéréographique corrigé :
  //   - textureU = u (rayon) → centre=pôle nord, bord=pôle sud
  //   - textureV = v (angle) → rotation autour du centre
  return {
    x: r * Math.cos(theta) * 2.5,
    y: 0,
    z: r * Math.sin(theta) * 2.5,
    textureU: v,      // longitude
    textureV: 1 - lat, // latitude stéréographique
    gridU: v,
    gridV: 1 - lat
  };
}

// Configuration spécifique disk
export const config = {
  scale: 100,
  rotX: 5,
  rotY: 0,
  rotZ: 0
};

// Gestion du drag spécifique disque
export function handleDrag(deltaX, deltaY, angles, config) {
  angles.rotY += deltaX * config.mouseSensitivity * 0.01;
  angles.rotX += deltaY * config.mouseSensitivity * 0.01;
  angles.rotX = Math.max(-Math.PI, Math.min(Math.PI, angles.rotX));
} 