// File: panel-iso.js - Panneau isométrique (logique)
// Desc: En français, dans l'architecture, je suis le module JS du panneau isométrique (drag, rollover, reset, etc.)
// Version 1.3.0 (simplification avec panel-manager)
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 20:00 UTC+1
// Logs:
//   - v1.3.0: Suppression logique 2D/3D redondante, maintenant gérée par panel-manager.js
//   - v1.2.6: Seuil clic vs drag augmenté à 300ms
//   - v1.3.1: Panneau déplacé dans document.body pour drag global
//   - v1.2.5: Correction timing clic vs drag - seuil 100ms et isClick conservé jusqu'au click
//   - v1.2.4: Correction debug avec fonction pdPanel() pour éviter redirection translations.js
//   - v1.2.3: Correction largeur fixe 85px et debug amélioré pour verrouillage
//   - v1.2.2: Ajout debug complet pour diagnostiquer détection clic vs drag
//   - v1.2.1: Amélioration détection clic vs drag avec timer 30ms
//   - v1.2.0: Ajout objet PanelIsoState et fonctionnalité clic pour empêcher repliage
//   - v1.1.0: Intégration complète drag, rollover, reset, gestion 2D/3D, largeur dynamique
//   - v1.0.0: Création du module, séparation depuis main.js

import { panelManager } from './panel-manager.js';

// Fonction debug locale
function pdPanel(f, msg) {
  console.log(`❌ [${f}][panel-iso.js] ${msg}`);
}

function positionPanelBottom() {
  const panel = document.getElementById('isometriesPanel');
  if (!panel) return;
  const panelHeight = panel.offsetHeight || 30;
  const top = window.innerHeight - panelHeight - 20;
  panel.style.top = top + 'px';
  panel.style.left = '20px';
  panel.style.bottom = '';
  panel.style.right = '';
}

function positionPanelBottomCanvas() {
  const panel = document.getElementById('isometriesPanel');
  const canvas = document.getElementById('canvas');
  if (!panel || !canvas) return;
  
  // Ne pas repositionner si le panneau est en cours de drag
  const panelState = panelManager.getPanel('isometriesPanel');
  if (panelState && panelState.isDragging) {
    pdPanel('positionPanelBottomCanvas', '⏸️ Repositionnement ignoré (drag en cours)');
    return;
  }
  
  const parent = panel.offsetParent || panel.parentElement;
  const parentRect = parent.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const top = (canvasRect.bottom - parentRect.top) - panel.offsetHeight - 20;
  panel.style.top = top + 'px';
  panel.style.left = '20px';
  panel.style.bottom = '';
  panel.style.right = '';
}

export function initPanelIso(options = {}) {
  const panel = document.getElementById('isometriesPanel');
  if (!panel) {
    pdPanel('initPanelIso', '❌ Panneau isométrique introuvable');
    return;
  }
  // Positionner le panneau en bas à gauche du canvas (flottant)
  // Si le panneau est dans .center-area, le drag s'aligne mal (offsetParent).
  // Le déplacer dans document.body pour obtenir des coordonnées correctes.
  if (panel.parentElement !== document.body) {
    const rect = panel.getBoundingClientRect();
    document.body.appendChild(panel);
    panel.style.position = 'absolute';
    panel.style.left = rect.left + 'px';
    panel.style.top = rect.top + 'px';
    panel.style.right = '';
    panel.style.bottom = '';
    pdPanel('initPanelIso', '✅ Panneau déplacé dans document.body');
  }

  // Recalculer la position par rapport au canvas
  positionPanelBottomCanvas();
  window.addEventListener('resize', positionPanelBottomCanvas);
  // Observer le canvas pour repositionner dynamiquement le panneau
  const canvas = document.getElementById('canvas');
  if (canvas && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      // Ne repositionner que si pas en drag
      positionPanelBottomCanvas();
    });
    ro.observe(canvas);
  }

  // Enregistrer le panneau dans le gestionnaire centralisé (drag, lock)
  const pmState = panelManager.registerPanel('isometriesPanel', {
    defaultPosition: 'bottom-left',
    clickThreshold: 300,
    margin: 20,
    disableIn2D: true // Désactiver automatiquement en mode 2D
  });
  pdPanel('initPanelIso', '✅ Panneau isometriesPanel enregistré dans panel-manager');

  // Reset (bouton recentrer)
  const resetBtn = panel.querySelector('#camCenter');
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof options.onReset === 'function') {
        options.onReset();
        pdPanel('reset', 'Bouton recentrer cliqué (hook onReset)');
      } else if (window.resetToDefaultConfiguration) {
        window.resetToDefaultConfiguration();
        pdPanel('reset', 'Bouton recentrer cliqué (resetToDefaultConfiguration)');
      } else {
        pdPanel('reset', '❌ Aucune fonction de reset trouvée');
      }
    });
  }

  pdPanel('initPanelIso', '✅ Initialisation complète panneau isométrique');
  
  return pmState;
} 