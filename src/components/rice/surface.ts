import * as THREE from "three";

/** The uploaded wood is a real floor, so its perspective follows the camera. */
export function createRiceSurface(
  url: string,
  renderer: THREE.WebGLRenderer,
  fallbackUrl?: string,
) {
  const resolution = new THREE.Vector2();
  const textureStrength = { value: 0.58 };
  const material = new THREE.MeshStandardMaterial({
    /* Follows `--color-stage-muted` a step lighter: the floor is the ground the
       bowl sits on, so it has to move with the page's ground or the canvas
       reads as a brown rectangle pasted onto a green page. */
    color: 0x193023,
    roughness: 0.98,
    metalness: 0,
    envMapIntensity: 0.18,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    dithering: true,
  });
  // Fade only the floor at the canvas edges; keep the product completely sharp.
  material.onBeforeCompile = (shader) => {
    shader.uniforms.surfaceResolution = { value: resolution };
    shader.uniforms.surfaceTextureStrength = textureStrength;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 surfaceUV;")
      .replace("#include <uv_vertex>", "#include <uv_vertex>\nsurfaceUV = uv;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec2 surfaceResolution;\nuniform float surfaceTextureStrength;\nvarying vec2 surfaceUV;",
      )
      .replace(
        "#include <map_fragment>",
        `vec3 surfaceTint = diffuseColor.rgb;
        #include <map_fragment>
        vec3 wood = diffuseColor.rgb / max(surfaceTint, vec3(0.0001));
        float grainTone = clamp(dot(wood, vec3(0.2126, 0.7152, 0.0722)) * 9.0, 0.0, 1.65);
        diffuseColor.rgb = surfaceTint * mix(1.0, grainTone, surfaceTextureStrength);`,
      )
      .replace(
        "#include <opaque_fragment>",
        `vec2 frameUV = gl_FragCoord.xy / surfaceResolution;
        vec2 edgeFade = smoothstep(vec2(0.0), vec2(0.26, 0.2), frameUV)
          * smoothstep(vec2(0.0), vec2(0.16), 1.0 - frameUV);
        float floorFade = 1.0 - smoothstep(0.28, 0.98, length((surfaceUV - 0.5) * 2.0));
        diffuseColor.a *= edgeFade.x * edgeFade.y * floorFade;
        #include <opaque_fragment>`,
      );
  };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), material);
  mesh.rotation.x = -Math.PI / 2;
  // Offset the end grain slightly left and behind the bowl.
  mesh.position.set(-0.35, -0.027, -0.7);
  // The scene's soft shadow layer sits just above the wooden surface.
  mesh.renderOrder = -2;
  mesh.visible = false;
  let disposed = false;
  let bitmap: ImageBitmap | undefined;
  let texture: THREE.Texture | undefined;
  const loader = new THREE.ImageBitmapLoader().setOptions({
    imageOrientation: "flipY",
    premultiplyAlpha: "none",
  });
  // Assets are already sized for the floor; keep their native 1024px resolution.
  const loaded = loader.loadAsync(url).catch((error: unknown) => {
    if (!fallbackUrl || disposed) throw error;
    return loader.loadAsync(fallbackUrl);
  });
  const ready = loaded.then(
    (image) => {
      if (disposed) {
        image.close();
        return false;
      }
      bitmap = image;
      texture = new THREE.Texture(image);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;
      material.map = texture;
      material.needsUpdate = true;
      mesh.visible = true;
      return true;
    },
    () => false,
  );

  return {
    mesh,
    ready,
    resize() {
      renderer.getDrawingBufferSize(resolution);
    },
    setDark(dark: boolean) {
      material.color.setHex(dark ? 0x38251f : 0xd4c3b7);
      material.opacity = dark ? 0.72 : 0.58;
      textureStrength.value = dark ? 0.58 : 0.46;
    },
    dispose() {
      disposed = true;
      mesh.removeFromParent();
      mesh.geometry.dispose();
      material.dispose();
      texture?.dispose();
      bitmap?.close();
    },
  };
}
