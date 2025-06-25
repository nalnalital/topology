export function createSurface() {
  const geometry = new THREE.TorusGeometry(1, 0.4, 32, 64);
  const material = new THREE.MeshStandardMaterial({ color: 0x3399ff });
  return new THREE.Mesh(geometry, material);
}
