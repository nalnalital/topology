// File: panel-manager.js - Gestionnaire centralisé des panneaux flottants
// Desc: En français, dans l'architecture, je suis le module centralisé de gestion des panneaux (drag, position, resize, lock, etc.)
// Version 1.3.0 (gestion mode 2D/3D)
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 20:30 UTC+1
// Logs:
//   - v1.3.0: Ajout gestion mode 2D/3D avec détection surface plane et désactivation panneau isométrique
//   - v1.0.0: Création du module, centralisation de la gestion des panneaux
//   - v1.0.1: Enregistrement automatique de isometriesPanel
//   - v1.2.0: Création automatique du drag-handle si absent

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
    this.is2DMode = false;
    this.disableIn2D = options.disableIn2D || false; // Désactiver ce panneau en mode 2D
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.initialMouseX = 0;
    this.initialMouseY = 0;
    this.mouseDownTime = 0;
    this.isClick = false;
    this.clickThreshold = options.clickThreshold || 300; // ms
    this.defaultPosition = options.defaultPosition || 'bottom-left';
    this.defaultWidth = options.defaultWidth; // peut être undefined
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

    // Assurer la présence d'une zone de drag ; la créer si absente
    this.dragHandle = this.panel.querySelector('.drag-handle');
    if (!this.dragHandle) {
      this.dragHandle = document.createElement('div');
      this.dragHandle.className = 'drag-handle';
      this.dragHandle.textContent = '⋮⋮⋮';
      this.panel.insertBefore(this.dragHandle, this.panel.firstChild);
      pdManager('init', `🆕 Drag handle créé pour ${this.panelId}`);
    }

    // Appliquer les dimensions par défaut
    if (this.defaultWidth) {
      this.panel.style.width = this.defaultWidth;
      this.panel.style.minWidth = this.defaultWidth;
      this.panel.style.maxWidth = this.defaultWidth;
    }
    if (this.defaultHeight !== 'auto') {
      this.panel.style.height = this.defaultHeight;
    }

    // Positionnement initial géré désormais uniquement par le CSS (plus de JS).

    // Attacher les événements
    this.attachEvents();

    pdManager('init', `✅ Panneau ${this.panelId} initialisé`);
  }

  // Méthodes de positionnement supprimées : positionPanel / position* (géré par CSS)

  /*
   * positionPanel(), positionBottomLeft(), positionBottomRight(), positionTopLeft(),
   * positionTopRight() supprimés : l'init CSS fixe l'emplacement initial.
   */

  attachEvents() {
    if (!this.dragHandle) return;

    const self = this; // pour accès dans les callbacks

    // Mousedown pour commencer le drag
    this.dragHandle.addEventListener('mousedown', (e) => {
      // Refuser si un autre panneau est déjà en drag
      if (!panelManager.startDrag(self)) return;

      self.mouseDownTime = Date.now();
      self.isClick = true;
      
      // Stocker la position initiale de la souris pour détecter le mouvement
      self.initialMouseX = e.clientX;
      self.initialMouseY = e.clientY;

      // Calculer l'offset par rapport au point de clic exact
      const panelRect = self.panel.getBoundingClientRect();
      
      // Compenser le scroll de la page dans le calcul de l'offset
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      self.dragOffsetX = e.clientX - (panelRect.left + scrollX);
      self.dragOffsetY = e.clientY - (panelRect.top + scrollY);
      
      self.setDragging(true);

      self.panel.style.transition = 'none';
      document.body.style.userSelect = 'none';
      self.dragHandle.style.cursor = 'grabbing';

      pdManager('mousedown', `MouseDown sur ${self.panelId} - offset=(${self.dragOffsetX}, ${self.dragOffsetY})`);
    });

    // Click pour verrouiller/déverrouiller
    this.dragHandle.addEventListener('click', (e) => {
      const clickDuration = Date.now() - self.mouseDownTime;
      const wasClick = self.isClick;
      
      pdManager('click', `Click sur ${self.panelId} - duration=${clickDuration}ms, isClick=${self.isClick}`);
      
      if (clickDuration < self.clickThreshold && wasClick) {
        self.toggleLock();
        e.stopPropagation();
        e.preventDefault();
      }
      
      self.isClick = false;
    });

    // Mousemove pour le drag
    document.addEventListener('mousemove', (e) => {
      if (!self.isDragging) return;
      
      const x = e.clientX - self.dragOffsetX;
      const y = e.clientY - self.dragOffsetY;
      
      // Supprimer explicitement right/bottom pour éviter les conflits avec le CSS
      self.panel.style.right = '';
      self.panel.style.bottom = '';
      self.panel.style.left = x + 'px';
      self.panel.style.top = y + 'px';
      
      // Si on bouge, ce n'est plus un clic
      if (self.isClick) {
        const moveDistance = Math.sqrt(
          Math.pow(e.clientX - self.initialMouseX, 2) + 
          Math.pow(e.clientY - self.initialMouseY, 2)
        );
        if (moveDistance > 5) {
          self.isClick = false;
        }
      }
    });

    // Mouseup pour finir le drag
    document.addEventListener('mouseup', () => {
      if (self.isDragging) {
        self.setDragging(false);
        panelManager.endDrag(self);
        self.panel.style.transition = '';
        document.body.style.userSelect = '';
        self.dragHandle.style.cursor = '';
        pdManager('mouseup', `MouseUp sur ${self.panelId} - drag terminé`);
      }
    });

    // Rollover pour ouvrir/fermer
    this.panel.addEventListener('mouseenter', () => {
      self.setHovered(true);
      if (!self.isLocked) {
        self.expand();
      }
    });

    this.panel.addEventListener('mouseleave', () => {
      self.setHovered(false);
      if (!self.isLocked) {
        self.collapse();
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

    // Gérer l'état 2D/3D
    if (this.is2DMode) {
      this.panel.classList.add('mode-2d');
      this.panel.classList.remove('mode-3d');
    } else {
      this.panel.classList.add('mode-3d');
      this.panel.classList.remove('mode-2d');
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

  // Gestion du mode 2D/3D
  set2DMode(is2D) {
    this.is2DMode = is2D;
    
    // Si ce panneau doit être désactivé en mode 2D, le faire automatiquement
    if (this.disableIn2D) {
      this.setDisabled(is2D);
    }
    
    this.updateVisualState();
    pdManager('set2DMode', `Panneau ${this.panelId} mode ${is2D ? '2D' : '3D'}`);
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
    // Plus de repositionnement JS ; CSS seul décide.
    pdManager('reset', `Panneau ${this.panelId} - pas de reposition JS (géré par CSS)`);
  }
}

// Gestionnaire principal des panneaux
class PanelManager {
  constructor() {
    this.panels = new Map();
    this.resizeObservers = new Map();
    // Panneau actuellement en cours de drag (un seul à la fois)
    this.currentDraggingPanel = null;
    
    // Observer les changements de surface pour détecter le mode 2D/3D
    this.initSurfaceObserver();
  }

  // Initialiser l'observateur de surface pour détecter le mode 2D/3D
  initSurfaceObserver() {
    // Observer les changements de window.currentSurface
    let lastSurface = null;
    
    const checkSurface = () => {
      const currentSurface = window.currentSurface;
      if (currentSurface !== lastSurface) {
        lastSurface = currentSurface;
        const is2D = currentSurface === 'plane';
        this.setAll2DMode(is2D);
        pdManager('surfaceChange', `Surface changée: ${currentSurface} (mode ${is2D ? '2D' : '3D'})`);
      }
    };
    
    // Vérifier périodiquement (toutes les 100ms)
    setInterval(checkSurface, 100);
    
    // Vérifier immédiatement
    checkSurface();
  }

  // Début de drag : retourne false si un autre panneau est déjà en drag
  startDrag(panelState) {
    if (this.currentDraggingPanel && this.currentDraggingPanel !== panelState) {
      return false; // Refuser le drag concurrent
    }
    this.currentDraggingPanel = panelState;
    return true;
  }

  // Fin de drag
  endDrag(panelState) {
    if (this.currentDraggingPanel === panelState) {
      this.currentDraggingPanel = null;
    }
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

  // Définir le mode 2D/3D pour tous les panneaux
  setAll2DMode(is2D) {
    this.panels.forEach(panelState => {
      panelState.set2DMode(is2D);
    });
    pdManager('setAll2DMode', `Tous les panneaux passés en mode ${is2D ? '2D' : '3D'}`);
  }

  // Obtenir l'état 2D/3D actuel
  is2DMode() {
    return window.currentSurface === 'plane';
  }
}

// Instance globale du gestionnaire
const panelManager = new PanelManager();

// === Enregistrement automatique du panneau isométrique ===
document.addEventListener('DOMContentLoaded', () => {
  panelManager.registerPanel('isometriesPanel', {
    defaultPosition: 'bottom-left',
    defaultWidth: '85px',
    clickThreshold: 300,
    margin: 20,
    disableIn2D: true // Désactiver le panneau isométrique en mode 2D
  });
});

// Fonction de debug
function pdManager(f, msg) {
  console.log(`❌ [${f}][panel-manager.js] ${msg}`);
}

// Export pour utilisation dans d'autres modules
export { PanelManager, PanelState, panelManager }; 