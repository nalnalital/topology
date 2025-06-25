export function createSurface() {
  const geometry = new THREE.ParametricGeometry((u, v, target) => {
    u *= 2 * Math.PI;
    v *= 2 * Math.PI;
    const r = 1 + 0.3 * Math.sin(2 * v);
    const x = r * Math.cos(u);
    const y = r * Math.sin(u);
    const z = 0.3 * Math.sin(v);
    target.set(x * 0.4, y * 0.4, z);
  }, 100, 50);
  const material = new THREE.MeshStandardMaterial({ color: 0xcc3333, side: THREE.DoubleSide });
  return new THREE.Mesh(geometry, material);
}
