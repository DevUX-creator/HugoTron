import * as THREE from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";

/** One depth-aware pass: the pack/door stay in focus, the harbour dissolves into silhouettes. */
export function createRoomAtmosphere(small: boolean) {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: small ? 0 : 2,
    depthTexture: new THREE.DepthTexture(1, 1),
  });
  const uniforms = {
    color: { value: target.texture },
    depth: { value: target.depthTexture },
    resolution: { value: new THREE.Vector2(1, 1) },
    focus: { value: 18 },
    nearClip: { value: 0.1 },
    farClip: { value: 180 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `
      #include <common>
      #include <packing>
      uniform sampler2D color,depth;
      uniform vec2 resolution;
      uniform float focus,nearClip,farClip;
      varying vec2 vUv;
      float distanceAt(vec2 uv){return -perspectiveDepthToViewZ(texture2D(depth,uv).x,nearClip,farClip);}
      void main(){
        float distance=distanceAt(vUv);
        float rear=smoothstep(focus+3.,focus+38.,distance);
        float edge=smoothstep(.22,.52,abs(vUv.x-.5));
        float front=(1.-smoothstep(2.,7.,distance))*edge;
        float blur=max(rear*9.,front*3.5);
        vec2 pixel=1./resolution;
        vec3 base=texture2D(color,vUv).rgb;
        vec3 sum=base*1.5;
        float weight=1.5;
        vec3 bloom=vec3(0.);
        for(int i=0;i<12;i++){
          float angle=float(i)*2.399963;
          vec2 direction=vec2(cos(angle),sin(angle));
          vec2 uv=vUv+direction*pixel*blur*sqrt((float(i)+.5)/12.);
          float sampleDistance=distanceAt(uv);
          // Preserve the bag silhouette: foreground surfaces never smear into the harbour.
          float w=smoothstep(-2.,0.,sampleDistance-distance);
          sum+=texture2D(color,uv).rgb*w;weight+=w;
          bloom+=max(vec3(0.),texture2D(color,vUv+direction*pixel*3.).rgb-vec3(1.15));
        }
        vec3 c=sum/weight+bloom*.016;
        c*=1.-smoothstep(.2,.78,length((vUv-.5)*vec2(1.,.82)))*.3;
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const quad = new FullScreenQuad(material);
  return {
    depth: target.depthTexture!,
    resize(width: number, height: number, ratio: number) {
      target.setSize(Math.round(width * ratio), Math.round(height * ratio));
      uniforms.resolution.value.set(width * ratio, height * ratio);
    },
    render(
      renderer: THREE.WebGLRenderer,
      scene: THREE.Scene,
      camera: THREE.Camera,
      focus: number,
      lightScene: THREE.Scene,
    ) {
      uniforms.focus.value = focus;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      quad.render(renderer);
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.render(lightScene, camera);
      renderer.autoClear = autoClear;
    },
    dispose() {
      target.depthTexture?.dispose();
      target.dispose();
      material.dispose();
      quad.dispose();
    },
  };
}
