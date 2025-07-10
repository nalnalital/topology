// File: panel-manager.js - Gestionnaire centralisé des panneaux flottants
// Desc: En français, dans l'architecture, je suis le module centralisé de gestion des panneaux (drag, position, resize, lock, etc.)
// Version 1.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 20:30 UTC+1
// Logs:
//   - v1.0.0: Création du module, centralisation de la gestion des panneaux

// Classe pour gérer l'état d'un panneau
class PanelState {
  constructor(panelId, options = {}) {
    this.panelId = panelId;
    this.panel = null;
    this.dragHandle = null;
    this.isLocked = false;
    this.isDragging = false;
    this.isHovered = false;
    this.isDisabled = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.mouseDownTime = 0;
    this.isClick = false;
    this.clickThreshold = options.clickThreshold || 300; // ms
    this.defaultPosition = options.defaultPosition || 'bottom-left';
    this.defaultWidth = options.defaultWidth || '85px';
    this.defaultHeight = options.defaultHeight || 'auto';
    this.margin = options.margin || 20;
    
    this.init();
  }

  init() {
    this.panel = document.getElementById(this.panelId);
    if (!this.panel) {
      pdManager('init', `❌ Panneau ${this.panelId} introuvable`);
      return;
    }

    this.dragHandle = this.panel.querySelector('.drag-handle');
    if (!this.dragHandle) {
      pdManager('init', `❌ Drag handle pour ${this.panelId} introuvable`);
      return;
    }

    // Appliquer les dimensions par défaut
    this.panel.style.width = this.defaultWidth;
    this.panel.style.minWidth = this.defaultWidth;
    this.panel.style.maxWidth = this.defaultWidth;
    if (this.defaultHeight !== 'auto') {
      this.panel.style.height = this.defaultHeight;
    }

    // Positionner le panneau
    this.positionPanel();

    // Attacher les événements
    this.attachEvents();

    pdManager('init', `✅ Panneau ${this.panelId} initialisé`);
  }

  positionPanel() {
    if (!this.panel) return;

    switch (this.defaultPosition) {
      case 'bottom-left':
        this.positionBottomLeft();
        break;
      case 'bottom-right':
        this.positionBottomRight();
        break;
      case 'top-left':
        this.positionTopLeft();
        break;
      case 'top-right':
        this.positionTopRight();
        break;
      default:
        this.positionBottomLeft();
    }
  }

  positionBottomLeft() {
    const canvas = document.getElementById('canvas');
    if (canvas) {
      // Positionner par rapport au canvas
      const parent = this.panel.offsetParent || this.panel.parentElement;
      const parentRect = parent.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const top = (canvasRect.bottom - parentRect.top) - this.panel.offsetHeight - this.margin;
      this.panel.style.top = top + 'px';
      this.panel.style.left = this.margin + 'px';
      this.panel.style.bottom = '';
      this.panel.style.right = '';
    } else {
      // Positionner par rapport à la fenêtre
      const top = window.innerHeight - this.panel.offsetHeight - this.margin;
      this.panel.style.top = top + 'px';
      this.panel.style.left = this.margin + 'px';
      this.panel.style.bottom = '';
      this.panel.style.right = '';
    }
  }

  positionBottomRight() {
    const canvas = document.getElementById('canvas');
    if (canvas) {
      const parent = this.panel.offsetParent || this.panel.parentElement;
      const parentRect = parent.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const top = (canvasRect.bottom - parentRect.top) - this.panel.offsetHeight - this.margin;
      this.panel.style.top = top + 'px';
      this.panel.style.right = this.margin + 'px';
      this.panel.style.bottom = '';
      this.panel.style.left = '';
    } else {
      const top = window.innerHeight - this.panel.offsetHeight - this.margin;
      this.panel.style.top = top + 'px';
      this.panel.style.right = this.margin + 'px';
      this.panel.style.bottom = '';
      this.panel.style.left = '';
    }
  }

  positionTopLeft() {
    this.panel.style.top = this.margin + 'px';
    this.panel.style.left = this.margin + 'px';
    this.panel.style.bottom = '';
    this.panel.style.right = '';
  }

  positionTopRight() {
    this.panel.style.top = this.margin + 'px';
    this.panel.style.right = this.margin + 'px';
    this.panel.style.bottom = '';
    this.panel.style.left = '';
  }

  attachEvents() {
    if (!this.dragHandle) return;

    // Mousedown pour commencer le drag
    this.dragHandle.addEventListener('mousedown', (e) => {
      this.mouseDownTime = Date.now();
      this.isClick = true;
      this.setDragging(true);
      
      const rect = this.panel.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
      
      this.panel.style.transition = 'none';
      document.body.style.userSelect = 'none';
      this.dragHandle.style.cursor = 'grabbing';
      
      pdManager('mousedown', `MouseDown sur ${this.panelId} - isClick=${this.isClick}`);
    });

    // Click pour verrouiller/déverrouiller
    this.dragHandle.addEventListener('click', (e) => {
      const clickDuration = Date.now() - this.mouseDownTime;
      const wasClick = this.isClick;
      
      pdManager('click', `Click sur ${this.panelId} - duration=${clickDuration}ms, isClick=${this.isClick}`);
      
      if (clickDuration < this.clickThreshold && wasClick) {
        this.toggleLock();
        e.stopPropagation();
        e.preventDefault();
      }
      
      this.isClick = false;
    });

    // Mousemove pour le drag
    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      const x = e.clientX - this.dragOffsetX;
      const y = e.clientY - this.dragOffsetY;
      
      this.panel.style.left = x + 'px';
      this.panel.style.top = y + 'px';
      this.panel.style.right = '';
      this.panel.style.bottom = '';
      
      // Si on bouge, ce n'est plus un clic
      if (this.isClick) {
        const moveDistance = Math.sqrt(
          Math.pow(e.clientX - (this.mouseDownTime), 2) + 
          Math.pow(e.clientY - (this.mouseDownTime), 2)
        );
        if (moveDistance > 5) {
          this.isClick = false;
        }
      }
    });

    // Mouseup pour finir le drag
    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.setDragging(false);
        this.panel.style.transition = '';
        document.body.style.userSelect = '';
        this.dragHandle.style.cursor = '';
        pdManager('mouseup', `MouseUp sur ${this.panelId} - drag terminé`);
      }
    });

    // Rollover pour ouvrir/fermer
    this.panel.addEventListener('mouseenter', () => {
      this.setHovered(true);
      if (!this.isLocked) {
        this.expand();
      }
    });

    this.panel.addEventListener('mouseleave', () => {
      this.setHovered(false);
      if (!this.isLocked) {
        this.collapse();
      }
    });
  }

  toggleLock() {
    this.isLocked = !this.isLocked;
    this.updateVisualState();
    pdManager('toggleLock', `🔄 Panneau ${this.panelId} ${this.isLocked ? 'verrouillé' : 'déverrouillé'}`);
  }

  updateVisualState() {
    if (!this.panel) return;

    if (this.isLocked) {
      this.panel.classList.add('locked');
      this.panel.classList.remove('unlocked');
    } else {
      this.panel.classList.add('unlocked');
      this.panel.classList.remove('locked');
    }

    if (this.isDragging) {
      this.panel.classList.add('dragging');
    } else {
      this.panel.classList.remove('dragging');
    }

    if (this.isDisabled) {
      this.panel.classList.add('disabled');
    } else {
      this.panel.classList.remove('disabled');
    }
  }

  setDragging(dragging) {
    this.isDragging = dragging;
    this.updateVisualState();
    pdManager('setDragging', `Drag ${this.panelId} ${dragging ? 'activé' : 'désactivé'}`);
  }

  setHovered(hovered) {
    this.isHovered = hovered;
    pdManager('setHovered', `Survol ${this.panelId} ${hovered ? 'activé' : 'désactivé'}`);
  }

  setDisabled(disabled) {
    this.isDisabled = disabled;
    this.updateVisualState();
    pdManager('setDisabled', `Panneau ${this.panelId} ${disabled ? 'désactivé' : 'activé'}`);
  }

  expand() {
    if (this.panel) {
      this.panel.classList.add('expanded');
      this.panel.classList.remove('collapsed');
      pdManager('expand', `Panneau ${this.panelId} déplié`);
    }
  }

  collapse() {
    if (this.panel) {
      this.panel.classList.add('collapsed');
      this.panel.classList.remove('expanded');
      pdManager('collapse', `Panneau ${this.panelId} replié`);
    }
  }

  reset() {
    this.positionPanel();
    pdManager('reset', `Panneau ${this.panelId} repositionné`);
  }
}

// Gestionnaire principal des panneaux
class PanelManager {
  constructor() {
    this.panels = new Map();
    this.resizeObservers = new Map();
  }

  // Enregistrer un nouveau panneau
  registerPanel(panelId, options = {}) {
    if (this.panels.has(panelId)) {
      pdManager('registerPanel', `⚠️ Panneau ${panelId} déjà enregistré`);
      return this.panels.get(panelId);
    }

    const panelState = new PanelState(panelId, options);
    this.panels.set(panelId, panelState);

    // Observer le canvas pour repositionner dynamiquement
    this.observeCanvas(panelId);

    pdManager('registerPanel', `✅ Panneau ${panelId} enregistré`);
    return panelState;
  }

  // Observer le canvas pour repositionner les panneaux
  observeCanvas(panelId) {
    const canvas = document.getElementById('canvas');
    if (!canvas || !('ResizeObserver' in window)) return;

    const panelState = this.panels.get(panelId);
    if (!panelState) return;

    const ro = new ResizeObserver(() => {
      panelState.reset();
    });
    ro.observe(canvas);
    this.resizeObservers.set(panelId, ro);
  }

  // Obtenir un panneau
  getPanel(panelId) {
    return this.panels.get(panelId);
  }

  // Supprimer un panneau
  removePanel(panelId) {
    const panelState = this.panels.get(panelId);
    if (panelState) {
      // Nettoyer l'observer
      const ro = this.resizeObservers.get(panelId);
      if (ro) {
        ro.disconnect();
        this.resizeObservers.delete(panelId);
      }
      
      this.panels.delete(panelId);
      pdManager('removePanel', `✅ Panneau ${panelId} supprimé`);
    }
  }

  // Réinitialiser tous les panneaux
  resetAll() {
    this.panels.forEach(panelState => {
      panelState.reset();
    });
    pdManager('resetAll', 'Tous les panneaux repositionnés');
  }

  // Désactiver/activer tous les panneaux
  setAllDisabled(disabled) {
    this.panels.forEach(panelState => {
      panelState.setDisabled(disabled);
    });
    pdManager('setAllDisabled', `Tous les panneaux ${disabled ? 'désactivés' : 'activés'}`);
  }
}

// Instance globale du gestionnaire
const panelManager = new PanelManager();

// Fonction de debug
function pdManager(f, msg) {
  console.log(`❌ [${f}][panel-manager.js] ${msg}`);
}

// Export pour utilisation dans d'autres modules
export { PanelManager, PanelState, panelManager }; 