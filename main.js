// File: main.js - 3D Isometric Topology Engine with texture mapping
// Desc: En français, dans l'architecture, je suis le moteur principal qui gère la projection 3D isométrique, les transformations topologiques, et le texture mapping avec système multi-cartes
// Version 3.79.0 (Angles en lecture seule + selectedTopology supprimé)
// Author: DNAvatar.org - Arnaud Maignan  
// Date: [December 16, 2024] [00:30 UTC+1]
// Logs:
//   - Fixed angle display: now read-only with ° symbol
//   - Removed selectedTopology element, all info in selectedProjection
//   - Fixed button event listeners compatibility
//   - Cleaned up unused input event handlers

// === IMPORTS ===
import { config } from './config.js';
import { createMesh, createSurface, transformCase, transformMesh, debugCase, debugMesh } from './mesh.js';
import { surface2D } from './surfaces/2D.js';
// Import configurations des surfaces
import { config as cylinderConfig, cylinder } from './surfaces/cylinder.js';
import { config as torusConfig, torus } from './surfaces/torus.js';
import { config as mobiusConfig, mobius } from './surfaces/mobius.js';
import { projective } from './surfaces/projective.js';
import { plane } from './surfaces/plane.js';

// === CONFIGURATION MAILLAGE ===
const MESH_U = 30; // Résolution en U (plus en X)
const MESH_V = 20; // Résolution en V (moins en Y)

// === PROJECTION ISOMÉTRIQUE ===
const ISO_COS = Math.cos(Math.PI / 6); // cos(30°)
const ISO_SIN = Math.sin(Math.PI / 6); // sin(30°)

// === OPTIMISATION RENDU RECTANGLES ===
let textureRectangles = null; // Cache des rectangles textures pré-calculés (calculé UNE SEULE FOIS)

// === DEBUG UV TRACKING ===
let lastUVSnapshot = null; // Snapshot précédent des UV pour détection changements

// === SYSTÈME MULTI-CARTES DYNAMIQUE ===
let availableMaps = []; // Sera rempli dynamiquement

// Détection automatique des textures disponibles (scan répertoire)
async function detectAvailableTextures() {
  try {
    // Scanner le répertoire cartes/ via l'API du serveur Python
    const response = await fetch('/api/list-textures');
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }
    
    const files = await response.json();
    pd('detectTextures', 'main.js', `📁 Scan répertoire: ${files.length} fichiers trouvés`);
    
    // Mapping des noms de fichiers vers titres (EN par défaut)
    const fileToTitle = {
      'map.png': 'World',
      'relief.jpg': 'Relief', 
      'night.jpg': 'Night',
      'great.png': 'Great',
      'sheet.jpg': 'Sheet',
      'geoview.jpg': 'GeoView',
      'Steam.png': 'Steam',
      'scool.jpg': 'School',
      'brick.jpg': 'Brick',
      'eye.png': 'Eye',
      'maze.png': 'Maze',
      'room.jpg': 'Room',
      'water.jpg': 'Water'
    };
    
    availableMaps = [];
    
    // Convertir les fichiers trouvés en configuration de textures
    for (const filename of files) {
      // Ignorer les fichiers système
      if (filename.startsWith('.') || !filename.match(/\.(jpg|jpeg|png)$/i)) {
        continue;
      }
      
      const name = filename.replace(/\.(jpg|jpeg|png)$/i, '').toLowerCase();
      const title = fileToTitle[filename] || filename.replace(/\.(jpg|jpeg|png)$/i, '');
      
      availableMaps.push({
        name: name,
        file: `cartes/${filename}`,
        title: title
      });
      
      pd('detectTextures', 'main.js', `✅ Texture: ${title} (${filename})`);
    }
    
    // Vérifier que la carte par défaut existe, sinon prendre la première
    if (availableMaps.length > 0) {
      const defaultExists = availableMaps.find(m => m.name === currentMapName);
      if (!defaultExists) {
        currentMapName = availableMaps[0].name;
        pd('detectTextures', 'main.js', `🔄 Carte par défaut changée vers: ${currentMapName}`);
      }
    }
    
    pd('detectTextures', 'main.js', `🗺️ ${availableMaps.length} textures configurées`);
    return availableMaps;
    
  } catch (error) {
    pd('detectTextures', 'main.js', `❌ Erreur scan répertoire: ${error.message}`);
    
    // Fallback: configuration minimale avec map.png par défaut
    availableMaps = [
      { name: 'map', file: 'cartes/map.png', title: 'Monde' }
    ];
    
    pd('detectTextures', 'main.js', `🔄 Fallback: 1 texture par défaut`);
    return availableMaps;
  }
}

let currentMapName = 'steam'; // Carte par défaut

// Génération dynamique de l'interface textures
function generateTextureInterface() {
  const mapOptionsContainer = document.querySelector('.map-options');
  if (!mapOptionsContainer) return;
  
  // Garder les boutons fixes (2D et grille)
  const fixedButtons = mapOptionsContainer.querySelectorAll('.topology-option');
  
  // Vider les boutons de cartes existants
  const existingMapButtons = mapOptionsContainer.querySelectorAll('.map-option');
  existingMapButtons.forEach(btn => btn.remove());
  
  // Calculer combien de boutons par ligne (basé sur largeur disponible)
  const maxButtonsPerRow = 6; // Lignes plus longues
  let currentRow = 0;
  
  availableMaps.forEach((map, index) => {
    // Créer le bouton de carte
    const label = document.createElement('label');
    label.className = 'map-option';
    
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'mapChoice';
    input.value = map.name;
    if (map.name === currentMapName) input.checked = true;
    
    const span = document.createElement('span');
    span.className = 'map-name';
    span.textContent = map.title;
    
    label.appendChild(input);
    label.appendChild(span);
    
    // Ajouter event listener
    input.addEventListener('change', (e) => {
      if (e.target.checked) {
        changeMap(e.target.value);
      }
    });
    
    // Ajouter à l'interface
    mapOptionsContainer.appendChild(label);
    
    // Passage à la ligne si nécessaire
    if ((index + 1) % maxButtonsPerRow === 0 && index < availableMaps.length - 1) {
      const lineBreak = document.createElement('div');
      lineBreak.style.width = '100%';
      lineBreak.style.height = '0';
      mapOptionsContainer.appendChild(lineBreak);
    }
  });
  
  pd('generateTextureInterface', 'main.js', `🎨 Interface générée avec ${availableMaps.length} textures`);
}

// === CHARGEMENT TEXTURE ===
function loadTexture(mapName = currentMapName) {
  pd('loadTexture', 'main.js', `🔍 Recherche carte: "${mapName}" dans ${availableMaps.length} disponibles`);
  pd('loadTexture', 'main.js', `📋 Cartes disponibles: ${availableMaps.map(m => m.name).join(', ')}`);
  
  const mapConfig = availableMaps.find(m => m.name === mapName);
  if (!mapConfig) {
    pd('loadTexture', 'main.js', `❌ Carte inconnue: ${mapName}`);
    return;
  }
  
  currentMapName = mapName;
  
  // Mettre à jour l'affichage de la projection
  updateProjectionName(mapName);
  
  const img = new Image();
  img.onload = function() {
    // Créer canvas hors-écran pour les transformations affines
    mapCanvas = document.createElement('canvas');
    mapCanvas.width = img.width;
    mapCanvas.height = img.height;
    mapContext = mapCanvas.getContext('2d');
    mapContext.drawImage(img, 0, 0);
    
    // Réinitialiser le cache des rectangles pour nouvelle texture
    textureRectangles = null;
    
    pd('loadTexture', 'main.js', `✅ Carte "${mapConfig.title}" chargée: ${img.width}x${img.height} pixels`);
    
    // AUTO-RETOUR 3D avec petit timeout pour éviter mélange tuiles
    if (previousSurfaceBeforeMapChange && previousSurfaceBeforeMapChange !== 'view2d') {
      pd('loadTexture', 'main.js', `⚡ Auto-retour 3D vers: ${previousSurfaceBeforeMapChange} (timeout 20ms)`);
      
      // Petit timeout pour laisser le recalcul se stabiliser
      setTimeout(() => {
        // Retourner à la surface précédente SANS ANIMATION
        view2DMode = false;
        morphToSurface(previousSurfaceBeforeMapChange, true); // SKIP ANIMATION
        
        // RÉINITIALISER les angles avec config de la surface 3D
        if (config.privilegedAngles[previousSurfaceBeforeMapChange]) {
          const angles = config.privilegedAngles[previousSurfaceBeforeMapChange];
          rotX = (angles.rotX * Math.PI) / 180;
          rotY = (angles.rotY * Math.PI) / 180;
          rotZ = (angles.rotZ * Math.PI) / 180;
          scale = angles.scale;
        } else {
          // Angles par défaut si pas de config spécifique
          rotX = (config.defaultRotationX * Math.PI) / 180;
          rotY = (config.defaultRotationY * Math.PI) / 180;
          rotZ = 0;
          scale = getOptimalScale(previousSurfaceBeforeMapChange);
        }
        updateAngleDisplay();
        
        // Mettre à jour l'interface
        const radioButton = document.querySelector(`input[value="${previousSurfaceBeforeMapChange}"]`);
        if (radioButton) {
          radioButton.checked = true;
        }
        
        // CACHE MISÈRE : Masquer overlay après retour 3D
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
          overlay.classList.remove('active');
          overlay.innerHTML = ''; // Nettoyer capture
          pd('loadTexture', 'main.js', `🎭 Cache misère désactivé (overlay masqué + capture nettoyée)`);
        }
        
        // Réinitialiser pour prochain changement
        previousSurfaceBeforeMapChange = null;
      }, 20); // 20ms timeout pour stabilisation recalcul
    } else {
      // MASQUER OVERLAY même en 2D après chargement texture
      const overlay = document.getElementById('loading-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        overlay.innerHTML = ''; // Nettoyer capture
      }
    }
    
    // Redessiner la scène avec la nouvelle texture
    requestAnimationFrame(render);
  };
  img.onerror = function() {
    pd('loadTexture', 'main.js', `❌ Erreur chargement carte: ${mapConfig.file}`);
  };
  img.src = mapConfig.file;
}

// Variable pour mémoriser surface précédente
let previousSurfaceBeforeMapChange = null;

// Changer de carte
function changeMap(mapName) {
  if (mapName !== currentMapName) {
    // CACHE MISÈRE : Capture canvas + afficher overlay
    const overlay = document.getElementById('loading-overlay');
    const canvas = document.getElementById('canvas');
    if (overlay && canvas) {
      // Capture du canvas actuel
      const captureImg = document.createElement('img');
      captureImg.src = canvas.toDataURL('image/png');
      
      // Vider overlay et ajouter capture
      overlay.innerHTML = '';
      overlay.appendChild(captureImg);
      overlay.classList.add('active');
      
      pd('changeMap', 'main.js', `🎭 Cache misère activé (capture canvas sur overlay canvas uniquement)`);
    }
    
    // Mémoriser surface précédente si on était en 3D
    if (!view2DMode) {
      previousSurfaceBeforeMapChange = currentSurface;
    }
    
    // FORCER le passage par 2D pour recalculer tout
    if (!view2DMode) {
      view2DMode = true;
      morphToSurface('view2d', true); // SKIP ANIMATION pour changement texture
      
      // RÉINITIALISER les angles avec config 2D complète
      if (config.privilegedAngles['view2d']) {
        const angles = config.privilegedAngles['view2d'];
        rotX = (angles.rotX * Math.PI) / 180;
        rotY = (angles.rotY * Math.PI) / 180;
        rotZ = (angles.rotZ * Math.PI) / 180;
        scale = angles.scale;
      } else {
        rotX = (config.defaultRotationX * Math.PI) / 180;
        rotY = (config.defaultRotationY * Math.PI) / 180;
        rotZ = 0;
        scale = 108;
      }
      updateAngleDisplay();
      
      // Mettre à jour l'interface pour refléter le passage en 2D
      document.querySelector('input[value="view2d"]').checked = true;
      updateTopologyName('');
      
      // Activer overlay pour mode 2D
      const moveOverlay = document.getElementById('moveOverlay');
      if (moveOverlay) moveOverlay.classList.add('active');
    }
    
    // Charger la nouvelle texture (avec callback auto-retour 3D)
    loadTexture(mapName);
    
    pd('changeMap', 'main.js', `🗺️ Changement vers carte: ${mapName}`);
  }
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
    const srcY = Math.floor(minV * texH); // Pas d'inversion Y
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
        originalIndex: face.originalIndex
      });
    } catch (e) {
      rectangles.push(null);
    }
  });
  
  pd('precalculateTextureRectangles', 'main.js', `✅ ${rectangles.filter(r => r !== null).length}/${rectangles.length} rectangles pré-calculés (UV stables)`);
  
  return rectangles;
}

// RENDU rectangle transformé avec VRAIE TRANSFORMATION PERSPECTIVE (trapèze)
// Basé sur perspective.js - subdivision intelligente pour vrais trapèzes
function drawTransformedRectangle(ctx, rectangle, projectedQuad) {
  if (!rectangle) return false;
  
  const p0 = projectedQuad[0]; // Top-left
  const p1 = projectedQuad[1]; // Top-right  
  const p2 = projectedQuad[2]; // Bottom-right
  const p3 = projectedQuad[3]; // Bottom-left
  
  // Éviter les quads trop petits
  const area = Math.abs((p1.x - p0.x) * (p3.y - p0.y) - (p3.x - p0.x) * (p1.y - p0.y));
  if (area < 1) return false;
  
  // 🔧 ÉTENDRE les quads de 1 pixel tout autour pour éliminer gaps
  const extend = 1;
  const p0Extended = { x: p0.x - extend, y: p0.y - extend };
  const p1Extended = { x: p1.x + extend, y: p1.y - extend };
  const p2Extended = { x: p2.x + extend, y: p2.y + extend };
  const p3Extended = { x: p3.x - extend, y: p3.y + extend };
  
  // Sauvegarder l'état du contexte
  ctx.save();
  
  // Clipping avec quad ÉTENDU
  ctx.beginPath();
  ctx.moveTo(p0Extended.x, p0Extended.y);
  ctx.lineTo(p1Extended.x, p1Extended.y);
  ctx.lineTo(p2Extended.x, p2Extended.y);
  ctx.lineTo(p3Extended.x, p3Extended.y);
  ctx.closePath();
  ctx.clip();
  
  // VRAIE TRANSFORMATION PERSPECTIVE - Méthode perspective.js
  // Subdivision adaptative pour créer de vrais trapèzes
  
  const srcW = rectangle.width;
  const srcH = rectangle.height;
  
  // Calculer nombre de subdivisions basé sur la déformation
  const maxDist = Math.max(
    distance2D(p0, p1), distance2D(p1, p2), 
    distance2D(p2, p3), distance2D(p3, p0)
  );
  const subdivisions = Math.min(8, Math.max(2, Math.floor(maxDist / 50)));
  
  // Subdivision intelligente pour perspective vraie
  for (let u = 0; u < subdivisions; u++) {
    for (let v = 0; v < subdivisions; v++) {
      const u0 = u / subdivisions;
      const u1 = (u + 1) / subdivisions;
      const v0 = v / subdivisions;
      const v1 = (v + 1) / subdivisions;
      
      // Interpolation bilinéaire pour les 4 coins du sous-quad (avec points étendus)
      const corner00 = bilinearInterpolation(p0Extended, p1Extended, p2Extended, p3Extended, u0, v0);
      const corner10 = bilinearInterpolation(p0Extended, p1Extended, p2Extended, p3Extended, u1, v0);
      const corner11 = bilinearInterpolation(p0Extended, p1Extended, p2Extended, p3Extended, u1, v1);
      const corner01 = bilinearInterpolation(p0Extended, p1Extended, p2Extended, p3Extended, u0, v1);
      
      // Correspondance dans la texture source
      const srcX0 = u0 * srcW;
      const srcY0 = v0 * srcH;
      const srcW_sub = (u1 - u0) * srcW;
      const srcH_sub = (v1 - v0) * srcH;
      
      // Dessiner triangle 1 (corner00, corner10, corner01)
      drawTriangleTexture(ctx, rectangle.canvas,
        [corner00, corner10, corner01],
        [[srcX0, srcY0], [srcX0 + srcW_sub, srcY0], [srcX0, srcY0 + srcH_sub]]
      );
      
      // Dessiner triangle 2 (corner10, corner11, corner01)  
      drawTriangleTexture(ctx, rectangle.canvas,
        [corner10, corner11, corner01],
        [[srcX0 + srcW_sub, srcY0], [srcX0 + srcW_sub, srcY0 + srcH_sub], [srcX0, srcY0 + srcH_sub]]
      );
    }
  }
  
  // Restaurer l'état
  ctx.restore();
  
  return true;
}

// Interpolation bilinéaire dans un quad (perspective vraie)
function bilinearInterpolation(p0, p1, p2, p3, u, v) {
  // Interpolation bilinéaire correcte pour perspective
  const x = (1-u)*(1-v)*p0.x + u*(1-v)*p1.x + u*v*p2.x + (1-u)*v*p3.x;
  const y = (1-u)*(1-v)*p0.y + u*(1-v)*p1.y + u*v*p2.y + (1-u)*v*p3.y;
  return {x, y};
}

// Distance 2D entre deux points
function distance2D(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx*dx + dy*dy);
}

// Dessiner triangle avec texture (méthode perspective.js)
function drawTriangleTexture(ctx, image, triangle, textureCoords) {
  const [p0, p1, p2] = triangle;
  const [t0, t1, t2] = textureCoords;
  
  // Calculer matrice de transformation affine pour ce triangle
  const denom = (t1[0] - t0[0]) * (t2[1] - t0[1]) - (t2[0] - t0[0]) * (t1[1] - t0[1]);
  if (Math.abs(denom) < 1e-10) return; // Triangle dégénéré
  
  const m11 = ((p1.x - p0.x) * (t2[1] - t0[1]) - (p2.x - p0.x) * (t1[1] - t0[1])) / denom;
  const m12 = ((p2.x - p0.x) * (t1[0] - t0[0]) - (p1.x - p0.x) * (t2[0] - t0[0])) / denom;
  const m21 = ((p1.y - p0.y) * (t2[1] - t0[1]) - (p2.y - p0.y) * (t1[1] - t0[1])) / denom;
  const m22 = ((p2.y - p0.y) * (t1[0] - t0[0]) - (p1.y - p0.y) * (t2[0] - t0[0])) / denom;
  const dx = p0.x - m11 * t0[0] - m12 * t0[1];
  const dy = p0.y - m21 * t0[0] - m22 * t0[1];
  
  // Sauvegarder et appliquer clipping triangle
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.closePath();
  ctx.clip();
  
  // Appliquer transformation et dessiner
  ctx.setTransform(m11, m21, m12, m22, dx, dy);
  ctx.drawImage(image, 0, 0);
  
  ctx.restore();
}

function pd(func, file, msg) {
  // Détection automatique du type de message par icônes dans le message
  let icon = '📄'; // Par défaut : info neutre
  
  if (msg.includes('✅') || msg.includes('✓')) {
    icon = '✅'; // Succès
  } else if (msg.includes('🔧') || msg.includes('⚡') || msg.includes('🔄')) {
    icon = '🔧'; // Technique/Process
  } else if (msg.includes('📊') || msg.includes('📍') || msg.includes('📐')) {
    icon = '📊'; // Info/Stats
  } else if (msg.includes('🎭') || msg.includes('🗺️')) {
    icon = '🎭'; // Interface/Display
  } else if (msg.includes('⏱️') || msg.includes('TIMEOUT') || msg.includes('timeout')) {
    icon = '⏱️'; // Debug spécial timeout
  } else if (msg.includes('TRACE') || msg.includes('CALL') || msg.includes('→')) {
    icon = '🔍'; // Debug trace
  } else if (msg.includes('❌') || msg.includes('ERREUR') || msg.includes('ERROR')) {
    icon = '❌'; // Erreur explicite
  } else if (msg.includes('STABLE') || msg.includes('MORPHING') || msg.includes('Mode de vue')) {
    icon = '📊'; // Messages d'état
  }
  
  console.log(`${icon} [${func}][${file}] ${msg}`);
}

// DEBUG: Afficher la structure complète du maillage
function showMeshStructure() {
  if (!currentMesh) {
    console.log('❌ Pas de maillage actuel');
    return;
  }
  
  console.log('\n🔧 === STRUCTURE DU MAILLAGE ===');
  console.log(`📊 Vertices: ${currentMesh.vertices.length} sommets`);
  console.log(`📊 Faces: ${currentMesh.faces.length} faces`);
  
  // Montrer structure d'un vertex
  const vertex0 = currentMesh.vertices[0];
  console.log('\n📍 STRUCTURE VERTEX (exemple vertex[0]):');
  console.log({
    position_courante: { x: vertex0.x, y: vertex0.y, z: vertex0.z },
    position_destination: { xDest: vertex0.xDest, yDest: vertex0.yDest, zDest: vertex0.zDest },
    parametres_UV: { u: vertex0.u, v: vertex0.v },
    coordonnees_grille_stables: { gridU: vertex0.gridU, gridV: vertex0.gridV },
    index: vertex0.index
  });
  
  // Montrer structure d'une face
  const face0 = currentMesh.faces[0];
  console.log('\n🔲 STRUCTURE FACE (exemple face[0]):');
  console.log({
    vertices_indices: face0.vertices,
    centre_projete: face0.center,
    profondeur: face0.avgZ,
    visibilite: { visibility: face0.visibility, hiddenCorners: face0.hiddenCorners },
    mapping_texture: { 
      originalIndex: face0.originalIndex,
      textureCenterX: face0.textureCenterX,
      textureCenterY: face0.textureCenterY
    }
  });
  
  // Montrer quelques exemples de centres de cases
  console.log('\n📐 CENTRES DES CASES (premiers exemples):');
  for (let i = 0; i < Math.min(5, currentMesh.faces.length); i++) {
    const face = currentMesh.faces[i];
    console.log(`Face[${i}]: centre texture (${face.textureCenterX}, ${face.textureCenterY}) → originalIndex=${face.originalIndex}`);
  }
  
  console.log('\n✅ Structure affichée dans la console');
}

// === MAILLAGE AVEC ANIMATION ===
let currentMesh = null;
let originalMesh2D = null; // RÉFÉRENCE FIXE du maillage 2D original (JAMAIS modifiée)
let targetSurface = 'view2d';
let currentSurface = 'view2d';
let isAnimating = false;
let dragEnabled = true;
let view2DMode = true; // Mode vue 2D grille par défaut

// === AFFICHAGE SCALE ===
// Scale affiché en temps réel

// === TEXTURE MAPPING ===
let mapCanvas = null;
let mapContext = null;
let showTexture = true;  // Afficher la texture (cartes)
let showGrid = false;    // Afficher les lignes de grille

// === FACES CACHÉES DÉSACTIVÉES (contrôle supprimé) ===
let showHiddenFaces = false;

// Direction de vue isométrique (vers le fond)
const VIEW_DIRECTION = { x: -ISO_COS, y: 0, z: ISO_COS };

function initializeMesh(surfaceFunc) {
  const vertices = [];
  const faces = [];
  
  // DEBUG SPÉCIFIQUE PROJECTIF - Test quelques points
  if (currentSurface === 'projective') {
    pd('projective_debug', 'main.js', `🪩 INIT PROJECTIF - Test coordonnées poles:`);
    const testPole1 = surfaceFunc(0.1, 0.5); // Près pôle
    const testPole2 = surfaceFunc(0.9, 0.5); // Près autre pôle
    const testCenter = surfaceFunc(0.5, 0.5); // Centre
    pd('projective_debug', 'main.js', `🪩 Pôle 1 (u=0.1): z=${testPole1.z.toFixed(3)} | Pôle 2 (u=0.9): z=${testPole2.z.toFixed(3)} | Centre: z=${testCenter.z.toFixed(3)}`);
  }
  
  // Génération des sommets sur grille rectangulaire
  for (let i = 0; i <= MESH_U; i++) {
    for (let j = 0; j <= MESH_V; j++) {
      const u = i / MESH_U; // Paramètre U normalisé [0,1]
      const v = j / MESH_V; // Paramètre V normalisé [0,1]
      
      const point = surfaceFunc(u, v);
      
      // STRUCTURE 2D UNIVERSELLE - Copier TOUJOURS la structure 2D avant projection
      // Toutes les surfaces utilisent la même base UV que 2D (cohérence morphing garantie)
      const gridU = 1 - u;  // Inversion X comme 2D (TOUJOURS)
      const gridV = v;      // Pas d'inversion Y comme 2D (TOUJOURS)
      
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
        gridU: gridU,  // UV avec inversions spécifiques à la surface
        gridV: gridV,
        index: i * (MESH_V + 1) + j
      });
    }
  }
  
  // Génération des faces (quads) - chaque carré = 4 sommets
  for (let i = 0; i < MESH_U; i++) {
    for (let j = 0; j < MESH_V; j++) {
      // Indices des 4 sommets du quad (ORDRE CORRIGÉ pour texture mapping)
      // Ordre cohérent avec grille UV : Bottom-left → Bottom-right → Top-right → Top-left
      const i0 = i * (MESH_V + 1) + j;         // Bottom-left  (u=i/30, v=j/20)
      const i1 = (i + 1) * (MESH_V + 1) + j;   // Bottom-right (u=(i+1)/30, v=j/20)
      const i2 = (i + 1) * (MESH_V + 1) + j + 1; // Top-right    (u=(i+1)/30, v=(j+1)/20)
      const i3 = i * (MESH_V + 1) + j + 1;     // Top-left     (u=i/30, v=(j+1)/20)
      
      faces.push({
        vertices: [i0, i1, i2, i3], // 4 indices DANS L'ORDRE CORRECT
        center: null, // Calculé plus tard
        normal: null, // Calculé plus tard
        avgZ: null,   // Profondeur après rotation
        // Nouvelles propriétés pour faces cachées
        hiddenCorners: 0, // Nombre de coins cachés (0-4)
        visibility: 'visible', // 'visible', 'partial', 'hidden'
        // Index original pour texture mapping stable
        originalIndex: i * MESH_V + j,
        // COORDONNÉES FIXES DU CENTRE DE LA CASE [x,y] pour mapping texture stable
        textureCenterX: i + 0.5,  // Centre en X de la case (0.5 à 29.5)
        textureCenterY: j + 0.5   // Centre en Y de la case (0.5 à 19.5)
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
function morphToSurface(newSurfaceName, skipAnimation = false) {
  if (newSurfaceName === targetSurface) return;
  
  targetSurface = newSurfaceName;
  currentSurface = newSurfaceName;
  
  // SCALE GÉRÉ PAR LES ANGLES PRIVILÉGIÉS - plus besoin de getOptimalScale
  
  let newMesh;
  
  if (newSurfaceName === 'view2d') {
    // RETOUR EN 2D : Utiliser la référence fixe originale (transformation réversible garantie)
    if (!originalMesh2D) {
      // Première fois : créer la référence fixe
      originalMesh2D = initializeMesh(surfaces.view2d);
      pd('morphToSurface', 'main.js', '🔧 Référence 2D originale créée (première fois)');
    }
    
    // Cloner la référence fixe (structure parfaitement identique)
    newMesh = {
      vertices: originalMesh2D.vertices.map(v => ({...v})),
      faces: originalMesh2D.faces.map(f => ({...f, vertices: [...f.vertices]}))
    };
    
    pd('morphToSurface', 'main.js', '🔄 Retour 2D via référence fixe - transformation réversible garantie');
  } else {
    // AUTRES SURFACES : Génération normale
    newMesh = initializeMesh(surfaces[newSurfaceName]);
    pd('morphToSurface', 'main.js', `🔄 Maillage généré vers ${newSurfaceName}`);
  }
  
  if (currentMesh) {
    // COPIE PAR CORRESPONDANCE LOGIQUE (même position grille) et non par index tableau
    // Créer un mapping basé sur les coordonnées UV originales
    const oldVertexMap = new Map();
  currentMesh.vertices.forEach(vertex => {
      const key = `${vertex.u.toFixed(6)}_${vertex.v.toFixed(6)}`;
      oldVertexMap.set(key, vertex);
    });
    
    // Copier les positions vers les vertices correspondants
    newMesh.vertices.forEach(vertex => {
      const key = `${vertex.u.toFixed(6)}_${vertex.v.toFixed(6)}`;
      const oldVertex = oldVertexMap.get(key);
      if (oldVertex) {
        vertex.x = oldVertex.x;
        vertex.y = oldVertex.y;
        vertex.z = oldVertex.z;
      }
    });
    
    pd('morphToSurface', 'main.js', '🔧 Positions copiées par correspondance logique UV (pas par index)');
  }
  
  // Remplacer le maillage corrompu par un nouveau propre
  currentMesh = newMesh;
  
  // PLUS BESOIN de réinitialiser le cache rectangles - structure UV identique !
  // textureRectangles reste valide car même grille 30x20, mêmes UV, même texture
  
  if (skipAnimation) {
    // SKIP ANIMATION : Aller directement à la position finale
    currentMesh.vertices.forEach(vertex => {
      vertex.x = vertex.xDest;
      vertex.y = vertex.yDest;
      vertex.z = vertex.zDest;
    });
    isAnimating = false;
    pd('morphToSurface', 'main.js', `⚡ Animation skippée - transition immédiate vers ${newSurfaceName}`);
  } else {
  isAnimating = true;
    pd('morphToSurface', 'main.js', `🔄 Animation démarrée vers ${newSurfaceName}`);
  }
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
  // Tore [+ +] - bords verticaux et horizontaux dans même sens (IMPORTÉ)
  torus: torus,
  
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
  
  // Cylindre [+ +] - bords horizontaux dans même sens (IMPORTÉ)
  cylinder: cylinder,
  
  // Ruban de Möbius [+ -] - bords horizontaux opposés
  mobius: mobius,
  
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
  
  // Plan projectif - quotient de la sphère (IMPORTÉ depuis projective.js)
  projective: projective,
  
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
  
  // Plan - surface plate infinie (IMPORTÉ)
  plane: plane,

  // Vue 2D - grille plate pour morphing 2D ↔ 3D (avec inversion Y)
  view2d: surface2D
};

// === ROTATION 3D ===
function rotate3D(x, y, z, rotX, rotY, rotZ) {
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

// === ROTATION 3D PROJECTIF ===
function rotate3DProjective(x, y, z, rotX, rotY, rotZ, rotShape) {
  // D'abord rotation de forme autour de l'axe principal (axe Z local de la forme)
  const cosShape = Math.cos(rotShape), sinShape = Math.sin(rotShape);
  const xShape = x * cosShape - y * sinShape;
  const yShape = x * sinShape + y * cosShape;
  const zShape = z;
  
  // Puis rotation normale (vue caméra)
  return rotate3D(xShape, yShape, zShape, rotX, rotY, rotZ);
}

// === PROJECTION ISOMÉTRIQUE ===
function projectIso(x, y, z, scale) {
  return {
    x: (x * ISO_COS - z * ISO_COS) * scale,
    y: (y + x * ISO_SIN + z * ISO_SIN) * scale
  };
}

// === CONFIGURATION SCALE DYNAMIQUE ===
function getOptimalScale(surfaceName) {
  const surfaceConfigs = {
    'cylinder': cylinderConfig,
    'torus': torusConfig,
    'mobius': mobiusConfig,
    'view2d': { scale: 108 }, // Scale par défaut pour 2D
    'plane': { scale: 150 },  // Scale par défaut pour plan
    // Autres surfaces utilisent scale par défaut
    'klein': { scale: 150 },
    'crosscap': { scale: 150 },
    'projective': { scale: 150 },
    'disk': { scale: 150 },
    'nonorientable2': { scale: 150 }
  };
  
  const config = surfaceConfigs[surfaceName];
  return config ? config.scale : 150; // Fallback vers scale par défaut
}

// === RENDU CANVAS ===
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
// Surface courante déjà déclarée en haut
// Initialisation avec config 2D par défaut
let rotX = config.privilegedAngles['view2d'] ? (config.privilegedAngles['view2d'].rotX * Math.PI) / 180 : (config.defaultRotationX * Math.PI) / 180;
let rotY = config.privilegedAngles['view2d'] ? (config.privilegedAngles['view2d'].rotY * Math.PI) / 180 : (config.defaultRotationY * Math.PI) / 180;
let rotZ = config.privilegedAngles['view2d'] ? (config.privilegedAngles['view2d'].rotZ * Math.PI) / 180 : 0;
let rotShape = 0; // Rotation autour de l'axe principal de la forme (pour projectif)
let scale = config.privilegedAngles['view2d'] ? config.privilegedAngles['view2d'].scale : 108; // Scale initial 2D
let cameraOffsetX = 0; // Translation caméra X
let cameraOffsetY = 0; // Translation caméra Y

// === GESTION SOURIS ===
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Mettre à jour l'affichage des angles
function updateAngleDisplay() {
  const angleXDeg = Math.round((rotX * 180) / Math.PI);
  const angleYDeg = Math.round((rotY * 180) / Math.PI);
  const angleZDeg = Math.round((rotZ * 180) / Math.PI);
  
  document.getElementById('angleXDisplay').textContent = angleXDeg + '°';
  document.getElementById('angleYDisplay').textContent = angleYDeg + '°';
  document.getElementById('angleZDisplay').textContent = angleZDeg + '°';
}

// Fonctions de translation caméra
function translateCamera(deltaX, deltaY) {
  const moveSpeed = 10; // Vitesse de déplacement
  cameraOffsetX += deltaX * moveSpeed;
  cameraOffsetY += deltaY * moveSpeed;
  pd('translateCamera', 'main.js', `📹 Caméra déplacée: X=${Math.round(cameraOffsetX)} Y=${Math.round(cameraOffsetY)}`);
}

function resetCameraPosition() {
  cameraOffsetX = 0;
  cameraOffsetY = 0;
  pd('resetCamera', 'main.js', `📹 Position caméra réinitialisée`);
}

// DEBUG UV + PROJECTION - Traquer les coordonnées des sommets de référence
function debugUVCorners() {
  if (!currentMesh) return;
  
  const vertices = currentMesh.vertices;
  const totalVertices = vertices.length;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Indices des sommets de référence dans un maillage 30x20
  // Organisation: index = i * (MESH_V + 1) + j
  const cornerIndices = {
    'TopLeft': 0 * (MESH_V + 1) + MESH_V,           // (0,20) - coin haut-gauche
    'TopRight': MESH_U * (MESH_V + 1) + MESH_V,     // (30,20) - coin haut-droite
    'BottomLeft': 0 * (MESH_V + 1) + 0,             // (0,0) - coin bas-gauche
    'BottomRight': MESH_U * (MESH_V + 1) + 0,       // (30,0) - coin bas-droite
    'Center': Math.floor(MESH_U/2) * (MESH_V + 1) + Math.floor(MESH_V/2) // (~15,~10)
  };
  
  // Snapshot actuel des UV + coordonnées projetées
  const currentSnapshot = {};
  Object.entries(cornerIndices).forEach(([name, index]) => {
    if (index < totalVertices) {
      const vertex = vertices[index];
      
      // Calculer projection à l'écran pour ce sommet
      const rotated = currentSurface === 'projective' 
        ? rotate3DProjective(vertex.x, vertex.y, vertex.z, rotX, rotY, rotZ, rotShape)
        : rotate3D(vertex.x, vertex.y, vertex.z, rotX, rotY, rotZ);
      const projected = projectIso(rotated.x, rotated.y, rotated.z, scale);
      const screenX = centerX + projected.x + cameraOffsetX;
      const screenY = centerY - projected.y + cameraOffsetY;
      
      currentSnapshot[name] = {
        gridU: vertex.gridU,
        gridV: vertex.gridV,
        u: vertex.u,
        v: vertex.v,
        // Nouvelles coordonnées projetées
        screenX: screenX,
        screenY: screenY,
        rotatedZ: rotated.z
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
     }
     } else {
     // Premier snapshot - juste afficher l'état initial
     console.log('🔍 État initial:');
   }
   
   // Toujours afficher les coordonnées projetées à chaque rotation
   console.log(`📍 Coordonnées projetées (3D → écran) - Surface: ${targetSurface}:`);
   Object.entries(currentSnapshot).forEach(([name, data]) => {
     console.log(`${name}: gridU=${data.gridU?.toFixed(3)} gridV=${data.gridV?.toFixed(3)} u=${data.u?.toFixed(3)} v=${data.v?.toFixed(3)} → screenX=${Math.round(data.screenX)} screenY=${Math.round(data.screenY)} z=${data.rotatedZ?.toFixed(2)}`);
   });
   
   // Vérifier si on est sur une surface fermée (cylindre, torus, etc.)
   const closedSurfaces = ['cylinder', 'torus', 'mobius', 'klein'];
   if (closedSurfaces.includes(targetSurface)) {
     console.log(`ℹ️ SURFACE FERMÉE (${targetSurface}): Les bords u=0 et u=1 se rejoignent mathématiquement - coordonnées identiques NORMALES`);
   }
   
   // Afficher aussi les coordonnées 2D de référence (grille plate)
   console.log('📐 Coordonnées 2D référence (grille plate):');
   const gridWidth = canvas.width * 0.8;
   const gridHeight = canvas.height * 0.8;
   const startX = (canvas.width - gridWidth) / 2;
   const startY = (canvas.height - gridHeight) / 2;
   const cellWidth = gridWidth / MESH_U;
   const cellHeight = gridHeight / MESH_V;
   
   const corner2D = {
     'TopLeft': {i: 0, j: 0},
     'TopRight': {i: 0, j: MESH_V},
     'BottomLeft': {i: MESH_U, j: 0},
     'BottomRight': {i: MESH_U, j: MESH_V},
     'Center': {i: Math.floor(MESH_U/2), j: Math.floor(MESH_V/2)}
   };
   
   Object.entries(corner2D).forEach(([name, {i, j}]) => {
     const x2D = startX + i * cellWidth;
     const y2D = startY + j * cellHeight;
     console.log(`${name}: grid(${i},${j}) → 2D(${Math.round(x2D)},${Math.round(y2D)})`);
   });
  
  // Sauvegarder le snapshot pour la prochaine fois
  lastUVSnapshot = JSON.parse(JSON.stringify(currentSnapshot));
}

// RENDU 2D GRILLE - Vue texture mapping de référence (PLEIN ÉCRAN OPTIMISÉ)
function render2DGrid() {
  // Clear
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (!currentMesh) return;
  
  // STRATÉGIE 1: Utiliser 95% de l'espace (au lieu de 80%)
  const availableWidth = canvas.width * 0.95;
  const availableHeight = canvas.height * 0.95;
  
  // STRATÉGIE 2: Calculer la taille de cellule optimale pour garder les cases carrées
  const cellSizeByWidth = availableWidth / MESH_U;
  const cellSizeByHeight = availableHeight / MESH_V;
  
  // Prendre la plus petite pour garder les cases carrées
  const optimalCellSize = Math.min(cellSizeByWidth, cellSizeByHeight);
  
  // STRATÉGIE 3: Calculer les dimensions finales de la grille
  const gridWidth = optimalCellSize * MESH_U;
  const gridHeight = optimalCellSize * MESH_V;
  
  // Centrer la grille dans l'espace disponible
  const startX = (canvas.width - gridWidth) / 2;
  const startY = (canvas.height - gridHeight) / 2;
  
  const cellWidth = optimalCellSize;
  const cellHeight = optimalCellSize;
  
  // Dessiner la texture 2D si activée
  if (showTexture && mapCanvas) {
    // Dessiner chaque cellule avec sa texture
    for (let i = 0; i < MESH_U; i++) {
      for (let j = 0; j < MESH_V; j++) {
        const x = startX + i * cellWidth;
        const y = startY + j * cellHeight;
        
                 // Coordonnées UV de cette cellule
         const u = i / MESH_U;
         const v = j / MESH_V;
         
         // Portion de texture correspondante
         const texX = Math.floor(u * mapCanvas.width);
         const texY = Math.floor(v * mapCanvas.height); // Pas d'inversion Y
         const texW = Math.ceil(mapCanvas.width / MESH_U);
         const texH = Math.ceil(mapCanvas.height / MESH_V);
        
        // Dessiner la portion de texture
        ctx.drawImage(mapCanvas, 
          texX, texY, texW, texH,
          x, y, cellWidth, cellHeight
        );
      }
    }
  }
  
  // Dessiner les lignes de grille si activées
  if (showGrid) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Lignes verticales
    for (let i = 0; i <= MESH_U; i++) {
      const x = startX + i * cellWidth;
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + gridHeight);
      ctx.stroke();
    }
    
    // Lignes horizontales
    for (let j = 0; j <= MESH_V; j++) {
      const y = startY + j * cellHeight;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + gridWidth, y);
      ctx.stroke();
    }
  }
  
  // Marquer les 5 points de référence
  const cornerIndices = {
    'TopLeft': {i: 0, j: 0, color: 'red'},
    'TopRight': {i: 0, j: MESH_V, color: 'blue'},
    'BottomLeft': {i: MESH_U, j: 0, color: 'green'},
    'BottomRight': {i: MESH_U, j: MESH_V, color: 'orange'},
    'Center': {i: Math.floor(MESH_U/2), j: Math.floor(MESH_V/2), color: 'purple'}
  };
  
  Object.entries(cornerIndices).forEach(([name, {i, j, color}]) => {
    const x = startX + i * cellWidth;
    const y = startY + j * cellHeight;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Label
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.fillText(name, x + 10, y - 10);
  });
  
  // Info mode 2D avec optimisation
  ctx.fillStyle = 'black';
  ctx.font = '16px Arial';
  const utilizationPercent = Math.round((gridWidth * gridHeight) / (canvas.width * canvas.height) * 100);
  ctx.fillText(`Vue 2D - Grille ${MESH_U}x${MESH_V} - Cases ${Math.round(cellWidth)}x${Math.round(cellHeight)}px - Utilisation ${utilizationPercent}%`, 10, 30);
}

function render() {
  
  // Debug UV désormais uniquement lors des rotations manuelles
  
  // Vue 2D utilise maintenant le même rendu avec projection orthogonale
  
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
    // MÊME SYSTÈME pour 2D et 3D : rotation puis projection isométrique
    const rotated = currentSurface === 'projective' 
      ? rotate3DProjective(vertex.x, vertex.y, vertex.z, rotX, rotY, rotZ, rotShape)
      : rotate3D(vertex.x, vertex.y, vertex.z, rotX, rotY, rotZ);
    const projected = projectIso(rotated.x, rotated.y, rotated.z, scale);
    
    return {
      x: centerX + projected.x + cameraOffsetX,
      y: centerY - projected.y + cameraOffsetY,
      z: rotated.z, // Profondeur normale pour tri
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
      
      // MÊME CALCUL de profondeur pour 2D et 3D
      const vertex = currentMesh.vertices[vertexIndex];
      const rotated = currentSurface === 'projective' 
        ? rotate3DProjective(vertex.x, vertex.y, vertex.z, rotX, rotY, rotZ, rotShape)
        : rotate3D(vertex.x, vertex.y, vertex.z, rotX, rotY, rotZ);
      centerZ += rotated.z;
    });
    
    face.center = {
      x: centerX / 4,
      y: centerY / 4
    };
    face.avgZ = centerZ / 4;
  });
  
  // Tri des faces par profondeur (painter's algorithm)
  const sortedFaces = currentMesh.faces.sort((a, b) => a.avgZ - b.avgZ);
  
  // Pré-calculer rectangles textures si nécessaire (SEULEMENT si pas encore fait)
  if (showTexture && !textureRectangles) {
    textureRectangles = precalculateTextureRectangles();
    pd('render', 'main.js', '🔧 Rectangles texture pré-calculés UNE SEULE FOIS');
  }
  
  // Debug périodique supprimé pour éviter spam console
  
  // Rendu avec texture ET grille si activé
  if (showTexture) {
    // Rendu avec texture projetée (rectangles pré-calculés + transformations)
    sortedFaces.forEach((face, sortedIndex) => {
      // Skip faces cachées si activé
      if (showHiddenFaces && face.visibility === 'hidden') return;
      
      // Construire quad projeté pour cette face
      const quadProjected = face.vertices.map(vertexIndex => projectedVertices[vertexIndex]);
      
      // CORRECTION CRITIQUE: Utiliser l'index ORIGINAL de la face, pas l'index trié
      const rectangle = textureRectangles ? textureRectangles[face.originalIndex] : null;
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
        
        // GRILLE DÉFORMABLE au-dessus de la texture (filet de foot !)
        if (showGrid) {
          ctx.strokeStyle = 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(projectedVertices[indices[0]].x, projectedVertices[indices[0]].y);
        ctx.lineTo(projectedVertices[indices[1]].x, projectedVertices[indices[1]].y);
        ctx.lineTo(projectedVertices[indices[2]].x, projectedVertices[indices[2]].y);
        ctx.lineTo(projectedVertices[indices[3]].x, projectedVertices[indices[3]].y);
        ctx.closePath();
        ctx.stroke();
        }
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

// === INTERFACE MOVE DRAGGABLE ===
let isInterfaceDragging = false;
let dragOffset = { x: 0, y: 0 };

const floatingInterface = document.getElementById('cameraTranslationFloating');
const dragHandle = floatingInterface.querySelector('.drag-handle');

dragHandle.addEventListener('mousedown', (e) => {
  isInterfaceDragging = true;
  
  // Positionner instantanément le div sous la souris (coordonnées globales)
  const container = floatingInterface.parentElement;
  const containerRect = container.getBoundingClientRect();
  
  // Position de la souris relative au container
  const mouseX = e.clientX - containerRect.left;
  const mouseY = e.clientY - containerRect.top;
  
  // Positionner les ⋮⋮⋮ sous la souris (pas le centre de la div)
  const interfaceWidth = floatingInterface.offsetWidth;
  const interfaceHeight = floatingInterface.offsetHeight;
  const handleHeight = dragHandle.offsetHeight;
  
  dragOffset.x = interfaceWidth / 2;  // Centre horizontal
  dragOffset.y = handleHeight / 2;    // Centre de la bande ⋮⋮⋮
  
  // Positionner immédiatement l'interface sous la souris
  const newX = mouseX - dragOffset.x;
  const newY = mouseY - dragOffset.y;
  
  // Contraintes pour rester dans le container
  const maxX = containerRect.width - interfaceWidth;
  const maxY = containerRect.height - interfaceHeight;
  
  const constrainedX = Math.max(0, Math.min(newX, maxX));
  const constrainedY = Math.max(0, Math.min(newY, maxY));
  
  floatingInterface.style.left = constrainedX + 'px';
  floatingInterface.style.top = constrainedY + 'px';
  floatingInterface.style.right = 'auto';
  floatingInterface.style.bottom = 'auto';
  
  // Ajouter classe de drag pour animation
  floatingInterface.classList.add('dragging');
  
  // Empêcher la sélection de texte
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isInterfaceDragging) return;
  
  // Optimisation: utiliser requestAnimationFrame pour éviter les ralentissements
  requestAnimationFrame(() => {
    const container = floatingInterface.parentElement;
    const containerRect = container.getBoundingClientRect();
    
    // Position de la souris relative au container
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Positionner l'interface centrée sous la souris
    const newX = mouseX - dragOffset.x;
    const newY = mouseY - dragOffset.y;
    
    // Contraintes pour rester dans le container
    const maxX = containerRect.width - floatingInterface.offsetWidth;
    const maxY = containerRect.height - floatingInterface.offsetHeight;
    
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));
    
    floatingInterface.style.left = constrainedX + 'px';
    floatingInterface.style.top = constrainedY + 'px';
    floatingInterface.style.right = 'auto';
    floatingInterface.style.bottom = 'auto';
  });
});

document.addEventListener('mouseup', () => {
  if (isInterfaceDragging) {
    isInterfaceDragging = false;
    
    // Retirer classe de drag pour restaurer les transitions
    floatingInterface.classList.remove('dragging');
  }
});

// Démarrer l'animation
animate();

// === INITIALISATION DYNAMIQUE DES TEXTURES ===
(async function initializeTextures() {
  await detectAvailableTextures();
  generateTextureInterface();
  
  // Charger la texture APRÈS détection
  loadTexture();
  
  // Initialiser l'affichage de la projection
  updateProjectionName(currentMapName);
  
  pd('initTextures', 'main.js', '🎨 Interface de textures initialisée dynamiquement');
})();

// === CONTRÔLES ===
// Noms des topologies pour affichage (EN par défaut)
const topologyNames = {
  'torus': 'Torus',
  'klein': 'Klein Bottle',
  'cylinder': 'Cylinder', 
  'mobius': 'Möbius Strip',
  'crosscap': 'Cross-cap',
  'projective': 'Projective Plane',
  'disk': 'Disk',
  'plane': 'Plane',
  'view2d': 'Texture'
};

// Pictos des topologies (séparés pour réutilisation)
const topologyIcons = {
  'plane': '🔷',
  'disk': '💿', 
  'cylinder': '🫙',
  'mobius': '🎀',
  'torus': '🍩',
  'projective': '🌎',
  'klein': '🖇️',
  'crosscap': '🪢'
};

// Fonction pour mettre à jour l'affichage du nom
function updateTopologyName(surfaceName) {
  // La topologie est maintenant affichée dans selectedProjection via updateProjectionName
  // Cette fonction ne fait plus rien mais est gardée pour compatibilité
}

// Fonction pour mettre à jour l'affichage compact topologie + texture
function updateProjectionName(mapName) {
  const mapConfig = availableMaps.find(m => m.name === mapName);
  const textureName = mapConfig ? mapConfig.title : mapName;
  
  // Récupérer la topologie actuelle
  const currentTopology = view2DMode ? 'Texture' : (topologyNames[currentSurface] || currentSurface);
  
  // Affichage compact sur une ligne : "Steam Texture", "Eye Cylinder", etc.
  const displayText = view2DMode ? `${textureName} Texture` : `${textureName} ${currentTopology}`;
  document.getElementById('selectedProjection').textContent = displayText;
  pd('updateProjection', 'main.js', `📊 Affichage: ${displayText}`);
}

// Boutons radio pour sélection de topologie
document.querySelectorAll('input[name="topology"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.checked) {
      const newValue = e.target.value;
      
      if (newValue === 'view2d') {
        // NOUVEAU: Bouton 2D = Reinit caméra avec config 2D complète
        if (config.privilegedAngles['view2d']) {
          const angles = config.privilegedAngles['view2d'];
          rotX = (angles.rotX * Math.PI) / 180;
          rotY = (angles.rotY * Math.PI) / 180;
          rotZ = (angles.rotZ * Math.PI) / 180;
          scale = angles.scale;
        } else {
          // Fallback si pas de config
          rotX = (config.defaultRotationX * Math.PI) / 180;
          rotY = (config.defaultRotationY * Math.PI) / 180;
          rotZ = 0;
          scale = 108; // Scale 2D correct
        }
        updateAngleDisplay();
        
        // Rester en mode 2D après reinit
        view2DMode = true;
        updateTopologyName('');
        
        // Mettre à jour l'affichage combiné
        updateProjectionName(currentMapName);
        
        // Désactiver interface move en mode 2D
        const cameraInterface = document.getElementById('cameraTranslationFloating');
        const moveOverlay = document.getElementById('moveOverlay');
        
        if (cameraInterface) {
          cameraInterface.classList.add('disabled');
        }
        if (moveOverlay) {
          moveOverlay.classList.add('active');
        }
        
        // Mettre à jour cursor pour mode 2D
        canvas.style.cursor = 'default';
        pd('view2D', 'main.js', '🔒 Mode 2D: Drag souris désactivé + interface move grisée');
        if ('view2d' !== targetSurface) {
          morphToSurface('view2d');
        }
        
        pd('reinitCamera', 'main.js', `🔄 Caméra réinitialisée via bouton 2D: X=${Math.round(rotX * 180 / Math.PI)}° Y=${Math.round(rotY * 180 / Math.PI)}° Z=${Math.round(rotZ * 180 / Math.PI)}° Scale=${scale}`);
        if (!view2DMode) debugUVCorners();
      } else {
        // Mode 3D normal avec topologie + ANGLES PRIVILÉGIÉS
        view2DMode = false;
        updateTopologyName(newValue);
        
        // Activer interface move en mode 3D
        const cameraInterface = document.getElementById('cameraTranslationFloating');
        const moveOverlay = document.getElementById('moveOverlay');
        
        if (cameraInterface) {
          cameraInterface.classList.remove('disabled');
        }
        if (moveOverlay) {
          moveOverlay.classList.remove('active');
        }
        
        pd('view3D', 'main.js', '🔓 Mode 3D: Drag souris activé + interface move fonctionnelle');
        
        // Appliquer les angles privilégiés de cette topologie
        if (config.privilegedAngles[newValue]) {
          const angles = config.privilegedAngles[newValue];
          rotX = (angles.rotX * Math.PI) / 180;
          rotY = (angles.rotY * Math.PI) / 180;
          rotZ = (angles.rotZ * Math.PI) / 180;
          scale = angles.scale;
          updateAngleDisplay();
          pd('privilegedAngles', 'main.js', `📐 Angles privilégiés appliqués pour ${newValue}: X=${angles.rotX}° Y=${angles.rotY}° Z=${angles.rotZ}° Scale=${angles.scale}`);
        }
        
        if (newValue !== targetSurface) {
          morphToSurface(newValue);
        }
        
        // Mettre à jour l'affichage combiné texture + topologie
        updateProjectionName(currentMapName);
        
        pd('topology', 'main.js', `Mode de vue: 3D ${topologyNames[newValue] || newValue}`);
        
        // DEBUG SPÉCIFIQUE PROJECTIF
        if (newValue === 'projective') {
          pd('projective_debug', 'main.js', `🪩 PROJECTIF ACTIVÉ - Debug coordonnées activé`);
        }
        
        // DEBUG DRAG COMPORTEMENT
        if (newValue === 'cylinder') {
          pd('drag_behavior', 'main.js', `🫙 CYLINDRE - Drag X inversé, Drag Y bloqué`);
        } else if (newValue === 'torus') {
          pd('drag_behavior', 'main.js', `🍩 TORE - Drag X = rotY, Drag Y = rotZ (inclinaison)`);
        } else if (newValue === 'projective') {
          pd('drag_behavior', 'main.js', `🪩 PROJECTIF - Drag X = rotation forme (pomme autour axe), Drag Y = rotation X`);
        }
      }
    }
  });
});

// Boutons radio pour sélection de cartes
document.querySelectorAll('input[name="mapChoice"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.checked) {
      const mapName = e.target.value;
      changeMap(mapName);
    }
  });
});

// Contrôle d'échelle supprimé - utiliser le zoom molette

// Drag rotation toujours activé (plus de contrôle)
dragEnabled = true;

document.getElementById('showTexture').addEventListener('change', (e) => {
  showGrid = e.target.checked;
  pd('showGrid', 'main.js', `Lignes de grille: ${showGrid ? 'ACTIVÉES' : 'DÉSACTIVÉES'}`);
});

// Les boutons radio topology gèrent maintenant aussi la vue 2D

// Ancien bouton reinit supprimé - fonction intégrée au bouton 2D

// Les angles sont maintenant affichés en lecture seule (plus d'inputs manuels)

// Boutons fine-tuning rotation X
document.getElementById('rotXLeft').addEventListener('click', () => {
  rotX -= (5 * Math.PI) / 180; // -5°
  updateAngleDisplay();
  pd('rotXLeft', 'main.js', `Rotation X -5°: ${Math.round(rotX * 180 / Math.PI)}°`);
  if (!view2DMode) debugUVCorners();
});

document.getElementById('rotXRight').addEventListener('click', () => {
  rotX += (5 * Math.PI) / 180; // +5°
  updateAngleDisplay();
  pd('rotXRight', 'main.js', `Rotation X +5°: ${Math.round(rotX * 180 / Math.PI)}°`);
  if (!view2DMode) debugUVCorners();
});

// Boutons fine-tuning rotation Y
document.getElementById('rotYLeft').addEventListener('click', () => {
  rotY -= (5 * Math.PI) / 180; // -5°
  updateAngleDisplay();
  pd('rotYLeft', 'main.js', `Rotation Y -5°: ${Math.round(rotY * 180 / Math.PI)}°`);
  if (!view2DMode) debugUVCorners();
});

document.getElementById('rotYRight').addEventListener('click', () => {
  rotY += (5 * Math.PI) / 180; // +5°
  updateAngleDisplay();
  pd('rotYRight', 'main.js', `Rotation Y +5°: ${Math.round(rotY * 180 / Math.PI)}°`);
  if (!view2DMode) debugUVCorners();
});

// Boutons fine-tuning rotation Z
document.getElementById('rotZLeft').addEventListener('click', () => {
  rotZ -= (5 * Math.PI) / 180; // -5°
  updateAngleDisplay();
  pd('rotZLeft', 'main.js', `Rotation Z -5°: ${Math.round(rotZ * 180 / Math.PI)}°`);
  if (!view2DMode) debugUVCorners();
});

document.getElementById('rotZRight').addEventListener('click', () => {
  rotZ += (5 * Math.PI) / 180; // +5°
  updateAngleDisplay();
  pd('rotZRight', 'main.js', `Rotation Z +5°: ${Math.round(rotZ * 180 / Math.PI)}°`);
  if (!view2DMode) debugUVCorners();
});

// Bouton affichage structure supprimé

// === ÉVÉNEMENTS SOURIS ===
canvas.addEventListener('mousedown', (e) => {
  if (dragEnabled && !view2DMode) {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging || !dragEnabled || view2DMode) return;
  
  const deltaX = e.clientX - lastMouseX;
  const deltaY = e.clientY - lastMouseY;
  
  // Sauvegarder anciennes valeurs pour détecter changements
  const oldRotX = rotX;
  const oldRotY = rotY;
  const oldRotZ = rotZ;
  
  if (e.shiftKey) {
    // SHIFT + Drag = Rotation Z (inclinaison Diablo/Civilization)
    rotZ += deltaX * config.mouseSensitivity * 0.01;
  } else {
    // DRAG ADAPTATIF PAR SURFACE
    if (currentSurface === 'projective') {
      // PROJECTIF : Drag X = rotation autour axe principal de la forme
      rotShape += deltaX * config.mouseSensitivity * 0.01;
      // Drag Y = rotation X INVERSÉE (vertical opposé)
      rotX -= deltaY * config.mouseSensitivity * 0.01;
      rotX = Math.max(-Math.PI, Math.min(Math.PI, rotX));
    } else {
      // Rotation Y (horizontal) - normale pour autres surfaces
      let rotYMultiplier = 1;
      if (currentSurface === 'cylinder') {
        rotYMultiplier = -1; // Inverser le sens pour cylindre
      }
      rotY += deltaX * config.mouseSensitivity * 0.01 * rotYMultiplier;
      
      // Rotation X (vertical) - adaptée par surface
      if (currentSurface === 'cylinder') {
        // Cylindre : pas de rotation verticale
      } else if (currentSurface === 'torus') {
        // Tore : dragY = rotZ (inclinaison autour de l'axe Z)
        rotZ += deltaY * config.mouseSensitivity * 0.01;
      } else {
        // Autres surfaces : rotation X normale
        rotX += deltaY * config.mouseSensitivity * 0.01;
        // Garder les angles dans une plage raisonnable
        rotX = Math.max(-Math.PI, Math.min(Math.PI, rotX));
      }
    }
  }
  
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  
  updateAngleDisplay();
  
  // DEBUG UV à chaque nouvelle valeur de rotation
  if (oldRotX !== rotX || oldRotY !== rotY || oldRotZ !== rotZ) {
    const rotXDeg = Math.round((rotX * 180) / Math.PI);
    const rotYDeg = Math.round((rotY * 180) / Math.PI);
    const rotZDeg = Math.round((rotZ * 180) / Math.PI);
    console.log(`🔄 Rotation changée: X=${rotXDeg}° Y=${rotYDeg}° Z=${rotZDeg}°`);
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
    canvas.style.cursor = (dragEnabled && !view2DMode) ? 'grab' : 'default';
  }
}, 100);

// Zoom avec molette
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  scale = Math.max(10, Math.min(500, scale * zoomFactor)); // ScaleMin à 10 !
});

// === CONTRÔLES TRANSLATION CAMÉRA (DIRECTIONS CORRIGÉES) ===
// Interface flottante - directions intuitives
document.getElementById('camUp').addEventListener('click', () => translateCamera(0, -1));      // Haut = Y négatif
document.getElementById('camUpRight').addEventListener('click', () => translateCamera(1, -1));  // Haut-droite
document.getElementById('camRight').addEventListener('click', () => translateCamera(1, 0));     // Droite = X positif
document.getElementById('camDownRight').addEventListener('click', () => translateCamera(1, 1)); // Bas-droite
document.getElementById('camDown').addEventListener('click', () => translateCamera(0, 1));      // Bas = Y positif
document.getElementById('camDownLeft').addEventListener('click', () => translateCamera(-1, 1)); // Bas-gauche
document.getElementById('camLeft').addEventListener('click', () => translateCamera(-1, 0));     // Gauche = X négatif
document.getElementById('camUpLeft').addEventListener('click', () => translateCamera(-1, -1));  // Haut-gauche
document.getElementById('camCenter').addEventListener('click', () => resetCameraPosition());

// Initialiser l'affichage des angles
updateAngleDisplay();

// Plus besoin d'appeler render() manuellement - animation automatique !
