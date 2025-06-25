// File: projective.js - Projective plane surface
// Desc: En français, dans l'architecture, je suis le plan projectif avec projection stéréographique
// Version 1.0.0 (création)
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 16:15 UTC+1
// Logs:
//   - Initial projective plane implementation

export function projective(u, v) {
  u *= Math.PI;
  v *= 2 * Math.PI;
  
  const sinU = Math.sin(u);
  const cosU = Math.cos(u);
  const cosV = Math.cos(v);
  const sinV = Math.sin(v);
  
  // Paramètres sur la sphère
  const x = sinU * cosV;
  const y = sinU * sinV;
  const z = cosU;
  
  // Projection stéréographique modifiée
  const denom = 1 + Math.abs(z);
  
  return {
    x: x / denom * 3,
    y: y / denom * 3,
    z: Math.sign(z) * (1 - 1/denom) * 2
  };
} 