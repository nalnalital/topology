// File: panel-algebre.js - Panneau des invariants algébriques
// Desc: En français, dans l'architecture, je suis le module JS du panneau algèbre (invariants topologiques)
// Version 1.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: June 08, 2025 21:00 UTC+1
// Logs:
//   - v1.0.0: Création du module, gestion des invariants algébriques avec panel-manager

import { panelManager } from './panel-manager.js';

// Fonction pour créer le contenu du panneau algèbre
function createAlgebreContent(surfaceName) {
  const content = document.createElement('div');
  content.className = 'algebre-content';
  // Titre du panneau (dynamique)
  const title = document.createElement('div');
  title.className = 'panel-title algebre-title';
  title.textContent = window.t ? window.t('algebrePanelTitle') : 'Algèbre';
  content.appendChild(title);
  // Contenu des invariants (sera mis à jour dynamiquement)
  const invariantsContainer = document.createElement('div');
  invariantsContainer.className = 'algebre-invariants';
  content.appendChild(invariantsContainer);
  return content;
}

// Fonction pour mettre à jour dynamiquement le titre selon la langue
function updateAlgebreTitle() {
  const panel = document.getElementById('algebrePanel');
  if (!panel) return;
  const title = panel.querySelector('.panel-title.algebre-title');
  if (title) title.textContent = window.t ? window.t('algebrePanelTitle') : 'Algèbre';
}

// Fonction pour mettre à jour les invariants
async function updateInvariants(surfaceName) {
  const panel = document.getElementById('algebrePanel');
  if (!panel) return;

  const invariantsContainer = panel.querySelector('.algebre-invariants');
  if (!invariantsContainer) return;

  try {
    const module = await import(`../surfaces/${surfaceName}.js`);
    
    if (!module.algebraicInvariants) {
      invariantsContainer.innerHTML = '<div style="color: #999; font-style: italic;">Aucun invariant</div>';
      return;
    }

    const invariants = module.algebraicInvariants;
    invariantsContainer.innerHTML = '';

    // Nom de la surface
    if (invariants.name) {
      const nameDiv = document.createElement('div');
      nameDiv.style.cssText = `
        font-weight: bold;
        font-size: 1.0em;
        color: #2c3e50;
        margin-bottom: 8px;
        text-align: center;
      `;
      nameDiv.textContent = invariants.name;
      invariantsContainer.appendChild(nameDiv);
    }

    // Labels des invariants
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
          margin: 3px 0;
          white-space: nowrap;
          font-size: 0.9em;
        `;

        const symbolSpan = document.createElement('span');
        symbolSpan.textContent = symbol;
        symbolSpan.style.cssText = `
          font-size: ${symbol === 'π₁' ? '1.2em' : symbol === 'ω' ? '1.3em' : '1.0em'};
          color: #000;
          margin-right: 4px;
          min-width: 18px;
          font-weight: 100;
          line-height: 1;
          transform: ${symbol === 'π₁' ? 'translateY(-1px)' : symbol === 'χ' ? 'translateY(-2px)' : 'none'};
        `;

        const separator = document.createElement('span');
        separator.textContent = '=';
        separator.style.cssText = `
          font-size: 1.0em;
          color: #000;
          margin: 0 4px;
          font-weight: bold;
          line-height: 1;
        `;

        const valueSpan = document.createElement('span');
        valueSpan.textContent = invariants[key];
        valueSpan.style.cssText = `
          font-weight: bold;
          font-size: 1.0em;
          line-height: 1;
        `;

        invariantDiv.appendChild(symbolSpan);
        invariantDiv.appendChild(separator);
        invariantDiv.appendChild(valueSpan);
        invariantsContainer.appendChild(invariantDiv);
      }
    });

  } catch (error) {
    console.error('Erreur lors du chargement des invariants:', error);
    invariantsContainer.innerHTML = '<div style="color: #f00; font-style: italic;">Erreur</div>';
  }
}

// Fonction d'initialisation du panneau algèbre
export function initPanelAlgebre(options = {}) {
  // Créer le panneau HTML s'il n'existe pas
  let panel = document.getElementById('algebrePanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'algebrePanel';
    panel.className = 'panel-floating algebre-panel';
    // Pas de style inline, tout passe par le CSS
    // Zone de drag générée automatiquement par panel-manager
    // Contenu initial
    const content = createAlgebreContent();
    panel.appendChild(content);
    document.body.appendChild(panel);
  }
  // Enregistrer le panneau avec le panel-manager
  const panelState = panelManager.registerPanel('algebrePanel', {
    defaultPosition: 'top-right',
    clickThreshold: 300,
    margin: 20
  });
  
  // Verrouiller le panneau algèbre par défaut
  panelState.toggleLock();
  // Exposer la fonction de mise à jour
  window.updateAlgebrePanel = updateInvariants;
  // Mettre à jour avec la surface actuelle
  if (window.currentSurface) {
    updateInvariants(window.currentSurface);
  }
  // S'abonner à la traduction globale
  if (typeof window.refreshAllTranslations === 'function') {
    const oldRefresh = window.refreshAllTranslations;
    window.refreshAllTranslations = function() {
      oldRefresh.apply(this, arguments);
      updateAlgebreTitle();
    };
  }
  console.log('✅ Panneau algèbre initialisé avec panel-manager');
  return panelState;
}

// Fonction pour afficher/masquer le panneau
export function toggleAlgebrePanel() {
  const panel = document.getElementById('algebrePanel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }
}

// Fonction pour mettre à jour le panneau avec une nouvelle surface
export function updateAlgebrePanel(surfaceName) {
  updateInvariants(surfaceName);
} 