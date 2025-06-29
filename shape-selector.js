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
        this.colors = ['#00BFFF', '#FF4136']; // Cyan, Red
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

            if (quotientContainer) {
                console.log(`[${surfaceName}] Conteneur trouvé. Application des styles...`);
                this.applyQuotientStyles(quotientContainer, surfaceInfo ? surfaceInfo.identification : null);
            }
        });
    }

    applyQuotientStyles(container, identification) {
        // Reset styles first
        container.style.borderTopColor = '';
        container.style.borderRightColor = '';
        container.style.borderBottomColor = '';
        container.style.borderLeftColor = '';

        if (!identification) {
            console.log(` -> Pas d'identification. Bordures par défaut.`);
            return;
        }
        
        console.log(` -> Application des couleurs pour ${identification.length} paire(s).`);
        identification.forEach((pair, index) => {
            const color = this.colors[index % this.colors.length];
            console.log(`   Paire ${index+1}: ${pair.edge1}/${pair.edge2} -> ${color}`);
            
            // Capitalize for style property name (e.g., 'top' -> 'Top')
            const capEdge1 = pair.edge1.charAt(0).toUpperCase() + pair.edge1.slice(1);
            const capEdge2 = pair.edge2.charAt(0).toUpperCase() + pair.edge2.slice(1);

            container.style[`border${capEdge1}Color`] = color;
            container.style[`border${capEdge2}Color`] = color;
        });
    }
}

export { ShapeSelector }; 