// File: panel-iso.js - Panneau isométrique (logique)
// Desc: En français, dans l'architecture, je suis le module JS du panneau isométrique (drag, rollover, reset, etc.)
// Version 1.2.6
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 20:00 UTC+1
// Logs:
//   - v1.2.6: Seuil clic vs drag augmenté à 300ms
//   - v1.2.5: Correction timing clic vs drag - seuil 100ms et isClick conservé jusqu'au click
//   - v1.2.4: Correction debug avec fonction pdPanel() pour éviter redirection translations.js
//   - v1.2.3: Correction largeur fixe 85px et debug amélioré pour verrouillage
//   - v1.2.2: Ajout debug complet pour diagnostiquer détection clic vs drag
//   - v1.2.1: Amélioration détection clic vs drag avec timer 30ms
//   - v1.2.0: Ajout objet PanelIsoState et fonctionnalité clic pour empêcher repliage
//   - v1.1.0: Intégration complète drag, rollover, reset, gestion 2D/3D, largeur dynamique
//   - v1.0.0: Création du module, séparation depuis main.js

// Objet pour gérer l'état du panneau isométrique
class PanelIsoState {
  constructor() {
    this.isLocked = false;        // Empêche le repliage au rollout
    this.isDragging = false;      // En cours de drag
    this.is2D = false;           // Mode 2D/3D
    this.isHovered = false;      // Survolé
    this.panel = null;           // Référence au panneau
    this.dragHandle = null;      // Référence à la zone de drag
  }

  // Verrouiller/déverrouiller le panneau
  toggleLock() {
    this.isLocked = !this.isLocked;
    this.updateVisualState();
    pdPanel('toggleLock', `🔄 Panneau ${this.isLocked ? 'verrouillé' : 'déverrouillé'}`);
    debugPanelState(this.panel);
  }

  // Mettre à jour l'état visuel
  updateVisualState() {
    if (!this.panel) {
      pdPanel('updateVisualState', '❌ Panel null - impossible de mettre à jour');
      return;
    }

    pdPanel('updateVisualState', `🔄 Mise à jour visuelle - isLocked=${this.isLocked}`);

    if (this.isLocked) {
      this.panel.classList.add('locked');
      this.panel.classList.remove('unlocked');
      pdPanel('updateVisualState', '🎨 Classes CSS: locked ajouté, unlocked retiré');
      pdPanel('updateVisualState', `🎨 Classes actuelles: ${this.panel.className}`);
    } else {
      this.panel.classList.add('unlocked');
      this.panel.classList.remove('locked');
      pdPanel('updateVisualState', '🎨 Classes CSS: unlocked ajouté, locked retiré');
      pdPanel('updateVisualState', `🎨 Classes actuelles: ${this.panel.className}`);
    }
    debugPanelState(this.panel);
  }

  // Gestion du mode 2D/3D
  set2DMode(is2D) {
    this.is2D = is2D;
    if (this.panel) {
      if (is2D) {
        this.panel.classList.add('disabled');
      } else {
        this.panel.classList.remove('disabled');
      }
    }
    pdPanel('set2DMode', `Mode ${is2D ? '2D' : '3D'}`);
    debugPanelState(this.panel);
  }

  // Gestion du survol
  setHovered(hovered) {
    this.isHovered = hovered;
    pdPanel('setHovered', `Survol ${hovered ? 'activé' : 'désactivé'}`);
    debugPanelState(this.panel);
  }

  // Gestion du drag
  setDragging(dragging) {
    this.isDragging = dragging;
    if (this.panel) {
      if (dragging) {
        this.panel.classList.add('dragging');
      } else {
        this.panel.classList.remove('dragging');
      }
    }
    pdPanel('setDragging', `Drag ${dragging ? 'activé' : 'désactivé'}`);
    debugPanelState(this.panel);
  }
}

// Instance globale de l'état du panneau
const panelState = new PanelIsoState();

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
  positionPanelBottomCanvas();
  window.addEventListener('resize', positionPanelBottomCanvas);
  // Observer le canvas pour repositionner dynamiquement le panneau
  const canvas = document.getElementById('canvas');
  if (canvas && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      positionPanelBottomCanvas();
    });
    ro.observe(canvas);
  }

  // Initialiser l'état
  panelState.panel = panel;
  panelState.dragHandle = panel.querySelector('.drag-handle');
  pdPanel('initPanelIso', `Panel trouvé: ${panel ? 'OUI' : 'NON'}`);
  pdPanel('initPanelIso', `Drag handle trouvé: ${panelState.dragHandle ? 'OUI' : 'NON'}`);

  // Largeur fixe à 85px comme demandé
  panel.style.width = '85px';
  panel.style.minWidth = '85px';
  panel.style.maxWidth = '85px';

  // Drag & drop du panneau
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let mouseDownTime = 0;
  let isClick = false;

  const dragHandle = panelState.dragHandle;
  pdPanel('initPanelIso', `Drag handle trouvé: ${dragHandle ? 'OUI' : 'NON'}`);
  
  if (dragHandle) {
    pdPanel('initPanelIso', 'Attachement des événements mousedown, click, mousemove, mouseup');
    
          dragHandle.addEventListener('mousedown', (e) => {
        mouseDownTime = Date.now();
        isClick = true;
        panelState.setDragging(true);
        const rect = panel.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        panel.style.transition = 'none';
        document.body.style.userSelect = 'none';
        dragHandle.style.cursor = 'grabbing';
        pdPanel('mousedown', `MouseDown - isClick=${isClick}, time=${mouseDownTime}`);
      });

    // Clic sur la zone de drag pour verrouiller/déverrouiller
    dragHandle.addEventListener('click', (e) => {
      pdPanel('click', '🎯 ÉVÉNEMENT CLICK DÉCLENCHÉ');
      const clickDuration = Date.now() - mouseDownTime;
      const wasClick = isClick; // Sauvegarder l'état avant traitement
      
      pdPanel('click', `Click event - duration=${clickDuration}ms, isClick=${isClick}, isDragging=${panelState.isDragging}`);
      
      // Si < 300ms, c'est un clic normal (pas un drag)
      if (clickDuration < 300 && wasClick) {
        pdPanel('click', `✅ Clic détecté (${clickDuration}ms) - Appel toggleLock()`);
        panelState.toggleLock();
        pdPanel('click', `✅ Verrouillage basculé - isLocked=${panelState.isLocked}`);
        e.stopPropagation();
        e.preventDefault();
      } else {
        pdPanel('click', `❌ Clic ignoré (${clickDuration}ms) - isClick=${wasClick} - Probablement un drag`);
      }
      
      // Réinitialiser isClick après traitement
      isClick = false;
      pdPanel('click', `🔄 isClick réinitialisé à false`);
    });
    
    pdPanel('initPanelIso', '✅ Événement click attaché au drag handle');

    document.addEventListener('mousemove', (e) => {
      if (!panelState.isDragging) return;
      
      // Si on bouge la souris, ce n'est plus un clic
      if (isClick) {
        pdPanel('mousemove', `MouseMove - isClick changé de true à false`);
        isClick = false;
      }
      
      panel.style.left = (e.clientX - dragOffsetX) + 'px';
      panel.style.top = (e.clientY - dragOffsetY) + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (panelState.isDragging) {
        const wasClick = isClick;
        panelState.setDragging(false);
        dragHandle.style.cursor = 'grab';
        document.body.style.userSelect = '';
        // Ne pas réinitialiser isClick ici, laisser l'événement click le faire
        pdPanel('mouseup', `MouseUp - wasClick=${wasClick}, isClick=${isClick} (conservé pour click)`);
      }
    });
  }

  // Gestion du survol pour le rollover
  panel.addEventListener('mouseenter', () => {
    panelState.setHovered(true);
    pdPanel('hover', `MouseEnter - isLocked=${panelState.isLocked}`);
    // Si verrouillé, pas de rollover
    if (panelState.isLocked) {
      pdPanel('hover', '🚫 Survol ignoré (panneau verrouillé)');
      return;
    }
  });

  panel.addEventListener('mouseleave', () => {
    panelState.setHovered(false);
    pdPanel('hover', `MouseLeave - isLocked=${panelState.isLocked}`);
    // Si verrouillé, pas de rollout
    if (panelState.isLocked) {
      pdPanel('hover', '🚫 Rollout ignoré (panneau verrouillé)');
      return;
    }
  });

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

  // Gestion mode 2D/3D (disabled, B&W, curseur, etc.)
  function updatePanelState(is2D) {
    panelState.set2DMode(is2D);
  }
  
  // Hook pour l'extérieur
  if (typeof options.is2D === 'function') {
    updatePanelState(options.is2D());
  } else if (typeof window.currentSurface !== 'undefined') {
    updatePanelState(window.currentSurface === 'plane');
  }
  
  // Permettre de mettre à jour dynamiquement
  window.updatePanelIsoState = updatePanelState;

  // Optionnel : hook pour drag custom
  if (typeof options.onDrag === 'function') {
    // À brancher si besoin
  }

  // Initialiser l'état visuel
  panelState.updateVisualState();

  pdPanel('initPanelIso', '✅ Initialisation complète panneau isométrique avec état');
  pdPanel('initPanelIso', `État initial: isLocked=${panelState.isLocked}, is2D=${panelState.is2D}`);
}

// Fonction de debug globale si absente
globalThis.pd = globalThis.pd || function pd(f, file, msg) {
  console.log(`❌ [${f}][${file}] ${msg}`);
};

// Fonction de debug spécifique pour panel-iso.js
function pdPanel(f, msg) {
  console.log(`🎯 [${f}][panel-iso.js] ${msg}`);
} 

// Debug visuel et console pour le panneau isométrique
function debugPanelState(panel) {
  if (!panel) return;
  const classes = panel.className;
  const height = panel.offsetHeight;
  const grid = panel.querySelector('.translation-grid');
  const rot = panel.querySelector('.rotation-controls');
  const gridVisible = grid && window.getComputedStyle(grid).opacity !== '0';
  const rotVisible = rot && window.getComputedStyle(rot).opacity !== '0';
  console.log(`[PANEL DEBUG] classes=${classes} | height=${height}px | gridVisible=${gridVisible} | rotVisible=${rotVisible}`);
  // Suppression de tout outline JS
  panel.style.outline = 'none';
} 