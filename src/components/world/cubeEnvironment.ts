import * as THREE from "three";

/** A static reflection rig: broad grazing panels reveal the frosted and polished glass. */
export function createCubeEnvironment(renderer: THREE.WebGLRenderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x16263a);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const materials: THREE.MeshBasicMaterial[] = [];
  function panel(
    position: [number, number, number],
    size: [number, number],
    color: number,
    intensity: number,
  ) {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    });
    materials.push(material);
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(...position);
    plane.scale.set(size[0], size[1], 1);
    plane.lookAt(0, 0, 0);
    studio.add(plane);
  }
  panel([-3.6, 1.1, 4], [0.85, 5.4], 0xc6e6ff, 3.5);
  panel([4, 0.4, 2.8], [1.2, 4.8], 0x9296ff, 3);
  panel([-0.5, 4.5, -1], [4.4, 1.2], 0xd6e8ff, 4.5);
  panel([1, -3, 2], [3, 0.35], 0x1768ff, 2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.025, 0.1, 20, { size: 128 });
  pmrem.dispose();
  geometry.dispose();
  materials.forEach((material) => material.dispose());
  return environment;
}
