import * as THREE from "three";

/** One floor current, using the hero’s intertwined filaments, travelling highlights and sparks. */
export function createPalaceStream(small: boolean, floorRoute?: THREE.CatmullRomCurve3) {
  const floor =
    floorRoute ??
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.6, 0.35, 12),
      new THREE.Vector3(0.8, 0.32, 0),
      new THREE.Vector3(-0.9, 0.42, -10),
      new THREE.Vector3(0.9, 0.35, -22),
      new THREE.Vector3(-0.65, 0.4, -32),
      new THREE.Vector3(-0.2, 0.22, -44),
      new THREE.Vector3(0, 0.25, -49),
    ]);
  // Invisible motion guides retain the floating stones beyond the arcades.
  const rockRoutes = [-1, 1].map((side) => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 10, 5.6, 8),
      new THREE.Vector3(side * 7.5, 4.2, -5),
      new THREE.Vector3(side * 9.5, 5.8, -15),
      new THREE.Vector3(side * 7.2, 3.9, -27),
      new THREE.Vector3(side * 9, 5.4, -38),
      new THREE.Vector3(side * 11, 4.8, -52),
      new THREE.Vector3(side * 15, 7, -65),
    ]);
  });
  const routes = [floor];
  const data = new Float32Array(256 * routes.length * 4);
  routes.forEach((curve, row) =>
    curve.getSpacedPoints(255).forEach((p, i) => data.set([p.x, p.y, p.z, 1], (row * 256 + i) * 4)),
  );
  const map = new THREE.DataTexture(data, 256, routes.length, THREE.RGBAFormat, THREE.FloatType);
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
      float row=(branch+.5)/${routes.length}.;
      return mix(texture2D(route,vec2((floor(n)+.5)/256.,row)).xyz,
        texture2D(route,vec2((min(floor(n)+1.,255.)+.5)/256.,row)).xyz,fract(n));
    }
    float hash(float n) { return fract(sin(n*127.1)*43758.5453); }
    vec3 at(float t,float seed,float branch) {
      vec3 p=sampleRoute(t,branch);
      vec3 tangent=normalize(sampleRoute(min(t+.006,1.),branch)-sampleRoute(max(t-.006,0.),branch));
      vec3 side=normalize(cross(tangent,vec3(0.,1.,0.)));
      vec3 up=cross(side,tangent);
      float spread=.045+hash(seed+9.1)*.32;
      float lateral=sin(t*17.+seed*51.-time*.36)+sin(t*37.+seed*31.+time*.27)*.22;
      float vertical=cos(t*12.+seed*67.+time*.24)+sin(t*29.-seed*17.-time*.31)*.25;
      return p+side*lateral*spread+up*vertical*spread*.4;
    }
    float visibility(float t,float distance) {
      return smoothstep(.1,.8,distance)*exp(-distance*.032)*smoothstep(0.,.04,t)*(1.-smoothstep(.96,1.,t));
    }
    // Lose focus and energy in world space before the dark backdrop at z=-46.8.
    // Slightly different extinction depths avoid a shared, visible end across the strands.
    float doorwayDepth(vec3 p,float seed) {
      return smoothstep(40.5+hash(seed+3.7)*.65,46.05+hash(seed+7.9)*.5,-p.z);
    }
  `;
  const group = new THREE.Group();
  group.name = "Palace_guiding_filaments";
  const segments = small ? 180 : 280;
  const strands = small ? 8 : 13;
  const flows: number[] = [],
    sides: number[] = [],
    indices: number[] = [];
  for (let strand = 0; strand < strands; strand++) {
    const start = flows.length / 3;
    for (let i = 0; i <= segments; i++) {
      for (const side of [-1, 1]) {
        flows.push(i / segments, (strand + 0.5) / strands, strand % routes.length);
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
    forceSinglePass: true,
    vertexShader: `${common}
      attribute vec3 flow; attribute float edge;
      varying float vEnergy,vPulse,vDefocus;
      void main() {
        float t=flow.x, seed=flow.y;
        vec3 world=at(t,seed,flow.z);
        vec4 view=viewMatrix*vec4(world,1.);
        vec4 next=viewMatrix*vec4(at(min(t+.002,1.),seed,flow.z),1.);
        vec4 behind=viewMatrix*vec4(at(max(t-.002,0.),seed,flow.z),1.);
        vec4 p=projectionMatrix*vec4(view.xy,min(view.z,-.1),1.);
        vec4 q=projectionMatrix*vec4(next.xy,min(next.z,-.1),1.);
        vec4 r=projectionMatrix*vec4(behind.xy,min(behind.z,-.1),1.);
        vec2 tangent=(q.xy/q.w-r.xy/r.w)*resolution;
        vec2 direction=tangent/max(length(tangent),.0001);
        // Same layered hero light: fine hairs and occasional travelling white-cyan accents.
        float prominent=1.-step(.5,abs(mod(floor(seed*${strands.toFixed(1)}),5.)-2.));
        float phase=fract(time*(.055+seed*.04)+seed*5.);
        float travel=fract(t-phase+1.);
        float pulse=exp(-pow((travel-.12)/.11,2.)*2.);
        float width=mix(3.,12.,prominent)+pulse*prominent*3.;
        float depth=doorwayDepth(world,seed);
        float defocus=max(1.-smoothstep(.4,4.,-view.z),depth*.82);
        width+=defocus*12.;
        p.xy+=vec2(-direction.y,direction.x)*edge*width*ratio/resolution*p.w;
        gl_Position=p; vAcross=edge; vSeed=seed;
        vEnergy=prominent; vPulse=pulse; vDefocus=defocus;
        vAlpha=visibility(t,-view.z)*mix(.07+pulse*.3,.4+pulse*.6,prominent)*mix(1.,.24,defocus)*pow(1.-depth,1.65);
      }`,
    fragmentShader: `varying float vAlpha,vAcross,vEnergy,vPulse,vDefocus;
      void main(){
        float d2=vAcross*vAcross,sharp=1.-vDefocus;
        float filament=exp(-d2*mix(8.,mix(90.,60.,vEnergy),sharp))*sharp;
        float sheath=exp(-d2*mix(4.,mix(14.,10.,vEnergy),sharp));
        float halo=exp(-d2*2.2);
        vec3 light=vec3(.45,.8,1.)*filament*(1.3+vPulse*1.6)
          +vec3(.02,.32,1.)*sheath*(.7+vPulse*.5)
          +vec3(.004,.12,1.)*halo*(.16+vPulse*.2);
        gl_FragColor=vec4(light*1.4,vAlpha);
      }`,
  });
  const ribbon = new THREE.Mesh(geometry, lines);
  ribbon.frustumCulled = false;
  group.add(ribbon);
  const count = small ? 360 : 660;
  const flow = new Float32Array(count * 3);
  for (let i = 0; i < count; i++)
    flow.set([(i * 0.61803398875) % 1, (i * 0.41421356) % 1, i % routes.length], i * 3);
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
        float spread=.65;
        vec3 p=at(t,flow.y,flow.z); p.x+=sin(time*.6+flow.x*201.)*.17*spread; p.y+=cos(time*.5+flow.x*103.)*.14*spread;
        float depth=doorwayDepth(p,flow.y);
        vec4 view=viewMatrix*vec4(p,1.); gl_Position=projectionMatrix*view;
        gl_PointSize=clamp((.8+flow.y*1.6)*ratio*8./max(-view.z,.1),.8*ratio,4.*ratio)*(1.+depth*.6);
        vSeed=flow.y; vAcross=0.; vAlpha=visibility(t,-view.z)*(.12+pow(.5+.5*sin(time*1.4+flow.x*101.),4.)*.65)*pow(1.-depth,2.);
      }`,
    fragmentShader: `varying float vAlpha,vSeed; void main(){vec2 p=(gl_PointCoord-.5)*2.;float r=dot(p,p);if(r>1.)discard;
      gl_FragColor=vec4(mix(vec3(.08,.36,1.6),vec3(.7,.9,1.7),pow(vSeed,4.)),exp(-r*4.5)*vAlpha);}`,
  });
  const points = new THREE.Points(pointGeometry, pointMaterial);
  points.frustumCulled = false;
  group.add(points);
  return {
    group,
    rockRoutes,
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
