// File: disk.js - Disk surface with boundary
// Desc: En français, dans l'architecture, je suis un disque avec bord
// Version 1.0.0 (création)
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 16:15 UTC+1
// Logs:
//   - Initial disk implementation with boundary

export function disk(u, v) {
  const r = u; // Rayon de 0 à 1
  const theta = v * 2 * Math.PI;
  
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  
  return {
    x: r * cosTheta * 2.5,
    y: 0,
    z: r * sinTheta * 2.5
  };
} 