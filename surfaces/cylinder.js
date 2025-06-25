export function createSurface() {
  const geometry = new THREE.CylinderGeometry(0.7, 0.7, 1.5, 32, 1, true);
  const material = new THREE.MeshStandardMaterial({ color: 0xff9933, side: THREE.DoubleSide });
  return new THREE.Mesh(geometry, material);
}
