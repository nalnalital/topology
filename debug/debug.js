// File: debug.js - Debug utilities for 3D Topology Engine
// Desc: En français, dans l'architecture, je suis le module de debug qui contient tous les outils d'analyse et de diagnostic pour le moteur 3D
// Version 1.2.0 (centralisation debug main.js)
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.2.0 Centralisation debugTileBorderColors, debugTileRendering, debugTileContent, debugTileMatrixTransforms, debugTileRenderingPipeline depuis main.js
//   - Maintient window.* exports pour console
//   - Utilise pd() pour logs

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
window.debugTileClick = debugTileClick;
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
window.debugSegmentColors = debugSegmentColors;

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

// === DEBUG TUILES SPÉCIFIQUES ===

/**
 * Debug des couleurs de bord pour une tuile spécifique et ses voisines
 * @param {number} targetX - Coordonnée X de la tuile à analyser
 * @param {number} targetY - Coordonnée Y de la tuile à analyser
 * @param {string} borderSide - Côté à analyser ('right', 'left', 'top', 'bottom')
 */
function debugTileBorderColors(targetX, targetY, borderSide = 'right') {
  const textureRectangles = window.textureRectangles;
  const getBmp = window.getBmp;
  const pd = window.pd;
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
window.debugTileBorderColors = debugTileBorderColors;

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
  const currentMesh = window.currentMesh;
  const textureRectangles = window.textureRectangles;
  const getBmp = window.getBmp;
  const pd = window.pd;
  if (!currentMesh || !textureRectangles) {
    pd('debugTileRendering', 'debug.js', '❌ Mesh ou rectangles non initialisés');
    return;
  }
  
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

window.debugTileRendering = debugTileRendering;

function debugTileContent(targetX, targetY) {
  const getBmp = window.getBmp;
  const pd = window.pd;
  const rectangle = getBmp(targetX, targetY);
  if (!rectangle || !rectangle.canvas) {
    pd('debugTileContent', 'debug.js', `❌ Rectangle (${targetX},${targetY}) introuvable`);
    return;
  }
}

window.debugTileContent = debugTileContent;

// === DEBUG: Analyser les transformations matricielles ===
function debugTileMatrixTransforms(gridX, gridY) {
  const currentMesh = window.currentMesh;
  const textureRectangles = window.textureRectangles;
  const canvas = window.canvas;
  const rotX = window.rotX;
  const rotY = window.rotY;
  const rotZ = window.rotZ;
  const rotShape = window.rotShape;
  const scale = window.scale;
  const currentSurface = window.currentSurface;
  const projectIso = window.projectIso;
  const rotate3D = window.rotate3D;
  const rotate3DProjective = window.rotate3DProjective;
  const cameraOffsetX = window.cameraOffsetX;
  const cameraOffsetY = window.cameraOffsetY;
  const MESH_U = window.MESH_U;
  const getBmp = window.getBmp;
  const bilinearInterpolation = window.bilinearInterpolation;
  const distance2D = window.distance2D;
  
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
  
  // Calculer l'aire du quad
  const area = Math.abs((p1.x - p0.x) * (p3.y - p0.y) - (p3.x - p0.x) * (p1.y - p0.y));

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
  
  // Analyser le premier triangle (corner00, corner10, corner01)
  const u0 = 0, u1 = 1/subdivisions, v0 = 0, v1 = 1/subdivisions;
  
  const corner00 = bilinearInterpolation(p0, p1, p2, p3, u0, v0);
  const corner10 = bilinearInterpolation(p0, p1, p2, p3, u1, v0);
  const corner01 = bilinearInterpolation(p0, p1, p2, p3, u0, v1);
  
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
  
  // CALCULER LA MATRICE DE TRANSFORMATION (même calcul que drawTriangleTexture)
  const denom = (t1[0] - t0[0]) * (t2[1] - t0[1]) - (t2[0] - t0[0]) * (t1[1] - t0[1]);
  
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
  
  // Calculer le déterminant de la matrice 2x2
  const det = m11 * m22 - m12 * m21;

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
  
  if (scaleX > 100 || scaleY > 100) {
    console.log('⚠️ ÉCHELLE EXTRÊME - peut causer du blanc par sur-étirement');
  }
  
  console.log(`=== FIN DEBUG TRANSFORMATIONS MATRICIELLES ===`);
}

// === DEBUG: Tracer le rendu complet d'une tuile spécifique ===
function debugTileRenderingPipeline(gridX, gridY) {
  const currentMesh = window.currentMesh;
  const textureRectangles = window.textureRectangles;
  const canvas = window.canvas;
  const rotX = window.rotX;
  const rotY = window.rotY;
  const rotZ = window.rotZ;
  const rotShape = window.rotShape;
  const scale = window.scale;
  const currentSurface = window.currentSurface;
  const projectIso = window.projectIso;
  const rotate3D = window.rotate3D;
  const rotate3DProjective = window.rotate3DProjective;
  const cameraOffsetX = window.cameraOffsetX;
  const cameraOffsetY = window.cameraOffsetY;
  const MESH_U = window.MESH_U;
  const getBmp = window.getBmp;
  const bilinearInterpolation = window.bilinearInterpolation;
  const distance2D = window.distance2D;
  const drawTransformedRectangle = window.drawTransformedRectangle;
  const showTexture = window.showTexture;
  const showUVPalette = window.showUVPalette;
  const showGrid = window.showGrid;
  
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
  console.log(`   showUVPalette: ${showUVPalette}`);
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

// === DEBUG: Analyser l'ordre des vertices et coordonnées UV ===
function debugVertexOrder(gridX, gridY) {
  const currentMesh = window.currentMesh;
  const textureRectangles = window.textureRectangles;
  const canvas = window.canvas;
  const rotX = window.rotX;
  const rotY = window.rotY;
  const rotZ = window.rotZ;
  const rotShape = window.rotShape;
  const scale = window.scale;
  const currentSurface = window.currentSurface;
  const projectIso = window.projectIso;
  const rotate3D = window.rotate3D;
  const rotate3DProjective = window.rotate3DProjective;
  const cameraOffsetX = window.cameraOffsetX;
  const cameraOffsetY = window.cameraOffsetY;
  const MESH_U = window.MESH_U;
  const MESH_V = window.MESH_V;
  
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

// Exposer toutes les fonctions pour test dans console
window.debugOverlaps = debugOverlaps;
window.debugVertexOrder = debugVertexOrder;
window.debugTileMatrixTransforms = debugTileMatrixTransforms;
window.debugTileRenderingPipeline = debugTileRenderingPipeline;

// Export pour import ES6
export { debugOverlaps, debugVertexOrder, debugTileMatrixTransforms, debugTileRenderingPipeline }; 