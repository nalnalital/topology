// File: interface.js - Génération dynamique des boutons de topologie
// Desc: Génère les boutons de topologie à partir des exports topologyIcon des modules surfaces/*.js
// Version 1.0.1
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.0.1: Ajout import renderTopologyIcon depuis shape-selector.js
//   - v1.0.0: Génération dynamique des boutons de topologie (plus de pictos en dur)

import { renderTopologyIcon } from './shape-selector.js';

// Liste des surfaces à afficher à gauche (deux colonnes) et à droite (classiques)
const leftSurfaces = [
  'plane','mobius','cylinder','klein', 'torus', 'projective','', 'crosscap'
];
const rightSurfaces = [
  'disk', 'sphere', 'boy'
];

function getQuotientColor(identification) {
  // identification: array d'objets {edge1, edge2, orientation}
  if (!Array.isArray(identification) || identification.length === 0) return '#aaaaaa'; // gris
  // Compter le nombre de paires
  const n = identification.length;
  if (n === 1) return '#4caf50'; // vert (2 côtés identifiés)
  if (n === 2) return '#ffd600'; // jaune (4 côtés identifiés)
  return '#aaaaaa'; // fallback gris
}

function getSideColor(icon) {
  if (!icon || icon.trim() === '') return '#e0e0e0'; // gris clair
  const doubleArrows = ['⏫','⏬','⏩','⏪','⏭️','⏮️'];
  if (doubleArrows.includes(icon)) return '#ffd600'; // jaune
  return '#009900'; // vert foncé (toute autre flèche)
}

// Génère dynamiquement les boutons de topologie
export async function buildTopologyButtons() {
  // Import dynamique des modules (ignorer les entrées vides)
  const allSurfaces = [...leftSurfaces, ...rightSurfaces].filter(name => name && name.trim() !== '');
  const modules = {};
  for (const name of allSurfaces) {
    modules[name] = await import(`./surfaces/${name}.js`);
  }

  // Génération colonne gauche avec organisation spécifique
  const leftGrid = document.querySelector('.left-shapes-grid');
  if (leftGrid) leftGrid.innerHTML = '';
  
  // Organisation spécifique : 2 colonnes, crosscap sous projective
  const leftOrganized = [
    ['plane', 'mobius'],
    ['cylinder', 'klein'],
    ['torus', 'projective'],
    ['', 'crosscap']
  ];
  
  for (const row of leftOrganized) {
    for (const name of row) {
      // Ignorer les entrées vides
      if (!name || name.trim() === '') {
        // Créer un div vide pour maintenir la grille
        const emptyDiv = document.createElement('div');
        emptyDiv.style.visibility = 'hidden';
        leftGrid.appendChild(emptyDiv);
        continue;
      }
      
      const icon = modules[name].topologyIcon;
      const label = document.createElement('label');
      label.className = 'topology-option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'topology';
      input.value = name;
      label.appendChild(input);
      // Nouveau : conteneur pour l'icône
      const iconContainer = document.createElement('div');
      iconContainer.className = 'topology-icon-container';
      renderTopologyIcon(icon, iconContainer);
      label.appendChild(iconContainer);
      leftGrid.appendChild(label);
    }
  }

  // Génération colonne droite
  const rightDiv = document.querySelector('.right-controls');
  if (rightDiv) {
    // Sauvegarder les drapeaux de langues existants
    const langSelector = rightDiv.querySelector('#langSelectorBottom');
    rightDiv.innerHTML = '';
    // Remettre les drapeaux de langues
    if (langSelector) {
      rightDiv.appendChild(langSelector);
    }
  }
  for (const name of rightSurfaces) {
    // Ignorer les entrées vides
    if (!name || name.trim() === '') continue;
    const icon = modules[name].topologyIcon;
    const label = document.createElement('label');
    label.className = 'topology-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'topology';
    input.value = name;
    label.appendChild(input);
    // Nouveau : conteneur pour l'icône
    const iconContainer = document.createElement('div');
    iconContainer.className = 'topology-icon-container';
    renderTopologyIcon(icon, iconContainer);
    label.appendChild(iconContainer);
    rightDiv.appendChild(label);
  }
}

// Fonction pour afficher les invariants algébriques à droite du titre
export function displayTopologyGroups(surfaceName) {
  console.log('[DEBUG] displayTopologyGroups appelé avec surfaceName:', surfaceName);
  const projectionTitle = document.getElementById('titleCarte');
  console.log('[DEBUG] Élément titleCarte trouvé:', projectionTitle);
  if (!projectionTitle) {
    console.log('[DEBUG] Élément titleCarte non trouvé');
    return;
  }

  // Supprimer l'ancien groupe s'il existe
  const existingGroup = projectionTitle.querySelector('.topology-groups');
  console.log('[DEBUG] Ancien groupe trouvé:', existingGroup);
  if (existingGroup) {
    existingGroup.remove();
    console.log('[DEBUG] Ancien groupe supprimé');
  }

  // Importer dynamiquement la surface pour obtenir les invariants
  console.log('[DEBUG] Tentative d\'import du module:', `./surfaces/${surfaceName}.js`);
  import(`./surfaces/${surfaceName}.js`).then(module => {
    console.log(`[DEBUG] Module chargé pour ${surfaceName}:`, module);
    
    if (!module.algebraicInvariants) {
      console.log(`[DEBUG] Surface ${surfaceName} n'a pas d'invariants algébriques`);
      return;
    }

    console.log(`[DEBUG] Affichage invariants pour ${surfaceName}:`, module.algebraicInvariants);
    console.log(`[DEBUG] Nom de la surface: ${module.algebraicInvariants.name}`);

    // Créer un conteneur principal pour le titre et l'algèbre
    const mainContainer = document.createElement('div');
    mainContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      position: relative;
      z-index: 1000;
      min-height: 40px;
      overflow: visible;
    `;

    // Sauvegarder le titre original avant de le remplacer
    const originalTitle = projectionTitle.textContent;
    
    // Conteneur pour le titre centré
    const titleContainer = document.createElement('div');
    titleContainer.className = 'title-carte';
    
    // Utiliser le titre original
    titleContainer.textContent = originalTitle;

    // Conteneur pour l'algèbre à droite
    const algebraContainer = document.createElement('div');
    algebraContainer.className = 'topology-groups';
    algebraContainer.style.cssText = `
      position: absolute;
      left: 70%;
      top: -90px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      font-family: 'Times New Roman', serif;
      font-size: 1.0em;
      color: #000;
      background: rgba(255, 255, 255, 0.95);
      padding: 8px 12px;
      border-radius: 8px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      backdrop-filter: blur(5px);
      z-index: 1001;
      min-width: 120px;
      border: 1px solid #ddd;
    `;

    // Afficher le nom de la surface et tous les invariants en colonne
    const invariants = module.algebraicInvariants;
    
    // Ajouter le nom de la surface en premier
    if (invariants.name) {
      const nameDiv = document.createElement('div');
      nameDiv.style.cssText = `
        font-weight: bold;
        font-size: 1.2em;
        color: #2c3e50;
        margin-bottom: 8px;
        text-align: center;
        border-bottom: 1px solid #ddd;
        padding-bottom: 4px;
      `;
      nameDiv.textContent = invariants.name;
      algebraContainer.appendChild(nameDiv);
    }
    
    const labels = [
      { key: 'pi1', symbol: 'π₁' },
      { key: 'chi', symbol: 'χ' },
      { key: 'H2', symbol: 'H₂' },
      { key: 'orientable', symbol: 'ω' }
    ];

    labels.forEach(({ key, symbol }) => {
      if (invariants[key] !== undefined) {
        const invariantDiv = document.createElement('div');
        invariantDiv.style.cssText = `
          display: flex;
          align-items: baseline;
          margin: 2px 0;
          white-space: nowrap;
        `;

        const symbolSpan = document.createElement('span');
        symbolSpan.textContent = symbol;
        symbolSpan.style.cssText = `
          font-size: ${symbol === 'π₁' ? '1.3em' : symbol === 'ω' ? '1.4em' : '1.1em'};
          color: #000;
          margin-right: 2px;
          min-width: 20px;
          font-weight: 100;
          line-height: 1;
          transform: ${symbol === 'π₁' ? 'translateY(-2px)' : symbol === 'χ' ? 'translateY(-4px)' : 'none'};
        `;

        const separator = document.createElement('span');
        separator.textContent = '=';
        separator.style.cssText = `
          font-size: 1.1em;
          color: #000;
          margin: 0 2px;
          font-weight: bold;
          line-height: 1;
        `;

        const valueSpan = document.createElement('span');
        valueSpan.textContent = invariants[key];
        valueSpan.style.cssText = `
          font-weight: bold;
          font-size: 1.1em;
          line-height: 1;
        `;

        invariantDiv.appendChild(symbolSpan);
        invariantDiv.appendChild(separator);
        invariantDiv.appendChild(valueSpan);
        algebraContainer.appendChild(invariantDiv);
      }
    });

    // Assembler le tout
    mainContainer.appendChild(titleContainer);
    mainContainer.appendChild(algebraContainer);

    // Remplacer le contenu de projectionTitle par le nouveau conteneur
    console.log('[DEBUG] Tentative de remplacement du contenu de titleCarte');
    console.log('[DEBUG] Contenu du mainContainer:', mainContainer.outerHTML);
    projectionTitle.innerHTML = '';
    projectionTitle.appendChild(mainContainer);
    console.log('[DEBUG] Contenu de titleCarte remplacé avec succès');
    console.log('[DEBUG] Contenu final de titleCarte:', projectionTitle.innerHTML);
  }).catch(error => {
    console.log(`[DEBUG] Erreur import surface ${surfaceName}:`, error);
  });
}

// À appeler au chargement du DOM :
// import { buildTopologyButtons } from './interface.js';
// buildTopologyButtons(); 