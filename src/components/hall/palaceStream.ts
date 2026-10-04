import * as THREE from "three";

/** Fine, tapered filaments and sparks share four routes through the nave. */
export function createPalaceStream(small: boolean) {
  const routes = Array.from({ length: 4 }, (_, branch) => {
    const side = branch % 2 ? 1 : -1;
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 1.6, 0.25, 12),
      new THREE.Vector3(side * 1.15, 0.38, 0),
      new THREE.Vector3(side * 1.85, 0.65 + branch * 0.06, -10),
      new THREE.Vector3(side * 0.75, 0.45, -22),
      new THREE.Vector3(side * 1.5, 0.8, -32),
      new THREE.Vector3(side * 0.55, 0.45, -44),
      new THREE.Vector3(side * 0.25, 0.55, -49),
    ]);
  });
  const data = new Float32Array(256 * 4 * 4);
  routes.forEach((curve, row) =>
    curve.getSpacedPoints(255).forEach((p, i) => data.set([p.x, p.y, p.z, 1], (row * 256 + i) * 4)),
  );
  const map = new THREE.DataTexture(data, 256, 4, THREE.RGBAFormat, THREE.FloatType);
  map.needsUpdate = true;
  const uniforms = {
    route: { value: map },
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
    ratio: { value: 1 },
  };
  const common = `
    uniform sampler2D route;
    uniform float time, ratio;
    uniform vec2 resolution;
    varying float vAlpha, vAcross, vSeed;
    vec3 sampleRoute(float t, float branch) {
      float n=clamp(t,0.,1.)*255.;
      float row=(branch+.5)/4.;
      return mix(texture2D(route,vec2((floor(n)+.5)/256.,row)).xyz,
        texture2D(route,vec2((min(floor(n)+1.,255.)+.5)/256.,row)).xyz,fract(n));
    }
    vec3 at(float t,float seed,float branch) {
      vec3 p=sampleRoute(t,branch);
      p.x+=sin(t*22.+seed*71.+time*.18)*(.018+seed*.12);
      p.y+=cos(t*29.+seed*47.-time*.22)*(.016+seed*.08);
      return p;
    }
    float visibility(float t,float distance) {
      return smoothstep(.1,.8,distance)*exp(-distance*.032)*smoothstep(0.,.04,t)*(1.-smoothstep(.96,1.,t));
    }
  `;
  const group = new THREE.Group();
  group.name = "Palace_guiding_filaments";
  const segments = small ? 180 : 280;
  const strands = small ? 12 : 18;
  const flows: number[] = [],
    sides: number[] = [],
    indices: number[] = [];
  for (let strand = 0; strand < strands; strand++) {
    const start = flows.length / 3;
    for (let i = 0; i <= segments; i++) {
      for (const side of [-1, 1]) {
        flows.push(i / segments, (strand + 0.5) / strands, strand % 4);
        sides.push(side);
      }
      if (i < segments) {
        const a = start + i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(new Float32Array(flows.length), 3),
  );
  geometry.setAttribute("flow", new THREE.Float32BufferAttribute(flows, 3));
  geometry.setAttribute("edge", new THREE.Float32BufferAttribute(sides, 1));
  geometry.setIndex(indices);
  const lines = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: `${common}
      attribute vec3 flow; attribute float edge;
      void main() {
        float t=flow.x, seed=flow.y;
        vec4 view=viewMatrix*vec4(at(t,seed,flow.z),1.);
        vec4 next=viewMatrix*vec4(at(min(t+.002,1.),seed,flow.z),1.);
        vec4 p=projectionMatrix*vec4(view.xy,min(view.z,-.1),1.);
        vec4 q=projectionMatrix*vec4(next.xy,min(next.z,-.1),1.);
        vec2 d=normalize((q.xy/q.w-p.xy/p.w)*resolution+vec2(.00001));
        float pulse=pow(.5+.5*sin(t*18.-time*.85+seed*9.),7.);
        float width=(.45+seed*.55+pulse*1.5)*ratio;
        p.xy+=vec2(-d.y,d.x)*edge*width/resolution*2.*p.w;
        gl_Position=p; vAcross=edge; vSeed=seed;
        vAlpha=visibility(t,-view.z)*(.17+pulse*.55);
      }`,
    fragmentShader: `varying float vAlpha,vAcross,vSeed;
      void main(){float a=exp(-vAcross*vAcross*3.5)*vAlpha;
        vec3 c=mix(vec3(.025,.23,1.3),vec3(.38,.8,1.7),pow(vSeed,7.));
        gl_FragColor=vec4(c,a); }`,
  });
  const ribbon = new THREE.Mesh(geometry, lines);
  ribbon.frustumCulled = false;
  group.add(ribbon);
  const count = small ? 480 : 950;
  const flow = new Float32Array(count * 3);
  for (let i = 0; i < count; i++)
    flow.set([(i * 0.61803398875) % 1, (i * 0.41421356) % 1, i % 4], i * 3);
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3),
  );
  pointGeometry.setAttribute("flow", new THREE.BufferAttribute(flow, 3));
  const pointMaterial = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `${common} attribute vec3 flow;
      void main(){float t=fract(flow.x+time*(.024+flow.y*.012));
        vec3 p=at(t,flow.y,flow.z); p.x+=sin(time*.6+flow.x*201.)*.17; p.y+=cos(time*.5+flow.x*103.)*.14;
        vec4 view=viewMatrix*vec4(p,1.); gl_Position=projectionMatrix*view;
        gl_PointSize=clamp((.8+flow.y*1.6)*ratio*8./max(-view.z,.1),.8*ratio,4.*ratio);
        vSeed=flow.y; vAcross=0.; vAlpha=visibility(t,-view.z)*(.12+pow(.5+.5*sin(time*1.4+flow.x*101.),4.)*.65);
      }`,
    fragmentShader: `varying float vAlpha,vSeed; void main(){vec2 p=(gl_PointCoord-.5)*2.;float r=dot(p,p);if(r>1.)discard;
      gl_FragColor=vec4(mix(vec3(.08,.36,1.6),vec3(.7,.9,1.7),pow(vSeed,4.)),exp(-r*4.5)*vAlpha);}`,
  });
  const points = new THREE.Points(pointGeometry, pointMaterial);
  points.frustumCulled = false;
  group.add(points);
  return {
    group,
    update(time: number) {
      uniforms.time.value = time;
    },
    resize(width: number, height: number, ratio: number) {
      uniforms.resolution.value.set(width, height);
      uniforms.ratio.value = ratio;
    },
    dispose() {
      map.dispose();
      geometry.dispose();
      lines.dispose();
      pointGeometry.dispose();
      pointMaterial.dispose();
    },
  };
}
