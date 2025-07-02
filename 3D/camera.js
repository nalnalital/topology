// File: camera.js - Gestion du drag et de la rotation caméra
// Desc: En français, dans l'architecture, je suis le module qui gère la rotation et la translation caméra selon la surface courante (drag souris)
// Version 1.0.0
// Author: DNAvatar.org - Arnaud Maignan
// Date: [June 08, 2025] [HH:MM UTC+1]
// Logs:
//   - Initial version, extraction depuis main.js

export function setupCameraControls(canvas, config, updateAngleDisplay, render, debugUVCorners, anglesRef) {
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  
  canvas.addEventListener('mousedown', (e) => {
    if (window.currentSurface !== 'view2d') {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      canvas.style.cursor = 'grabbing';
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging || window.currentSurface === 'view2d') return;
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    // Sauvegarder anciennes valeurs pour détecter changements
    const oldRotX = anglesRef.rotX;
    const oldRotY = anglesRef.rotY;
    const oldRotZ = anglesRef.rotZ;
    // Délégation à la fonction handleDrag de la surface courante
    if (typeof window.currentHandleDrag === 'function') {
      window.currentHandleDrag(deltaX, deltaY, anglesRef, config);
    }
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    updateAngleDisplay();
    requestAnimationFrame(render);
    if (oldRotX !== anglesRef.rotX || oldRotY !== anglesRef.rotY || oldRotZ !== anglesRef.rotZ) {
      const rotXDeg = Math.round((anglesRef.rotX * 180) / Math.PI);
      const rotYDeg = Math.round((anglesRef.rotY * 180) / Math.PI);
      const rotZDeg = Math.round((anglesRef.rotZ * 180) / Math.PI);
      console.log(`🔄 Rotation changée: X=${rotXDeg}° Y=${rotYDeg}° Z=${rotZDeg}°`);
      if (typeof debugUVCorners === 'function') debugUVCorners();
    }
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = window.currentSurface !== 'view2d' ? 'grab' : 'default';
  });
  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    canvas.style.cursor = window.currentSurface !== 'view2d' ? 'grab' : 'default';
  });
  setInterval(() => {
    if (!isDragging) {
      canvas.style.cursor = window.currentSurface !== 'view2d' ? 'grab' : 'default';
    }
  }, 100);
} 