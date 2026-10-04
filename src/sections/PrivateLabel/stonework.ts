import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/** Actual courtyard stone pieces, in a 209 KB subset of the existing home model. */
export function createRoomStonework(fallbackMaterial: THREE.Material) {
  const group = new THREE.Group();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  let disposed = false;
  const fallback = new THREE.BoxGeometry(1, 1, 1);
  geometries.add(fallback);

  function slab(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    angle = 0,
  ) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.rotation.y = angle;
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  }
  // A broad landing with supported risers; the final tread meets the plinth edge.
  function podium(a: THREE.BufferGeometry, b: THREE.BufferGeometry, material: THREE.Material) {
    slab(a, material, 4.7, 0.43, 4.05, 1.95, 0, -8.03, -0.035);
    slab(b, material, 3.85, 0.99, 3.35, 2.04, 0.43, -8.01, 0.025);
    for (let i = 0; i < 5; i++) {
      const width = 2.75 - i * 0.1;
      slab(
        i % 2 ? a : b,
        material,
        width,
        (i + 1) * 0.24,
        1.2,
        2 + Math.sin(i * 1.7) * 0.035,
        0,
        -2.45 - i * 0.83,
        Math.sin(i * 2) * 0.008,
      );
    }
    // A pair of fallen fragments embeds the landing into the surrounding floor.
    slab(b, material, 0.8, 0.14, 1.25, -0.65, 0, -7.2, -0.22);
    slab(a, material, 1.15, 0.18, 0.68, 4.6, 0, -8.85, 0.24);
  }
  const fallbackSlab = fallback.clone().translate(0, 0.5, 0);
  geometries.add(fallbackSlab);
  podium(fallbackSlab, fallbackSlab, fallbackMaterial);

  const release = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => {
      t.dispose();
      (t.source.data as ImageBitmap | undefined)?.close?.();
    });
    geometries.clear();
    materials.clear();
    textures.clear();
  };
  const ready = new GLTFLoader()
    .loadAsync("/models/private-label/courtyard-stonework.glb")
    .then((gltf) => {
      gltf.scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        const values = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of values) {
          materials.add(material);
          for (const value of Object.values(material))
            if (value instanceof THREE.Texture) textures.add(value);
        }
      });
      if (disposed) {
        release();
        return;
      }
      const column = gltf.scene.getObjectByName("Courtyard_column") as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshStandardMaterial
      >;
      const a = gltf.scene.getObjectByName("Courtyard_slab_a") as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshStandardMaterial
      >;
      const b = gltf.scene.getObjectByName("Courtyard_slab_b") as typeof a;
      const size = new THREE.Vector3(),
        center = new THREE.Vector3();
      for (const mesh of [column, a, b]) {
        const geometry = mesh.geometry;
        if (mesh !== column) {
          // Loose courtyard slabs have their original rotations baked into the vertices.
          // Restore their stone-cut axes before sizing them as level architectural risers.
          const normals = geometry.getAttribute("normal");
          const up = new THREE.Vector3(),
            forward = new THREE.Vector3(),
            n = new THREE.Vector3();
          for (let i = 0; i < normals.count; i++) {
            n.fromBufferAttribute(normals, i);
            if (n.y > up.y) up.copy(n);
            if (n.z > forward.z) forward.copy(n);
          }
          const right = new THREE.Vector3().crossVectors(up, forward).normalize();
          forward.crossVectors(right, up).normalize();
          geometry.applyMatrix4(
            new THREE.Matrix4().makeBasis(right, up.normalize(), forward).invert(),
          );
        }
        geometry.computeBoundingBox();
        const bounds = geometry.boundingBox!;
        bounds.getSize(size);
        bounds.getCenter(center);
        geometry.translate(-center.x, -bounds.min.y, -center.z);
        if (mesh === column) geometry.scale(1 / size.y, 1 / size.y, 1 / size.y);
        else {
          geometry.scale(1 / size.x, 1 / size.y, 1 / size.z);
          // Keep worn edges, but level the walking surface of each reused loose slab.
          const p = geometry.getAttribute("position");
          for (let i = 0; i < p.count; i++)
            p.setY(i, p.getY(i) > 0.5 ? 1 - (1 - p.getY(i)) * 0.025 : p.getY(i) * 0.025);
          p.needsUpdate = true;
          geometry.computeVertexNormals();
        }
        geometry.computeBoundingSphere();
      }
      const material = column.material;
      material.color.setRGB(0.32, 0.37, 0.43);
      material.metalness = 0;
      material.roughness = 0.96;
      material.envMapIntensity = 0.09;
      material.normalScale.setScalar(0.7);
      for (const texture of textures) texture.anisotropy = 4;
      group.clear();
      fallback.dispose();
      fallbackSlab.dispose();
      geometries.delete(fallback);
      geometries.delete(fallbackSlab);
      podium(a.geometry, b.geometry, material);
      for (const x of [-9.4, 9.4])
        for (const z of [5, -5, -16]) {
          const mesh = new THREE.Mesh(column.geometry, material);
          mesh.scale.setScalar(9.55);
          mesh.position.set(x, 0, z);
          mesh.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
          mesh.castShadow = mesh.receiveShadow = true;
          group.add(mesh);
        }
    })
    .catch(() => {
      /* The matte stone landing remains usable when the optional model is unavailable. */
    });
  return {
    group,
    ready,
    dispose() {
      disposed = true;
      release();
      group.clear();
    },
  };
}
