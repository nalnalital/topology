// File: crosscap.js - Cross-cap surface 
// Desc: En français, dans l'architecture, je suis un cross-cap [- -] non-orientable
// Version 1.0.0 (création)
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 16:15 UTC+1
// Logs:
//   - Initial cross-cap implementation with singularity

export function crosscap(u, v) {
  u *= Math.PI;
  v *= 2 * Math.PI;
  
  const sinU = Math.sin(u);
  const cosU = Math.cos(u);
  const cosV = Math.cos(v);
  const sinV = Math.sin(v);
  const cos2V = Math.cos(2 * v);
  
  return {
    x: sinU * cosV * 2,
    y: sinU * sinV * 2,
    z: cosU * cos2V
  };
} 