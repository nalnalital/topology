// File: plane.js - Plane surface
// Desc: En français, dans l'architecture, je suis un plan simple
// Version 1.0.0 (création)
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 22:00 UTC+1
// Logs:
//   - Initial plane implementation

// Icône topologique simple
// Plan : surface simple sans flèches directionnelles
export const topologyIcon = {
  center: '🔷'
};

export function plane(u, v) {
  return {
    x: (u - 0.5) * 6,
    y: 0,
    z: (v - 0.5) * 4
  };
} 