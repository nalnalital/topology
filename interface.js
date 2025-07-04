// File: interface.js - Génération dynamique des boutons de topologie
// Desc: Génère les boutons de topologie à partir des exports topologyIcon des modules surfaces/*.js
// Version 1.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [XX:XX UTC+1]
// Logs:
//   - v1.0.0: Génération dynamique des boutons de topologie (plus de pictos en dur)

// Liste des surfaces à afficher à gauche (quotients) et à droite (classiques)
const leftSurfaces = [
  'cylinder', 'mobius', 'torus', 'projective', 'klein', 'crosscap'
];
const rightSurfaces = [
  'sphere', 'disk', 'boy'
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
  // Import dynamique des modules
  const allSurfaces = [...leftSurfaces, ...rightSurfaces];
  const modules = {};
  for (const name of allSurfaces) {
    modules[name] = await import(`./surfaces/${name}.js`);
  }

  // Génération colonne gauche
  const leftGrid = document.querySelector('.left-shapes-grid');
  if (leftGrid) leftGrid.innerHTML = '';
  for (const name of leftSurfaces) {
    const icon = modules[name].topologyIcon;
    const identification = modules[name].identification;
    const label = document.createElement('label');
    label.className = 'topology-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'topology';
    input.value = name;
    label.appendChild(input);
    // Ajout du carré de fond
    const quotientDiv = document.createElement('div');
    quotientDiv.className = 'quotient-container';
    quotientDiv.style.background = 'none';
    quotientDiv.style.borderTopColor = getSideColor(icon.top);
    quotientDiv.style.borderRightColor = getSideColor(icon.right);
    quotientDiv.style.borderBottomColor = getSideColor(icon.bottom);
    quotientDiv.style.borderLeftColor = getSideColor(icon.left);
    label.appendChild(quotientDiv);
    // Structure quotient
    const span = document.createElement('span');
    span.className = 'topology-visual cross-pattern';
    // Flèches et centre
    const top = document.createElement('span');
    top.className = 'cross-top';
    top.textContent = icon.top || '';
    const leftS = document.createElement('span');
    leftS.className = 'cross-left';
    leftS.textContent = icon.left || '';
    const center = document.createElement('span');
    center.className = 'cross-center';
    center.setAttribute('data-center-icon', '');
    center.textContent = icon.center || '';
    const rightS = document.createElement('span');
    rightS.className = 'cross-right';
    rightS.textContent = icon.right || '';
    const bottom = document.createElement('span');
    bottom.className = 'cross-bottom';
    bottom.textContent = icon.bottom || '';
    span.appendChild(top);
    span.appendChild(leftS);
    span.appendChild(center);
    span.appendChild(rightS);
    span.appendChild(bottom);
    label.appendChild(span);
    leftGrid.appendChild(label);
  }

  // Génération colonne droite
  const rightDiv = document.querySelector('.right-controls');
  if (rightDiv) rightDiv.innerHTML = '';
  for (const name of rightSurfaces) {
    const icon = modules[name].topologyIcon;
    const label = document.createElement('label');
    label.className = 'topology-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'topology';
    input.value = name;
    label.appendChild(input);
    // Icône centrale seule
    const span = document.createElement('span');
    span.className = 'topology-visual';
    span.setAttribute('data-center-icon', '');
    span.textContent = icon.center || '';
    label.appendChild(span);
    rightDiv.appendChild(label);
  }
}

// Fonction pour afficher les invariants algébriques à droite du titre
export function displayTopologyGroups(surfaceName) {
  const projectionTitle = document.getElementById('selectedProjection');
  if (!projectionTitle) {
    console.log('[DEBUG] Élément selectedProjection non trouvé');
    return;
  }

  // Supprimer l'ancien groupe s'il existe
  const existingGroup = projectionTitle.querySelector('.topology-groups');
  if (existingGroup) {
    existingGroup.remove();
  }

  // Importer dynamiquement la surface pour obtenir les invariants
  import(`./surfaces/${surfaceName}.js`).then(module => {
    console.log(`[DEBUG] Module chargé pour ${surfaceName}:`, module);
    
    if (!module.algebraicInvariants) {
      console.log(`[DEBUG] Surface ${surfaceName} n'a pas d'invariants algébriques`);
      return;
    }

    console.log(`[DEBUG] Affichage invariants pour ${surfaceName}:`, module.algebraicInvariants);

    // Créer un conteneur principal pour le titre et l'algèbre
    const mainContainer = document.createElement('div');
    mainContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      position: relative;
      z-index: 1000;
    `;

    // Conteneur pour le titre centré
    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = `
      flex: 1;
      text-align: center;
      font-family: 'Soopafresh', cursive;
      font-size: 1.2em;
      color: #fbc02d;
      text-shadow: 1px 1px 0px #a31a0b, 2px 2px 4px rgba(0,0,0,0.2);
    `;
    
    // En mode 2D, garder le titre original sans modification
    if (surfaceName === 'view2d') {
      titleContainer.textContent = projectionTitle.textContent;
    } else {
      titleContainer.textContent = projectionTitle.textContent;
    }

    // Conteneur pour l'algèbre à droite
    const algebraContainer = document.createElement('div');
    algebraContainer.className = 'topology-groups';
    algebraContainer.style.cssText = `
      position: absolute;
      right: ${surfaceName === 'view2d' ? '200px' : '-190px'};
      bottom: 0;
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
    `;

    // Afficher tous les invariants en colonne
    const invariants = module.algebraicInvariants;
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

    // Remplacer le contenu du titre (sauf en mode 2D)
    if (surfaceName === 'view2d') {
      // En mode 2D, juste ajouter le panneau algèbre sans modifier le titre
      projectionTitle.appendChild(algebraContainer);
    } else {
      // Pour les autres modes, remplacer complètement le contenu
      projectionTitle.innerHTML = '';
      projectionTitle.appendChild(mainContainer);
    }
  }).catch(error => {
    console.log(`[DEBUG] Erreur import surface ${surfaceName}:`, error);
  });
}

// À appeler au chargement du DOM :
// import { buildTopologyButtons } from './interface.js';
// buildTopologyButtons(); 