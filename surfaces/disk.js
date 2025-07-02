// File: disk.js - Disk surface with boundary
// Desc: En français, dans l'architecture, je suis un disque avec projection stéréographique
// Version 1.2.0 (projection stéréographique inverse)
// Author: DNAvatar.org - Arnaud Maignan
// Date: December 16, 2024 01:00 UTC+1
// Logs:
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

  // Disque plat : Y=0, XZ dans le plan
  // Mapping UV platistes :
  //   - textureU = v (angle)
  //   - textureV = u (rayon)
  return {
    x: r * Math.cos(theta) * 2.5,
    y: 0,
    z: r * Math.sin(theta) * 2.5,
    textureU: v, // angle
    textureV: u  // rayon (0=centre, 1=bord)
  };
}

// Configuration spécifique disk
export const config = {
  scale: 162,
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