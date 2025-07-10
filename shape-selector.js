// File: shape-selector.js - Shape selection UI and quotient map visualization
// Desc: Gère l'interface de sélection des formes topologiques et l'affichage des diagrammes de quotient.
// Version 3.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [17:30 UTC+1]
// Logs:
//   - CRITICAL REFACTOR: SVG generation removed. Now uses simple div border styling.
//   - Logic simplified to dynamically change border colors based on surface identification data.

class ShapeSelector {
    constructor(surfaceData, onShapeChange) {
        this.surfaceData = surfaceData;
        this.onShapeChange = onShapeChange;
        this.colors = [COLOR1, COLOR2]; // Vert, Bleu
        this.initShapeButtons();
        this.createQuotientVisuals();
    }

    initShapeButtons() {
        const shapeButtons = document.querySelectorAll('input[name="topology"]');
        shapeButtons.forEach(button => {
            button.addEventListener('change', (event) => {
                if (event.target.checked) {
                    const surfaceName = event.target.value;
                    this.onShapeChange(surfaceName);
                }
            });
        });
    }

    createQuotientVisuals() {
        console.log("--- createQuotientVisuals ---");
        const shapeLabels = document.querySelectorAll('.topology-option');
        
        shapeLabels.forEach(label => {
            const input = label.querySelector('input[name="topology"]');
            if (!input) return;

            const surfaceName = input.value;
            const surfaceInfo = this.surfaceData[surfaceName];
            const quotientContainer = label.querySelector('.quotient-container');

            if (quotientContainer && surfaceInfo && surfaceInfo.topologyIcon) {
                console.log(`[${surfaceName}] Conteneur trouvé. Application des styles...`);
                this.applyQuotientStyles(quotientContainer, surfaceInfo.topologyIcon);
            }
        });
    }

    applyQuotientStyles(container, topologyIcon) {
        // Reset styles first
        container.style.borderTopColor = '';
        container.style.borderRightColor = '';
        container.style.borderBottomColor = '';
        container.style.borderLeftColor = '';

        if (!topologyIcon || topologyIcon.shape !== 'square') {
            console.log(` -> Pas d'icône carrée. Bordures par défaut.`);
            return;
        }
        
        // Analyser les flèches pour déterminer les identifications
        const identifications = this.analyzeArrows(topologyIcon);
        
        if (identifications.length === 0) {
            console.log(` -> Aucune identification trouvée. Bordures grises.`);
            // Pas de quotient = bordures grises
            container.style.borderTopColor = '#e0e0e0';
            container.style.borderRightColor = '#e0e0e0';
            container.style.borderBottomColor = '#e0e0e0';
            container.style.borderLeftColor = '#e0e0e0';
            return;
        }
        
        console.log(` -> Application des couleurs pour ${identifications.length} paire(s).`);
        identifications.forEach((pair, index) => {
            const color = this.colors[index % this.colors.length];
            console.log(`   Paire ${index+1}: ${pair.edge1}/${pair.edge2} -> ${color}`);
            
            // Capitalize for style property name (e.g., 'top' -> 'Top')
            const capEdge1 = pair.edge1.charAt(0).toUpperCase() + pair.edge1.slice(1);
            const capEdge2 = pair.edge2.charAt(0).toUpperCase() + pair.edge2.slice(1);

            container.style[`border${capEdge1}Color`] = color;
            container.style[`border${capEdge2}Color`] = color;
        });
    }

    analyzeArrows(topologyIcon) {
        const identifications = [];
        const edges = ['top', 'right', 'bottom', 'left'];
        const arrows = [topologyIcon.top, topologyIcon.right, topologyIcon.bottom, topologyIcon.left];
        
        // Cas spécial pour le plan projectif : 2 côtés verts consécutifs, puis 2 côtés jaunes consécutifs
        if (topologyIcon.center === '🍎') {
            // Plan projectif : top+right (verts), bottom+left (jaunes)
            identifications.push({
                edge1: 'top',
                edge2: 'right',
                orientation: 'same'
            });
            identifications.push({
                edge1: 'bottom',
                edge2: 'left',
                orientation: 'same'
            });
            return identifications;
        }
        
        // Cas spécial pour le ruban de Möbius : identification left-right
        if (topologyIcon.center === '♾️') {
            // Ruban de Möbius : left+right (identification avec torsion)
            identifications.push({
                edge1: 'left',
                edge2: 'right',
                orientation: 'opposite'
            });
            return identifications;
        }
        
        // Classer les flèches par type (simples vs doubles)
        const simpleArrows = ['▶️', '◀️', '🔼', '🔽', '⏩', '⏪'];
        const doubleArrows = ['⏫', '⏬', '⏭️', '⏮️'];
        
        const simpleEdges = [];
        const doubleEdges = [];
        
        edges.forEach((edge, index) => {
            const arrow = arrows[index];
            if (arrow && arrow.trim() !== '') {
                if (simpleArrows.includes(arrow)) {
                    simpleEdges.push(edge);
                } else if (doubleArrows.includes(arrow)) {
                    doubleEdges.push(edge);
                }
            }
        });
        
        // Créer les identifications pour chaque classe de flèches
        if (simpleEdges.length >= 2) {
            identifications.push({
                edge1: simpleEdges[0],
                edge2: simpleEdges[1],
                orientation: 'same'
            });
        }
        
        if (doubleEdges.length >= 2) {
            identifications.push({
                edge1: doubleEdges[0],
                edge2: doubleEdges[1],
                orientation: 'same'
            });
        }
        
        return identifications;
    }
}

// === Ajout rendu icône topologique ===

// Couleurs officielles (vert et bleu)
const COLOR1 = '#009900';
const COLOR2 = '#FFD600';

/**
 * Dessine une icône topologique (carré ou cercle segmenté) dans le conteneur donné.
 * @param {object} icon - L'objet topologyIcon de la surface
 * @param {HTMLElement} container - Le conteneur DOM où dessiner
 */
export function renderTopologyIcon(icon, container) {
  container.innerHTML = '';
  if (icon.shape === 'circle') {
    // Cercle avec bordures dégradées
    const div = document.createElement('div');
    div.className = 'quotient-container circle';
    div.style.background = 'none';
    div.style.width = '38px';
    div.style.height = '38px';
    div.style.borderRadius = '50%';
    div.style.border = '1px solid transparent';
    div.style.position = 'relative';
    div.style.boxSizing = 'border-box';
    
    // Analyser les segments pour déterminer les secteurs et orientations
    const segments = Array.isArray(icon.segments) ? icon.segments : [1, 1];
    const n = segments.length;
    
    // Créer un conteneur pour les dégradés de bordure
    const borderGradient = document.createElement('div');
    borderGradient.style.position = 'absolute';
    borderGradient.style.top = '-15px';
    borderGradient.style.left = '-15px';
    borderGradient.style.width = 'calc(100% + 30px)';
    borderGradient.style.height = 'calc(100% + 30px)';
    borderGradient.style.borderRadius = '50%';
    borderGradient.style.zIndex = '1';
    
    // Créer le dégradé conique basé sur segments[i]
    let gradientStops = '';
    for (let i = 0; i < n; i++) {
      const startAngle = (i / n) * 360;
      const endAngle = ((i + 1) / n) * 360;
      const midAngle = (startAngle + endAngle) / 2;
      
      // Dégradé selon segments[i] : 1 = normal, -1 = inversé, 0 = gris, 2 = vert, -2 = jaune
      if (segments[i] === 1) {
        gradientStops += `${COLOR2} ${startAngle}deg, ${COLOR2} ${midAngle - 80}deg, ${COLOR1} ${midAngle + 90}deg, ${COLOR1} ${endAngle}deg, `;
      } else if (segments[i] === -1) {
        gradientStops += `${COLOR1} ${startAngle}deg, ${COLOR1} ${midAngle - 90}deg, ${COLOR2} ${midAngle + 80}deg, ${COLOR2} ${endAngle}deg, `;
      } else if (segments[i] === 0) {
        gradientStops += `#e0e0e0 ${startAngle}deg, #e0e0e0 ${endAngle}deg, `;
      } else if (segments[i] === 2) {
        gradientStops += `${COLOR1} ${startAngle}deg, ${COLOR1} ${endAngle}deg, `;
      } else if (segments[i] === -2) {
        gradientStops += `${COLOR2} ${startAngle}deg, ${COLOR2} ${endAngle}deg, `;
      } else {
        gradientStops += `#e0e0e0 ${startAngle}deg, #e0e0e0 ${endAngle}deg, `;
      }
    }
    
    // Enlever la virgule finale et créer le dégradé
    gradientStops = gradientStops.slice(0, -2);
    borderGradient.style.background = `conic-gradient(${gradientStops})`;
    
    // Masquer la partie centrale pour créer l'effet de bordure
    borderGradient.style.mask = `radial-gradient(circle at center, transparent 63%, black 63%)`;
    borderGradient.style.webkitMask = `radial-gradient(circle at center, transparent 63%, black 63%)`;
    
    div.appendChild(borderGradient);
    
    // Icône centrale
    if (icon.center) {
      const centerIcon = document.createElement('div');
      centerIcon.style.position = 'absolute';
      centerIcon.style.top = '50%';
      centerIcon.style.left = '50%';
      centerIcon.style.transform = 'translate(-50%, -50%)';
      centerIcon.style.fontSize = '18px';
      centerIcon.style.zIndex = '2';
      centerIcon.textContent = icon.center;
      div.appendChild(centerIcon);
    }
    
    container.appendChild(div);
  } else {
    // Carré classique avec bordures colorées
    const div = document.createElement('div');
    div.className = 'quotient-container';
    div.style.background = 'none';
    // Pas de couleurs par défaut - sera géré par applyQuotientStyles
    container.appendChild(div);
    // Flèches et centre
    const span = document.createElement('span');
    span.className = 'topology-visual cross-pattern';
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
    container.appendChild(span);
    
    // Appliquer les couleurs des bordures basées sur les flèches
    const tempSelector = new ShapeSelector({}, () => {});
    tempSelector.applyQuotientStyles(div, icon);
  }
}

export { ShapeSelector }; 