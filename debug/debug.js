// File: debug.js - Debug utilities for 3D Topology Engine
// Desc: En français, dans l'architecture, je suis le module de debug qui contient tous les outils d'analyse et de diagnostic pour le moteur 3D
// Version 1.1.0 (Ajout fonction pd locale)
// Author: DNAvatar.org - Arnaud Maignan
// Date: [December 16, 2024] [01:30 UTC+1]
// Logs:
//   - Extracted all debug functions from main.js for better organization
//   - Includes tile analysis, texture debugging, border analysis, and click debug
//   - Maintains window.* exports for console access
//   - Requires main.js variables via global scope
//   - Added local pd() function for debug output

// === FONCTION DEBUG LOCALE ===

/**
 * Fonction de debug pour affichage console avec format standardisé
 * @param {string} func - Nom de la fonction appelante
 * @param {string} file - Nom du fichier
 * @param {string} msg - Message à afficher
 */
export function pd(func, file, msg) {
  const timestamp = new Date().toLocaleTimeString('fr-FR');
  console.log(`🔍 [${func}][${file}] ${msg}`);
}

// === SYSTÈME DE DEBUG PAR CLIC EN MODE 2D ===

// Note: Les fonctions géométriques findTileAtPosition, isPointInQuad, isPointInTriangle
// sont maintenant dans main.js car elles sont nécessaires pour les événements de clic

/**
 * Debug complet d'une tuile cliquée (segments, voisins, couleurs)
 * @param {number} tileX - Coordonnée X de la tuile (0-29)
 * @param {number} tileY - Coordonnée Y de la tuile (0-19)
 */
function debugTileClick(tileX, tileY) {
  pd('tileClick', 'debug.js', `🎯 CLIC TUILE (${tileX},${tileY}) - DEBUG COMPLET`);
  
  // Récupérer les données de la tuile
  const rectangle = getBmp(tileX, tileY);
  if (!rectangle) {
    pd('tileClick', 'debug.js', `❌ Tuile (${tileX},${tileY}) non trouvée`);
    return;
  }
  
  pd('tileClick', 'debug.js', `📦 Rectangle: ${rectangle.width}x${rectangle.height}, index=${rectangle.originalIndex}`);
  
  // Analyser les segments disponibles (RIGHT+BOTTOM toujours, TOP+LEFT pour bordures globales)
  if (rectangle.segments) {
    pd('tileClick', 'debug.js', `🎨 SEGMENTS DISPONIBLES:`);
    
    // Vérifier tous les segments possibles
    ['bottom', 'right', 'top', 'left'].forEach(side => {
      const segment = rectangle.segments[side];
      if (segment && segment.data) {
        const pixelCount = segment.data.length / 4;
        const firstPixel = `rgba(${segment.data[0]},${segment.data[1]},${segment.data[2]},${segment.data[3]})`;
        const lastPixel = `rgba(${segment.data[segment.data.length-4]},${segment.data[segment.data.length-3]},${segment.data[segment.data.length-2]},${segment.data[segment.data.length-1]})`;
        pd('tileClick', 'debug.js', `   ${side.toUpperCase()}: ✅ ${pixelCount}px, ${segment.width}x${segment.height} | Premier=${firstPixel} Dernier=${lastPixel}`);
      } else {
        // Expliquer pourquoi le segment n'est pas là
        let reason = '';
        if (side === 'top' && tileY > 0) reason = ' (fourni par voisin HAUT)';
        else if (side === 'left' && tileX > 0) reason = ' (fourni par voisin GAUCHE)';
        else if (side === 'top' && tileY === 0) reason = ' (ERREUR: devrait être calculé pour Y=0!)';
        else if (side === 'left' && tileX === 0) reason = ' (ERREUR: devrait être calculé pour X=0!)';
        
        pd('tileClick', 'debug.js', `   ${side.toUpperCase()}: ❌ MANQUANT${reason}`);
      }
    });
    
    // Expliquer la logique selon la position
    if (tileX === 0 && tileY === 0) {
      pd('tileClick', 'debug.js', `📍 COIN (0,0): Devrait avoir 4 segments (RIGHT+BOTTOM+LEFT+TOP)`);
    } else if (tileX === 0) {
      pd('tileClick', 'debug.js', `📍 COLONNE X=0: Devrait avoir 3 segments (RIGHT+BOTTOM+LEFT)`);
    } else if (tileY === 0) {
      pd('tileClick', 'debug.js', `📍 LIGNE Y=0: Devrait avoir 3 segments (RIGHT+BOTTOM+TOP)`);
    } else {
      pd('tileClick', 'debug.js', `📍 TUILE STANDARD: 2 segments (RIGHT+BOTTOM) - économie mémoire`);
    }
  } else {
    pd('tileClick', 'debug.js', `❌ Pas de segments pré-calculés`);
  }
  
  // Analyser les voisins
  pd('tileClick', 'debug.js', `🏘️ VOISINS:`);
  const neighbors = [
    { name: 'GAUCHE', x: tileX - 1, y: tileY },
    { name: 'DROITE', x: tileX + 1, y: tileY },
    { name: 'HAUT', x: tileX, y: tileY - 1 },
    { name: 'BAS', x: tileX, y: tileY + 1 }
  ];
  
  neighbors.forEach(neighbor => {
    const neighborRect = getBmp(neighbor.x, neighbor.y);
    if (neighborRect) {
      pd('tileClick', 'debug.js', `   ${neighbor.name} (${neighbor.x},${neighbor.y}): ✅ ${neighborRect.width}x${neighborRect.height}`);
    } else {
      pd('tileClick', 'debug.js', `   ${neighbor.name} (${neighbor.x},${neighbor.y}): ❌ ABSENT`);
    }
  });
  
  // Analyser quels bords seront dessinés selon la nouvelle logique
  pd('tileClick', 'debug.js', `🖌️ BORDS DESSINÉS (logique RIGHT+BOTTOM + bordures globales):`);
  
  // Bord RIGHT
  if (tileX < MESH_U - 1) {
    const rightNeighbor = getBmp(tileX + 1, tileY);
    if (rightNeighbor) {
      pd('tileClick', 'debug.js', `   RIGHT: ✅ Sera dessiné (voisin droite existe)`);
    } else {
      pd('tileClick', 'debug.js', `   RIGHT: ❌ Ne sera pas dessiné (pas de voisin droite)`);
    }
  } else {
    pd('tileClick', 'debug.js', `   RIGHT: ❌ Bord extrême (X=${tileX})`);
  }
  
  // Bord BOTTOM  
  if (tileY < MESH_V - 1) {
    const bottomNeighbor = getBmp(tileX, tileY + 1);
    if (bottomNeighbor) {
      pd('tileClick', 'debug.js', `   BOTTOM: ✅ Sera dessiné (voisin bas existe)`);
    } else {
      pd('tileClick', 'debug.js', `   BOTTOM: ❌ Ne sera pas dessiné (pas de voisin bas)`);
    }
  } else {
    pd('tileClick', 'debug.js', `   BOTTOM: ❌ Bord extrême (Y=${tileY})`);
  }
  
  // Bords LEFT et TOP conditionnels
  if (tileX === 0) {
    pd('tileClick', 'debug.js', `   LEFT: ✅ Sera dessiné (bordure globale X=0)`);
  } else {
    pd('tileClick', 'debug.js', `   LEFT: ⏸️ Sera dessiné par voisin gauche (${tileX-1},${tileY})`);
  }
  
  if (tileY === 0) {
    pd('tileClick', 'debug.js', `   TOP: ✅ Sera dessiné (bordure globale Y=0)`);
  } else {
    pd('tileClick', 'debug.js', `   TOP: ⏸️ Sera dessiné par voisin haut (${tileX},${tileY-1})`);
  }
  
  pd('tileClick', 'debug.js', `🔚 FIN DEBUG TUILE (${tileX},${tileY})`);
  
  // ANALYSE AUTOMATIQUE DES VECTEURS COULEURS
  pd('tileClick', 'debug.js', `🎨 === ANALYSE AUTOMATIQUE VECTEURS COULEURS ===`);
  
  // Analyser tous les segments disponibles
  ['right', 'bottom', 'top', 'left'].forEach(segmentSide => {
    if (rectangle.segments && rectangle.segments[segmentSide]) {
      debugSegmentColors(tileX, tileY, segmentSide);
    } else {
      pd('tileClick', 'debug.js', `❌ Segment ${segmentSide.toUpperCase()} non disponible pour analyse`);
    }
  });
}

/**
 * Affiche le vecteur complet des couleurs d'un segment spécifique
 * @param {number} tileX - Coordonnée X de la tuile
 * @param {number} tileY - Coordonnée Y de la tuile  
 * @param {string} segmentSide - 'right', 'bottom', 'left', 'top'
 */
function debugSegmentColors(tileX, tileY, segmentSide = 'right') {
  pd('segmentColors', 'debug.js', `🎨 === VECTEUR COULEURS SEGMENT ${segmentSide.toUpperCase()} TUILE (${tileX},${tileY}) ===`);
  
  const rectangle = getBmp(tileX, tileY);
  if (!rectangle || !rectangle.segments) {
    pd('segmentColors', 'debug.js', `❌ Tuile ou segments non disponibles`);
    return;
  }
  
  // DEBUG COORDONNÉES SOURCE du segment
  const originalIndex = tileX + tileY * MESH_U;
  pd('segmentColors', 'debug.js', `📍 Tuile (${tileX},${tileY}) → originalIndex=${originalIndex}`);
  
  // Calculer les coordonnées source comme dans precalculateTextureRectangles
  if (typeof mapCanvas !== 'undefined' && mapCanvas) {
    const texW = mapCanvas.width;
    const texH = mapCanvas.height;
    const srcW = Math.floor(texW / MESH_U);
    const srcH = Math.floor(texH / MESH_V);
    const srcX = (tileX % MESH_U) * srcW;
    const srcY = Math.floor(tileY) * srcH;
    
    pd('segmentColors', 'debug.js', `🗺️ Texture source: ${texW}x${texH}, tuile: ${srcW}x${srcH}`);
    pd('segmentColors', 'debug.js', `📐 Position source: srcX=${srcX}, srcY=${srcY}`);
    
    // Coordonnées exactes du segment selon le côté
    let segmentSrcX, segmentSrcY, segmentSrcW, segmentSrcH;
    switch (segmentSide) {
      case 'bottom':
        segmentSrcX = srcX;
        segmentSrcY = srcY;  // ← CORRECTION: PREMIÈRE ligne (était srcY + srcH - 1)
        segmentSrcW = srcW;
        segmentSrcH = 1;
        break;
      case 'right':
        segmentSrcX = srcX + srcW - 1;  // ← DERNIÈRE colonne
        segmentSrcY = srcY;
        segmentSrcW = 1;
        segmentSrcH = srcH;
        break;
      case 'top':
        segmentSrcX = srcX;
        segmentSrcY = srcY + srcH - 1;  // ← DERNIÈRE ligne pour TOP
        segmentSrcW = srcW;
        segmentSrcH = 1;
        break;
      case 'left':
        segmentSrcX = srcX;  // ← PREMIÈRE colonne pour LEFT
        segmentSrcY = srcY;
        segmentSrcW = 1;
        segmentSrcH = srcH;
        break;
    }
    
    pd('segmentColors', 'debug.js', `🎯 Segment ${segmentSide} source: (${segmentSrcX},${segmentSrcY}) ${segmentSrcW}x${segmentSrcH}`);
    pd('segmentColors', 'debug.js', `🔄 CORRECTION: segment BOTTOM utilise maintenant srcY (première ligne) au lieu de srcY+srcH-1`);
    
    // ALERTE si coordonnées dépassent la texture
    if (segmentSrcX + segmentSrcW > texW || segmentSrcY + segmentSrcH > texH) {
      pd('segmentColors', 'debug.js', `⚠️ DÉPASSEMENT TEXTURE ! Segment va de (${segmentSrcX},${segmentSrcY}) à (${segmentSrcX + segmentSrcW},${segmentSrcY + segmentSrcH}) mais texture = ${texW}x${texH}`);
    }
  }
  
  const segment = rectangle.segments[segmentSide];
  if (!segment || !segment.data) {
    pd('segmentColors', 'debug.js', `❌ Segment ${segmentSide} non disponible`);
    return;
  }
  
  const data = segment.data;
  const pixelCount = data.length / 4;
  
  pd('segmentColors', 'debug.js', `📊 Segment ${segmentSide}: ${pixelCount} pixels, ${segment.width}x${segment.height}`);
  
  // Afficher chaque pixel du segment
  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];
    
    // Analyser le type de couleur
    let type = '';
    if (r > 240 && g > 240 && b > 240) type = ' ⚪ BLANC';
    else if (r > 200 && g > 180 && b > 150 && r > g && g > b) type = ' 🏖️ BEIGE';
    else if (r < 50 && g > 40 && b > 30 && g > r) type = ' 🌊 OCÉAN';
    else if (r > 100 && g > 80 && b < 60) type = ' 🏔️ TERRE';
    else type = ' 🔍 AUTRE';
    
    pd('segmentColors', 'debug.js', `   Pixel ${i.toString().padStart(2)}: rgba(${r.toString().padStart(3)},${g.toString().padStart(3)},${b.toString().padStart(3)},${a.toString().padStart(3)})${type}`);
  }
  
  // Statistiques globales
  let whiteCount = 0, beigeCount = 0, oceanCount = 0, landCount = 0, otherCount = 0;
  
  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1]; 
    const b = data[i * 4 + 2];
    
    if (r > 240 && g > 240 && b > 240) whiteCount++;
    else if (r > 200 && g > 180 && b > 150 && r > g && g > b) beigeCount++;
    else if (r < 50 && g > 40 && b > 30 && g > r) oceanCount++;
    else if (r > 100 && g > 80 && b < 60) landCount++;
    else otherCount++;
  }
  
  pd('segmentColors', 'debug.js', `📈 STATISTIQUES:`);
  pd('segmentColors', 'debug.js', `   🌊 Océan: ${oceanCount}/${pixelCount} (${((oceanCount/pixelCount)*100).toFixed(1)}%)`);
  pd('segmentColors', 'debug.js', `   🏔️ Terre: ${landCount}/${pixelCount} (${((landCount/pixelCount)*100).toFixed(1)}%)`);
  pd('segmentColors', 'debug.js', `   🏖️ Beige: ${beigeCount}/${pixelCount} (${((beigeCount/pixelCount)*100).toFixed(1)}%)`);
  pd('segmentColors', 'debug.js', `   ⚪ Blanc: ${whiteCount}/${pixelCount} (${((whiteCount/pixelCount)*100).toFixed(1)}%)`);
  pd('segmentColors', 'debug.js', `   🔍 Autre: ${otherCount}/${pixelCount} (${((otherCount/pixelCount)*100).toFixed(1)}%)`);
  
  if (whiteCount > 0) {
    pd('segmentColors', 'debug.js', `⚠️ ALERTE: ${whiteCount} pixels blancs détectés dans le segment!`);
  }
  
  pd('segmentColors', 'debug.js', `=== FIN VECTEUR COULEURS SEGMENT ${segmentSide.toUpperCase()} ===`);
}

// Exposer globalement pour usage console
window.debugSegmentColors = debugSegmentColors;

// === DEBUG UV ET STRUCTURE ===

/**
 * Debug des coins UV pour vérifier mapping texture
 */
function debugUVCorners() {
  // Récupérer currentMesh depuis window
  const mesh = window.currentMesh;
  if (!mesh || !mesh.vertices) {
    pd('debugUV', 'debug.js', '❌ Pas de mesh actuel');
    return;
  }
  
  // Analyser les 4 coins du mesh
  const corners = [
    { name: 'Coin 0,0', index: 0 },
    { name: 'Coin 29,0', index: 29 },
    { name: 'Coin 0,19', index: 19 * 30 },
    { name: 'Coin 29,19', index: 19 * 30 + 29 }
  ];
  
  pd('debugUV', 'debug.js', '🔍 ANALYSE COINS UV:');
  
  corners.forEach(corner => {
    if (corner.index < mesh.vertices.length) {
      const vertex = mesh.vertices[corner.index];
      pd('debugUV', 'debug.js', `   ${corner.name}: UV(${vertex.u.toFixed(3)}, ${vertex.v.toFixed(3)}) XYZ(${vertex.x.toFixed(2)}, ${vertex.y.toFixed(2)}, ${vertex.z.toFixed(2)})`);
    }
  });
}

// === DEBUG Z-FIGHTING ET OVERLAPS ===

/**
 * Debug des chevauchements de faces
 */
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
    xs = rect.screenQuad.map(p => p.x);
    ys = rect.screenQuad.map(p => p.y);
  } else {
    // Structure inconnue, fallback
    console.log('🔴 Structure rectangle inconnue:', Object.keys(rect));
    return { left: 0, right: 0, top: 0, bottom: 0 };
  }
  
  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys)
  };
}

// === DEBUG TUILES SPÉCIFIQUES ===

/**
 * Debug des couleurs de bord pour une tuile spécifique et ses voisines
 * @param {number} targetX - Coordonnée X de la tuile à analyser
 * @param {number} targetY - Coordonnée Y de la tuile à analyser
 * @param {string} borderSide - Côté à analyser ('right', 'left', 'top', 'bottom')
 */
function debugTileBorderColors(targetX, targetY, borderSide = 'right') {
  if (!textureRectangles) {
    pd('debugTileBorderColors', 'debug.js', '❌ textureRectangles non initialisé');
    return;
  }
  
  // Récupérer la tuile cible
  const targetRect = getBmp(targetX, targetY);
  if (!targetRect) {
    pd('debugTileBorderColors', 'debug.js', `❌ Tuile (${targetX},${targetY}) introuvable`);
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
  
  pd('debugTileBorderColors', 'debug.js', `🔍 ANALYSE BORD ${borderSide.toUpperCase()} - Tuile (${targetX},${targetY}) vs Voisine (${neighborX},${neighborY})`);
  pd('debugTileBorderColors', 'debug.js', `📦 Tuile cible: ${targetRect.width}x${targetRect.height} | Voisine: ${neighborRect ? `${neighborRect.width}x${neighborRect.height}` : 'NULL'}`);
  
  // Analyser les couleurs du bord de la tuile cible
  const targetColors = sampleBorderPixels(targetRect, borderSide, 5);
  pd('debugTileBorderColors', 'debug.js', `🎨 COULEURS BORD ${borderSide.toUpperCase()} tuile (${targetX},${targetY}):`);
  targetColors.forEach((color, i) => {
    pd('debugTileBorderColors', 'debug.js', `   [${i}] rgba(${color.r},${color.g},${color.b},${color.a})`);
  });
  
  // Analyser les couleurs du bord correspondant de la tuile voisine
  if (neighborRect) {
    const oppositeSide = getOppositeBorderSide(borderSide);
    const neighborColors = sampleBorderPixels(neighborRect, oppositeSide, 5);
    pd('debugTileBorderColors', 'debug.js', `🎨 COULEURS BORD ${oppositeSide.toUpperCase()} voisine (${neighborX},${neighborY}):`);
    neighborColors.forEach((color, i) => {
      pd('debugTileBorderColors', 'debug.js', `   [${i}] rgba(${color.r},${color.g},${color.b},${color.a})`);
    });
    
    // Calculer différences de couleur
    pd('debugTileBorderColors', 'debug.js', `📊 DIFFÉRENCES DE COULEUR:`);
    targetColors.forEach((targetColor, i) => {
      if (i < neighborColors.length) {
        const neighborColor = neighborColors[i];
        const deltaR = Math.abs(targetColor.r - neighborColor.r);
        const deltaG = Math.abs(targetColor.g - neighborColor.g);
        const deltaB = Math.abs(targetColor.b - neighborColor.b);
        const totalDelta = deltaR + deltaG + deltaB;
        pd('debugTileBorderColors', 'debug.js', `   [${i}] ΔR=${deltaR}, ΔG=${deltaG}, ΔB=${deltaB} | Total=${totalDelta}`);
      }
    });
  } else {
    pd('debugTileBorderColors', 'debug.js', `⚠️ Voisine (${neighborX},${neighborY}) introuvable`);
  }
}

/**
 * Échantillonner pixels le long d'un bord d'un rectangle
 * @param {Object} rectangle - Rectangle texture avec canvas
 * @param {string} borderSide - Côté ('top', 'bottom', 'left', 'right')
 * @param {number} sampleCount - Nombre d'échantillons à prendre
 * @returns {Array} Array de couleurs {r, g, b, a}
 */
function sampleBorderPixels(rectangle, borderSide, sampleCount = 5) {
  if (!rectangle || !rectangle.canvas) {
    return [];
  }
  
  const canvas = rectangle.canvas;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const width = canvas.width;
  const height = canvas.height;
  
  const colors = [];
  
  try {
    for (let i = 0; i < sampleCount; i++) {
      let x, y;
      
      switch (borderSide) {
        case 'top':
          x = Math.floor((i / (sampleCount - 1)) * (width - 1));
          y = 0;
          break;
        case 'bottom':
          x = Math.floor((i / (sampleCount - 1)) * (width - 1));
          y = height - 1;
          break;
        case 'left':
          x = 0;
          y = Math.floor((i / (sampleCount - 1)) * (height - 1));
          break;
        case 'right':
          x = width - 1;
          y = Math.floor((i / (sampleCount - 1)) * (height - 1));
          break;
        default:
          continue;
      }
      
      const imageData = ctx.getImageData(x, y, 1, 1);
      const [r, g, b, a] = imageData.data;
      colors.push({ r, g, b, a: a / 255 });
    }
  } catch (e) {
    pd('sampleBorderPixels', 'debug.js', `❌ Erreur échantillonnage: ${e.message}`);
  }
  
  return colors;
}

/**
 * Obtenir le côté opposé d'un bord
 * @param {string} borderSide - Côté original
 * @returns {string} Côté opposé
 */
function getOppositeBorderSide(borderSide) {
  const opposites = {
    'top': 'bottom',
    'bottom': 'top',
    'left': 'right',
    'right': 'left'
  };
  return opposites[borderSide] || borderSide;
}

/**
 * Debug complet d'une tuile (texture, projection, matrices)
 * @param {number} targetX - Coordonnée X de la tuile
 * @param {number} targetY - Coordonnée Y de la tuile
 */
function debugTileRendering(targetX, targetY) {
  pd('debugTileRendering', 'debug.js', `🔍 DEBUG RENDU TUILE (${targetX},${targetY})`);
  
  // Calculer l'index de la face
  const faceIndex = targetY * MESH_U + targetX;
  
  // Vérifier le mesh
  if (!currentMesh || !currentMesh.faces || faceIndex >= currentMesh.faces.length) {
    pd('debugTileRendering', 'debug.js', `❌ Face ${faceIndex} introuvable dans mesh`);
    return;
  }
  
  const face = currentMesh.faces[faceIndex];
  pd('debugTileRendering', 'debug.js', `📦 Face ${faceIndex}: originalIndex=${face.originalIndex}, visible=${face.visible}`);
  
  // Vérifier le rectangle texture
  const rectangle = getBmp(targetX, targetY);
  if (!rectangle) {
    pd('debugTileRendering', 'debug.js', `❌ Rectangle texture introuvable pour (${targetX},${targetY})`);
    return;
  }
  
  pd('debugTileRendering', 'debug.js', `🎨 Rectangle: ${rectangle.width}x${rectangle.height}, originalIndex=${rectangle.originalIndex}`);
  
  // Analyser la projection
  if (currentMesh.projectedVertices && face.vertices) {
    const indices = face.vertices;
    const projectedQuad = [
      currentMesh.projectedVertices[indices[0]], // Bottom-left
      currentMesh.projectedVertices[indices[1]], // Bottom-right
      currentMesh.projectedVertices[indices[2]], // Top-right
      currentMesh.projectedVertices[indices[3]]  // Top-left
    ];
    
    pd('debugTileRendering', 'debug.js', `📐 Quad projeté:`);
    projectedQuad.forEach((point, i) => {
      const labels = ['Bottom-left', 'Bottom-right', 'Top-right', 'Top-left'];
      pd('debugTileRendering', 'debug.js', `   ${labels[i]}: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
    });
    
    // Calculer l'aire du quad
    const area = Math.abs(
      (projectedQuad[0].x * (projectedQuad[1].y - projectedQuad[3].y) +
       projectedQuad[1].x * (projectedQuad[2].y - projectedQuad[0].y) +
       projectedQuad[2].x * (projectedQuad[3].y - projectedQuad[1].y) +
       projectedQuad[3].x * (projectedQuad[0].y - projectedQuad[2].y)) / 2
    );
    
    pd('debugTileRendering', 'debug.js', `📏 Aire quad: ${area.toFixed(2)} pixels²`);
  }
  
  pd('debugTileRendering', 'debug.js', `🔚 FIN DEBUG RENDU (${targetX},${targetY})`);
}

// === EXPORTS POUR CONSOLE ===

// Export des fonctions principales pour accès console
window.debugOverlaps = debugOverlaps;
window.debugTileBorderColors = debugTileBorderColors;
window.debugTileRendering = debugTileRendering;
window.debugUVCorners = debugUVCorners;

// === FONCTIONS DEBUG CONSOLE (WINDOW.*) ===

// DEBUG: Fonction pour forcer le recalcul des rectangles (accessible depuis console)
window.forceRecalculateRectangles = function() {
  textureRectangles = null;
  pd('forceRecalculate', 'debug.js', `🔧 FORCE RECALCUL: Cache rectangles vidé, prochaine render() recalculera`);
  render();
};

// DEBUG: Fonction pour activer debug sur tuile océan
window.debugOceanTile = function() {
  window.debugCurrentTile = true;
  pd('debugOcean', 'debug.js', `🌊 DEBUG OCÉAN ACTIVÉ: Prochaine désactivation grille montrera détails tuile (1,9)`);
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

// === DEBUG FONCTIONS SPÉCIALISÉES (LEGACY) ===

// Fonctions spécifiques gardées pour compatibilité - peuvent être nettoyées plus tard
window.debugTile18 = function() {
  debugTileClick(1, 8);
};

window.analyzeSourceTexture18 = function() {
  if (!mapCanvas) {
    console.log('❌ Pas de texture source');
    return;
  }
  
  const ctx = mapCanvas.getContext('2d');
  const width = mapCanvas.width;
  const height = mapCanvas.height;
  
  console.log(`🔍 TEXTURE SOURCE: ${width}x${height}`);
  
  // Analyser zone tuile (1,8)
  const tileX = 1;
  const tileY = 8;
  const srcX = Math.floor((tileX / MESH_U) * width);
  const srcY = Math.floor((tileY / MESH_V) * height);
  const srcW = Math.floor(width / MESH_U);
  const srcH = Math.floor(height / MESH_V);
  
  console.log(`📍 Zone tuile (1,8): srcX=${srcX}, srcY=${srcY}, srcW=${srcW}, srcH=${srcH}`);
  
  // Échantillonner quelques pixels dans cette zone
  try {
    const samples = [
      { name: 'Coin haut-gauche', x: srcX, y: srcY },
      { name: 'Coin haut-droite', x: srcX + srcW - 1, y: srcY },
      { name: 'Coin bas-gauche', x: srcX, y: srcY + srcH - 1 },
      { name: 'Coin bas-droite', x: srcX + srcW - 1, y: srcY + srcH - 1 },
      { name: 'Centre', x: srcX + Math.floor(srcW/2), y: srcY + Math.floor(srcH/2) }
    ];
    
    console.log(`🎨 ÉCHANTILLONS COULEUR:`);
    samples.forEach(sample => {
      const imageData = ctx.getImageData(sample.x, sample.y, 1, 1);
      const [r, g, b, a] = imageData.data;
      console.log(`   ${sample.name} (${sample.x},${sample.y}): rgba(${r},${g},${b},${a})`);
    });
  } catch (e) {
    console.log(`❌ Erreur échantillonnage: ${e.message}`);
  }
};

console.log('🔧 Debug module loaded - Functions available: debugTileClick, debugOverlaps, debugTileRendering, debugUVCorners'); 
console.log('🔧 Debug module loaded - Functions available: debugTileClick, debugOverlaps, debugTileRendering, debugUVCorners'); 