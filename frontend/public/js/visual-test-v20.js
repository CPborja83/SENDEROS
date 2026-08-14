(() => {
  'use strict';
  if (!window.BABYLON) {
    document.body.innerHTML = '<div style="padding:24px;color:white;font:16px system-ui">No se pudo cargar Babylon.js. Verifica tu conexión a Internet y vuelve a abrir esta prueba.</div>';
    return;
  }

  const B = BABYLON;
  const canvas = document.getElementById('renderCanvas');
  const engine = new B.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true, antialias: true, powerPreference: 'high-performance' });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  engine.setHardwareScalingLevel(1 / dpr);

  const scene = new B.Scene(engine);
  scene.clearColor = B.Color4.FromHexString('#071528ff');
  scene.fogMode = B.Scene.FOGMODE_EXP2;
  scene.fogColor = B.Color3.FromHexString('#0b1d2e');
  scene.fogDensity = 0.012;
  scene.ambientColor = new B.Color3(.28, .34, .42);
  scene.imageProcessingConfiguration.contrast = 1.18;
  scene.imageProcessingConfiguration.exposure = 1.08;
  scene.imageProcessingConfiguration.toneMappingEnabled = true;
  scene.imageProcessingConfiguration.toneMappingType = B.ImageProcessingConfiguration.TONEMAPPING_ACES;

  const hemi = new B.HemisphericLight('hemi', new B.Vector3(-.2, 1, .15), scene);
  hemi.intensity = 1.05;
  hemi.diffuse = B.Color3.FromHexString('#cdeeff');
  hemi.groundColor = B.Color3.FromHexString('#18334d');

  const sun = new B.DirectionalLight('sun', new B.Vector3(-.55, -1, -.45), scene);
  sun.position = new B.Vector3(16, 28, 18);
  sun.intensity = 2.25;
  sun.diffuse = B.Color3.FromHexString('#fff0cc');
  const shadows = new B.ShadowGenerator(2048, sun);
  shadows.usePercentageCloserFiltering = true;
  shadows.filteringQuality = B.ShadowGenerator.QUALITY_HIGH;
  shadows.bias = 0.0007;
  shadows.normalBias = 0.02;

  function mat(name, hex, rough = .72, metal = 0, emissive = null) {
    const m = new B.PBRMaterial(name, scene);
    m.albedoColor = B.Color3.FromHexString(hex);
    m.roughness = rough;
    m.metallic = metal;
    if (emissive) m.emissiveColor = B.Color3.FromHexString(emissive);
    return m;
  }
  const mats = {
    asphalt: mat('asphalt', '#263b50', .96),
    sidewalk: mat('sidewalk', '#a8c2ca', .92),
    curb: mat('curb', '#d8edf1', .84),
    line: mat('roadLine', '#ffd74c', .66, 0, '#5a4300'),
    grass: mat('grass', '#42a85f', .94),
    wallA: mat('wallA', '#3c6f96', .82),
    wallB: mat('wallB', '#774f91', .82),
    wallC: mat('wallC', '#d06a53', .82),
    window: mat('window', '#58d7ff', .28, .05, '#0d4a67'),
    lamp: mat('lamp', '#ffe68a', .35, 0, '#ffd34c'),
    pole: mat('pole', '#34495d', .5, .45),
    trunk: mat('trunk', '#815837', .9),
    leaves: mat('leaves', '#2e9c58', .9),
    blue: mat('babyBlue', '#5cbcff', .42, .02),
    blueDark: mat('babyBlueDark', '#287fc5', .45, .02),
    white: mat('suitWhite', '#eef8ff', .36, .04),
    softWhite: mat('softWhite', '#d7ecf6', .46, .02),
    visor: mat('visor', '#0b3154', .18, .34, '#071c32'),
    visorGlow: mat('visorGlow', '#62ddff', .22, .18, '#114e68'),
    boot: mat('boot', '#24445d', .5, .18),
  };

  function box(name, w, h, d, x, y, z, material, bevel = 0) {
    const mesh = B.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d, faceColors: undefined }, scene);
    mesh.position.set(x, y, z); mesh.material = material; mesh.receiveShadows = true;
    if (bevel) mesh.enableEdgesRendering(.999); // clean cartoon silhouette
    if (bevel) { mesh.edgesWidth = 1.2; mesh.edgesColor = new B.Color4(.02,.06,.09,.18); }
    return mesh;
  }
  function cyl(name, diameter, height, x, y, z, material, tess = 24) {
    const mesh = B.MeshBuilder.CreateCylinder(name, { diameter, height, tessellation: tess }, scene);
    mesh.position.set(x, y, z); mesh.material = material; mesh.receiveShadows = true; return mesh;
  }
  function sphere(name, diameter, x, y, z, material, sx=1, sy=1, sz=1) {
    const mesh = B.MeshBuilder.CreateSphere(name, { diameter, segments: 28 }, scene);
    mesh.position.set(x, y, z); mesh.scaling.set(sx, sy, sz); mesh.material = material; mesh.receiveShadows = true; return mesh;
  }

  // Street / plaza: deliberately small vertical slice.
  box('road', 13, .18, 42, 0, -.09, 0, mats.asphalt);
  box('walkL', 4.4, .28, 42, -8.7, .01, 0, mats.sidewalk);
  box('walkR', 4.4, .28, 42, 8.7, .01, 0, mats.sidewalk);
  box('curbL', .38, .4, 42, -6.62, .06, 0, mats.curb);
  box('curbR', .38, .4, 42, 6.62, .06, 0, mats.curb);
  for (let z=-18; z<=18; z+=4.2) box('line'+z, .18, .03, 2.2, 0, .035, z, mats.line);
  box('grassL', 8, .18, 42, -14.9, -.03, 0, mats.grass);
  box('grassR', 8, .18, 42, 14.9, -.03, 0, mats.grass);

  function building(x,z,w,d,h,material,accent) {
    const b = box('building', w,h,d,x,h/2+.13,z,material,true);
    shadows.addShadowCaster(b);
    const rows = Math.max(2,Math.floor(h/2.1)), cols = Math.max(2,Math.floor(w/2.1));
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
      const wx = x-w/2+1.1+c*((w-2.2)/Math.max(1,cols-1));
      const wy = .95+r*1.9;
      const wz = z + (z<0?d/2+.015:-d/2-.015);
      const win = box('window', .9,.7,.035,wx,wy,wz,accent);
      win.rotation.y = z<0?0:Math.PI;
    }
    const roof = box('roof',w+.45,.28,d+.45,x,h+.27,z,mats.curb,true); shadows.addShadowCaster(roof);
  }
  building(-11.8,-11.5,8,7,7,mats.wallA,mats.window);
  building(11.8,-10.5,8.5,8,9,mats.wallB,mats.window);
  building(-12.2,11.5,8.5,7.5,8,mats.wallC,mats.window);
  building(12.3,12,9,8,6.5,mats.wallA,mats.window);

  function streetLamp(x,z) {
    const pole=cyl('pole',.15,3.6,x,1.8,z,mats.pole,18); shadows.addShadowCaster(pole);
    const cap=sphere('lamp',.52,x,3.58,z,mats.lamp,1, .75,1); shadows.addShadowCaster(cap);
    const light=new B.PointLight('pl',new B.Vector3(x,3.45,z),scene); light.diffuse=B.Color3.FromHexString('#ffe7a1'); light.intensity=9; light.range=8;
  }
  [-15,-7,2,11,17].forEach((z,i)=>{streetLamp(-6.0,z); if(i%2===0) streetLamp(6.0,z+2.4)});

  function tree(x,z,s=1) {
    const t=cyl('trunk',.36*s,1.5*s,x,.75*s,z,mats.trunk,18); shadows.addShadowCaster(t);
    const a=sphere('leaf',1.75*s,x,1.9*s,z,mats.leaves,1,1.1,1); shadows.addShadowCaster(a);
    const b=sphere('leaf',1.25*s,x+.65*s,2.0*s,z-.1*s,mats.leaves,1,1,1); shadows.addShadowCaster(b);
    const c=sphere('leaf',1.2*s,x-.55*s,2.05*s,z+.25*s,mats.leaves,1,1,1); shadows.addShadowCaster(c);
  }
  [[-9,-3,1],[9,-1,.9],[-9,4,.85],[9,6,1],[-10,18,.9],[10,-18,.85]].forEach(p=>tree(...p));

  // Avatar: first approved visual direction only (Bebé Azul).
  const avatar = new B.TransformNode('avatar', scene);
  avatar.position.set(0,0,10);
  const body = B.MeshBuilder.CreateCapsule('body',{radius:.58,height:1.72,tessellation:24,subdivisions:8},scene); body.parent=avatar; body.position.y=1.02; body.material=mats.white;
  const chest = sphere('chest',1.15,0,1.02,0,mats.blue,1,.86,.86); chest.parent=avatar;
  const helmet = sphere('helmet',1.48,0,1.95,0,mats.softWhite,1,1,.94); helmet.parent=avatar;
  const blueRing = B.MeshBuilder.CreateTorus('helmetRing',{diameter:1.28,thickness:.10,tessellation:30},scene); blueRing.parent=avatar; blueRing.position.set(0,1.92,.56); blueRing.rotation.x=Math.PI/2; blueRing.material=mats.blue;
  const visor = sphere('visor',1.0,0,1.94,.51,mats.visor,1,.63,.22); visor.parent=avatar;
  const highlight = sphere('visorHi',.26,-.22,2.10,.72,mats.visorGlow,1.5,.55,.16); highlight.parent=avatar;
  const backpack = box('pack',.78,.9,.42,0,1.03,-.55,mats.blueDark,true); backpack.parent=avatar;
  const antenna = cyl('antenna',.07,.55,.33,2.65,-.12,mats.pole,14); antenna.parent=avatar; antenna.rotation.z=-.18;
  const antennaBall = sphere('antBall',.20,.38,2.91,-.12,mats.blue,1,1,1); antennaBall.parent=avatar;

  function limb(name,x,y,z,material){const n=new B.TransformNode(name,scene);n.parent=avatar;n.position.set(x,y,z);const m=B.MeshBuilder.CreateCapsule(name+'Mesh',{radius:.16,height:.76,tessellation:18,subdivisions:5},scene);m.parent=n;m.position.y=-.28;m.material=material;shadows.addShadowCaster(m);return n}
  const armL=limb('armL',-.67,1.42,0,mats.blue),armR=limb('armR',.67,1.42,0,mats.blue);
  const legL=limb('legL',-.31,.61,0,mats.white),legR=limb('legR',.31,.61,0,mats.white);
  const bootL=sphere('bootL',.46,-.31,.18,.12,mats.boot,1,.65,1.3);bootL.parent=avatar;
  const bootR=sphere('bootR',.46,.31,.18,.12,mats.boot,1,.65,1.3);bootR.parent=avatar;
  [body,chest,helmet,blueRing,visor,highlight,backpack,antenna,antennaBall,bootL,bootR].forEach(m=>shadows.addShadowCaster(m));

  // Small luminous marker to reinforce scale and visual hierarchy.
  const goal = B.MeshBuilder.CreateTorus('goal',{diameter:2.4,thickness:.08,tessellation:36},scene); goal.position.set(0,.12,-12); goal.rotation.x=Math.PI/2; goal.material=mats.lamp;
  const glow = new B.GlowLayer('glow',scene,{blurKernelSize:48}); glow.intensity=.35;

  const camera = new B.FreeCamera('camera', new B.Vector3(0,10.8,19), scene);
  camera.minZ=.08; camera.maxZ=130; camera.fov = 0.68;
  camera.inputs.clear();
  scene.activeCamera=camera;

  const keys = new Set(); let runTouch=false;
  const prevent = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space']);
  window.addEventListener('keydown',e=>{keys.add(e.code);keys.add(e.key);if(prevent.has(e.code)||prevent.has(e.key))e.preventDefault()},{passive:false});
  window.addEventListener('keyup',e=>{keys.delete(e.code);keys.delete(e.key)});
  document.querySelectorAll('[data-key]').forEach(btn=>{
    const key=btn.dataset.key;
    const down=e=>{e.preventDefault();keys.add(key)}; const up=e=>{e.preventDefault();keys.delete(key)};
    btn.addEventListener('pointerdown',down); btn.addEventListener('pointerup',up); btn.addEventListener('pointercancel',up); btn.addEventListener('pointerleave',up);
  });
  document.querySelector('[data-run]')?.addEventListener('pointerdown',e=>{e.preventDefault();runTouch=true});
  for(const ev of ['pointerup','pointercancel','pointerleave'])document.querySelector('[data-run]')?.addEventListener(ev,e=>{e.preventDefault();runTouch=false});

  let t=0, moving=0;
  scene.onBeforeRenderObservable.add(()=>{
    const dt=Math.min(.033,engine.getDeltaTime()/1000); t+=dt;
    let x=0,z=0;
    if(keys.has('ArrowUp')||keys.has('KeyW')||keys.has('w'))z-=1;
    if(keys.has('ArrowDown')||keys.has('KeyS')||keys.has('s'))z+=1;
    if(keys.has('ArrowLeft')||keys.has('KeyA')||keys.has('a'))x-=1;
    if(keys.has('ArrowRight')||keys.has('KeyD')||keys.has('d'))x+=1;
    const len=Math.hypot(x,z); moving = B.Scalar.Lerp(moving,len?1:0,1-Math.exp(-12*dt));
    if(len){x/=len;z/=len;const running=keys.has('ShiftLeft')||keys.has('ShiftRight')||runTouch;const speed=running?5.7:3.25;avatar.position.x+=x*speed*dt;avatar.position.z+=z*speed*dt;avatar.position.x=B.Scalar.Clamp(avatar.position.x,-5.55,5.55);avatar.position.z=B.Scalar.Clamp(avatar.position.z,-19.2,19.2);const wanted=Math.atan2(x,z);let diff=((wanted-avatar.rotation.y+Math.PI)%(Math.PI*2))-Math.PI;avatar.rotation.y+=diff*(1-Math.exp(-14*dt));}
    const gait=t*(keys.has('ShiftLeft')||keys.has('ShiftRight')||runTouch?13:9);
    const swing=Math.sin(gait)*.50*moving;
    armL.rotation.x=swing;armR.rotation.x=-swing;legL.rotation.x=-swing*.62;legR.rotation.x=swing*.62;
    avatar.position.y=.04+Math.abs(Math.sin(gait))*0.07*moving+Math.sin(t*2.1)*.018*(1-moving);
    chest.scaling.y=.86+Math.sin(t*2.1)*.012*(1-moving);
    helmet.rotation.z=Math.sin(t*1.45)*.015*(1-moving);

    const desiredTarget=new B.Vector3(avatar.position.x,1.0,avatar.position.z-1.5);
    const desiredPos=new B.Vector3(avatar.position.x,9.8,avatar.position.z+10.8);
    camera.position=B.Vector3.Lerp(camera.position,desiredPos,1-Math.exp(-5.5*dt));
    camera.setTarget(B.Vector3.Lerp(camera.getTarget(),desiredTarget,1-Math.exp(-7*dt)));
  });

  let fpsClock=0;
  engine.runRenderLoop(()=>{scene.render();fpsClock+=engine.getDeltaTime();if(fpsClock>500){fpsClock=0;const el=document.getElementById('fps');if(el)el.textContent=Math.round(engine.getFps())+' FPS';}});
  window.addEventListener('resize',()=>engine.resize());
})();
