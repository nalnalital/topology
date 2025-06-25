// File: main.js - Topology viewer with morphing animation
// Desc: En français, dans l'architecture, je suis le moteur de rendu avec animation morphing barycentrique
// Version 3.1.0 (ajout animation morphing)
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 15:45 UTC+1
// Logs:
//   - Added barycentric morphing animation between surfaces
//   - Smooth transitions using interpolation
//   - Convergence detection for smooth stops

// === IMPORTS ===
import { config } from './config.js';

// === CONFIGURATION MAILLAGE ===
const MESH_U = 30; // Résolution en U (plus en X)
const MESH_V = 20; // Résolution en V (moins en Y)

// === PROJECTION ISOMÉTRIQUE ===
const ISO_COS = Math.cos(Math.PI / 6); // cos(30°)
const ISO_SIN = Math.sin(Math.PI / 6); // sin(30°)

function pd(func, file, msg) {
  console.log(`❌ [${func}][${file}] ${msg}`);
}

// === MAILLAGE AVEC ANIMATION ===
let currentMesh = null;
let targetSurface = 'plane';
let isAnimating = false;

function initializeMesh(surfaceFunc) {
  const vertices = [];
  const faces = [];
  
  // Génération des sommets sur grille rectangulaire
  for (let i = 0; i <= MESH_U; i++) {
    for (let j = 0; j <= MESH_V; j++) {
      const u = i / MESH_U; // Paramètre U normalisé [0,1]
      const v = j / MESH_V; // Paramètre V normalisé [0,1]
      
      const point = surfaceFunc(u, v);
      vertices.push({
        // Position courante (animée)
        x: point.x,
        y: point.y, 
        z: point.z,
        // Position cible (destination)
        xDest: point.x,
        yDest: point.y,
        zDest: point.z,
        // Paramètres UV pour recalcul
        u: u, v: v,
        index: i * (MESH_V + 1) + j
      });
    }
  }
  
  // Génération des faces (quads) - chaque carré = 4 sommets
  for (let i = 0; i < MESH_U; i++) {
    for (let j = 0; j < MESH_V; j++) {
      // Indices des 4 sommets du quad (dans le sens trigonométrique)
      const i0 = i * (MESH_V + 1) + j;         // Bottom-left
      const i1 = (i + 1) * (MESH_V + 1) + j;   // Bottom-right  
      const i2 = (i + 1) * (MESH_V + 1) + j + 1; // Top-right
      const i3 = i * (MESH_V + 1) + j + 1;     // Top-left
      
      faces.push({
        vertices: [i0, i1, i2, i3], // 4 indices
        center: null, // Calculé plus tard
        normal: null, // Calculé plus tard
        avgZ: null    // Profondeur après rotation
      });
    }
  }
  
  return { vertices, faces };
}

// Morphing vers une nouvelle surface
function morphToSurface(newSurfaceName) {
  if (!currentMesh || newSurfaceName === targetSurface) return;
  
  targetSurface = newSurfaceName;
  const newSurfaceFunc = surfaces[newSurfaceName];
  
  // Calculer les nouvelles positions cibles
  currentMesh.vertices.forEach(vertex => {
    const newPoint = newSurfaceFunc(vertex.u, vertex.v);
    vertex.xDest = newPoint.x;
    vertex.yDest = newPoint.y;
    vertex.zDest = newPoint.z;
  });
  
  isAnimating = true;
  pd('morphToSurface', 'main.js', `Morphing vers ${newSurfaceName}`);
}

// Update animation barycentrique
function updateMorphing() {
  if (!isAnimating || !currentMesh) return;
  
  let convergedCount = 0;
  
  currentMesh.vertices.forEach(vertex => {
    // Interpolation barycentrique
    const newX = config.bary * vertex.x + (1 - config.bary) * vertex.xDest;
    const newY = config.bary * vertex.y + (1 - config.bary) * vertex.yDest;
    const newZ = config.bary * vertex.z + (1 - config.bary) * vertex.zDest;
    
    // Test de convergence
    const maxDist = Math.max(
      Math.abs(newX - vertex.xDest),
      Math.abs(newY - vertex.yDest),
      Math.abs(newZ - vertex.zDest)
    );
    
    if (maxDist < config.convergenceThreshold) {
      // Convergé → fixer à la position finale
      vertex.x = vertex.xDest;
      vertex.y = vertex.yDest;
      vertex.z = vertex.zDest;
      convergedCount++;
    } else {
      // Continuer l'interpolation
      vertex.x = newX;
      vertex.y = newY;
      vertex.z = newZ;
    }
  });
  
  // Arrêter l'animation si tous les sommets ont convergé
  if (convergedCount === currentMesh.vertices.length) {
    isAnimating = false;
    pd('updateMorphing', 'main.js', `Animation terminée - tous sommets convergés`);
  }
}

// === SURFACES PARAMÉTRÉES ===
const surfaces = {
  // Plan test pour commencer
  plane: (u, v) => {
    return {
      x: (u - 0.5) * 4, // Plus large en X
      y: 0,
      z: (v - 0.5) * 2  // Moins large en Z
    };
  },
  
  cylinder: (u, v) => {
    const phi = u * 2 * Math.PI;
    const h = (v - 0.5) * 3;
    return {
      x: Math.cos(phi),
      y: h,
      z: Math.sin(phi)
    };
  },
  
  torus: (u, v) => {
    const R = 1.5, r = 0.6;
    const phi = u * 2 * Math.PI;
    const theta = v * 2 * Math.PI;
    return {
      x: (R + r * Math.cos(theta)) * Math.cos(phi),
      y: r * Math.sin(theta),
      z: (R + r * Math.cos(theta)) * Math.sin(phi)
    };
  },
  
  mobius: (u, v) => {
    u *= 2 * Math.PI;
    v = (v - 0.5) * 2;
    return {
      x: Math.cos(u) + v * Math.cos(u/2) * Math.cos(u),
      y: Math.sin(u) + v * Math.cos(u/2) * Math.sin(u),
      z: v * Math.sin(u/2)
    };
  }
};

// === ROTATION 3D ===
function rotate3D(x, y, z, rotX, rotY) {
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  
  // Rotation Y puis X
  const x1 = x * cosY - z * sinY;
  const y1 = y;
  const z1 = x * sinY + z * cosY;
  
  return {
    x: x1,
    y: y1 * cosX - z1 * sinX,
    z: y1 * sinX + z1 * cosX
  };
}

// === PROJECTION ISOMÉTRIQUE ===
function projectIso(x, y, z, scale) {
  return {
    x: (x * ISO_COS - z * ISO_COS) * scale,
    y: (y + x * ISO_SIN + z * ISO_SIN) * scale
  };
}

// === RENDU CANVAS ===
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let currentSurface = 'plane'; // Commencer par un plan (compatible legacy)
let rotX = Math.PI / 6, rotY = Math.PI / 4, scale = 150;
let showWireframe = true;
let showFaces = false;

function render() {
  // Clear
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Initialiser le maillage si nécessaire
  if (!currentMesh) {
    currentMesh = initializeMesh(surfaces[currentSurface]);
  }
  
  // Update animation
  updateMorphing();
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Rotation et projection des sommets (avec positions animées)
  const projectedVertices = currentMesh.vertices.map(vertex => {
    const rotated = rotate3D(vertex.x, vertex.y, vertex.z, rotX, rotY);
    const projected = projectIso(rotated.x, rotated.y, rotated.z, scale);
    
    return {
      x: centerX + projected.x,
      y: centerY - projected.y,
      z: rotated.z, // Profondeur pour tri
      originalIndex: vertex.index
    };
  });
  
  // Calcul centres et profondeurs des faces
  currentMesh.faces.forEach(face => {
    let centerX = 0, centerY = 0, centerZ = 0;
    
    face.vertices.forEach(vertexIndex => {
      const projected = projectedVertices[vertexIndex];
      centerX += projected.x;
      centerY += projected.y; 
      centerZ += projected.z;
    });
    
    face.center = {
      x: centerX / 4,
      y: centerY / 4
    };
    face.avgZ = centerZ / 4;
  });
  
  // Tri des faces par profondeur (painter's algorithm)
  const sortedFaces = currentMesh.faces.sort((a, b) => a.avgZ - b.avgZ);
  
  // Rendu wireframe avec couleur selon animation
  if (showWireframe) {
    ctx.strokeStyle = isAnimating ? '#e74c3c' : '#333'; // Rouge si en animation
    ctx.lineWidth = isAnimating ? 1.5 : 1;
    
    sortedFaces.forEach(face => {
      const indices = face.vertices;
      
      // Dessiner le contour du quad
      ctx.beginPath();
      ctx.moveTo(projectedVertices[indices[0]].x, projectedVertices[indices[0]].y);
      ctx.lineTo(projectedVertices[indices[1]].x, projectedVertices[indices[1]].y);
      ctx.lineTo(projectedVertices[indices[2]].x, projectedVertices[indices[2]].y);
      ctx.lineTo(projectedVertices[indices[3]].x, projectedVertices[indices[3]].y);
      ctx.closePath();
      ctx.stroke();
    });
  }
  
  // Debug info
  const status = isAnimating ? 'MORPHING' : 'STABLE';
  pd('render', 'main.js', `${status} - Maillage: ${currentMesh.vertices.length} sommets, ${currentMesh.faces.length} faces`);
}

// Boucle d'animation
function animate() {
  render();
  requestAnimationFrame(animate);
}

// Démarrer l'animation
animate();

// === CONTRÔLES ===
document.getElementById('surfaceSelector').addEventListener('change', (e) => {
  const newSurface = e.target.value;
  if (newSurface !== targetSurface) {
    morphToSurface(newSurface);
  }
});

document.getElementById('rotY').addEventListener('input', (e) => {
  rotY = (e.target.value * Math.PI) / 180;
});

document.getElementById('rotX').addEventListener('input', (e) => {
  rotX = (e.target.value * Math.PI) / 180;
});

document.getElementById('scale').addEventListener('input', (e) => {
  scale = parseInt(e.target.value);
});

// Plus besoin d'appeler render() manuellement - animation automatique !
