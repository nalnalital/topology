// Icône topologique avec flèches directionnelles
// Tore [+ +] : bords verticaux et horizontaux dans même sens
export const topologyIcon = {
  center: '🍩',
  top: '▶️',
  left: '⏫', 
  right: '⏫',
  bottom: '▶️'
};

export function createSurface() {
  const geometry = new THREE.TorusGeometry(1, 0.4, 32, 64);
  const material = new THREE.MeshStandardMaterial({ color: 0x3399ff });
  return new THREE.Mesh(geometry, material);
}
