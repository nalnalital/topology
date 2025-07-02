// File: main.js - 3D Isometric Topology Engine with texture mapping
// Desc: En français, dans l'architecture, je suis le moteur principal qui gère la projection 3D isométrique, les transformations topologiques, et le texture mapping avec système multi-cartes
// Version 3.89.0 (Fix fonctions géométriques pour clic debug)
// Author: DNAvatar.org - Arnaud Maignan  
// Date: [December 16, 2024] [01:40 UTC+1]
// Logs:
//   - Fixed ReferenceError: moved geometric functions back to main.js
//   - findTileAtPosition, isPointInQuad, isPointInTriangle needed for click events
//   - Debug analysis functions remain in debug.js module
//   - Click-to-debug system now functional

// === IMPORTS ===
import { config } from './config.js';
import { createMesh, createSurface, transformCase, transformMesh, debugCase, debugMesh } from './mesh.js';
import { surface2D } from './surfaces/2D.js';
import { drawColorGrid } from './3Diso.js';
// Import configurations des surfaces
import { cylinder } from './surfaces/cylinder.js';
import { torus } from './surfaces/torus.js';
import { mobius } from './surfaces/mobius.js';
import { projective } from './surfaces/projective.js';
import { plane } from './surfaces/plane.js';
import { sphere } from './surfaces/sphere.js';
import { disk } from './surfaces/disk.js';
import { klein, identification as kleinId } from './surfaces/klein.js';
import { crosscap, identification as crosscapId } from './surfaces/crosscap.js';
import { createSurface as kleinSurface } from './surfaces/klein.js';
import { createSurface as crosscapSurface } from './surfaces/crosscap.js';
import { createSurface as diskSurface } from './surfaces/disk.js';
// import { debugTileClick } from './debug/debug.js';

// === CONFIGURATION MAILLAGE ===
// ========================================================================
// ⚠️ SYSTÈME DE COORDONNÉES ULTRA CRITIQUE - NE JAMAIS MODIFIER ! ⚠️
// ========================================================================
// Cette section définit la BASE ABSOLUE de tout le système 3D isométrique
// Toute modification ici CASSE TOUT le mapping texture/géométrie/debug
// ========================================================================

const MESH_U = 30; // ⚠️ CRITIQUE: Résolution en U → X horizontal (0-29) - NE PAS CHANGER
const MESH_V = 20; // ⚠️ CRITIQUE: Résolution en V → Y vertical (0-19) - NE PAS CHANGER

// ========================================================================
// MAPPING COORDONNÉES CORRIGÉ (pour 30 horizontales × 20 verticales) :
// 
// Boucles: for(x=0; x<width; x++) for(y=0; y<height; y++) → index = (x%30) + y*30
// face.originalIndex = (x % MESH_U) + y * MESH_U (modulo sur X seulement)
// gridX = face.originalIndex % MESH_U              → X (horizontal, 0-29)
// gridY = Math.floor(face.originalIndex / MESH_U) → Y (vertical, 0-19)
//
// DONC : X = gridX, Y = gridY
//
// CONVENTION FINALE :
// - X augmente HORIZONTALEMENT (gauche → droite) : 0 à 29 (30 cases)
// - Y augmente VERTICALEMENT (haut → bas) : 0 à 19 (20 cases)
// - (5,0) est À DROITE de (0,0), PAS en dessous !
// - (0,5) est EN DESSOUS de (0,0), PAS à droite !
// ========================================================================

// === PROJECTION ISOMÉTRIQUE ===
const ISO_COS = Math.cos(Math.PI / 6); // cos(30°)
const ISO_SIN = Math.sin(Math.PI / 6); // sin(30°)

// === OPTIMISATION RENDU RECTANGLES ===
let textureRectangles = null; // Cache des rectangles textures pré-calculés (calculé UNE SEULE FOIS)

// === FONCTION CENTRALE RÉCUPÉRATION TEXTURE ===
/**
 * Récupère le morceau de texture pour une tuile donnée
 * @param {number} x - Coordonnée X (horizontal, 0-29)
 * @param {number} y - Coordonnée Y (vertical, 0-19)
 * @returns {Object|null} Rectangle texture avec canvas, width, height
 */
function getBmp(x, y) {
  // Vérification préalable que les rectangles sont initialisés
  if (!textureRectangles) {
    // Pas de log ici pour éviter spam - l'erreur est gérée en amont
    return null;
  }
  
  // ⚠️ PROTECTION: Appliquer limites sur X ET Y pour éviter débordements
  const wrappedX = x % MESH_U;                    // Modulo pour X (0-29), MESH_U=30
  const clampedY = Math.max(0, Math.min(y, MESH_V - 1)); // Clamp Y (0-19), MESH_V=20
  
  // Calculer l'index selon votre formule: x%30 + y*30
  const index = wrappedX + clampedY * MESH_U;  // index = (x%30) + y*30
  
  // Vérifier que l'index est valide
  if (index >= textureRectangles.length) {
    pd('getBmp', 'main.js', `❌ Index invalide: ${index} (max: ${textureRectangles.length - 1})`);
    return null;
  }
  
  const rectangle = textureRectangles[index];
  
  // DEBUG DÉSACTIVÉ pour éviter spam dans updateMorphing
  // if (x === 1 && y === 8) {
  //   pd('getBmp18', 'main.js', `🎯 getBmp(1,8) → index=${index} → ${rectangle ? `${rectangle.width}x${rectangle.height}` : 'NULL'}`);
  // } else if (index < 10 || (x === 15 && y === 10) || y !== clampedY || x >= MESH_U) {
  //   // Debug pour quelques tuiles et détection de dépassements
  //   const overflow = y !== clampedY ? ` ⚠️Y-CLAMP(${y}→${clampedY})` : '';
  //   const xOverflow = x >= MESH_U ? ` ⚠️X-WRAP(${x}→${wrappedX})` : '';
  //   pd('getBmp', 'main.js', `🎯 getBmp(${x},${y}) → wrappedX=${wrappedX}, clampedY=${clampedY} → index=${index}${overflow}${xOverflow} → ${rectangle ? `${rectangle.width}x${rectangle.height}` : 'null'}`);
  // }
  
  return rectangle;
}

// Exposer getBmp et constantes globalement pour debug.js
window.getBmp = getBmp;
window.MESH_U = MESH_U;
window.MESH_V = MESH_V;
// currentMesh sera exporté dynamiquement quand il sera initialisé

// === MODE COULEUR DEBUG ===
let showColorDebug = false; // Mode couleur coordonnées (bouton 🎨)
let showCoordinates = false; // Mode affichage coordonnées texte (bouton 📍)

// === DEBUG UV TRACKING ===
let lastUVSnapshot = null; // Snapshot précédent des UV pour détection changements

// === SYSTÈME MULTI-CARTES DYNAMIQUE ===
let availableMaps = []; // Sera rempli dynamiquement
window.availableMaps = availableMaps; // 🔗 Correction : exposer sur window

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
      
      pd('detectTextures', 'main.js', `🟢 Texture: ${title} (${filename})`);
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
    window.availableMaps = availableMaps; // 🔗 Sync window
    return availableMaps;
    
  } catch (error) {
    pd('detectTextures', 'main.js', `🔴 Erreur scan répertoire: ${error.message}`);
    
    // Fallback: configuration minimale avec map.png par défaut
    availableMaps = [
      { name: 'map', file: 'cartes/map.png', title: 'Monde' }
    ];
    
    pd('detectTextures', 'main.js', `🔄 Fallback: 1 texture par défaut`);
    window.availableMaps = availableMaps; // 🔗 Sync window
    return availableMaps;
  }
}

let currentMapName = 'steam'; // Carte par défaut
window.currentMapName = currentMapName; // 🔗 Correction : exposer sur window

// Génération dynamique de l'interface textures
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateTextureInterface() {
  const mapOptionsContainer = document.querySelector('.map-options');
  if (!mapOptionsContainer) return;
  // Supprimer tous les enfants (labels) existants
  while (mapOptionsContainer.firstChild) {
    mapOptionsContainer.removeChild(mapOptionsContainer.firstChild);
  }
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
    // Correction : clé de traduction toujours mapXXX
    const tradKey = 'map' + capitalizeFirstLetter(map.name);
    span.setAttribute('trad', tradKey);
    span.textContent = window.t ? window.t(tradKey) : map.title;
    
    label.appendChild(input);
    label.appendChild(span);
    
    // Ajouter event listener
    input.addEventListener('change', (e) => {
      if (e.target.checked) {
        changeTexture(e.target.value);
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
  const mapConfig = availableMaps.find(m => m.name === mapName);
  if (!mapConfig) {
    pd('loadTexture', 'main.js', `🔴 Texture inconnue: ${mapName}`);
    return;
  }
  
  currentMapName = mapName;
  window.currentMapName = currentMapName; // 🔗 Sync window
  
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
    
    pd('loadTexture', 'main.js', `🟢 Texture "${mapConfig.title}" chargée`);
    
    // AUTO-RETOUR 3D avec petit timeout pour éviter mélange tuiles
    if (previousSurfaceBeforeMapChange && previousSurfaceBeforeMapChange !== 'view2d') {
      pd('loadTexture', 'main.js', `⚡ Auto-retour 3D vers: ${previousSurfaceBeforeMapChange}`);
      
                    // Petit timeout pour laisser le recalcul se stabiliser
       setTimeout(() => {
         // Retourner à la surface précédente SANS ANIMATION
         view2DMode = false;
        currentSurface = previousSurfaceBeforeMapChange; // FORCER la surface cible
         morphToSurface(previousSurfaceBeforeMapChange, true); // SKIP ANIMATION
         
        // RESTAURER les angles mémorisés (au lieu des angles privilégiés)
        if (previousAnglesBeforeMapChange) {
          rotX = previousAnglesBeforeMapChange.rotX;
          rotY = previousAnglesBeforeMapChange.rotY;
          rotZ = previousAnglesBeforeMapChange.rotZ;
          scale = previousAnglesBeforeMapChange.scale;
          pd('loadTexture', 'main.js', `📐 Angles restaurés: X=${Math.round(rotX * 180 / Math.PI)}° Y=${Math.round(rotY * 180 / Math.PI)}° Z=${Math.round(rotZ * 180 / Math.PI)}° Scale=${scale.toFixed(1)}`);
        } else if (config.privilegedAngles[previousSurfaceBeforeMapChange]) {
          // Fallback : angles privilégiés si pas de mémorisation
           const angles = config.privilegedAngles[previousSurfaceBeforeMapChange];
           rotX = (angles.rotX * Math.PI) / 180;
           rotY = (angles.rotY * Math.PI) / 180;
           rotZ = (angles.rotZ * Math.PI) / 180;
           scale = angles.scale;
          pd('loadTexture', 'main.js', `📐 Angles privilégiés appliqués (fallback)`);
         } else {
           // Angles par défaut si pas de config spécifique
           rotX = (config.defaultRotationX * Math.PI) / 180;
           rotY = (config.defaultRotationY * Math.PI) / 180;
           rotZ = 0;
           scale = getOptimalScale(previousSurfaceBeforeMapChange);
          pd('loadTexture', 'main.js', `📐 Angles par défaut appliqués (fallback)`);
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
          pd('loadTexture', 'main.js', `🎭 Cache misère désactivé`);
        }
        
        // DÉSACTIVER moveOverlay pour réactiver contrôles caméra en 3D
        const moveOverlay = document.getElementById('moveOverlay');
        if (moveOverlay) {
          moveOverlay.classList.remove('active');
          pd('loadTexture', 'main.js', `🔓 Contrôles caméra réactivés`);
        }
        
        // FORCER rendu pour afficher le retour 3D immédiatement
        requestAnimationFrame(render);
         
         // Réinitialiser pour prochain changement
         previousSurfaceBeforeMapChange = null;
        previousAnglesBeforeMapChange = null;
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
    pd('loadTexture', 'main.js', `🔴 Erreur chargement: ${mapConfig.file}`);
  };
  img.src = mapConfig.file;
}

// Variables pour mémoriser l'état précédent
let previousSurfaceBeforeMapChange = null;
let previousAnglesBeforeMapChange = null;

// Changer de carte
function changeTexture(mapName) {
  if (mapName !== window.currentMapName) {
    window.currentMapName = mapName;
    currentMapName = mapName;
    loadTexture(mapName);
    refreshProjectionTitle(); // Uniquement le titre de projection
  }
}

// PRE-CALCUL des rectangles textures à plat (O(1) par frame après init)
function precalculateTextureRectangles() {
  if (!mapCanvas || !currentMesh) return null;
  
  // Créer tableau indexé par originalIndex (pas par position de face)
  const rectangles = new Array(MESH_U * MESH_V);
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
  
      const srcX = Math.round(minU * texW);
    const srcY = Math.round(minV * texH); // Pas d'inversion Y
  const srcW = Math.ceil((maxU - minU) * texW);
  const srcH = Math.ceil((maxV - minV) * texH);
  
    // Debug supprimé pour éviter boucle infinie
    
    // SOLUTION: Créer rectangle fallback pour tuiles trop petites
    if (srcW < 2 || srcH < 2) {
      // Debug pour tuiles problématiques
      if (face.originalIndex === 271 || face.originalIndex === 272) {
        pd('precalculateDebug', 'main.js', `🔧 Rectangle fallback face ${face.originalIndex}: ${srcW}x${srcH} → 4x4 pixels (UV: ${minU.toFixed(3)}-${maxU.toFixed(3)}, ${minV.toFixed(3)}-${maxV.toFixed(3)})`);
      }
      
      // Créer rectangle 4x4 minimal avec échantillon robuste
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 4;
      fallbackCanvas.height = 4;
      const fallbackCtx = fallbackCanvas.getContext('2d', { willReadFrequently: true });
      
      // Échantillonner plusieurs points pour trouver une couleur valide
      const centerU = (minU + maxU) / 2;
      const centerV = (minV + maxV) / 2;
      let validColor = null;
      
      // Essayer plusieurs positions pour trouver un pixel non-transparent
      const testPositions = [
        { u: centerU, v: centerV },
        { u: minU + 0.1, v: minV + 0.1 },
        { u: maxU - 0.1, v: maxV - 0.1 },
        { u: centerU, v: minV + 0.1 },
        { u: centerU, v: maxV - 0.1 }
      ];
      
      for (const pos of testPositions) {
        const testX = Math.max(0, Math.min(Math.round(pos.u * texW), texW-1));
        const testY = Math.max(0, Math.min(Math.round(pos.v * texH), texH-1));
        
        try {
          const testData = mapCanvas.getContext('2d').getImageData(testX, testY, 1, 1);
          const [r, g, b, a] = testData.data;
          
          // Si le pixel n'est pas transparent, l'utiliser
          if (a > 0) {
            validColor = testData;
            if (face.originalIndex === 271) {
              pd('precalculateDebug', 'main.js', `🎨 Couleur trouvée pour face ${face.originalIndex} à (${testX},${testY}): rgba(${r},${g},${b},${a})`);
            }
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // Si aucune couleur valide trouvée, utiliser bleu océan par défaut
      if (!validColor) {
        validColor = new ImageData(new Uint8ClampedArray([20, 50, 80, 255]), 1, 1);
        if (face.originalIndex === 271) {
          pd('precalculateDebug', 'main.js', `🌊 Aucune couleur valide trouvée, utilisation bleu océan par défaut pour face ${face.originalIndex}`);
        }
      }
      
      try {
        // Remplir le canvas 4x4 avec la couleur trouvée
        for (let x = 0; x < 4; x++) {
          for (let y = 0; y < 4; y++) {
            fallbackCtx.putImageData(validColor, x, y);
          }
        }
        
        // PRÉ-CALCULER LES SEGMENTS 1D pour fallback aussi
        const fallbackSegments = {
          top: validColor,
          bottom: validColor, 
          left: validColor,
          right: validColor
        };

        rectangles[face.originalIndex] = {
          canvas: fallbackCanvas,
          width: 4,
          height: 4,
          originalIndex: face.originalIndex,
          isFallback: true,
          segments: fallbackSegments  // 🎯 SEGMENTS 1D FALLBACK
        };
      } catch (e) {
        rectangles[face.originalIndex] = null;
      }
      return;
    }
    
    // Créer canvas rectangle à plat (performance: copie unique)
    const rectCanvas = document.createElement('canvas');
    rectCanvas.width = srcW;
    rectCanvas.height = srcH;
    const rectCtx = rectCanvas.getContext('2d', { willReadFrequently: true });
    
    // Copier portion de texture avec extension des bords pour éviter transparence
    try {
      // D'abord copier la zone principale
      rectCtx.drawImage(mapCanvas, 
        Math.max(0, srcX), Math.max(0, srcY), 
        Math.min(srcW, texW - srcX), Math.min(srcH, texH - srcY),
        0, 0, srcW, srcH
      );
      
      // Étendre les bords pour éliminer toute transparence résiduelle
      const imageData = rectCtx.getImageData(0, 0, srcW, srcH);
      const data = imageData.data;
      
      // Remplir les pixels transparents avec la couleur du pixel voisin le plus proche
      for (let y = 0; y < srcH; y++) {
        for (let x = 0; x < srcW; x++) {
          const index = (y * srcW + x) * 4;
          
          // Si pixel transparent, remplacer par couleur voisine
          if (data[index + 3] === 0) {
            // Chercher le pixel non-transparent le plus proche
            let found = false;
            for (let radius = 1; radius <= 3 && !found; radius++) {
              for (let dy = -radius; dy <= radius && !found; dy++) {
                for (let dx = -radius; dx <= radius && !found; dx++) {
                  const nx = x + dx;
                  const ny = y + dy;
                  
                  if (nx >= 0 && nx < srcW && ny >= 0 && ny < srcH) {
                    const nIndex = (ny * srcW + nx) * 4;
                    if (data[nIndex + 3] > 0) {
                      data[index] = data[nIndex];         // R
                      data[index + 1] = data[nIndex + 1]; // G
                      data[index + 2] = data[nIndex + 2]; // B
                      data[index + 3] = 255;              // A (opaque)
                      found = true;
                    }
                  }
                }
              }
            }
            
            // Si aucun voisin trouvé, utiliser bleu océan par défaut
            if (!found) {
              data[index] = 20;      // R
              data[index + 1] = 50;  // G  
              data[index + 2] = 80;  // B
              data[index + 3] = 255; // A
            }
          }
        }
      }
      
      // Remettre les données corrigées
      rectCtx.putImageData(imageData, 0, 0);
      
      // PRÉ-CALCULER SEGMENTS : RIGHT+BOTTOM toujours, TOP+LEFT pour bordures globales
      const segments = {};
      
      // Calculer coordonnées grille pour cette face
      const gridX = face.originalIndex % MESH_U;
      const gridY = Math.floor(face.originalIndex / MESH_U);
      
      try {
        // Calculer largeur/hauteur uniformes pour segments cohérents
        const uniformTileW = Math.floor(texW / MESH_U); // 35px théorique
        const uniformTileH = Math.floor(texH / MESH_V); // 40px théorique
        
        // Segment BOTTOM (horizontal uniforme) - CORRECTION: utiliser srcY au lieu de srcY + srcH - 1
        segments.bottom = mapCanvas.getContext('2d').getImageData(
          Math.max(0, srcX), Math.max(0, srcY),
          srcW, 1  // 🎯 CORRECTION: utiliser srcW réel au lieu de uniformTileW
        );
        
        // Segment RIGHT (vertical uniforme) - toujours calculé
        segments.right = mapCanvas.getContext('2d').getImageData(
          Math.max(0, srcX + srcW - 1), Math.max(0, srcY),
          1, srcH  // 🎯 CORRECTION: utiliser srcH réel au lieu de uniformTileH
        );
        
        // SEGMENTS SUPPLÉMENTAIRES pour bordures globales
        if (gridX === 0) {
          // Bordure LEFT pour colonne X=0 (pas de voisin gauche)
          segments.left = mapCanvas.getContext('2d').getImageData(
            Math.max(0, srcX), Math.max(0, srcY),
            1, srcH  // 🎯 CORRECTION: utiliser srcH réel
          );
        }
        
        if (gridY === 0) {
          // Bordure TOP pour ligne Y=0 (pas de voisin haut)
          segments.top = mapCanvas.getContext('2d').getImageData(
            Math.max(0, srcX), Math.max(0, srcY + srcH - 1),
            srcW, 1  // 🎯 CORRECTION: utiliser srcW réel
          );
        }
        
      } catch (e) {
        // Fallback si erreur - créer segments uniformes
        const uniformTileW = Math.floor(texW / MESH_U);
        const uniformTileH = Math.floor(texH / MESH_V);
        const fallbackDataH = new ImageData(new Uint8ClampedArray(Array(uniformTileW * 4).fill([20, 50, 80, 255]).flat()), uniformTileW, 1);
        const fallbackDataV = new ImageData(new Uint8ClampedArray(Array(uniformTileH * 4).fill([20, 50, 80, 255]).flat()), 1, uniformTileH);
        
        segments.bottom = fallbackDataH;
        segments.right = fallbackDataV;
        if (gridX === 0) segments.left = fallbackDataV;
        if (gridY === 0) segments.top = fallbackDataH;
      }

      rectangles[face.originalIndex] = {
        canvas: rectCanvas,
        width: srcW,
        height: srcH,
        originalIndex: face.originalIndex,
        segments: segments  // 🎯 SEGMENTS 1D PRÉ-CALCULÉS
      };
    } catch (e) {
      rectangles[face.originalIndex] = null;
    }
  });
  
  const validRects = rectangles.filter(r => r !== null && r !== undefined).length;
  const fallbackRects = rectangles.filter(r => r && r.isFallback).length;
  pd('precalculateTextureRectangles', 'main.js', `🟢 ${validRects}/${rectangles.length} rectangles pré-calculés (${fallbackRects} fallbacks 4x4)`);
  
  return rectangles;
}

// RENDU rectangle transformé avec VRAIE TRANSFORMATION PERSPECTIVE (trapèze)
// Basé sur perspective.js - subdivision intelligente pour vrais trapèzes
function drawTransformedRectangle(ctx, rectangle, projectedQuad, faceOriginalIndex = null) {
  if (!rectangle) return false;
  
  // ⚠️ ORDRE CORRIGÉ selon debugVertexOrder(1,8) ⚠️
  const p0 = projectedQuad[0]; // Bottom-left  (UV min,min)
  const p1 = projectedQuad[1]; // Bottom-right (UV max,min)
  const p2 = projectedQuad[2]; // Top-right    (UV max,max)
  const p3 = projectedQuad[3]; // Top-left     (UV min,max)
  
  // DEBUG COORDONNÉES AVEC COULEURS (seulement si mode debug activé)
  // Ce code est maintenant géré par le module 3Diso.js via showColorDebug
  // La fonction drawTransformedRectangle se contente du rendu texture normal
  
  // Éviter les quads trop petits
  const area = Math.abs((p1.x - p0.x) * (p3.y - p0.y) - (p3.x - p0.x) * (p1.y - p0.y));
  if (area < 1) return false;
  
    // Pas d'extension - état propre
  const p0Extended = p0;
  const p1Extended = p1;
  const p2Extended = p2;
  const p3Extended = p3;
  
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
  
  // Plus de debug visuel
  
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
      
      // Interpolation bilinéaire pour les 4 coins du sous-quad (avec points ORIGINAUX)
      const corner00 = bilinearInterpolation(p0, p1, p2, p3, u0, v0);
      const corner10 = bilinearInterpolation(p0, p1, p2, p3, u1, v0);
      const corner11 = bilinearInterpolation(p0, p1, p2, p3, u1, v1);
      const corner01 = bilinearInterpolation(p0, p1, p2, p3, u0, v1);
      
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
  
  // Sauvegarder et appliquer clipping triangle précis
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
  
  if (msg.includes('🟢') || msg.includes('✓')) {
    icon = '🟢'; // Succès
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
  } else if (msg.includes('🔴') || msg.includes('ERREUR') || msg.includes('ERROR')) {
    icon = '🔴'; // Erreur explicite
  } else if (msg.includes('SKIP') || msg.includes('⏸️')) {
    icon = '⏸️'; // Skip/Pause normal
  } else if (msg.includes('STABLE') || msg.includes('MORPHING') || msg.includes('Mode de vue')) {
    icon = '📊'; // Messages d'état
  }
  
  console.log(`${icon} [${func}][${file}] ${msg}`);
}

// DEBUG: Afficher la structure complète du maillage
function showMeshStructure() {
  if (!currentMesh) {
    console.log('🔴 Pas de maillage actuel');
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
  
  console.log('\n🟢 Structure affichée dans la console');
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
  for (let x = 0; x <= MESH_U; x++) {
    for (let y = 0; y <= MESH_V; y++) {
      const u = x / MESH_U; // Paramètre U normalisé [0,1]
      const v = y / MESH_V; // Paramètre V normalisé [0,1]
      
      const point = surfaceFunc(u, v);
      
      // STRUCTURE 2D UNIVERSELLE - Copier TOUJOURS la structure 2D avant projection
      // Toutes les surfaces utilisent la même base UV que 2D (cohérence morphing garantie)
      const gridU = u;      // ⚠️ CORRIGÉ: Pas d'inversion X pour correspondance texture
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
        index: x * (MESH_V + 1) + y
      });
    }
  }
  
  // Génération des faces (quads) - chaque carré = 4 sommets
  for (let x = 0; x < MESH_U; x++) {
    for (let y = 0; y < MESH_V; y++) {
      // Indices des 4 sommets du quad (ORDRE CORRIGÉ pour texture mapping)
      // Ordre cohérent avec grille UV : Bottom-left → Bottom-right → Top-right → Top-left
      const i0 = x * (MESH_V + 1) + y;         // Bottom-left  (u=x/30, v=y/20)
      const i1 = (x + 1) * (MESH_V + 1) + y;   // Bottom-right (u=(x+1)/30, v=y/20)
      const i2 = (x + 1) * (MESH_V + 1) + y + 1; // Top-right    (u=(x+1)/30, v=(y+1)/20)
      const i3 = x * (MESH_V + 1) + y + 1;     // Top-left     (u=x/30, v=(y+1)/20)
      
      faces.push({
        vertices: [i0, i1, i2, i3], // 4 indices DANS L'ORDRE CORRECT
        center: null, // Calculé plus tard
        normal: null, // Calculé plus tard
        avgZ: null,   // Profondeur après rotation
        // Nouvelles propriétés pour faces cachées
        hiddenCorners: 0, // Nombre de coins cachés (0-4)
        visibility: 'visible', // 'visible', 'partial', 'hidden'
        // Index original pour texture mapping stable
        originalIndex: (x % MESH_U) + y * MESH_U,  // CORRIGÉ: (x%30) + y*30
        // COORDONNÉES FIXES DU CENTRE DE LA CASE [x,y] pour mapping texture stable
        textureCenterX: x + 0.5,  // Centre en X de la case (0.5 à 29.5)
        textureCenterY: y + 0.5   // Centre en Y de la case (0.5 à 19.5)
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
  // DEBUG CONFIG INIT
  const configSource = 'config.privilegedAngles';
  const configObj = config.privilegedAngles[newSurfaceName] || null;
  pd('CONFIG', 'main.js', `CONFIG | source: ${configSource} | surface: ${newSurfaceName} | valeurs: ${configObj ? JSON.stringify(configObj) : 'Aucune config trouvée'}`);
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
    window.currentMesh = currentMesh; // Export pour debug.js
  
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
    startAnimation(); // CORRECTION: Redémarrer la boucle d'animation
    pd('morphToSurface', 'main.js', `🔄 Animation démarrée vers ${newSurfaceName}`);
  }
}

// Update animation barycentrique
function updateMorphing() {
  if (!isAnimating || !currentMesh) {
    pd('updateMorphing', 'main.js', `⏸️ SKIP: isAnimating=${isAnimating}, currentMesh=${!!currentMesh}`);
    return;
  }
  
  // DEBUG CONFIG DEST
  if (currentSurface && config.privilegedAngles[currentSurface]) {
    const conf = config.privilegedAngles[currentSurface];
    pd('CONFIG', 'main.js', `CONFIG | DEST | surface: ${currentSurface} | rotX: ${conf.rotX} | rotY: ${conf.rotY} | rotZ: ${conf.rotZ} | scale: ${conf.scale}`);
  }
  
  let convergedCount = 0;
  let totalVertices = currentMesh.vertices.length;
  
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
  
  // Debug morphing progress
  if (Math.random() < 0.1) { // 10% des frames pour éviter spam
    pd('updateMorphing', 'main.js', `🔄 Morphing: ${convergedCount}/${totalVertices} convergés`);
  }
  
  // Arrêter l'animation si tous les sommets ont convergé
  if (convergedCount === currentMesh.vertices.length) {
    isAnimating = false;
    pd('updateMorphing', 'main.js', `🟢 Animation terminée - tous sommets convergés vers ${targetSurface}`);
  }
}

// === SURFACES PARAMÉTRÉES ===
const surfaces = {
  sphere: sphere,
  torus: torus,
  klein: kleinSurface,
  cylinder: cylinder,
  mobius: mobius,
  crosscap: crosscapSurface,
  projective: projective,
  disk: diskSurface,
  plane: plane,
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
  const privileged = config.privilegedAngles[surfaceName];
  return privileged && privileged.scale ? privileged.scale : 150;
}

// === RENDU CANVAS ===
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
// Surface courante déjà déclarée en haut
// Initialisation avec config 2D par défaut
let rotX = config.privilegedAngles[window.currentSurface] ? (config.privilegedAngles[window.currentSurface].rotX * Math.PI) / 180 : 0;
let rotY = config.privilegedAngles[window.currentSurface] ? (config.privilegedAngles[window.currentSurface].rotY * Math.PI) / 180 : 0;
let rotZ = config.privilegedAngles[window.currentSurface] ? (config.privilegedAngles[window.currentSurface].rotZ * Math.PI) / 180 : 0;
let scale = config.privilegedAngles[window.currentSurface] ? config.privilegedAngles[window.currentSurface].scale : 150; // Scale initial 2D
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

  
  // 🎯 CORRECTION: Forcer le rendu après déplacement caméra
  requestAnimationFrame(render);
}

function resetCameraPosition() {
  cameraOffsetX = 0;
  cameraOffsetY = 0;

  
  // 🎯 CORRECTION: Forcer le rendu après reset caméra
  requestAnimationFrame(render);
}

function resetToDefaultConfiguration() {
  // Réinitialiser position caméra
  cameraOffsetX = 0;
  cameraOffsetY = 0;
  
  // Réinitialiser angles et scale selon la config de la surface courante
  if (view2DMode) {
    // Mode 2D : utiliser config view2d
    if (config.privilegedAngles['view2d']) {
      const angles = config.privilegedAngles['view2d'];
      rotX = (angles.rotX * Math.PI) / 180;
      rotY = (angles.rotY * Math.PI) / 180;
      rotZ = (angles.rotZ * Math.PI) / 180;
      scale = angles.scale;
     }
     } else {
    // Mode 3D : utiliser config de la surface courante
    if (config.privilegedAngles[currentSurface]) {
      const angles = config.privilegedAngles[currentSurface];
      rotX = (angles.rotX * Math.PI) / 180;
      rotY = (angles.rotY * Math.PI) / 180;
      rotZ = (angles.rotZ * Math.PI) / 180;
      scale = angles.scale;
    } else {
      // Fallback angles par défaut
      rotX = (config.defaultRotationX * Math.PI) / 180;
      rotY = (config.defaultRotationY * Math.PI) / 180;
      rotZ = 0;
      scale = getOptimalScale(currentSurface);
    }
  }
  
  updateAngleDisplay();
  requestAnimationFrame(render);
  
  pd('resetConfig', 'main.js', `🎯 Configuration réinitialisée pour ${view2DMode ? 'view2d' : currentSurface}`);
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
    for (let x = 0; x < MESH_U; x++) {
      for (let y = 0; y < MESH_V; y++) {
        const cellX = startX + x * cellWidth;
        const cellY = startY + y * cellHeight;
        
                 // Coordonnées UV de cette cellule
         const u = x / MESH_U;
         const v = y / MESH_V;
         
         // Portion de texture correspondante
               const texX = Math.round(u * mapCanvas.width);
      const texY = Math.round(v * mapCanvas.height); // Pas d'inversion Y
         const texW = Math.ceil(mapCanvas.width / MESH_U);
         const texH = Math.ceil(mapCanvas.height / MESH_V);
        
        // Dessiner la portion de texture
        ctx.drawImage(mapCanvas, 
          texX, texY, texW, texH,
          cellX, cellY, cellWidth, cellHeight
        );
      }
    }
  }
  
  // Dessiner les lignes de grille si activées
  if (showGrid) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Lignes verticales
    for (let x = 0; x <= MESH_U; x++) {
      const lineX = startX + x * cellWidth;
      ctx.beginPath();
      ctx.moveTo(lineX, startY);
      ctx.lineTo(lineX, startY + gridHeight);
      ctx.stroke();
    }
    
    // Lignes horizontales
    for (let y = 0; y <= MESH_V; y++) {
      const lineY = startY + y * cellHeight;
      ctx.beginPath();
      ctx.moveTo(startX, lineY);
      ctx.lineTo(startX + gridWidth, lineY);
      ctx.stroke();
    }
  }
  
  // Marquer les 5 points de référence
  const cornerIndices = {
    'TopLeft': {x: 0, y: 0, color: 'red'},
    'TopRight': {x: 0, y: MESH_V, color: 'blue'},
    'BottomLeft': {x: MESH_U, y: 0, color: 'green'},
    'BottomRight': {x: MESH_U, y: MESH_V, color: 'orange'},
    'Center': {x: Math.floor(MESH_U/2), y: Math.floor(MESH_V/2), color: 'purple'}
  };
  
  Object.entries(cornerIndices).forEach(([name, {x, y, color}]) => {
    const pointX = startX + x * cellWidth;
    const pointY = startY + y * cellHeight;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pointX, pointY, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Label
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.fillText(name, pointX + 10, pointY - 10);
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
    window.currentMesh = currentMesh; // Export pour debug.js
  }
  
  // Update animation (seulement si morphing actif)
  if (isAnimating) {
  updateMorphing();
  }
  
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
  
  // Sauvegarder les projectedVertices pour le système de clic
  currentMesh.projectedVertices = projectedVertices;
  
  // Calcul centres et profondeurs des faces
  currentMesh.faces.forEach((face, faceIndex) => {
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
    
    // CORRECTION Z-ORDER : Ajouter petit décalage basé sur l'index pour préserver l'ordre logique
    // Les faces avec index plus élevé sont légèrement plus proches (Z plus grand)
    const zOffset = faceIndex * 0.001; // Très petit décalage pour préserver l'ordre
    face.avgZ = (centerZ / 4) + zOffset;
  });
  
  // Tri des faces par profondeur (painter's algorithm) - RÉACTIVÉ avec Z-order corrigé
  const sortedFaces = currentMesh.faces.sort((a, b) => a.avgZ - b.avgZ);
  // L'ordre logique est préservé grâce au zOffset basé sur faceIndex
  
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
      
      // Récupérer coordonnées X,Y pour cette face
      const gridX = face.originalIndex % MESH_U;             // X (horizontal, 0-29)
      const gridY = Math.floor(face.originalIndex / MESH_U); // Y (vertical, 0-19)
      
      // NOUVELLE APPROCHE: Utiliser getBmp(x,y) pour récupérer la texture
      // Vérifier que les rectangles sont initialisés avant d'appeler getBmp
      const rectangle = textureRectangles ? getBmp(gridX, gridY) : null;
      
      // Mode couleur coordonnées ou texture normale
      let success = false;
      if (showColorDebug) {
        // Mode couleur : affichage couleurs coordonnées sans texte
        success = drawColorGrid(ctx, quadProjected, face.originalIndex);
      } else {
        // Mode normal : texture récupérée via getBmp(x,y)
        success = drawTransformedRectangle(ctx, rectangle, quadProjected, face.originalIndex);
      }
      
      // Affichage coordonnées texte si activé
      if (showCoordinates) {
        const centerX = (quadProjected[0].x + quadProjected[1].x + quadProjected[2].x + quadProjected[3].x) / 4;
        const centerY = (quadProjected[0].y + quadProjected[1].y + quadProjected[2].y + quadProjected[3].y) / 4;
        
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const coordText = `${gridX},${gridY}`;
        // Contour noir pour lisibilité
        ctx.strokeText(coordText, centerX, centerY);
        // Texte blanc par-dessus
        ctx.fillText(coordText, centerX, centerY);
        
        ctx.restore();
      }
      
      // TOUJOURS traiter la grille, même si texture échoue
      {
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
        
        // Grille intelligente : visible si activée, colorée si désactivée (masque gaps)
        if (showGrid) {
          // GRILLE VISIBLE : Contours noirs classiques
          if (Math.random() < 0.01) { // Debug 1% des faces
            pd('renderGrid', 'main.js', `🔲 Rendu grille visible face ${face.originalIndex}`);
          }
          ctx.strokeStyle = 'rgba(0,0,0,0.6)';
          ctx.lineWidth = 1;
          const indices = face.vertices;
        ctx.beginPath();
        ctx.moveTo(projectedVertices[indices[0]].x, projectedVertices[indices[0]].y);
        ctx.lineTo(projectedVertices[indices[1]].x, projectedVertices[indices[1]].y);
        ctx.lineTo(projectedVertices[indices[2]].x, projectedVertices[indices[2]].y);
        ctx.lineTo(projectedVertices[indices[3]].x, projectedVertices[indices[3]].y);
        ctx.closePath();
        ctx.stroke();
        } else {
          // GRILLE COLORÉE : Segments avec couleur moyenne des bords (masque gaps)
          // CORRECTION: Toujours active quand grille désactivée pour masquer gaps
          drawColoredGrid(ctx, face, projectedVertices, rectangle);
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
  
  // Grille supplémentaire si demandée (mode wireframe)
  if (showGrid && !showTexture) {
    pd('renderGridWireframe', 'main.js', `🔲 Rendu grille wireframe: ${sortedFaces.length} faces`);
    sortedFaces.forEach(face => {
      const indices = face.vertices;
      ctx.strokeStyle = 'rgba(255,0,0,0.8)'; // Rouge pour debug wireframe
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(projectedVertices[indices[0]].x, projectedVertices[indices[0]].y);
      ctx.lineTo(projectedVertices[indices[1]].x, projectedVertices[indices[1]].y);
      ctx.lineTo(projectedVertices[indices[2]].x, projectedVertices[indices[2]].y);
      ctx.lineTo(projectedVertices[indices[3]].x, projectedVertices[indices[3]].y);
      ctx.closePath();
      ctx.stroke();
    });
  }
  
  // Debug info supprimé pour voir si boucle persiste
}

// Boucle d'animation avec autostop intelligent
let animationId = null;
let framesSinceLastActivity = 0;
const MAX_IDLE_FRAMES = 60; // 1 seconde à 60fps

function animate() {
  render();
  
  // Compter les frames d'inactivité
  if (isAnimating || isDragging || isInterfaceDragging) {
    framesSinceLastActivity = 0;
  } else {
    framesSinceLastActivity++;
  }
  
  // Continuer l'animation si activité récente
  if (framesSinceLastActivity < MAX_IDLE_FRAMES) {
    animationId = requestAnimationFrame(animate);
  } else {
    // ARRÊT après inactivité prolongée
    animationId = null;
    pd('animate', 'main.js', '⏹️ Animation stoppée après inactivité');
  }
}

// Fonction pour redémarrer l'animation
function startAnimation() {
  if (animationId === null) {
    framesSinceLastActivity = 0;
    pd('startAnimation', 'main.js', '▶️ Animation redémarrée');
    animationId = requestAnimationFrame(animate);
  } else {
    pd('startAnimation', 'main.js', '⚠️ Animation déjà en cours, pas de redémarrage');
  }
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
  
  // CONTRAINTE INTELLIGENTE : Seule la zone de drag doit rester dans le container
  // Calculer la position de la zone de drag
  const dragHandleX = newX + dragOffset.x;
  const dragHandleY = newY + dragOffset.y;
  
  // Contraintes pour que la zone de drag reste dans le container
  const minDragX = dragOffset.x;
  const maxDragX = containerRect.width - dragOffset.x;
  const minDragY = dragOffset.y;
  const maxDragY = containerRect.height - dragOffset.y;
  
  const constrainedDragX = Math.max(minDragX, Math.min(dragHandleX, maxDragX));
  const constrainedDragY = Math.max(minDragY, Math.min(dragHandleY, maxDragY));
  
  // Recalculer la position du panneau depuis la zone de drag contrainte
  const constrainedX = constrainedDragX - dragOffset.x;
  const constrainedY = constrainedDragY - dragOffset.y;
  
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
    
    // CONTRAINTE INTELLIGENTE : Seule la zone de drag doit rester dans le container
    // Calculer la position de la zone de drag
    const dragHandleX = newX + dragOffset.x;
    const dragHandleY = newY + dragOffset.y;
    
    // Contraintes pour que la zone de drag reste dans le container
    const minDragX = dragOffset.x;
    const maxDragX = containerRect.width - dragOffset.x;
    const minDragY = dragOffset.y;
    const maxDragY = containerRect.height - dragOffset.y;
    
    const constrainedDragX = Math.max(minDragX, Math.min(dragHandleX, maxDragX));
    const constrainedDragY = Math.max(minDragY, Math.min(dragHandleY, maxDragY));
    
    // Recalculer la position du panneau depuis la zone de drag contrainte
    const constrainedX = constrainedDragX - dragOffset.x;
    const constrainedY = constrainedDragY - dragOffset.y;
    
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

// Démarrer l'animation initiale
startAnimation();

// === INITIALISATION DYNAMIQUE DES TEXTURES ===
// Remplacer l'IIFE par une fonction globale
async function initializeTextures() {
  await detectAvailableTextures();
  generateTextureInterface();
  loadTexture();
  // Initialiser l'affichage de la projection
  const moveOverlay = document.getElementById('moveOverlay');
  if (moveOverlay) {
    moveOverlay.classList.add('active');
    pd('initTextures', 'main.js', '🔒 Mode 2D par défaut: panneau move grisé');
  }
  pd('initTextures', 'main.js', '🎨 Interface de textures initialisée dynamiquement');
  refreshProjectionTitle(); // Uniquement le titre de projection
}
window.initializeTextures = initializeTextures;

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
window.topologyNames = topologyNames; // 🔗 Correction : exposer sur window

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

// === DEBUG INTÉGRATION TRADUCTIONS ===
(function checkTranslationSystem() {
  if (typeof window.TranslationAPI === 'undefined' || typeof window.TranslationManager === 'undefined') {
    pd('init', 'main.js', '❌ Système de traductions (TranslationAPI/Manager) NON chargé dans window');
  } else {
    pd('init', 'main.js', '✅ Système de traductions détecté dans window');
  }
})();

// === SYSTÈME DE TRADUCTION GLOBAL ===
window.translationAPI = null;
window.translationLoaded = false;
(async function initTranslations() {
  if (window.TranslationAPI) {
    window.translationAPI = new window.TranslationAPI();
    window.translationLoaded = await window.translationAPI.init('trads/translations.csv');
    pd('initTranslations', 'main.js', window.translationLoaded ? '✅ Traductions chargées' : '❌ Échec chargement traductions');
        } else {
    pd('initTranslations', 'main.js', '❌ TranslationAPI non disponible');
  }
})();

/**
 * Met à jour l'affichage compact topologie + texture avec traduction
 * Utilise l'API de traduction si disponible et chargée
 */
function updateProjectionName(mapName) {
  // Utiliser currentTopology comme unique référence
  const mapConfig = availableMaps.find(m => m.name === mapName);
  let textureName = mapConfig ? mapConfig.title : mapName;
  // Capitaliser la première lettre
  if (textureName && typeof textureName === 'string') {
    textureName = textureName.charAt(0).toUpperCase() + textureName.slice(1);
  }
  let currentTopology = topologyNames[currentSurface] || currentSurface;
  // Utiliser une clé de traduction paramétrique UNIQUEMENT pour le template
  let projectionTitle = '';
  if (window.translationAPI && window.translationLoaded) {
    let template = window.translationAPI.manager.get('projectionTitle');
    projectionTitle = template.replace(/%1/g, textureName).replace(/%2/g, currentTopology);
  } else {
    projectionTitle = `${textureName} ${currentTopology}`;
  }
  // Mettre à jour le DOM avec le titre calculé
  const el = document.getElementById('selectedProjection');
  if (el) {
    el.innerText = projectionTitle;
  }
  pd('updateProjection', 'main.js', `📊 Affichage traduit: ${projectionTitle}`);
}

// Boutons radio pour sélection de topologie
document.querySelectorAll('input[name="topology"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.checked) {
      const newValue = e.target.value;
      currentTopology = newValue;
      window.currentTopology = newValue;
      morphToSurface(newValue); // Charge la bonne géométrie/config JS
      refreshProjectionTitle(); // Uniquement le titre de projection
    }
  });
});

// Boutons radio pour sélection de cartes
document.querySelectorAll('input[name="mapChoice"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.checked) {
      const mapName = e.target.value;
      changeTexture(mapName);
    }
  });
});

// Contrôle d'échelle supprimé - utiliser le zoom molette

// Drag rotation toujours activé (plus de contrôle)
dragEnabled = true;

// Gestionnaire pour le bouton grille 🌐 (toggle du checkbox caché)
document.querySelector('label[for="showTexture"], .map-option:has(#showTexture)').addEventListener('click', (e) => {
  e.preventDefault();
  const checkbox = document.getElementById('showTexture');
  checkbox.checked = !checkbox.checked;
  checkbox.dispatchEvent(new Event('change'));
});

document.getElementById('showTexture').addEventListener('change', (e) => {
  showGrid = e.target.checked;
  pd('showGrid', 'main.js', `Lignes de grille: ${showGrid ? 'ACTIVÉES' : 'DÉSACTIVÉES'} - Scale actuel: ${scale.toFixed(1)}`);
  
  // CORRECTION: Forcer recalcul grille colorée quand toggle grille
  if (!showGrid && typeof colorCache !== 'undefined') {
    colorCache.clear(); // Vider cache pour recalcul complet
    pd('gridToggle', 'main.js', '🔄 Cache grille colorée vidé pour recalcul');
  }
  
  render(); // Rendu direct pour voir changement
});

// Gestionnaire pour le bouton couleur 🎨 (toggle du checkbox caché)
document.querySelector('label[for="showColorDebug"], .map-option:has(#showColorDebug)').addEventListener('click', (e) => {
  e.preventDefault();
  const checkbox = document.getElementById('showColorDebug');
  checkbox.checked = !checkbox.checked;
  checkbox.dispatchEvent(new Event('change'));
});

document.getElementById('showColorDebug').addEventListener('change', (e) => {
  showColorDebug = e.target.checked;
  pd('showColorDebug', 'main.js', `Mode couleur coordonnées: ${showColorDebug ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
  render(); // Rendu direct pour voir changement
});

// Gestionnaire pour le bouton coordonnées 📍 (toggle du checkbox caché)
document.querySelector('label[for="showCoordinates"], .map-option:has(#showCoordinates)').addEventListener('click', (e) => {
  e.preventDefault();
  const checkbox = document.getElementById('showCoordinates');
  checkbox.checked = !checkbox.checked;
  checkbox.dispatchEvent(new Event('change'));
});

document.getElementById('showCoordinates').addEventListener('change', (e) => {
  showCoordinates = e.target.checked;
  pd('showCoordinates', 'main.js', `Mode affichage coordonnées: ${showCoordinates ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
  render(); // Rendu direct pour voir changement
});

// Les boutons radio topology gèrent maintenant aussi la vue 2D

// Ancien bouton reinit supprimé - fonction intégrée au bouton 2D

// Les angles sont maintenant affichés en lecture seule (plus d'inputs manuels)

// Boutons fine-tuning rotation X
document.getElementById('rotXLeft').addEventListener('click', () => {
  rotX -= (5 * Math.PI) / 180; // -5°
  updateAngleDisplay();
  requestAnimationFrame(render);
});

document.getElementById('rotXRight').addEventListener('click', () => {
  rotX += (5 * Math.PI) / 180; // +5°
  updateAngleDisplay();
  requestAnimationFrame(render);
});

// Boutons fine-tuning rotation Y
document.getElementById('rotYLeft').addEventListener('click', () => {
  rotY -= (5 * Math.PI) / 180; // -5°
  updateAngleDisplay();
  requestAnimationFrame(render);
});

document.getElementById('rotYRight').addEventListener('click', () => {
  rotY += (5 * Math.PI) / 180; // +5°
  updateAngleDisplay();
  requestAnimationFrame(render);
});

// Boutons fine-tuning rotation Z
document.getElementById('rotZLeft').addEventListener('click', () => {
  rotZ -= (5 * Math.PI) / 180; // -5°
  updateAngleDisplay();
  requestAnimationFrame(render);
});

document.getElementById('rotZRight').addEventListener('click', () => {
  rotZ += (5 * Math.PI) / 180; // +5°
  updateAngleDisplay();
  requestAnimationFrame(render);
});

// Bouton affichage structure supprimé

// === ÉVÉNEMENTS SOURIS ===
canvas.addEventListener('mousedown', (e) => {
  // MODE 2D : Clic pour debug tuile
  if (view2DMode) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Trouver la tuile cliquée
    const tileCoords = findTileAtPosition(clickX, clickY);
    
    if (tileCoords) {
      console.log(`🎯 Clic tuile (${tileCoords.x}, ${tileCoords.y})`);
      if (typeof debugTileClick === 'function') {
        debugTileClick(tileCoords.x, tileCoords.y);
      } else {
        console.error('❌ debugTileClick non disponible');
      }
    }
    return;
  }
  
  // MODE 3D : Drag normal
  if (dragEnabled && !view2DMode) {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
    startAnimation(); // Redémarrer animation pour drag
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

// Zoom avec molette + rendu différé
let wheelTimeout = null;
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const oldScale = scale;
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  scale = Math.max(10, Math.min(500, scale * zoomFactor)); // ScaleMin à 10 !
  // DEBUG SCALE
  const surfaceConf = (typeof window.currentSurface !== 'undefined' && config.privilegedAngles[window.currentSurface]) ? config.privilegedAngles[window.currentSurface] : {};
  pd('zoomWheel', 'main.js', `🔍 Zoom molette | Surface: ${window.currentSurface} | scale=${scale.toFixed(2)} | config.scale=${surfaceConf.scale} | config.defaultRotation=${JSON.stringify(surfaceConf)}`);
  // Annuler le timeout précédent s'il existe
  if (wheelTimeout) {
    clearTimeout(wheelTimeout);
  }
  // Programmer un rendu dans 10ms (oneshot après fin du wheel)
  wheelTimeout = setTimeout(() => {
    render();
    wheelTimeout = null;
  }, 10);
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
document.getElementById('camCenter').addEventListener('click', () => resetToDefaultConfiguration());

// Initialiser l'affichage des angles
updateAngleDisplay();

// Plus besoin d'appeler render() manuellement - animation automatique !

// === FONCTION UTILITAIRE POUR DEBUG CLIC ===

/**
 * Trouve la tuile à une position donnée sur le canvas (mode 2D seulement)
 * @param {number} clickX - Position X du clic sur le canvas
 * @param {number} clickY - Position Y du clic sur le canvas
 * @returns {Object|null} - {x, y} coordonnées de la tuile ou null si non trouvée
 */
function findTileAtPosition(clickX, clickY) {
  if (!view2DMode || !currentMesh || !currentMesh.faces) {
    console.log('❌ Conditions non remplies:', {view2DMode, currentMesh: !!currentMesh, faces: currentMesh?.faces?.length});
    return null;
  }
  
  // EN MODE 2D : Conversion directe coordonnées → grille (plus simple et fiable)
  if (view2DMode) {
    const tileWidth = canvas.width / MESH_U;   // Largeur d'une tuile = 800/30 ≈ 26.67
    const tileHeight = canvas.height / MESH_V; // Hauteur d'une tuile = 450/20 = 22.5
    
    const gridX = Math.floor(clickX / tileWidth);
    const gridY = Math.floor(clickY / tileHeight);
    
    // Vérifier que les coordonnées sont dans les limites
    if (gridX >= 0 && gridX < MESH_U && gridY >= 0 && gridY < MESH_V) {
      const originalIndex = gridX + gridY * MESH_U;
      const face = currentMesh.faces.find(f => f.originalIndex === originalIndex);
      
      return { x: gridX, y: gridY, face: face };
    } else {
      console.log(`❌ Clic hors grille: (${gridX}, ${gridY}) max=(${MESH_U-1}, ${MESH_V-1})`);
      return null;
    }
  }
  
  // MODE 3D : Méthode géométrique (code original conservé mais pas utilisé en 2D)
  console.log(`📊 projectedVertices disponibles:`, !!currentMesh.projectedVertices, currentMesh.projectedVertices?.length);
  
  if (!currentMesh.projectedVertices) {
    console.log('❌ projectedVertices manquants!');
    return null;
  }
  
  let visibleFaces = 0;
  let testedFaces = 0;
  
  // En mode 3D, parcourir toutes les faces visibles et vérifier si le clic est dedans
  for (const face of currentMesh.faces) {
    if (!face.visible) continue;
    visibleFaces++;
    
    const indices = face.vertices;
    const projectedQuad = [
      currentMesh.projectedVertices[indices[0]], // Bottom-left
      currentMesh.projectedVertices[indices[1]], // Bottom-right  
      currentMesh.projectedVertices[indices[2]], // Top-right
      currentMesh.projectedVertices[indices[3]]  // Top-left
    ];
    
    // Vérifier que tous les vertices sont définis
    if (!projectedQuad[0] || !projectedQuad[1] || !projectedQuad[2] || !projectedQuad[3]) {
      if (testedFaces < 3) console.log(`⚠️ Face ${face.originalIndex}: vertices manquants`, projectedQuad);
      continue;
    }
    
    testedFaces++;
    
    // Debug pour les premières faces
    if (testedFaces <= 3) {
      console.log(`🔍 Test face ${face.originalIndex}: quad=`, projectedQuad.map(p => `(${p.x?.toFixed(1)}, ${p.y?.toFixed(1)})`));
    }
    
    // Vérifier si le point de clic est dans ce quadrilatère
    if (isPointInQuad(clickX, clickY, projectedQuad)) {
      // Calculer les coordonnées de grille
      const gridX = face.originalIndex % MESH_U;
      const gridY = Math.floor(face.originalIndex / MESH_U);
      
      console.log(`✅ Tuile trouvée: (${gridX}, ${gridY}) face=${face.originalIndex}`);
      return { x: gridX, y: gridY, face: face };
    }
  }
  
  console.log(`❌ Aucune tuile trouvée. Faces visibles: ${visibleFaces}, testées: ${testedFaces}`);
  return null;
}

/**
 * Vérifie si un point est dans un quadrilatère
 * @param {number} px - X du point
 * @param {number} py - Y du point  
 * @param {Array} quad - Array de 4 points {x, y}
 * @returns {boolean}
 */
function isPointInQuad(px, py, quad) {
  // Utiliser la méthode du ray casting pour chaque triangle du quad
  // Diviser le quad en 2 triangles et tester chacun
  
  // Triangle 1: p0, p1, p2
  if (isPointInTriangle(px, py, quad[0], quad[1], quad[2])) {
    return true;
  }
  
  // Triangle 2: p0, p2, p3  
  if (isPointInTriangle(px, py, quad[0], quad[2], quad[3])) {
    return true;
  }
  
  return false;
}

/**
 * Vérifie si un point est dans un triangle
 * @param {number} px - X du point
 * @param {number} py - Y du point
 * @param {Object} p1 - Point 1 {x, y}
 * @param {Object} p2 - Point 2 {x, y}
 * @param {Object} p3 - Point 3 {x, y}
 * @returns {boolean}
 */
function isPointInTriangle(px, py, p1, p2, p3) {
  // Méthode des coordonnées barycentriques
  const denom = (p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y);
  if (Math.abs(denom) < 0.001) return false; // Triangle dégénéré
  
  const a = ((p2.y - p3.y) * (px - p3.x) + (p3.x - p2.x) * (py - p3.y)) / denom;
  const b = ((p3.y - p1.y) * (px - p3.x) + (p1.x - p3.x) * (py - p3.y)) / denom;
  const c = 1 - a - b;
  
  return a >= 0 && b >= 0 && c >= 0;
}

 

// 🔍 DEBUG Z-FIGHTING : compter les chevauchements
function debugOverlaps() {
  console.log('=== DEBUG OVERLAPS ===');
  
  if (!textureRectangles || textureRectangles.length === 0) {
    console.log('🔴 Pas de textureRectangles disponibles');
    return;
  }
  
  // D'abord, analyser la structure des rectangles
  console.log('🔍 Structure du premier rectangle:');
  console.log(textureRectangles[0]);
  console.log('🔍 Clés disponibles:', Object.keys(textureRectangles[0]));
  
  // Si on a au moins 2 rectangles, analyser les chevauchements
  if (textureRectangles.length < 2) {
    console.log('🔴 Pas assez de rectangles pour tester les chevauchements');
    return;
  }
  
  let overlaps = 0;
  let totalChecks = 0;
  
  for (let i = 0; i < Math.min(10, textureRectangles.length); i++) { // Limiter à 10 pour debug
    for (let j = i + 1; j < Math.min(10, textureRectangles.length); j++) {
      const rect1 = textureRectangles[i];
      const rect2 = textureRectangles[j];
      
      // Check si les rectangles se chevauchent
      try {
        if (rectsOverlap(rect1, rect2)) {
          overlaps++;
          if (overlaps <= 3) { // Afficher seulement les 3 premiers
            console.log(`🔍 Overlap ${overlaps}: Face ${rect1.originalIndex || i} vs ${rect2.originalIndex || j}`);
          }
        }
      } catch (e) {
        console.log(`🔴 Erreur lors de la comparaison ${i} vs ${j}:`, e.message);
        return; // Arrêter si erreur
      }
      totalChecks++;
    }
  }
  
  console.log(`🔍 Chevauchements détectés: ${overlaps}/${totalChecks} (échantillon)`);
  if (totalChecks > 0) {
    console.log(`📊 Pourcentage: ${(overlaps/totalChecks*100).toFixed(2)}%`);
  }
}

function rectsOverlap(rect1, rect2) {
  // Simple bounding box overlap check
  const r1 = getBoundingBox(rect1);
  const r2 = getBoundingBox(rect2);
  
  return !(r1.right < r2.left || 
           r2.right < r1.left || 
           r1.bottom < r2.top || 
           r2.bottom < r1.top);
}

function getBoundingBox(rect) {
  // Adapter selon la vraie structure des rectangles
  let xs, ys;
  
  if (rect.p0 && rect.p1 && rect.p2 && rect.p3) {
    // Structure attendue avec p0, p1, p2, p3
    xs = [rect.p0.x, rect.p1.x, rect.p2.x, rect.p3.x];
    ys = [rect.p0.y, rect.p1.y, rect.p2.y, rect.p3.y];
  } else if (rect.screenQuad) {
    // Structure alternative avec screenQuad
    const sq = rect.screenQuad;
    xs = [sq.p0.x, sq.p1.x, sq.p2.x, sq.p3.x];
    ys = [sq.p0.y, sq.p1.y, sq.p2.y, sq.p3.y];
  } else {
    // Structure inconnue - essayer de détecter
    console.log('🔴 Structure rectangle inconnue:', Object.keys(rect));
    throw new Error('Structure rectangle non supportée');
  }
  
  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys)
  };
}

// Exposer la fonction pour test dans console
window.debugOverlaps = debugOverlaps;

// 🎨 GRILLE COLORÉE - moyenne des couleurs des bords communs entre tuiles
function drawColoredGrid(ctx, face, projectedVertices, rectangle) {
  // DEBUG: Analyser le problème avant de retourner
  const MESH_U = 30;
  const MESH_V = 20;
  const gridU = face.originalIndex % MESH_U;
  const gridV = Math.floor(face.originalIndex / MESH_U);
  
  // DEBUG NETTOYÉ - RIEN
  
  if (!rectangle || !rectangle.canvas) return;
  
  const indices = face.vertices;
  
  // CORRECTION: Pas de throttling - tous les segments doivent être calculés pour masquer gaps
  // (L'optimisation se fera par cache des couleurs dans sampleTextureColor)
  
  ctx.lineWidth = 1; // Épaisseur fine pour masquer gaps
  
  // Dessiner SEULEMENT bord DROITE et BAS pour éviter doublons et conflits
  // ⚠️ ORDRE CORRIGÉ selon debugVertexOrder(1,8) ⚠️
  const points = [
    projectedVertices[indices[0]], // Bottom-left  (P0)
    projectedVertices[indices[1]], // Bottom-right (P1)
    projectedVertices[indices[2]], // Top-right    (P2)
    projectedVertices[indices[3]]  // Top-left     (P3)
  ];
  
  // Segment RIGHT (entre bottom-right et top-right)
  if (gridU < MESH_U - 1) { // Pas le bord droit global
    const neighborRect = getNeighborRect(gridU + 1, gridV);
    if (neighborRect && neighborRect.canvas) {
      // Utiliser directement le segment pré-calculé au lieu de la couleur moyennée
      const segmentData = rectangle.segments ? rectangle.segments.right : null;
      drawColoredSegment(ctx, points[1], points[2], segmentData);
    }
  }
  
  // Segment BOTTOM (entre bottom-left et bottom-right)  
  if (gridV < MESH_V - 1) { // Pas le bord inférieur global
    const neighborRect = getNeighborRect(gridU, gridV + 1);
    if (neighborRect && neighborRect.canvas) {
      // Utiliser directement le segment pré-calculé au lieu de la couleur moyennée
      const segmentData = rectangle.segments ? rectangle.segments.bottom : null;
      drawColoredSegment(ctx, points[0], points[1], segmentData);
    }
  }
  
  // 🎯 SEGMENTS DE BORDURE GLOBALE - dessiner même sans voisin
  
  // Segment RIGHT pour dernière colonne (X=29)
  if (gridU === MESH_U - 1 && rectangle.segments && rectangle.segments.right) {
    drawColoredSegment(ctx, points[1], points[2], rectangle.segments.right);
  }
  
  // Segment BOTTOM pour dernière ligne (Y=19)  
  if (gridV === MESH_V - 1 && rectangle.segments && rectangle.segments.bottom) {
    drawColoredSegment(ctx, points[0], points[1], rectangle.segments.bottom);
  }
  
  // SEGMENTS SUPPLÉMENTAIRES pour bordures globales
  
  // Segment LEFT (entre top-left et bottom-left) - seulement pour colonne X=0
  if (gridU === 0 && rectangle.segments && rectangle.segments.left) {
    drawColoredSegment(ctx, points[3], points[0], rectangle.segments.left);
  }
  
  // Segment TOP (entre top-left et top-right) - seulement pour ligne Y=0  
  if (gridV === 0 && rectangle.segments && rectangle.segments.top) {
    drawColoredSegment(ctx, points[3], points[2], rectangle.segments.top);
  }
}

// Cache des couleurs pour éviter getImageData répétés
const colorCache = new Map();

// Échantillonner couleur d'une texture à une position UV
function sampleTextureColor(canvas, u, v) {
  // Clé de cache unique par canvas et position
  const cacheKey = `${canvas.width}x${canvas.height}_${u.toFixed(2)}_${v.toFixed(2)}`;
  
  if (colorCache.has(cacheKey)) {
    return colorCache.get(cacheKey);
  }
  
  // Optimiser le contexte pour lectures fréquentes
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const x = Math.floor(u * canvas.width);
  const y = Math.floor(v * canvas.height);
  
  try {
    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b, a] = imageData.data;
    
    // DEBUG NETTOYÉ - RIEN
    
    const color = { r, g, b, a: a / 255 };
    
    // Cache le résultat
    colorCache.set(cacheKey, color);
    return color;
  } catch (e) {
    // Fallback si erreur d'accès
    const fallback = { r: 128, g: 128, b: 128, a: 1 };
    colorCache.set(cacheKey, fallback);
    return fallback;
  }
}

// Obtenir rectangle d'une tuile voisine
function getNeighborRect(gridU, gridV) {
  if (!textureRectangles) return null;
  
  const MESH_U = 30;
  const neighborIndex = gridV * MESH_U + gridU;
  
  if (neighborIndex >= 0 && neighborIndex < textureRectangles.length) {
    return textureRectangles[neighborIndex];
  }
  
  return null;
}

// Échantillonner couleurs le long du bord commun entre deux tuiles
function sampleBorderColors(canvas1, rectangle2, borderSide) {
  if (!textureRectangles) {
    return { r: 128, g: 128, b: 128, a: 1 };
  }
  
  // OPTIMISATION: Utiliser les segments 1D pré-calculés !
  // Récupérer l'index de la tuile actuelle depuis canvas1
  let currentTileIndex = -1;
  for (let i = 0; i < textureRectangles.length; i++) {
    if (textureRectangles[i] && textureRectangles[i].canvas === canvas1) {
      currentTileIndex = i;
      break;
    }
  }
  
  if (currentTileIndex === -1 || !textureRectangles[currentTileIndex]) {
    return { r: 128, g: 128, b: 128, a: 1 };
  }
  
  const rectangle = textureRectangles[currentTileIndex];
  
  // Vérifier que les segments sont disponibles
  if (!rectangle.segments) {
    return { r: 128, g: 128, b: 128, a: 1 };
  }
  
  // Récupérer le segment pré-calculé selon borderSide
  let segmentData;
  
  switch (borderSide) {
    case 'bottom':
      segmentData = rectangle.segments.bottom;
      break;
    case 'right':
      segmentData = rectangle.segments.right;
      break;
    case 'top':
      segmentData = rectangle.segments.top;
      break;
    case 'left':
      segmentData = rectangle.segments.left;
      break;
    default:
      // Fallback: utiliser segment top
      segmentData = rectangle.segments.top;
  }
  
  if (!segmentData || !segmentData.data) {
    return { r: 128, g: 128, b: 128, a: 1 };
  }
  
  // Moyenner tous les pixels du segment pré-calculé
  const data = segmentData.data;
  const pixelCount = data.length / 4;
  let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
    totalA += data[i + 3];
  }
  
  return {
    r: Math.round(totalR / pixelCount),
    g: Math.round(totalG / pixelCount),
    b: Math.round(totalB / pixelCount),
    a: (totalA / pixelCount) / 255
  };
}

// Moyenne de deux couleurs
function averageColors(color1, color2) {
  return {
    r: Math.round((color1.r + color2.r) / 2),
    g: Math.round((color1.g + color2.g) / 2),
    b: Math.round((color1.b + color2.b) / 2),
    a: (color1.a + color2.a) / 2
  };
}

// Dessiner un segment avec une couleur spécifique
function drawColoredSegment(ctx, point1, point2, segmentImageData) {
  // Si pas de données de segment, fallback vers ligne colorée simple
  if (!segmentImageData || !segmentImageData.data) {
    ctx.strokeStyle = 'rgba(128,128,128,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(point1.x, point1.y);
    ctx.lineTo(point2.x, point2.y);
    ctx.stroke();
    return;
  }
  
  // Calculer la longueur et direction du segment
  const deltaX = point2.x - point1.x;
  const deltaY = point2.y - point1.y;
  const segmentLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  if (segmentLength < 1) return; // Segment trop petit
  
  // Déterminer si c'est un segment horizontal ou vertical selon les données
  const data = segmentImageData.data;
  const pixelCount = data.length / 4;
  const isHorizontal = segmentImageData.width > segmentImageData.height;
  
  // Configuration ligne épaisse comme la grille normale
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  
  // Parcourir le segment pixel par pixel et copier les couleurs correspondantes
  const steps = Math.max(1, Math.floor(segmentLength));
  
  for (let step = 0; step < steps; step++) {
    // Position le long du segment (0 à 1)
    const t = step / Math.max(1, steps - 1);
    
    // Coordonnées du pixel actuel sur le canvas
    const currentX = Math.round(point1.x + t * deltaX);
    const currentY = Math.round(point1.y + t * deltaY);
    
    // Index dans les données du segment (mapping linéaire)
    const segmentIndex = Math.floor(t * (pixelCount - 1));
    const pixelIndex = segmentIndex * 4;
    
    // Vérifier que l'index est valide
    if (pixelIndex >= 0 && pixelIndex < data.length - 3) {
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      const a = data[pixelIndex + 3] / 255;
      
      // Dessiner avec stroke épais au lieu de fillRect 1x1
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(currentX + 0.5, currentY + 0.5); // Micro-segment pour activer stroke
      ctx.stroke();
    }
  }
  
  // Restaurer lineWidth par défaut
  ctx.lineWidth = 1;
}

// DEBUG: Fonction pour forcer le recalcul des rectangles (accessible depuis console)
window.forceRecalculateRectangles = function() {
  textureRectangles = null;
  pd('forceRecalculate', 'main.js', `🔧 FORCE RECALCUL: Cache rectangles vidé, prochaine render() recalculera`);
  render();
};

// DEBUG: Fonction pour activer debug sur tuile océan
window.debugOceanTile = function() {
  window.debugCurrentTile = true;
  pd('debugOcean', 'main.js', `🌊 DEBUG OCÉAN ACTIVÉ: Prochaine désactivation grille montrera détails tuile (1,9)`);
};

// DEBUG: Analyser la texture pour détecter pixels transparents
window.analyzeTextureTransparency = function() {
  if (!mapCanvas) {
    console.log('❌ Aucune texture chargée');
    return;
  }
  
  const ctx = mapCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, mapCanvas.width, mapCanvas.height);
  const data = imageData.data;
  
  let transparentPixels = 0;
  let semiTransparentPixels = 0;
  let totalPixels = mapCanvas.width * mapCanvas.height;
  
  // Analyser quelques zones océan spécifiques
  const oceanSamples = [];
  const oceanZones = [
    { name: 'Atlantique Nord', x: 0.1, y: 0.3 },
    { name: 'Pacifique', x: 0.8, y: 0.5 },
    { name: 'Océan Indien', x: 0.6, y: 0.7 },
    { name: 'Zone problématique (1,9)', x: 1/30, y: 9/20 }
  ];
  
  oceanZones.forEach(zone => {
    const pixelX = Math.floor(zone.x * mapCanvas.width);
    const pixelY = Math.floor(zone.y * mapCanvas.height);
    const pixelIndex = (pixelY * mapCanvas.width + pixelX) * 4;
    
    const r = data[pixelIndex];
    const g = data[pixelIndex + 1];
    const b = data[pixelIndex + 2];
    const a = data[pixelIndex + 3];
    
    oceanSamples.push({
      zone: zone.name,
      coords: `(${pixelX},${pixelY})`,
      color: `rgba(${r},${g},${b},${a})`
    });
  });
  
  // Compter pixels transparents globalement
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] === 0) transparentPixels++;
    else if (data[i] < 255) semiTransparentPixels++;
  }
  
  console.log(`🔍 ANALYSE TRANSPARENCE TEXTURE "${currentMapName}":`);
  console.log(`📊 Total pixels: ${totalPixels.toLocaleString()}`);
  console.log(`🕳️ Pixels transparents (alpha=0): ${transparentPixels.toLocaleString()} (${(transparentPixels/totalPixels*100).toFixed(2)}%)`);
  console.log(`👻 Pixels semi-transparents (0<alpha<255): ${semiTransparentPixels.toLocaleString()} (${(semiTransparentPixels/totalPixels*100).toFixed(2)}%)`);
  console.log(`🌊 Échantillons océan:`);
  oceanSamples.forEach(sample => {
    console.log(`   ${sample.zone}: ${sample.coords} → ${sample.color}`);
  });
  
  if (transparentPixels > 0) {
    console.log(`⚠️ PROBLÈME DÉTECTÉ: La texture contient ${transparentPixels.toLocaleString()} pixels transparents !`);
    console.log(`💡 SOLUTION: Remplacer les pixels transparents par du bleu océan`);
  }
};

// DEBUG: Corriger les pixels transparents de la texture
window.fixTransparentPixels = function() {
  if (!mapCanvas) {
    console.log('❌ Aucune texture chargée');
    return;
  }
  
  const ctx = mapCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, mapCanvas.width, mapCanvas.height);
  const data = imageData.data;
  
  let fixedPixels = 0;
  const oceanBlue = [20, 50, 80, 255]; // RGBA bleu océan
  
  // Remplacer tous les pixels transparents par du bleu océan
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) { // Alpha = 0 (transparent)
      data[i] = oceanBlue[0];     // R
      data[i + 1] = oceanBlue[1]; // G
      data[i + 2] = oceanBlue[2]; // B
      data[i + 3] = oceanBlue[3]; // A
      fixedPixels++;
    }
  }
  
  // Appliquer les corrections à la texture
  ctx.putImageData(imageData, 0, 0);
  
  // Forcer recalcul des rectangles avec texture corrigée
  textureRectangles = null;
  
  console.log(`🔧 CORRECTION APPLIQUÉE:`);
  console.log(`   ${fixedPixels.toLocaleString()} pixels transparents → bleu océan`);
  console.log(`   Cache rectangles vidé pour recalcul`);
  console.log(`   Testez maintenant la grille colorée !`);
  
  // Re-render avec texture corrigée
  render();
};

// === DEBUG SPÉCIFIQUE TUILE ===

/**
 * Debug des couleurs de bord pour une tuile spécifique et ses voisines
 * @param {number} targetX - Coordonnée X de la tuile à analyser
 * @param {number} targetY - Coordonnée Y de la tuile à analyser
 * @param {string} borderSide - Côté à analyser ('right', 'left', 'top', 'bottom')
 */
function debugTileBorderColors(targetX, targetY, borderSide = 'right') {
  if (!textureRectangles) {
    pd('debugTileBorderColors', 'main.js', '❌ textureRectangles non initialisé');
    return;
  }
  
  // Récupérer la tuile cible
  const targetRect = getBmp(targetX, targetY);
  if (!targetRect) {
    pd('debugTileBorderColors', 'main.js', `❌ Tuile (${targetX},${targetY}) introuvable`);
    return;
  }
  
  // Calculer coordonnées de la tuile voisine selon le côté
  let neighborX = targetX;
  let neighborY = targetY;
  
  switch (borderSide) {
    case 'right':
      neighborX = targetX + 1;
      break;
    case 'left':
      neighborX = targetX - 1;
      break;
    case 'top':
      neighborY = targetY - 1;
      break;
    case 'bottom':
      neighborY = targetY + 1;
      break;
  }
  
  // Récupérer la tuile voisine (avec wrap-around pour X)
  const neighborRect = getBmp(neighborX, neighborY);
  
  pd('debugTileBorderColors', 'main.js', `🔍 ANALYSE BORD ${borderSide.toUpperCase()} - Tuile (${targetX},${targetY}) vs Voisine (${neighborX},${neighborY})`);
  pd('debugTileBorderColors', 'main.js', `📦 Tuile cible: ${targetRect.width}x${targetRect.height} | Voisine: ${neighborRect ? `${neighborRect.width}x${neighborRect.height}` : 'NULL'}`);
  
  // Analyser les couleurs du bord de la tuile cible
  const targetColors = sampleBorderPixels(targetRect, borderSide, 5);
  pd('debugTileBorderColors', 'main.js', `🎨 COULEURS BORD ${borderSide.toUpperCase()} tuile (${targetX},${targetY}):`);
  targetColors.forEach((color, i) => {
    pd('debugTileBorderColors', 'main.js', `   [${i}] rgba(${color.r},${color.g},${color.b},${color.a})`);
  });
  
  // Analyser les couleurs du bord correspondant de la tuile voisine
  if (neighborRect) {
    const oppositeSide = getOppositeBorderSide(borderSide);
    const neighborColors = sampleBorderPixels(neighborRect, oppositeSide, 5);
    pd('debugTileBorderColors', 'main.js', `🎨 COULEURS BORD ${oppositeSide.toUpperCase()} voisine (${neighborX},${neighborY}):`);
    neighborColors.forEach((color, i) => {
      pd('debugTileBorderColors', 'main.js', `   [${i}] rgba(${color.r},${color.g},${color.b},${color.a})`);
    });
    
    // Calculer différences de couleur
    pd('debugTileBorderColors', 'main.js', `📊 DIFFÉRENCES DE COULEUR:`);
    targetColors.forEach((targetColor, i) => {
      if (i < neighborColors.length) {
        const neighborColor = neighborColors[i];
        const deltaR = Math.abs(targetColor.r - neighborColor.r);
        const deltaG = Math.abs(targetColor.g - neighborColor.g);
        const deltaB = Math.abs(targetColor.b - neighborColor.b);
        const totalDelta = deltaR + deltaG + deltaB;
        pd('debugTileBorderColors', 'main.js', `   [${i}] ΔR=${deltaR}, ΔG=${deltaG}, ΔB=${deltaB} | Total=${totalDelta}`);
      }
    });
  } else {
    pd('debugTileBorderColors', 'main.js', `⚠️ Voisine (${neighborX},${neighborY}) introuvable`);
  }
}

/**
 * Échantillonne les pixels d'un bord spécifique d'un rectangle
 * @param {Object} rectangle - Rectangle de texture avec canvas
 * @param {string} borderSide - Côté ('right', 'left', 'top', 'bottom')
 * @param {number} sampleCount - Nombre d'échantillons à prendre
 * @returns {Array} - Tableau de couleurs {r, g, b, a}
 */
function sampleBorderPixels(rectangle, borderSide, sampleCount = 5) {
  if (!rectangle || !rectangle.canvas) return [];
  
  const canvas = rectangle.canvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const width = canvas.width;
  const height = canvas.height;
  
  const colors = [];
  
  for (let i = 0; i < sampleCount; i++) {
    let x, y;
    
    switch (borderSide) {
      case 'right':
        x = width - 1; // Bord droit
        y = Math.round((i / (sampleCount - 1)) * (height - 1));
        break;
      case 'left':
        x = 0; // Bord gauche
        y = Math.round((i / (sampleCount - 1)) * (height - 1));
        break;
      case 'top':
        x = Math.round((i / (sampleCount - 1)) * (width - 1));
        y = 0; // Bord haut
        break;
      case 'bottom':
        x = Math.round((i / (sampleCount - 1)) * (width - 1));
        y = height - 1; // Bord bas
        break;
    }
    
    try {
      const imageData = ctx.getImageData(x, y, 1, 1);
      const [r, g, b, a] = imageData.data;
      colors.push({ r, g, b, a });
    } catch (e) {
      colors.push({ r: 0, g: 0, b: 0, a: 0 });
    }
  }
  
  return colors;
}

/**
 * Retourne le côté opposé d'un bord
 * @param {string} borderSide - Côté original
 * @returns {string} - Côté opposé
 */
function getOppositeBorderSide(borderSide) {
  const opposites = {
    'right': 'left',
    'left': 'right',
    'top': 'bottom',
    'bottom': 'top'
  };
  return opposites[borderSide] || borderSide;
}

// === FIN DEBUG SPÉCIFIQUE TUILE ===

// Exposer la fonction de debug globalement pour utilisation en console
window.debugTileBorderColors = debugTileBorderColors;

// Debug automatique de la tuile (1,8) bord droit au démarrage
// Debug supprimé pour éviter boucle infinie

// === DEBUG RENDU SPÉCIFIQUE TUILE ===

/**
 * Debug le rendu d'une tuile spécifique pour détecter les problèmes d'affichage
 * @param {number} targetX - Coordonnée X de la tuile
 * @param {number} targetY - Coordonnée Y de la tuile  
 */
function debugTileRendering(targetX, targetY) {
  if (!currentMesh || !textureRectangles) {
    pd('debugTileRendering', 'main.js', '❌ Mesh ou rectangles non initialisés');
    return;
  }
  
  // Trouver la face correspondante
  const targetOriginalIndex = targetX + targetY * MESH_U;
  const targetFace = currentMesh.faces.find(face => face.originalIndex === targetOriginalIndex);
  
  if (!targetFace) {
    pd('debugTileRendering', 'main.js', `❌ Face (${targetX},${targetY}) introuvable, originalIndex=${targetOriginalIndex}`);
    return;
  }
  
  pd('debugTileRendering', 'main.js', `🔍 === DEBUG RENDU TUILE (${targetX},${targetY}) ===`);
  pd('debugTileRendering', 'main.js', `📍 Face trouvée: originalIndex=${targetFace.originalIndex}`);
  pd('debugTileRendering', 'main.js', `📍 Vertices indices: [${targetFace.vertices.join(', ')}]`);
  
  // Vérifier le rectangle de texture
  const rectangle = getBmp(targetX, targetY);
  pd('debugTileRendering', 'main.js', `📦 Rectangle texture: ${rectangle ? `${rectangle.width}x${rectangle.height}` : 'NULL'}`);
  
  if (rectangle) {
    // Analyser le contenu du rectangle
    const canvas = rectangle.canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Échantillonner quelques pixels pour vérifier le contenu
    const samples = [];
    for (let i = 0; i < 5; i++) {
      const x = Math.floor((i / 4) * (canvas.width - 1));
      const y = Math.floor(canvas.height / 2); // Milieu en Y
      
      try {
        const imageData = ctx.getImageData(x, y, 1, 1);
        const [r, g, b, a] = imageData.data;
        samples.push({ x, y, r, g, b, a });
      } catch (e) {
        samples.push({ x, y, r: 0, g: 0, b: 0, a: 0 });
      }
    }
    
    pd('debugTileRendering', 'main.js', `🎨 Échantillons rectangle (ligne milieu):`);
    samples.forEach((sample, i) => {
      const isWhite = sample.r > 240 && sample.g > 240 && sample.b > 240;
      const warning = isWhite ? ' ⚠️ BLANC!' : '';
      pd('debugTileRendering', 'main.js', `   [${i}] (${sample.x},${sample.y}): rgba(${sample.r},${sample.g},${sample.b},${sample.a})${warning}`);
    });
  }
  
  // Vérifier les coordonnées UV des vertices
  pd('debugTileRendering', 'main.js', `🗺️ Coordonnées UV des vertices:`);
  targetFace.vertices.forEach((vertexIndex, i) => {
    const vertex = currentMesh.vertices[vertexIndex];
    pd('debugTileRendering', 'main.js', `   V${i}: gridU=${vertex.gridU.toFixed(3)}, gridV=${vertex.gridV.toFixed(3)}, u=${vertex.u.toFixed(3)}, v=${vertex.v.toFixed(3)}`);
  });
  
  // Vérifier si la face est visible
  pd('debugTileRendering', 'main.js', `👁️ Visibilité face: ${targetFace.visibility}, hiddenCorners=${targetFace.hiddenCorners}`);
  
  pd('debugTileRendering', 'main.js', `=== FIN DEBUG RENDU TUILE (${targetX},${targetY}) ===`);
}

// Exposer globalement
window.debugTileRendering = debugTileRendering;

// Debug automatique de la tuile (1,8) problématique - DÉSACTIVÉ
// setTimeout(() => {
//   if (currentMesh && textureRectangles) {
//     console.log('\n🚨 === DEBUG TUILE BLANCHE (1,8) ===');
//     debugTileRendering(1, 8);
//     console.log('=== FIN DEBUG TUILE BLANCHE ===\n');
//   }
// }, 4000);

// === FIN DEBUG RENDU SPÉCIFIQUE ===

/**
 * Debug complet du contenu d'une tuile (centre + bords + coins)
 * @param {number} targetX - Coordonnée X de la tuile
 * @param {number} targetY - Coordonnée Y de la tuile
 */
function debugTileContent(targetX, targetY) {
  const rectangle = getBmp(targetX, targetY);
  if (!rectangle || !rectangle.canvas) {
    pd('debugTileContent', 'main.js', `❌ Rectangle (${targetX},${targetY}) introuvable`);
    return;
  }
  
  const canvas = rectangle.canvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const width = canvas.width;
  const height = canvas.height;
  
  pd('debugTileContent', 'main.js', `🔍 === CONTENU COMPLET TUILE (${targetX},${targetY}) ${width}x${height} ===`);
  
  // Échantillonner différentes zones
  const zones = [
    { name: 'Centre', x: Math.floor(width/2), y: Math.floor(height/2) },
    { name: 'Coin TL', x: 0, y: 0 },
    { name: 'Coin TR', x: width-1, y: 0 },
    { name: 'Coin BL', x: 0, y: height-1 },
    { name: 'Coin BR', x: width-1, y: height-1 },
    { name: 'Bord L', x: 0, y: Math.floor(height/2) },
    { name: 'Bord R', x: width-1, y: Math.floor(height/2) },
    { name: 'Bord T', x: Math.floor(width/2), y: 0 },
    { name: 'Bord B', x: Math.floor(width/2), y: height-1 }
  ];
  
  zones.forEach(zone => {
    try {
      const imageData = ctx.getImageData(zone.x, zone.y, 1, 1);
      const [r, g, b, a] = imageData.data;
      
      // Détecter les couleurs problématiques
      const isWhite = r > 240 && g > 240 && b > 240;
      const isBeige = r > 200 && g > 180 && b > 150 && r > g && g > b;
      const isOcean = r < 50 && g > 40 && b > 30 && g > r;
      
      let type = '';
      if (isWhite) type = ' ⚠️ BLANC!';
      else if (isBeige) type = ' 🏖️ BEIGE';
      else if (isOcean) type = ' 🌊 OCÉAN';
      
      pd('debugTileContent', 'main.js', `   ${zone.name.padEnd(8)}: rgba(${r},${g},${b},${a})${type}`);
    } catch (e) {
      pd('debugTileContent', 'main.js', `   ${zone.name.padEnd(8)}: ERREUR`);
    }
  });
  
  // Statistiques globales
  let whitePixels = 0, beigePixels = 0, oceanPixels = 0, totalPixels = 0;
  
  try {
    const fullData = ctx.getImageData(0, 0, width, height);
    const data = fullData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      totalPixels++;
      
      if (r > 240 && g > 240 && b > 240) whitePixels++;
      else if (r > 200 && g > 180 && b > 150 && r > g && g > b) beigePixels++;
      else if (r < 50 && g > 40 && b > 30 && g > r) oceanPixels++;
    }
    
    const whitePercent = ((whitePixels / totalPixels) * 100).toFixed(1);
    const beigePercent = ((beigePixels / totalPixels) * 100).toFixed(1);
    const oceanPercent = ((oceanPixels / totalPixels) * 100).toFixed(1);
    
    pd('debugTileContent', 'main.js', `📊 STATISTIQUES:`);
    pd('debugTileContent', 'main.js', `   🌊 Océan: ${oceanPercent}% (${oceanPixels}/${totalPixels})`);
    pd('debugTileContent', 'main.js', `   🏖️ Beige: ${beigePercent}% (${beigePixels}/${totalPixels})`);
    pd('debugTileContent', 'main.js', `   ⚠️ Blanc: ${whitePercent}% (${whitePixels}/${totalPixels})`);
    
    if (whitePixels > totalPixels * 0.1) {
      pd('debugTileContent', 'main.js', `🚨 ALERTE: ${whitePercent}% de pixels blancs détectés!`);
    }
  } catch (e) {
    pd('debugTileContent', 'main.js', `❌ Erreur analyse globale: ${e.message}`);
  }
  
  pd('debugTileContent', 'main.js', `=== FIN CONTENU TUILE (${targetX},${targetY}) ===`);
}

// Exposer globalement
window.debugTileContent = debugTileContent;

// Debug automatique du contenu de (1,8) - DÉSACTIVÉ
// setTimeout(() => {
//   if (textureRectangles) {
//     console.log('\n🔍 === ANALYSE CONTENU TUILE (1,8) ===');
//     debugTileContent(1, 8);
//     console.log('=== FIN ANALYSE CONTENU ===\n');
//   }
// }, 5000);

// === DEBUG: Analyser les transformations matricielles ===
function debugTileMatrixTransforms(gridX, gridY) {
  if (!currentMesh || !textureRectangles) {
    console.log('❌ Mesh ou rectangles non initialisés');
    return;
  }
  
  const originalIndex = gridX + gridY * MESH_U;
  const face = currentMesh.faces.find(f => f.originalIndex === originalIndex);
  
  if (!face) {
    console.log(`❌ Face non trouvée pour (${gridX},${gridY}) index=${originalIndex}`);
    return;
  }
  
  console.log(`🔍 === DEBUG TRANSFORMATIONS MATRICIELLES TUILE (${gridX},${gridY}) ===`);
  console.log(`📍 Face originalIndex: ${originalIndex}`);
  
  // Récupérer le rectangle texture
  const rectangle = getBmp(gridX, gridY);
  if (!rectangle) {
    console.log('❌ Rectangle texture non trouvé');
    return;
  }
  
  console.log(`📦 Rectangle: ${rectangle.width}x${rectangle.height}`);
  
  // Calculer les vertices projetés comme dans render()
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  const projectedVertices = currentMesh.vertices.map(vertex => {
    const rotated = currentSurface === 'projective' 
      ? rotate3DProjective(vertex.x, vertex.y, vertex.z, rotX, rotY, rotZ, rotShape)
      : rotate3D(vertex.x, vertex.y, vertex.z, rotX, rotY, rotZ);
    const projected = projectIso(rotated.x, rotated.y, rotated.z, scale);
    
    return {
      x: centerX + projected.x + cameraOffsetX,
      y: centerY - projected.y + cameraOffsetY,
      z: rotated.z,
      originalIndex: vertex.index
    };
  });
  
  // Construire le quad projeté
  const quadProjected = face.vertices.map(vertexIndex => projectedVertices[vertexIndex]);
  const [p0, p1, p2, p3] = quadProjected;
  
  console.log(`🎯 Quad projeté:`);
  console.log(`   P0: (${p0.x.toFixed(1)}, ${p0.y.toFixed(1)})`);
  console.log(`   P1: (${p1.x.toFixed(1)}, ${p1.y.toFixed(1)})`);
  console.log(`   P2: (${p2.x.toFixed(1)}, ${p2.y.toFixed(1)})`);
  console.log(`   P3: (${p3.x.toFixed(1)}, ${p3.y.toFixed(1)})`);
  
  // Calculer l'aire du quad
  const area = Math.abs((p1.x - p0.x) * (p3.y - p0.y) - (p3.x - p0.x) * (p1.y - p0.y));
  console.log(`📐 Aire du quad: ${area.toFixed(2)} pixels²`);
  
  if (area < 1) {
    console.log('⚠️ Quad trop petit (area < 1) - sera ignoré');
    return;
  }
  
  // Analyser les subdivisions
  const maxDist = Math.max(
    distance2D(p0, p1), distance2D(p1, p2), 
    distance2D(p2, p3), distance2D(p3, p0)
  );
  const subdivisions = Math.min(8, Math.max(2, Math.floor(maxDist / 50)));
  console.log(`🔧 Distance max: ${maxDist.toFixed(1)}, Subdivisions: ${subdivisions}`);
  
  // Analyser le premier triangle (corner00, corner10, corner01)
  const u0 = 0, u1 = 1/subdivisions, v0 = 0, v1 = 1/subdivisions;
  
  const corner00 = bilinearInterpolation(p0, p1, p2, p3, u0, v0);
  const corner10 = bilinearInterpolation(p0, p1, p2, p3, u1, v0);
  const corner01 = bilinearInterpolation(p0, p1, p2, p3, u0, v1);
  
  console.log(`🔺 Premier triangle:`);
  console.log(`   Corner00: (${corner00.x.toFixed(1)}, ${corner00.y.toFixed(1)})`);
  console.log(`   Corner10: (${corner10.x.toFixed(1)}, ${corner10.y.toFixed(1)})`);
  console.log(`   Corner01: (${corner01.x.toFixed(1)}, ${corner01.y.toFixed(1)})`);
  
  // Coordonnées texture correspondantes
  const srcW = rectangle.width;
  const srcH = rectangle.height;
  const srcX0 = u0 * srcW;
  const srcY0 = v0 * srcH;
  const srcW_sub = (u1 - u0) * srcW;
  const srcH_sub = (v1 - v0) * srcH;
  
  const t0 = [srcX0, srcY0];
  const t1 = [srcX0 + srcW_sub, srcY0];
  const t2 = [srcX0, srcY0 + srcH_sub];
  
  console.log(`🎨 Coordonnées texture:`);
  console.log(`   T0: (${t0[0].toFixed(1)}, ${t0[1].toFixed(1)})`);
  console.log(`   T1: (${t1[0].toFixed(1)}, ${t1[1].toFixed(1)})`);
  console.log(`   T2: (${t2[0].toFixed(1)}, ${t2[1].toFixed(1)})`);
  
  // CALCULER LA MATRICE DE TRANSFORMATION (même calcul que drawTriangleTexture)
  const denom = (t1[0] - t0[0]) * (t2[1] - t0[1]) - (t2[0] - t0[0]) * (t1[1] - t0[1]);
  console.log(`🧮 Dénominateur matrice: ${denom.toFixed(6)}`);
  
  if (Math.abs(denom) < 1e-10) {
    console.log('❌ TRIANGLE DÉGÉNÉRÉ (denom trop petit) - sera ignoré');
    return;
  }
  
  const m11 = ((corner10.x - corner00.x) * (t2[1] - t0[1]) - (corner01.x - corner00.x) * (t1[1] - t0[1])) / denom;
  const m12 = ((corner01.x - corner00.x) * (t1[0] - t0[0]) - (corner10.x - corner00.x) * (t2[0] - t0[0])) / denom;
  const m21 = ((corner10.y - corner00.y) * (t2[1] - t0[1]) - (corner01.y - corner00.y) * (t1[1] - t0[1])) / denom;
  const m22 = ((corner01.y - corner00.y) * (t1[0] - t0[0]) - (corner10.y - corner00.y) * (t2[0] - t0[0])) / denom;
  const dx = corner00.x - m11 * t0[0] - m12 * t0[1];
  const dy = corner00.y - m21 * t0[0] - m22 * t0[1];
  
  console.log(`🔢 Matrice de transformation:`);
  console.log(`   [${m11.toFixed(3)}, ${m12.toFixed(3)}, ${dx.toFixed(1)}]`);
  console.log(`   [${m21.toFixed(3)}, ${m22.toFixed(3)}, ${dy.toFixed(1)}]`);
  console.log(`   [0, 0, 1]`);
  
  // Calculer le déterminant de la matrice 2x2
  const det = m11 * m22 - m12 * m21;
  console.log(`📊 Déterminant: ${det.toFixed(6)}`);
  
  if (Math.abs(det) < 1e-10) {
    console.log('⚠️ MATRICE QUASI-SINGULIÈRE (det ≈ 0) - transformation dégénérée');
  } else if (Math.abs(det) > 1000) {
    console.log('⚠️ MATRICE TRÈS DÉFORMÉE (det > 1000) - transformation extrême');
  } else {
    console.log('✅ Matrice normale');
  }
  
  // Analyser l'échelle de transformation
  const scaleX = Math.sqrt(m11 * m11 + m21 * m21);
  const scaleY = Math.sqrt(m12 * m12 + m22 * m22);
  console.log(`📏 Échelles: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}`);
  
  if (scaleX > 100 || scaleY > 100) {
    console.log('⚠️ ÉCHELLE EXTRÊME - peut causer du blanc par sur-étirement');
  }
  
  console.log(`=== FIN DEBUG TRANSFORMATIONS MATRICIELLES ===`);
}

// Exposer pour la console
window.debugTileMatrixTransforms = debugTileMatrixTransforms;

// === DEBUG: Analyser l'ordre des vertices et coordonnées UV ===
function debugVertexOrder(gridX, gridY) {
  if (!currentMesh || !textureRectangles) {
    console.log('❌ Mesh ou rectangles non initialisés');
    return;
  }
  
  const originalIndex = gridX + gridY * MESH_U;
  const face = currentMesh.faces.find(f => f.originalIndex === originalIndex);
  
  if (!face) {
    console.log(`❌ Face non trouvée pour (${gridX},${gridY}) index=${originalIndex}`);
    return;
  }
  
  console.log(`🔍 === DEBUG ORDRE VERTICES TUILE (${gridX},${gridY}) ===`);
  console.log(`📍 Face originalIndex: ${originalIndex}`);
  
  // Analyser chaque vertex de la face
  face.vertices.forEach((vertexIndex, i) => {
    const vertex = currentMesh.vertices[vertexIndex];
    console.log(`📍 Vertex ${i} (index ${vertexIndex}):`);
    console.log(`   gridU: ${vertex.gridU.toFixed(3)} (u normalisé)`);
    console.log(`   gridV: ${vertex.gridV.toFixed(3)} (v normalisé)`);
    console.log(`   Position: (${vertex.x.toFixed(2)}, ${vertex.y.toFixed(2)}, ${vertex.z.toFixed(2)})`);
  });
  
  // Calculer les projections à l'écran
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  const projectedVertices = currentMesh.vertices.map(vertex => {
    const rotated = currentSurface === 'projective' 
      ? rotate3DProjective(vertex.x, vertex.y, vertex.z, rotX, rotY, rotZ, rotShape)
      : rotate3D(vertex.x, vertex.y, vertex.z, rotX, rotY, rotZ);
    const projected = projectIso(rotated.x, rotated.y, rotated.z, scale);
    
    return {
      x: centerX + projected.x + cameraOffsetX,
      y: centerY - projected.y + cameraOffsetY,
      z: rotated.z,
      originalIndex: vertex.index
    };
  });
  
  // Construire le quad projeté
  const quadProjected = face.vertices.map(vertexIndex => projectedVertices[vertexIndex]);
  
  console.log(`🎯 Quad projeté (ordre actuel des vertices):`);
  quadProjected.forEach((point, i) => {
    const vertex = currentMesh.vertices[face.vertices[i]];
    console.log(`   P${i}: (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) - UV(${vertex.gridU.toFixed(3)}, ${vertex.gridV.toFixed(3)})`);
  });
  
  // Identifier quel vertex correspond à quel coin selon les UV
  const corners = {
    bottomLeft: null,   // UV proche de (gridX/30, gridY/20)
    bottomRight: null,  // UV proche de ((gridX+1)/30, gridY/20)
    topRight: null,     // UV proche de ((gridX+1)/30, (gridY+1)/20)
    topLeft: null       // UV proche de (gridX/30, (gridY+1)/20)
  };
  
  const targetU_min = gridX / MESH_U;
  const targetU_max = (gridX + 1) / MESH_U;
  const targetV_min = gridY / MESH_V;
  const targetV_max = (gridY + 1) / MESH_V;
  
  face.vertices.forEach((vertexIndex, i) => {
    const vertex = currentMesh.vertices[vertexIndex];
    const u = vertex.gridU;
    const v = vertex.gridV;
    
    // Déterminer quel coin c'est selon les UV
    if (Math.abs(u - targetU_min) < 0.001 && Math.abs(v - targetV_min) < 0.001) {
      corners.bottomLeft = { index: i, vertex, projected: quadProjected[i] };
    } else if (Math.abs(u - targetU_max) < 0.001 && Math.abs(v - targetV_min) < 0.001) {
      corners.bottomRight = { index: i, vertex, projected: quadProjected[i] };
    } else if (Math.abs(u - targetU_max) < 0.001 && Math.abs(v - targetV_max) < 0.001) {
      corners.topRight = { index: i, vertex, projected: quadProjected[i] };
    } else if (Math.abs(u - targetU_min) < 0.001 && Math.abs(v - targetV_max) < 0.001) {
      corners.topLeft = { index: i, vertex, projected: quadProjected[i] };
    }
  });
  
  console.log(`🧭 Mapping des coins selon UV:`);
  Object.entries(corners).forEach(([cornerName, corner]) => {
    if (corner) {
      console.log(`   ${cornerName}: P${corner.index} - UV(${corner.vertex.gridU.toFixed(3)}, ${corner.vertex.gridV.toFixed(3)}) - Screen(${corner.projected.x.toFixed(1)}, ${corner.projected.y.toFixed(1)})`);
    } else {
      console.log(`   ${cornerName}: ❌ NON TROUVÉ`);
    }
  });
  
  // Vérifier l'ordre attendu vs réel
  console.log(`🔄 Ordre actuel dans face.vertices:`);
  console.log(`   [0] = ${corners.bottomLeft ? 'Bottom-Left' : '?'}`);
  console.log(`   [1] = ${corners.bottomRight ? 'Bottom-Right' : '?'}`);
  console.log(`   [2] = ${corners.topRight ? 'Top-Right' : '?'}`);
  console.log(`   [3] = ${corners.topLeft ? 'Top-Left' : '?'}`);
  
  console.log(`=== FIN DEBUG ORDRE VERTICES ===`);
}

// Exposer pour la console
window.debugVertexOrder = debugVertexOrder;

// === DEBUG: Tracer le rendu complet d'une tuile spécifique ===
function debugTileRenderingPipeline(gridX, gridY) {
  if (!currentMesh || !textureRectangles) {
    console.log('❌ Mesh ou rectangles non initialisés');
    return;
  }
  
  const originalIndex = gridX + gridY * MESH_U;
  const face = currentMesh.faces.find(f => f.originalIndex === originalIndex);
  
  if (!face) {
    console.log(`❌ Face non trouvée pour (${gridX},${gridY}) index=${originalIndex}`);
    return;
  }
  
  console.log(`🔍 === DEBUG PIPELINE RENDU TUILE (${gridX},${gridY}) ===`);
  console.log(`📍 Face originalIndex: ${originalIndex}`);
  
  // 1. Vérifier le rectangle texture
  const rectangle = getBmp(gridX, gridY);
  if (!rectangle) {
    console.log('❌ ÉCHEC: Rectangle texture non trouvé');
    return;
  }
  
  console.log(`📦 Rectangle: ${rectangle.width}x${rectangle.height}, fallback: ${!!rectangle.isFallback}`);
  
  // 2. Échantillonner le contenu du rectangle
  const rectCanvas = rectangle.canvas;
  const rectCtx = rectCanvas.getContext('2d', { willReadFrequently: true });
  
  console.log(`🎨 Échantillons rectangle (5 points):`);
  for (let i = 0; i < 5; i++) {
    const x = Math.floor((i / 4) * (rectCanvas.width - 1));
    const y = Math.floor(rectCanvas.height / 2);
    
    try {
      const imageData = rectCtx.getImageData(x, y, 1, 1);
      const [r, g, b, a] = imageData.data;
      const isWhite = r > 240 && g > 240 && b > 240;
      console.log(`   Point ${i}: (${x},${y}) → rgba(${r},${g},${b},${a}) ${isWhite ? '⚠️ BLANC!' : '✅'}`);
    } catch (e) {
      console.log(`   Point ${i}: ERREUR lecture pixel`);
    }
  }
  
  // 3. Calculer le quad projeté
  const centerX = canvas.width / 2;  // Canvas principal, pas rectangle texture
  const centerY = canvas.height / 2;
  
  const projectedVertices = currentMesh.vertices.map(vertex => {
    const rotated = currentSurface === 'projective' 
      ? rotate3DProjective(vertex.x, vertex.y, vertex.z, rotX, rotY, rotZ, rotShape)
      : rotate3D(vertex.x, vertex.y, vertex.z, rotX, rotY, rotZ);
    const projected = projectIso(rotated.x, rotated.y, rotated.z, scale);
    
    return {
      x: centerX + projected.x + cameraOffsetX,
      y: centerY - projected.y + cameraOffsetY,
      z: rotated.z,
      originalIndex: vertex.index
    };
  });
  
  const quadProjected = face.vertices.map(vertexIndex => projectedVertices[vertexIndex]);
  
  console.log(`🎯 Quad projeté:`);
  quadProjected.forEach((point, i) => {
    console.log(`   P${i}: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
  });
  
  // 4. Tester si drawTransformedRectangle sera appelé
  const [p0, p1, p2, p3] = quadProjected;
  const area = Math.abs((p1.x - p0.x) * (p3.y - p0.y) - (p3.x - p0.x) * (p1.y - p0.y));
  
  console.log(`📐 Aire quad: ${area.toFixed(2)} pixels²`);
  if (area < 1) {
    console.log('❌ ÉCHEC: Quad trop petit (area < 1) - ne sera pas rendu');
    return;
  }
  
  // 5. Calculer les subdivisions
  const maxDist = Math.max(
    distance2D(p0, p1), distance2D(p1, p2), 
    distance2D(p2, p3), distance2D(p3, p0)
  );
  const subdivisions = Math.min(8, Math.max(2, Math.floor(maxDist / 50)));
  
  console.log(`🔧 Distance max: ${maxDist.toFixed(1)}, Subdivisions: ${subdivisions}`);
  
  // 6. Analyser le premier sous-triangle
  const u0 = 0, u1 = 1/subdivisions, v0 = 0, v1 = 1/subdivisions;
  
  const corner00 = bilinearInterpolation(p0, p1, p2, p3, u0, v0);
  const corner10 = bilinearInterpolation(p0, p1, p2, p3, u1, v0);
  const corner01 = bilinearInterpolation(p0, p1, p2, p3, u0, v1);
  
  const srcW = rectangle.width;
  const srcH = rectangle.height;
  const srcX0 = u0 * srcW;
  const srcY0 = v0 * srcH;
  const srcW_sub = (u1 - u0) * srcW;
  const srcH_sub = (v1 - v0) * srcH;
  
  const t0 = [srcX0, srcY0];
  const t1 = [srcX0 + srcW_sub, srcY0];
  const t2 = [srcX0, srcY0 + srcH_sub];
  
  console.log(`🔺 Premier triangle screen:`);
  console.log(`   Corner00: (${corner00.x.toFixed(1)}, ${corner00.y.toFixed(1)})`);
  console.log(`   Corner10: (${corner10.x.toFixed(1)}, ${corner10.y.toFixed(1)})`);
  console.log(`   Corner01: (${corner01.x.toFixed(1)}, ${corner01.y.toFixed(1)})`);
  
  console.log(`🎨 Coordonnées texture triangle:`);
  console.log(`   T0: (${t0[0].toFixed(1)}, ${t0[1].toFixed(1)})`);
  console.log(`   T1: (${t1[0].toFixed(1)}, ${t1[1].toFixed(1)})`);
  console.log(`   T2: (${t2[0].toFixed(1)}, ${t2[1].toFixed(1)})`);
  
  // 7. Vérifier les pixels texture correspondants
  console.log(`🔍 Pixels texture aux coordonnées triangle:`);
  [t0, t1, t2].forEach((coord, i) => {
    const x = Math.floor(coord[0]);
    const y = Math.floor(coord[1]);
    
    if (x >= 0 && x < rectCanvas.width && y >= 0 && y < rectCanvas.height) {
      try {
        const imageData = rectCtx.getImageData(x, y, 1, 1);
        const [r, g, b, a] = imageData.data;
        const isWhite = r > 240 && g > 240 && b > 240;
        console.log(`   T${i} (${x},${y}): rgba(${r},${g},${b},${a}) ${isWhite ? '⚠️ BLANC!' : '✅'}`);
      } catch (e) {
        console.log(`   T${i}: ERREUR lecture`);
      }
    } else {
      console.log(`   T${i}: HORS LIMITES (${x},${y}) dans ${rectCanvas.width}x${rectCanvas.height}`);
    }
  });
  
  // 8. Simuler le rendu et voir ce qui est appelé
  console.log(`🎭 Modes de rendu actifs:`);
  console.log(`   showTexture: ${showTexture}`);
  console.log(`   showColorDebug: ${showColorDebug}`);
  console.log(`   showGrid: ${showGrid}`);
  
  // 9. Tester directement drawTransformedRectangle
  console.log(`🧪 Test direct drawTransformedRectangle...`);
  
  // Créer un canvas de test
  const testCanvas = document.createElement('canvas');
  testCanvas.width = 100;
  testCanvas.height = 100;
  const testCtx = testCanvas.getContext('2d');
  
  // Fond blanc pour voir si quelque chose est dessiné
  testCtx.fillStyle = 'white';
  testCtx.fillRect(0, 0, 100, 100);
  
  // Ajuster le quad pour le canvas de test
  const testQuad = quadProjected.map(p => ({
    x: (p.x - 20) * 0.5,
    y: (p.y - 170) * 0.5
  }));
  
  try {
    const success = drawTransformedRectangle(testCtx, rectangle, testQuad, originalIndex);
    console.log(`   Résultat drawTransformedRectangle: ${success ? 'SUCCESS' : 'FAILED'}`);
    
    // Vérifier ce qui a été dessiné
    const testData = testCtx.getImageData(0, 0, 100, 100);
    let nonWhitePixels = 0;
    for (let i = 0; i < testData.data.length; i += 4) {
      const r = testData.data[i];
      const g = testData.data[i + 1];
      const b = testData.data[i + 2];
      if (r < 240 || g < 240 || b < 240) {
        nonWhitePixels++;
      }
    }
    console.log(`   Pixels non-blancs dans test: ${nonWhitePixels} / ${testData.data.length / 4}`);
    
  } catch (e) {
    console.log(`   ERREUR drawTransformedRectangle: ${e.message}`);
  }
  
  console.log(`=== FIN DEBUG PIPELINE RENDU ===`);
}

// Exposer pour la console
window.debugTileRenderingPipeline = debugTileRenderingPipeline;

// === DEBUG SIMPLE TUILE (1,8) - SANS BOUCLE INFINIE ===
// (SUPPRIMÉ: debugTile18, testRenderTile18, analyzeSourceTexture18, debugPrecalcTile18, debugAllTile18, debugWhyWhite18 et logs associés)
// ... existing code ...

// Fonction utilitaire pour mettre une majuscule à chaque mot
function capitalizeWords(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

// Après initialisation de window.currentSurface et window.currentMapName
if (typeof window !== 'undefined' && window.currentSurface && config.privilegedAngles[window.currentSurface]) {
  const configSource = 'config.privilegedAngles';
  const configObj = config.privilegedAngles[window.currentSurface];
  pd('CONFIG', 'main.js', `CONFIG | INIT | source: ${configSource} | surface: ${window.currentSurface} | valeurs: ${JSON.stringify(configObj)}`);
}

// === SYSTÈME DE TRADUCTION GLOBAL (NOUVEAU) ===
window.translations = {};
window.currentLang = 'fr'; // Langue par défaut

async function loadAllTranslations() {
  const t0 = performance.now();
  const response = await fetch('trads/translations.csv');
  const csv = await response.text();
  const lines = csv.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'));
  if (lines.length < 2) return;

  // 1. Utiliser la première ligne comme labels
  const labels = lines[0].split(',').map(l => l.trim());
  // labels[0] = clé, labels[1] = FR, labels[2] = EN, etc.
  const langIdx = {
    fr: labels.findIndex(l => l.toLowerCase() === 'fr'),
    en: labels.findIndex(l => l.toLowerCase() === 'en'),
    es: labels.findIndex(l => l.toLowerCase() === 'es'),
    it: labels.findIndex(l => l.toLowerCase() === 'it'),
    de: labels.findIndex(l => l.toLowerCase() === 'de')
  };

  const translations = { fr: {}, en: {}, es: {}, it: {}, de: {} };

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const key = cols[0];
    if (!key) continue;
    Object.keys(langIdx).forEach(lang => {
      const idx = langIdx[lang];
      if (idx > 0 && cols[idx] !== undefined) {
        translations[lang][key] = cols[idx];
      }
    });
  }
  window.translations = translations;
  const t1 = performance.now();
  console.log('[DEBUG][loadAllTranslations] Toutes les langues chargées en', (t1-t0).toFixed(1), 'ms');
  console.log('[DEBUG][loadAllTranslations] Clés FR:', Object.keys(translations.fr));
  console.log('[DEBUG][loadAllTranslations] Structure:', window.translations);
}

function t(key) {
  const lang = window.currentLang || 'fr';
  const value = window.translations[lang] && window.translations[lang][key];
  if (!value) {
    console.warn(`[TRAD][${lang}] Clé manquante:`, key);
    return key;
  }
  return value;
}
window.t = t;

// Appeler loadAllTranslations au démarrage
loadAllTranslations();

// === SCRIPT DE NETTOYAGE CSV (à exécuter une fois, pas en prod) ===
// Copie ce code dans un fichier Node.js ou dans la console du navigateur avec le contenu du CSV en variable.
// Il supprime tous les guillemets parasites autour des champs et génère un CSV propre.

function cleanCsv(csvText) {
  return csvText.split(/\r?\n/)
    .map(line => line
      .split(',')
      .map(cell => cell.replace(/^[\"']+|[\"']+$/g, '').trim())
      .join(',')
    )
    .join('\n');
}
// Exemple d'utilisation :
// const cleaned = cleanCsv(document.querySelector('pre').innerText);
// console.log(cleaned);
// Puis copier/coller le résultat dans trads/translations.csv

async function startApp() {
  await loadAllTranslations();
  // Initialisation de l'UI et scan des textures APRES chargement des traductions
  await initializeTextures();
  // ... autres initialisations si besoin ...
}

startApp();
// ...
// Supprimer ou commenter tout appel direct à loadAllTranslations() ou initializeTextures() ailleurs dans le code
// ... existing code ...
