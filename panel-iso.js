// File: panel-iso.js - Panneau isométrique (logique)
// Desc: En français, dans l'architecture, je suis le module JS du panneau isométrique (drag, rollover, reset, etc.)
// Version 1.1.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 16:30 UTC+1
// Logs:
//   - v1.1.0: Intégration complète drag, rollover, reset, gestion 2D/3D, largeur dynamique
//   - v1.0.0: Création du module, séparation depuis main.js

export function initPanelIso(options = {}) {
  const panel = document.getElementById('cameraTranslationFloating');
  if (!panel) {
    pd('initPanelIso', 'panel-iso.js', '❌ Panneau isométrique introuvable');
    return;
  }

  // Largeur dynamique/fixe propre
  panel.style.minWidth = '180px';
  panel.style.maxWidth = '320px';
  panel.style.width = 'fit-content';

  // Drag & drop du panneau
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  const dragHandle = panel.querySelector('.drag-handle');
  if (dragHandle) {
    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      panel.style.transition = 'none';
      document.body.style.userSelect = 'none';
      dragHandle.style.cursor = 'grabbing';
      pd('drag', 'panel-iso.js', 'Début drag panneau');
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panel.style.left = (e.clientX - dragOffsetX) + 'px';
      panel.style.top = (e.clientY - dragOffsetY) + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        dragHandle.style.cursor = 'grab';
        document.body.style.userSelect = '';
        pd('drag', 'panel-iso.js', 'Fin drag panneau');
      }
    });
  }

  // Rollover (dépliage/fermeture) : géré par le CSS (hover)

  // Reset (bouton recentrer)
  const resetBtn = panel.querySelector('#camCenter');
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof options.onReset === 'function') {
        options.onReset();
        pd('reset', 'panel-iso.js', 'Bouton recentrer cliqué (hook onReset)');
      } else if (window.resetToDefaultConfiguration) {
        window.resetToDefaultConfiguration();
        pd('reset', 'panel-iso.js', 'Bouton recentrer cliqué (resetToDefaultConfiguration)');
      } else {
        pd('reset', 'panel-iso.js', '❌ Aucune fonction de reset trouvée');
      }
    });
  }

  // Gestion mode 2D/3D (disabled, B&W, curseur, etc.)
  function updatePanelState(is2D) {
    if (is2D) {
      panel.classList.add('disabled');
      pd('mode', 'panel-iso.js', 'Panneau en mode 2D (disabled)');
    } else {
      panel.classList.remove('disabled');
      pd('mode', 'panel-iso.js', 'Panneau en mode 3D (enabled)');
    }
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

  pd('initPanelIso', 'panel-iso.js', '✅ Initialisation complète panneau isométrique');
}

// Fonction de debug globale si absente
globalThis.pd = globalThis.pd || function pd(f, file, msg) {
  if (window && window.DEBUG) console.log(`❌ [${f}][${file}] ${msg}`);
}; 