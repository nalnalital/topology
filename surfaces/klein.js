export function createSurface() {
  const geometry = new THREE.ParametricGeometry((u, v, target) => {
    u *= Math.PI * 2;
    v *= Math.PI * 2;
    let x, y, z;
    const r = 0.5;
    if (u < Math.PI) {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v) * Math.cos(u);
      y = 3 * Math.sin(u) * (1 + Math.sin(u)) + r * Math.cos(v) * Math.sin(u);
    } else {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v + Math.PI) * Math.cos(u);
      y = 3 * Math.sin(u) * (1 + Math.sin(u)) + r * Math.cos(v + Math.PI) * Math.sin(u);
    }
    z = r * Math.sin(v);
    target.set(x * 0.1, y * 0.1, z * 0.1);
  }, 100, 30);
  const material = new THREE.MeshStandardMaterial({ color: 0x009999, side: THREE.DoubleSide });
  return new THREE.Mesh(geometry, material);
}
