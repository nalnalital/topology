// File: 3Diso.js - 3D Isometric Coordinate System with Color Debug
// Desc: En français, dans l'architecture, je suis le module dédié au système de coordonnées 3D isométrique avec debug visuel par couleurs
// Version 1.5.0 (Modulo X corrigé)
// Author: DNAvatar.org - Arnaud Maignan
// Date: [December 16, 2024] [00:50 UTC+1]
// Logs:
//   - Updated to match corrected getBmp function
//   - Formula now (x%30) + y*30 with modulo only on X
//   - Coordinate system properly aligned
//   - Consistent with main.js v3.83.0

// === CONFIGURATION MAILLAGE ULTRA CRITIQUE ===
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

// === CONTRÔLE DEBUG ===
let color_debug = false; // Si true: affiche coordonnées avec couleurs, si false: affiche texture

// === FONCTION PRINCIPALE D'AFFICHAGE ===

/**
 * Affiche une case avec texture ou debug visuel des coordonnées par couleurs
 * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
 * @param {Object} rectangle - Rectangle texture
 * @param {Array} projectedQuad - 4 points projetés [p0,p1,p2,p3]
 * @param {number|null} faceOriginalIndex - Index de la face pour calcul coordonnées
 * @returns {boolean} - True si rendu effectué
 */
function drawTransformedRectangle(ctx, rectangle, projectedQuad, faceOriginalIndex = null) {
  if (!rectangle) return false;
  
  // ⚠️ ORDRE CORRIGÉ selon debugVertexOrder(1,8) ⚠️
  const p0 = projectedQuad[0]; // Bottom-left  (UV min,min)
  const p1 = projectedQuad[1]; // Bottom-right (UV max,min)
  const p2 = projectedQuad[2]; // Top-right    (UV max,max)
  const p3 = projectedQuad[3]; // Top-left     (UV min,max) // Bottom-left
  
  // === MODE DEBUG COORDONNÉES AVEC COULEURS ===
  if (color_debug && faceOriginalIndex !== null) {
    const gridX = faceOriginalIndex % MESH_U;             // X (horizontal, 0-29) 
    const gridY = Math.floor(faceOriginalIndex / MESH_U); // Y (vertical, 0-19)
    
    // ================================================================
    // ⚠️ MAPPING COORDONNÉES CORRIGÉ - BASE DE TOUT ! ⚠️
    // ================================================================
    // Ce mapping est la FONDATION de tout le système 3D isométrique
    // Corrigé pour 30 horizontales × 20 verticales
    // ================================================================
    
    const X = gridX;  // ⚠️ CRITIQUE: X = gridX (horizontal, 0-29)
    const Y = gridY;  // ⚠️ CRITIQUE: Y = gridY (vertical, 0-19)
    
    const indices = faceOriginalIndex !== null && window.currentMesh ? window.currentMesh.faces[faceOriginalIndex].vertices : null;
    let v = 0;
    let u = 0;
    if (indices && window.currentMesh) {
      const vertex = window.currentMesh.vertices[indices[0]];
      u = vertex.u;
      v = vertex.v;
    }
    
    
    const redAmount = Math.round(v * 255);   // X → Rouge (horizontal, 0-29)
    const blueAmount = Math.round(u * 255);  // Y → Bleu (vertical, 0-19)   
    const greenAmount = Math.round((1-v) * 255);
    
    ctx.save();
    ctx.fillStyle = `rgba(${redAmount}, ${greenAmount}, ${blueAmount}, 0.6)`;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fill();
    
    // Contour fin
    ctx.strokeStyle = `rgba(${redAmount}, ${greenAmount}, ${blueAmount}, 1.0)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Texte coordonnées optionnel (pas pour mode couleur pur)
    // Le texte sera géré par l'appelant selon le mode
    
    // Debug dans console pour quelques tuiles
    if (faceOriginalIndex < 10) {
      console.log(`🎯 Face ${faceOriginalIndex}: gridX=${gridX}, gridY=${gridY} → X=${X}, Y=${Y}`);
    }
    
    ctx.restore();
    return true;
  }
  
  // === MODE NORMAL: RENDU TEXTURE ===
  
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

// === FONCTIONS UTILITAIRES POUR RENDU TEXTURE ===

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

// === FONCTION PALETTE UV TOPOLOGIQUE ===
/**
 * Affiche une case avec couleurs coordonnées UV (palette topologique)
 * @param {CanvasRenderingContext2D} ctx - Contexte de rendu
 * @param {Array} projectedQuad - 4 points projetés [p0,p1,p2,p3]
 * @param {number} faceOriginalIndex - Index de la face pour calcul coordonnées
 * @returns {boolean} - True si rendu effectué
 */
function drawUVPalette(ctx, projectedQuad, faceOriginalIndex) {
  const p0 = projectedQuad[0];
  const p1 = projectedQuad[1];
  const p2 = projectedQuad[2];
  const p3 = projectedQuad[3];

  // Utiliser les indices de grille pour la palette UV topologique
  const gridX = faceOriginalIndex % window.MESH_U;
  const gridY = Math.floor(faceOriginalIndex / window.MESH_U);

  const u = gridX / (window.MESH_U - 1); // 0 → 1 sur toute la largeur
  const v = gridY / (window.MESH_V - 1); // 0 → 1 sur toute la hauteur

  const redAmount = Math.round(v * 255);
  const blueAmount = Math.round(u * 255);
  const greenAmount = Math.round((1 - v) * 255);

  // Debug : log quelques cases pour vérification
  if ((gridY === 0 && (gridX % 5 === 0 || gridX === window.MESH_U - 1)) || (gridX === 0 && (gridY % 5 === 0 || gridY === window.MESH_V - 1))) {
    if (typeof pd === 'function') {
      pd('drawUVPalette', '3Diso.js', `Face (${gridX},${gridY}) : u=${u.toFixed(3)}, v=${v.toFixed(3)} | RGB=(${redAmount},${greenAmount},${blueAmount})`);
    } else {
      console.log(`[drawUVPalette] Face (${gridX},${gridY}) : u=${u.toFixed(3)}, v=${v.toFixed(3)} | RGB=(${redAmount},${greenAmount},${blueAmount})`);
    }
  }

  ctx.save();
  ctx.fillStyle = `rgba(${redAmount}, ${greenAmount}, ${blueAmount}, 0.8)`;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${redAmount}, ${greenAmount}, ${blueAmount}, 1.0)`;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
  return true;
}

// === CONTRÔLE EXTERNE ===

/**
 * Active/désactive le mode debug coordonnées avec couleurs
 * @param {boolean} enabled - True pour debug couleurs, false pour texture
 */
function setColorDebug(enabled) {
  color_debug = enabled;
  console.log(`🎯 Mode debug coordonnées: ${enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
}

/**
 * Retourne l'état actuel du mode debug
 * @returns {boolean} - État du mode debug
 */
function getColorDebug() {
  return color_debug;
}

// === EXPORT ===
export { 
  MESH_U, 
  MESH_V, 
  drawTransformedRectangle,
  drawUVPalette,
  setColorDebug,
  getColorDebug
}; 