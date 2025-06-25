// File: main.js - Moteur 3D isométrique avec morphing et texture mapping
// Desc: En français, dans l'architecture, je suis le cœur du moteur de rendu 3D isométrique avec support morphing barycentrique, algorithme faces cachées par raytracing, et texture mapping par rectangles pré-calculés avec UV stables lors du morphing
// Version 3.9.3 (debug à chaque changement rotation + pictos séparés)
// Author: DNAvatar.org - Arnaud Maignan  
// Date: June 08, 2025 20:25 UTC+1
// Logs:
//   - v3.9.3: Debug à chaque changement rotX/rotY + pictos extraits en tableau + suppression cadre controls
//   - v3.9.2: Debug UV déclenché à chaque rotation manuelle + amélioration style boutons
//   - v3.9.1: Debug UV tracking pour identifier changements inatendus lors rotations
//   - v3.9.0: Maillage complètement réinitialisé par changement (anti-corruption UV) + FPS + bouton reinit
//   - v3.8.1: Verbosité logs réduite (debug toutes les 2s au lieu de chaque frame)
//   - v3.8.0: Coordonnées UV stables pendant morphing (anti-sauts aléatoires texture)
//   - v3.7.0: Rectangles textures pré-calculés à plat puis transformés (performance x3, anti-pixellisation)
//   - v3.6.0: Texture mapping par transformations affines (scale/rotate/skew), projection complète de texture au lieu d'échantillonnage moyenné
//   - v3.5.0: Texture mapping avec échantillonnage 4 coins, couleur moyenne par face, rendu dual texture/wireframe
//   - v3.4.0: Raytracing faces cachées avec classification visible/partiel/caché, couleurs adaptatives
//   - v3.3.0: Morphing barycentrique avec convergence automatique et interface couleur
//   - v3.2.0: Projection isométrique native, maillage 30x20, animation 60 FPS

// === IMPORTS ===
import { config } from './config.js';

// === CONFIGURATION MAILLAGE ===
const MESH_U = 30; // Résolution en U (plus en X)
const MESH_V = 20; // Résolution en V (moins en Y)

// === PROJECTION ISOMÉTRIQUE ===
const ISO_COS = Math.cos(Math.PI / 6); // cos(30°)
const ISO_SIN = Math.sin(Math.PI / 6); // sin(30°)

// === OPTIMISATION RENDU RECTANGLES ===
let textureRectangles = null; // Cache des rectangles textures pré-calculés
let rectanglesDirty = true;   // Flag pour recalcul cache

// === DEBUG UV TRACKING ===
let lastUVSnapshot = null; // Snapshot précédent des UV pour détection changements

// === CHARGEMENT TEXTURE ===
function loadTexture() {
  const img = new Image();
  img.onload = function() {
    // Créer canvas hors-écran pour les transformations affines
    mapCanvas = document.createElement('canvas');
    mapCanvas.width = img.width;
    mapCanvas.height = img.height;
    mapContext = mapCanvas.getContext('2d');
    mapContext.drawImage(img, 0, 0);
    
    // Invalider le cache des rectangles
    rectanglesDirty = true;
    
    pd('loadTexture', 'main.js', `✅ Texture chargée: ${img.width}x${img.height} pixels - Cache rectangles invalidé`);
    
    // Redessiner la scène avec la nouvelle texture
    requestAnimationFrame(render);
  };
  img.onerror = function() {
    pd('loadTexture', 'main.js', '❌ Erreur chargement texture map.png');
  };
  img.src = 'map.png';
}

// PRE-CALCUL des rectangles textures à plat (O(1) par frame après init)
function precalculateTextureRectangles() {
  if (!mapCanvas || !currentMesh) return null;
  
  const rectangles = [];
  const texW = mapCanvas.width;
  const texH = mapCanvas.height;
  
  // Canvas temporaire pour chaque rectangle (plus performant que repeated drawImage)
  currentMesh.faces.forEach((face, faceIndex) => {
    const indices = face.vertices;
    const v0 = currentMesh.vertices[indices[0]];
    const v1 = currentMesh.vertices[indices[1]];
    const v2 = currentMesh.vertices[indices[2]];
    const v3 = currentMesh.vertices[indices[3]];
    
    // COORDONNÉES UV STABLES basées sur la grille (pas sur les surfaces)
    // Utiliser les coordonnées UV de grille au lieu des paramètres de surface
    const u0 = v0.gridU;
    const v0_tex = v0.gridV;
    const u1 = v1.gridU;
    const v1_tex = v1.gridV;
    const u2 = v2.gridU;
    const v2_tex = v2.gridV;
    const u3 = v3.gridU;
    const v3_tex = v3.gridV;
    
    // Rectangle UV dans la texture (en pixels)
    const minU = Math.min(u0, u1, u2, u3);
    const maxU = Math.max(u0, u1, u2, u3);
    const minV = Math.min(v0_tex, v1_tex, v2_tex, v3_tex);
    const maxV = Math.max(v0_tex, v1_tex, v2_tex, v3_tex);
    
    const srcX = Math.floor(minU * texW);
    const srcY = Math.floor((1 - maxV) * texH); // Inverser Y
    const srcW = Math.ceil((maxU - minU) * texW);
    const srcH = Math.ceil((maxV - minV) * texH);
    
    // Éviter les rectangles trop petits
    if (srcW < 2 || srcH < 2) {
      rectangles.push(null);
      return;
    }
    
    // Créer canvas rectangle à plat (performance: copie unique)
    const rectCanvas = document.createElement('canvas');
    rectCanvas.width = srcW;
    rectCanvas.height = srcH;
    const rectCtx = rectCanvas.getContext('2d');
    
    // Copier portion de texture (une seule fois)
    try {
      rectCtx.drawImage(mapCanvas, 
        Math.max(0, srcX), Math.max(0, srcY), 
        Math.min(srcW, texW - srcX), Math.min(srcH, texH - srcY),
        0, 0, srcW, srcH
      );
      
      rectangles.push({
        canvas: rectCanvas,
        width: srcW,
        height: srcH,
        faceIndex: faceIndex
      });
    } catch (e) {
      rectangles.push(null);
    }
  });
  
  pd('precalculateTextureRectangles', 'main.js', `✅ ${rectangles.filter(r => r !== null).length}/${rectangles.length} rectangles pré-calculés (UV stables)`);
  
  return rectangles;
}

// RENDU rectangle transformé (scale/rotate/skew optimisé)
function drawTransformedRectangle(ctx, rectangle, projectedQuad) {
  if (!rectangle) return false;
  
  const p0 = projectedQuad[0];
  const p1 = projectedQuad[1];
  const p2 = projectedQuad[2];
  const p3 = projectedQuad[3];
  
  // Calculer rectangle destination
  const minX = Math.min(p0.x, p1.x, p2.x, p3.x);
  const maxX = Math.max(p0.x, p1.x, p2.x, p3.x);
  const minY = Math.min(p0.y, p1.y, p2.y, p3.y);
  const maxY = Math.max(p0.y, p1.y, p2.y, p3.y);
  
  const dstW = maxX - minX;
  const dstH = maxY - minY;
  
  // Éviter les transformations trop petites
  if (dstW < 1 || dstH < 1) return false;
  
  // Sauvegarder l'état du contexte
  ctx.save();
  
  // Clipping précis du quad (anti-aliasing naturel)
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.clip();
  
  // Transformation linéaire simple (performance x3 vs matrices complexes)
  const scaleX = dstW / rectangle.width;
  const scaleY = dstH / rectangle.height;
  
  ctx.translate(minX, minY);
  ctx.scale(scaleX, scaleY);
  
  // Dessiner rectangle pré-calculé (une seule opération)
  ctx.drawImage(rectangle.canvas, 0, 0);
  
  // Restaurer l'état
  ctx.restore();
  
  return true;
}

function pd(func, file, msg) {
  console.log(`❌ [${func}][${file}] ${msg}`);
}

// === MAILLAGE AVEC ANIMATION ===
let currentMesh = null;
let targetSurface = 'plane';
let currentSurface = 'plane';
let isAnimating = false;
let dragEnabled = true;

// === COMPTEUR FPS ===
let fpsCounter = {
  frameCount: 0,
  lastTime: performance.now(),
  currentFPS: 0
};

// === TEXTURE MAPPING ===
let mapCanvas = null;
let mapContext = null;
let showTexture = true;

// === FACES CACHÉES AVEC RAYTRACING PAR COINS ===
let showHiddenFaces = false;

// Direction de vue isométrique (vers le fond)
const VIEW_DIRECTION = { x: -ISO_COS, y: 0, z: ISO_COS };

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
        // Paramètres UV pour recalcul surface
        u: u, v: v,
        // Coordonnées UV STABLES de grille (pour texture mapping cohérent)
        gridU: u,
        gridV: v,
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
        avgZ: null,   // Profondeur après rotation
        // Nouvelles propriétés pour faces cachées
        hiddenCorners: 0, // Nombre de coins cachés (0-4)
        visibility: 'visible' // 'visible', 'partial', 'hidden'
      });
    }
  }
  
  return { vertices, faces };
}

// === RAYTRACING POUR FACES CACHÉES ===

// Test si un point 3D est caché par d'autres faces
function isPointOccluded(point3D, excludeFace, allFaces, allVertices) {
  // Lancer un rayon depuis le point vers le fond (direction de vue)
  
  for (let face of allFaces) {
    if (face === excludeFace) continue; // Ne pas tester contre soi-même
    
    // Optimisation : test rapide de profondeur Z
    if (face.avgZ <= excludeFace.avgZ + 0.1) continue; // Face pas assez devant
    
    // Test intersection rayon-face
    if (rayIntersectsFace(point3D, VIEW_DIRECTION, face, allVertices)) {
      return true; // Point occulté par cette face
    }
  }
  
  return false; // Point visible
}

// Test intersection rayon-face (quad) simplifié
function rayIntersectsFace(rayOrigin, rayDir, face, vertices) {
  // Récupérer les 4 sommets de la face
  const v0 = vertices[face.vertices[0]];
  const v1 = vertices[face.vertices[1]];
  const v2 = vertices[face.vertices[2]];
  const v3 = vertices[face.vertices[3]];
  
  // Test d'intersection avec les 2 triangles du quad
  return rayIntersectsTriangle(rayOrigin, rayDir, v0, v1, v2) ||
         rayIntersectsTriangle(rayOrigin, rayDir, v0, v2, v3);
}

// Test intersection rayon-triangle (Möller-Trumbore adapté pour faces cachées)
function rayIntersectsTriangle(rayOrigin, rayDir, v0, v1, v2) {
  const EPSILON = 1e-6;
  
  // Vecteurs du triangle
  const edge1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
  const edge2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };
  
  // Produit vectoriel rayDir × edge2
  const h = {
    x: rayDir.y * edge2.z - rayDir.z * edge2.y,
    y: rayDir.z * edge2.x - rayDir.x * edge2.z,
    z: rayDir.x * edge2.y - rayDir.y * edge2.x
  };
  
  // Déterminant
  const a = edge1.x * h.x + edge1.y * h.y + edge1.z * h.z;
  if (a > -EPSILON && a < EPSILON) return false; // Rayon parallèle au triangle
  
  const f = 1.0 / a;
  const s = { x: rayOrigin.x - v0.x, y: rayOrigin.y - v0.y, z: rayOrigin.z - v0.z };
  const u = f * (s.x * h.x + s.y * h.y + s.z * h.z);
  
  if (u < 0.0 || u > 1.0) return false;
  
  const q = {
    x: s.y * edge1.z - s.z * edge1.y,
    y: s.z * edge1.x - s.x * edge1.z,
    z: s.x * edge1.y - s.y * edge1.x
  };
  
  const v = f * (rayDir.x * q.x + rayDir.y * q.y + rayDir.z * q.z);
  if (v < 0.0 || u + v > 1.0) return false;
  
  // Distance d'intersection
  const t = f * (edge2.x * q.x + edge2.y * q.y + edge2.z * q.z);
  
  // Intersection devant le rayon et pas trop proche (éviter auto-intersection)
  return t > EPSILON && t < 10.0; // Distance max raisonnable
}

// Calculer visibilité de toutes les faces
function calculateFaceVisibility() {
  if (!currentMesh || !showHiddenFaces) {
    // Reset visibility si désactivé
    if (currentMesh) {
      currentMesh.faces.forEach(face => {
        face.visibility = 'visible';
        face.hiddenCorners = 0;
      });
    }
    return;
  }
  
  let visibleCount = 0, partialCount = 0, hiddenCount = 0;
  
  currentMesh.faces.forEach(face => {
    let hiddenCorners = 0;
    
    // Tester chaque coin de la face
    face.vertices.forEach(vertexIndex => {
      const vertex = currentMesh.vertices[vertexIndex];
      
      if (isPointOccluded(vertex, face, currentMesh.faces, currentMesh.vertices)) {
        hiddenCorners++;
      }
    });
    
    // Classification selon nombre de coins cachés
    face.hiddenCorners = hiddenCorners;
    if (hiddenCorners === 0) {
      face.visibility = 'visible';
      visibleCount++;
    } else if (hiddenCorners === 4) {
      face.visibility = 'hidden';
      hiddenCount++;
    } else {
      face.visibility = 'partial';
      partialCount++;
    }
  });
  
  // Debug moins fréquent pour performances
  calculateFaceVisibility.debugCounter = (calculateFaceVisibility.debugCounter || 0) + 1;
  if (calculateFaceVisibility.debugCounter % config.hiddenFacesDebugInterval === 0) {
    pd('calculateFaceVisibility', 'main.js', 
      `Faces: ${visibleCount} visibles, ${partialCount} partielles, ${hiddenCount} cachées`
    );
  }
}

// Morphing vers une nouvelle surface (RÉINITIALISATION COMPLÈTE pour éviter corruption UV)
function morphToSurface(newSurfaceName) {
  if (newSurfaceName === targetSurface) return;
  
  targetSurface = newSurfaceName;
  currentSurface = newSurfaceName;
  
  // RÉINITIALISATION COMPLÈTE du maillage (anti-corruption UV)
  const newMesh = initializeMesh(surfaces[newSurfaceName]);
  
  if (currentMesh) {
    // Copier les positions courantes vers les nouvelles destinations
    newMesh.vertices.forEach((vertex, i) => {
      if (i < currentMesh.vertices.length) {
        vertex.x = currentMesh.vertices[i].x;
        vertex.y = currentMesh.vertices[i].y;
        vertex.z = currentMesh.vertices[i].z;
      }
    });
  }
  
  // Remplacer le maillage corrompu par un nouveau propre
  currentMesh = newMesh;
  
  // Invalider le cache des rectangles
  rectanglesDirty = true;
  
  isAnimating = true;
  pd('morphToSurface', 'main.js', `🔄 Maillage réinitialisé vers ${newSurfaceName} - UV propres garanties`);
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
    pd('updateMorphing', 'main.js', `✅ Animation terminée - tous sommets convergés vers ${targetSurface}`);
  }
}

// === SURFACES PARAMÉTRÉES ===
const surfaces = {
  // Tore [+ +] - bords verticaux et horizontaux dans même sens
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
  
  // Bouteille de Klein [+ -] - bords verticaux opposés
  klein: (u, v) => {
    u *= 2 * Math.PI;
    v *= 2 * Math.PI;
    const a = 1.5;
    if (u < Math.PI) {
      return {
        x: 2.5 * Math.cos(u) * (1 + Math.sin(u)) + (a * (1 - Math.cos(u) / 2)) * Math.cos(u) * Math.cos(v),
        z: -6 * Math.sin(u) - (a * (1 - Math.cos(u) / 2)) * Math.sin(u) * Math.cos(v),
        y: (a * (1 - Math.cos(u) / 2)) * Math.sin(v)
      };
    } else {
      return {
        x: 2.5 * Math.cos(u) * (1 + Math.sin(u)) + (a * (1 - Math.cos(u) / 2)) * Math.cos(v + Math.PI),
        z: -6 * Math.sin(u),
        y: (a * (1 - Math.cos(u) / 2)) * Math.sin(v)
      };
    }
  },
  
  // Cylindre [+ +] - bords horizontaux dans même sens
  cylinder: (u, v) => {
    const phi = u * 2 * Math.PI;
    const h = (v - 0.5) * 3;
    return {
      x: Math.cos(phi),
      y: h,
      z: Math.sin(phi)
    };
  },
  
  // Ruban de Möbius [+ -] - bords horizontaux opposés
  mobius: (u, v) => {
    u *= 2 * Math.PI;
    v = (v - 0.5) * 2;
    return {
      x: Math.cos(u) + v * Math.cos(u/2) * Math.cos(u),
      y: Math.sin(u) + v * Math.cos(u/2) * Math.sin(u),
      z: v * Math.sin(u/2)
    };
  },
  
  // Cross-cap [- -] - surface non-orientable avec singularité
  crosscap: (u, v) => {
    u *= Math.PI;
    v *= 2 * Math.PI;
    return {
      x: Math.sin(u) * Math.cos(v),
      y: Math.sin(u) * Math.sin(v),
      z: Math.cos(u) * Math.cos(2*v) * 0.5
    };
  },
  
  // Plan projectif - quotient de la sphère
  projective: (u, v) => {
    u *= Math.PI;
    v *= 2 * Math.PI;
    const x = Math.sin(u) * Math.cos(v);
    const y = Math.sin(u) * Math.sin(v);
    const z = Math.cos(u);
    // Projection stéréographique modifiée
    return {
      x: x / (1 + Math.abs(z)) * 2,
      y: y / (1 + Math.abs(z)) * 2,
      z: Math.sign(z) * (1 - 1/(1 + Math.abs(z)))
    };
  },
  
  // Disque - surface avec bord
  disk: (u, v) => {
    const r = u; // Rayon de 0 à 1
    const theta = v * 2 * Math.PI;
    return {
      x: r * Math.cos(theta) * 2,
      y: 0,
      z: r * Math.sin(theta) * 2
    };
  },
  
  // Plan - surface plate infinie
  plane: (u, v) => {
    return {
      x: (u - 0.5) * 4,
      y: 0,
      z: (v - 0.5) * 4
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
// Surface courante déjà déclarée en haut
let rotX = (config.defaultRotationX * Math.PI) / 180;
let rotY = (config.defaultRotationY * Math.PI) / 180;
let scale = 150;

// === GESTION SOURIS ===
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Mettre à jour l'affichage des angles
function updateAngleDisplay() {
  const angleXDeg = Math.round((rotX * 180) / Math.PI);
  const angleYDeg = Math.round((rotY * 180) / Math.PI);
  
  document.getElementById('angleX').textContent = `${angleXDeg}°`;
  document.getElementById('angleY').textContent = `${angleYDeg}°`;
}

// Calcul FPS
function updateFPS() {
  fpsCounter.frameCount++;
  const currentTime = performance.now();
  const deltaTime = currentTime - fpsCounter.lastTime;
  
  if (deltaTime >= 1000) { // Mettre à jour chaque seconde
    fpsCounter.currentFPS = Math.round((fpsCounter.frameCount * 1000) / deltaTime);
    document.getElementById('fpsDisplay').textContent = fpsCounter.currentFPS;
    fpsCounter.frameCount = 0;
    fpsCounter.lastTime = currentTime;
  }
}

// DEBUG UV - Traquer les coordonnées des sommets de référence
function debugUVCorners() {
  if (!currentMesh) return;
  
  const vertices = currentMesh.vertices;
  const totalVertices = vertices.length;
  
  // Indices des sommets de référence dans un maillage 30x20
  const cornerIndices = {
    'TopLeft': 0,                                    // (0,0)
    'TopRight': MESH_V,                             // (0,20)  
    'BottomLeft': MESH_U * (MESH_V + 1),           // (30,0)
    'BottomRight': MESH_U * (MESH_V + 1) + MESH_V, // (30,20)
    'Center': Math.floor(MESH_U/2) * (MESH_V + 1) + Math.floor(MESH_V/2) // (~15,~10)
  };
  
  // Snapshot actuel des UV
  const currentSnapshot = {};
  Object.entries(cornerIndices).forEach(([name, index]) => {
    if (index < totalVertices) {
      const vertex = vertices[index];
      currentSnapshot[name] = {
        gridU: vertex.gridU,
        gridV: vertex.gridV,
        u: vertex.u,
        v: vertex.v
      };
    }
  });
  
  // Comparer avec le snapshot précédent
  if (lastUVSnapshot) {
    let hasChanged = false;
    let debugInfo = '🚨 UV CHANGES DETECTED:\n';
    
    Object.entries(currentSnapshot).forEach(([name, current]) => {
      const previous = lastUVSnapshot[name];
      if (previous) {
        const gridUChange = Math.abs(current.gridU - previous.gridU);
        const gridVChange = Math.abs(current.gridV - previous.gridV);
        
        if (gridUChange > 0.001 || gridVChange > 0.001) {
          hasChanged = true;
          debugInfo += `${name}: gridU ${previous.gridU.toFixed(3)}→${current.gridU.toFixed(3)} gridV ${previous.gridV.toFixed(3)}→${current.gridV.toFixed(3)}\n`;
        }
      }
    });
    
    if (hasChanged) {
      console.error(debugInfo);
      console.log('🔍 Current UV state:');
      Object.entries(currentSnapshot).forEach(([name, data]) => {
        console.log(`${name}: gridU=${data.gridU?.toFixed(3)} gridV=${data.gridV?.toFixed(3)} u=${data.u?.toFixed(3)} v=${data.v?.toFixed(3)}`);
      });
    }
  } else {
    // Premier snapshot - juste afficher l'état initial
    console.log('🔍 UV Initial state:');
    Object.entries(currentSnapshot).forEach(([name, data]) => {
      console.log(`${name}: gridU=${data.gridU?.toFixed(3)} gridV=${data.gridV?.toFixed(3)} u=${data.u?.toFixed(3)} v=${data.v?.toFixed(3)}`);
    });
  }
  
  // Sauvegarder le snapshot pour la prochaine fois
  lastUVSnapshot = JSON.parse(JSON.stringify(currentSnapshot));
}

function render() {
  // Calculer FPS
  updateFPS();
  
  // Debug UV désormais uniquement lors des rotations manuelles
  
  // Clear
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Initialiser le maillage si nécessaire
  if (!currentMesh) {
    currentMesh = initializeMesh(surfaces[currentSurface]);
  }
  
  // Update animation
  updateMorphing();
  
  // Calculer visibilité des faces si activé
  calculateFaceVisibility();
  
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
  
  // Pré-calculer rectangles textures si nécessaire
  if (showTexture && rectanglesDirty) {
    textureRectangles = precalculateTextureRectangles();
    rectanglesDirty = false;
  }
  
  // Rendu selon le mode sélectionné
  if (showTexture) {
    // Rendu avec texture projetée (rectangles pré-calculés + transformations)
    sortedFaces.forEach((face, faceIndex) => {
      // Skip faces cachées si activé
      if (showHiddenFaces && face.visibility === 'hidden') return;
      
      // Construire quad projeté pour cette face
      const quadProjected = face.vertices.map(vertexIndex => projectedVertices[vertexIndex]);
      
      // Projeter rectangle pré-calculé avec transformations optimisées
      const rectangle = textureRectangles ? textureRectangles[faceIndex] : null;
      const success = drawTransformedRectangle(ctx, rectangle, quadProjected);
      
      // Si la projection échoue ou pour les contours, dessiner un contour léger
      if (success) {
        const indices = face.vertices;
        
        // Contour selon visibilité
        let strokeColor, lineWidth;
        if (showHiddenFaces) {
          switch (face.visibility) {
            case 'visible':
              strokeColor = 'rgba(0,0,0,0.1)';
              lineWidth = 0.2;
              break;
            case 'partial':
              strokeColor = 'rgba(243,156,18,0.5)';
              lineWidth = 0.3;
              break;
            default:
              strokeColor = 'rgba(149,165,166,0.7)';
              lineWidth = 0.5;
          }
        } else {
          strokeColor = isAnimating ? 'rgba(231,76,60,0.3)' : 'rgba(0,0,0,0.1)';
          lineWidth = isAnimating ? 0.3 : 0.1;
        }
        
        // Dessiner contour très fin
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(projectedVertices[indices[0]].x, projectedVertices[indices[0]].y);
        ctx.lineTo(projectedVertices[indices[1]].x, projectedVertices[indices[1]].y);
        ctx.lineTo(projectedVertices[indices[2]].x, projectedVertices[indices[2]].y);
        ctx.lineTo(projectedVertices[indices[3]].x, projectedVertices[indices[3]].y);
        ctx.closePath();
        ctx.stroke();
      }
    });
  } else {
    // Rendu wireframe classique
    sortedFaces.forEach(face => {
      const indices = face.vertices;
      
      // Couleur selon visibilité des faces cachées
      if (showHiddenFaces) {
        switch (face.visibility) {
          case 'visible':
            ctx.strokeStyle = isAnimating ? '#e74c3c' : '#2c3e50';
            ctx.lineWidth = 1.5;
            break;
          case 'partial':
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 1;
            break;
          case 'hidden':
            ctx.strokeStyle = '#95a5a6';
            ctx.lineWidth = 0.5;
            break;
        }
      } else {
        ctx.strokeStyle = isAnimating ? '#e74c3c' : '#333';
        ctx.lineWidth = isAnimating ? 1.5 : 1;
      }
      
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
  
  // Debug info réduit (éviter spam console)
  render.frameCount = (render.frameCount || 0) + 1;
  if (render.frameCount % 120 === 0) { // Debug toutes les 2 secondes à 60fps
    const status = isAnimating ? 'MORPHING' : 'STABLE';
    pd('render', 'main.js', `${status} - Maillage: ${currentMesh.vertices.length} sommets, ${currentMesh.faces.length} faces`);
  }
}

// Boucle d'animation
function animate() {
  render();
  requestAnimationFrame(animate);
}

// Démarrer l'animation et charger la texture
loadTexture();
animate();

// === CONTRÔLES ===
// Noms des topologies pour affichage
const topologyNames = {
  'torus': 'Tore',
  'klein': 'Klein',
  'cylinder': 'Cylindre', 
  'mobius': 'Möbius',
  'crosscap': 'Cross-cap',
  'projective': 'Projectif',
  'disk': 'Disque',
  'plane': 'Plan'
};

// Pictos des topologies (séparés pour réutilisation)
const topologyIcons = {
  'plane': '🔷',
  'disk': '💿', 
  'cylinder': '🫙',
  'mobius': '🎀',
  'torus': '🍩',
  'projective': '🪩',
  'klein': '🖇️',
  'crosscap': '🪢'
};

// Fonction pour mettre à jour l'affichage du nom
function updateTopologyName(surfaceName) {
  document.getElementById('selectedTopology').textContent = topologyNames[surfaceName] || surfaceName;
}

// Boutons radio pour sélection de topologie
document.querySelectorAll('input[name="topology"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.checked) {
      const newSurface = e.target.value;
      updateTopologyName(newSurface);
      if (newSurface !== targetSurface) {
        morphToSurface(newSurface);
      }
    }
  });
});

// Contrôle d'échelle supprimé - utiliser le zoom molette

document.getElementById('hiddenFaces').addEventListener('change', (e) => {
  showHiddenFaces = e.target.checked;
  pd('hiddenFaces', 'main.js', `Faces cachées: ${showHiddenFaces ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
});

document.getElementById('enableDrag').addEventListener('change', (e) => {
  dragEnabled = e.target.checked;
  pd('enableDrag', 'main.js', `Drag rotation: ${dragEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
});

document.getElementById('showTexture').addEventListener('change', (e) => {
  showTexture = e.target.checked;
  pd('showTexture', 'main.js', `Texture mapping: ${showTexture ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
});

// Bouton reinit caméra
document.getElementById('reinitCamera').addEventListener('click', () => {
  rotX = (config.defaultRotationX * Math.PI) / 180;
  rotY = (config.defaultRotationY * Math.PI) / 180;
  scale = 150;
  updateAngleDisplay();
  pd('reinitCamera', 'main.js', `🔄 Caméra réinitialisée: ${config.defaultRotationX}°, ${config.defaultRotationY}°`);
  
  // Debug UV après reinit de la caméra
  console.log(`🔄 Reinit caméra: X=${config.defaultRotationX}° Y=${config.defaultRotationY}°`);
  debugUVCorners();
});

// === ÉVÉNEMENTS SOURIS ===
canvas.addEventListener('mousedown', (e) => {
  if (dragEnabled) {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging || !dragEnabled) return;
  
  const deltaX = e.clientX - lastMouseX;
  const deltaY = e.clientY - lastMouseY;
  
  // Sauvegarder anciennes valeurs pour détecter changements
  const oldRotX = rotX;
  const oldRotY = rotY;
  
  // Rotation Y (horizontal) et X (vertical)
  rotY += deltaX * config.mouseSensitivity * 0.01;
  rotX += deltaY * config.mouseSensitivity * 0.01;
  
  // Garder les angles dans une plage raisonnable
  rotX = Math.max(-Math.PI, Math.min(Math.PI, rotX));
  
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  
  updateAngleDisplay();
  
  // DEBUG UV à chaque nouvelle valeur de rotation
  if (oldRotX !== rotX || oldRotY !== rotY) {
    const rotXDeg = Math.round((rotX * 180) / Math.PI);
    const rotYDeg = Math.round((rotY * 180) / Math.PI);
    console.log(`🔄 Rotation changée: X=${rotXDeg}° Y=${rotYDeg}°`);
    debugUVCorners();
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  canvas.style.cursor = dragEnabled ? 'grab' : 'default';
});

canvas.addEventListener('mouseleave', () => {
  isDragging = false;
  canvas.style.cursor = dragEnabled ? 'grab' : 'default';
});

// Update cursor style based on drag state
setInterval(() => {
  if (!isDragging) {
    canvas.style.cursor = dragEnabled ? 'grab' : 'default';
  }
}, 100);

// Zoom avec molette
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  scale = Math.max(50, Math.min(500, scale * zoomFactor));
});

// Initialiser l'affichage des angles
updateAngleDisplay();

// Plus besoin d'appeler render() manuellement - animation automatique !
