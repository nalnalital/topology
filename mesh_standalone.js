// File: mesh_standalone.js - Version standalone pour test navigateur
// Desc: En français, dans l'architecture, je suis une version standalone du système mesh sans modules ES6
// Version 1.0.1 (version standalone)
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 21:15 UTC+1
// Logs:
//   - v1.0.1: Version standalone sans import/export pour test navigateur direct

// === STRUCTURE MAILLAGE (VERSION STANDALONE) ===

/**
 * Crée la structure maillage avec cases
 * @param {number} width - Nombre de cases en X (ex: 30)
 * @param {number} height - Nombre de cases en Y (ex: 20) 
 * @returns {Object} maillage = {all:[case], width, height}
 */
function createMesh(width = 30, height = 20) {
  const all = [];
  
  // Générer toutes les cases de la grille
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      // Case = 4 coins en coordonnées grille [0,0] à [width,height]
      const case_quad = [
        [i, j],         // Bottom-left
        [i + 1, j],     // Bottom-right  
        [i + 1, j + 1], // Top-right
        [i, j + 1]      // Top-left
      ];
      
      all.push(case_quad);
    }
  }
  
  return {
    all: all,           // Toutes les cases
    width: width,       // Dimensions 30
    height: height,     // Dimensions 20
    totalCases: width * height
  };
}

/**
 * Transformation linéaire grille → 2D selon paramètres
 * @param {Array} gridPoint - [x,y] en coordonnées grille
 * @param {Object} params - Paramètres transformation {scale, offsetX, offsetY, ...}
 * @returns {Array} [x2D, y2D] coordonnées 2D finales
 */
function createSurface(gridPoint, params = {}) {
  const [gridX, gridY] = gridPoint;
  
  // Paramètres par défaut
  const {
    scale = 10,        // Échelle base
    offsetX = 0,       // Décalage X
    offsetY = 0,       // Décalage Y
    rotationAngle = 0  // Rotation éventuelle
  } = params;
  
  // Transformation linéaire de base : grille → 2D
  let x2D = gridX * scale + offsetX;
  let y2D = gridY * scale + offsetY;
  
  // Rotation optionnelle
  if (rotationAngle !== 0) {
    const cos = Math.cos(rotationAngle);
    const sin = Math.sin(rotationAngle);
    const newX = x2D * cos - y2D * sin;
    const newY = x2D * sin + y2D * cos;
    x2D = newX;
    y2D = newY;
  }
  
  return [x2D, y2D];
}

/**
 * Applique createSurface à toute une case (4 points)
 * @param {Array} case_quad - [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]
 * @param {Object} params - Paramètres transformation
 * @returns {Array} Case transformée [[x2D0,y2D0], ...]
 */
function transformCase(case_quad, params = {}) {
  return case_quad.map(gridPoint => createSurface(gridPoint, params));
}

/**
 * Applique transformation à tout le maillage
 * @param {Object} maillage - Structure {all, width, height}
 * @param {Object} params - Paramètres transformation
 * @returns {Object} Maillage transformé {all: [...], width, height, transformed: true}
 */
function transformMesh(maillage, params = {}) {
  const transformedCases = maillage.all.map(case_quad => 
    transformCase(case_quad, params)
  );
  
  return {
    ...maillage,
    all: transformedCases,
    transformed: true,
    params: params
  };
}

/**
 * Utilitaire debug : affiche une case
 * @param {Array} case_quad - Case à afficher
 * @param {number} index - Index case (optionnel)
 */
function debugCase(case_quad, index = -1) {
  const prefix = index >= 0 ? `Case[${index}]` : 'Case';
  console.log(`❌ [debugCase][mesh_standalone.js] ${prefix}: ${JSON.stringify(case_quad)}`);
}

/**
 * Utilitaire debug : statistiques maillage
 * @param {Object} maillage - Maillage à analyser
 */
function debugMesh(maillage) {
  console.log(`❌ [debugMesh][mesh_standalone.js] Maillage ${maillage.width}x${maillage.height} = ${maillage.totalCases} cases`);
  
  if (maillage.all.length > 0) {
    console.log(`❌ [debugMesh][mesh_standalone.js] Première case: ${JSON.stringify(maillage.all[0])}`);
    console.log(`❌ [debugMesh][mesh_standalone.js] Dernière case: ${JSON.stringify(maillage.all[maillage.all.length - 1])}`);
  }
  
  if (maillage.transformed) {
    console.log(`❌ [debugMesh][mesh_standalone.js] Transformé avec params: ${JSON.stringify(maillage.params)}`);
  }
}

// === TEST AUTOMATIQUE AU CHARGEMENT ===
console.log('\n=== AUTO-TEST MESH STANDALONE ===');

// Test simple
const maillageTest = createMesh(3, 2);
debugMesh(maillageTest);
debugCase(maillageTest.all[0], 0);

// Test transformation
const params = { scale: 20, offsetX: 100, offsetY: 50 };
const caseTransformee = transformCase(maillageTest.all[0], params);
console.log(`❌ [auto-test][mesh_standalone.js] Case transformée: ${JSON.stringify(caseTransformee)}`);

console.log('=== AUTO-TEST TERMINÉ ===\n'); 