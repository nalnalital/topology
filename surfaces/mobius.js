// Icône topologique avec flèches directionnelles
// Ruban de Möbius [+ -] : bords horizontaux opposés  
export const topologyIcon = {
  center: '🎀',
  top: '▶️',
  left: '',
  right: '',
  bottom: '◀️'
};

export function createSurface() {
  const geometry = new THREE.ParametricGeometry((u, t, target) => {
    u *= Math.PI * 2;
    t = t * 2 - 1;
    const x = Math.cos(u) + t * Math.cos(u / 2) * Math.cos(u);
    const y = Math.sin(u) + t * Math.cos(u / 2) * Math.sin(u);
    const z = t * Math.sin(u / 2);
    target.set(x, y, z);
  }, 100, 15);
  const material = new THREE.MeshStandardMaterial({ color: 0x9900cc, side: THREE.DoubleSide });
  return new THREE.Mesh(geometry, material);
}
