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

// À appeler au chargement du DOM :
// import { buildTopologyButtons } from './interface.js';
// buildTopologyButtons(); 