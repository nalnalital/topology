// File: 3D/rotate.js - Centralized 3D rotation functions
// Desc: En français, dans l'architecture, je suis le module centralisé des rotations 3D
// Version 1.0.0 (centralisation des rotations)
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [17:00 UTC+1]
// Logs:
//   - v1.0.0: Centralisation de toutes les fonctions de rotation 3D

// === ROTATION 3D STANDARD ===
// Ordre : Y → X → Z (effet Diablo)
export function rotate3D(x, y, z, rotX, rotY, rotZ) {
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);
  
  // Rotation Y puis X puis Z (ordre important pour effet Diablo)
  const x1 = x * cosY - z * sinY;
  const y1 = y;
  const z1 = x * sinY + z * cosY;
  
  const x2 = x1;
  const y2 = y1 * cosX - z1 * sinX;
  const z2 = y1 * sinX + z1 * cosX;
  
  // Rotation Z finale pour inclinaison
  return {
    x: x2 * cosZ - y2 * sinZ,
    y: x2 * sinZ + y2 * cosZ,
    z: z2
  };
}

// === ROTATION 3D SPÉCIALE DISQUE ===
// Ordre : Z → X → Y (rotation dans le plan du disque)
export function rotate3DForDisk(x, y, z, rotX, rotY, rotZ) {
  const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  
  // 1. Rotation Z en premier (dans le plan du disque)
  const x1 = x * cosZ - y * sinZ;
  const y1 = x * sinZ + y * cosZ;
  const z1 = z;
  
  // 2. Rotation X (inclinaison)
  const x2 = x1;
  const y2 = y1 * cosX - z1 * sinX;
  const z2 = y1 * sinX + z1 * cosX;
  
  // 3. Rotation Y (inclinaison)
  return {
    x: x2 * cosY - z2 * sinY,
    y: y2,
    z: x2 * sinY + z2 * cosY
  };
}

// === ROTATION 3D PROJECTIVE ===
// Pour les surfaces projectives (Steiner, etc.)
export function rotate3DProjective(x, y, z, rotX, rotY, rotZ, rotShape) {
  // D'abord rotation de forme autour de l'axe principal (axe Z local de la forme)
  const cosShape = Math.cos(rotShape), sinShape = Math.sin(rotShape);
  const xShape = x * cosShape - y * sinShape;
  const yShape = x * sinShape + y * cosShape;
  const zShape = z;
  
  // Puis rotation normale (vue caméra)
  return rotate3D(xShape, yShape, zShape, rotX, rotY, rotZ);
}

// === FONCTION UNIVERSELLE DE ROTATION ===
// Sélectionne automatiquement la bonne fonction selon la surface
export function rotate3DUniversal(x, y, z, rotX, rotY, rotZ, surfaceName, rotShape = 0) {
  switch (surfaceName) {
    case 'projective':
      return rotate3DProjective(x, y, z, rotX, rotY, rotZ, rotShape);
    case 'disk':
      return rotate3DForDisk(x, y, z, rotX, rotY, rotZ);
    default:
      return rotate3D(x, y, z, rotX, rotY, rotZ);
  }
} 