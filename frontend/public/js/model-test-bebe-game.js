(() => {
  'use strict';

  const status = document.getElementById('status');
  const loading = document.getElementById('loading');
  const loadingText = document.getElementById('loadingText');

  function fail(message, err) {
    console.error(message, err || '');
    status.textContent = message;
    status.classList.add('error');
    loadingText.textContent = message;
    setTimeout(() => loading.classList.add('hidden'), 1200);
  }

  if (!window.BABYLON) {
    fail('No se pudo cargar Babylon.js. Revisa la conexión.');
    return;
  }

  const B = BABYLON;
  const canvas = document.getElementById('renderCanvas');
  const engine = new B.Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: true,
    antialias: true,
    powerPreference: 'high-performance'
  });

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  engine.setHardwareScalingLevel(1 / dpr);

  const scene = new B.Scene(engine);
  scene.clearColor = B.Color4.FromHexString('#071528ff');
  scene.fogMode = B.Scene.FOGMODE_EXP2;
  scene.fogColor = B.Color3.FromHexString('#0b1d2e');
  scene.fogDensity = 0.009;
  scene.ambientColor = new B.Color3(.30,.35,.42);
  scene.imageProcessingConfiguration.contrast = 1.16;
  scene.imageProcessingConfiguration.exposure = 1.06;
  scene.imageProcessingConfiguration.toneMappingEnabled = true;
  scene.imageProcessingConfiguration.toneMappingType = B.ImageProcessingConfiguration.TONEMAPPING_ACES;

  const hemi = new B.HemisphericLight('hemi', new B.Vector3(-.2,1,.15), scene);
  hemi.intensity = 1.08;
  hemi.diffuse = B.Color3.FromHexString('#d7f1ff');
  hemi.groundColor = B.Color3.FromHexString('#173148');

  const sun = new B.DirectionalLight('sun', new B.Vector3(-.55,-1,-.45), scene);
  sun.position = new B.Vector3(16,28,18);
  sun.intensity = 2.1;
  sun.diffuse = B.Color3.FromHexString('#fff0d5');

  const shadows = new B.ShadowGenerator(1024, sun);
  shadows.usePercentageCloserFiltering = true;
  shadows.filteringQuality = B.ShadowGenerator.QUALITY_MEDIUM;
  shadows.bias = .0008;
  shadows.normalBias = .02;

  function mat(name, hex, rough=.75, metal=0, emissive=null) {
    const m = new B.PBRMaterial(name, scene);
    m.albedoColor = B.Color3.FromHexString(hex);
    m.roughness = rough;
    m.metallic = metal;
    if (emissive) m.emissiveColor = B.Color3.FromHexString(emissive);
    return m;
  }

  const mats = {
    asphalt: mat('asphalt','#273b50',.96),
    sidewalk: mat('sidewalk','#a6c0c9',.92),
    curb: mat('curb','#d8edf1',.84),
    line: mat('line','#ffd74c',.66,0,'#4d3b00'),
    grass: mat('grass','#3c9d59',.95),
    wallA: mat('wallA','#3f7098',.82),
    wallB: mat('wallB','#76528e',.82),
    wallC: mat('wallC','#c96c58',.82),
    window: mat('window','#5bd6ff',.25,.04,'#0b4560'),
    lamp: mat('lamp','#ffe68a',.35,0,'#ffd34c'),
    pole: mat('pole','#34495d',.55,.32),
    trunk: mat('trunk','#80583a',.9),
    leaves: mat('leaves','#319555',.9),
    baby: mat('baby','#68c5ff',.52,.01),
    babyAccent: mat('babyAccent','#d8f1ff',.42,.02),
    goal: mat('goal','#ffe276',.35,0,'#ffcf32')
  };

  function box(name,w,h,d,x,y,z,material) {
    const mesh = B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);
    mesh.position.set(x,y,z);
    mesh.material = material;
    mesh.receiveShadows = true;
    return mesh;
  }

  function cyl(name,diameter,height,x,y,z,material,tess=20) {
    const mesh=B.MeshBuilder.CreateCylinder(name,{diameter,height,tessellation:tess},scene);
    mesh.position.set(x,y,z);mesh.material=material;mesh.receiveShadows=true;return mesh;
  }

  function sphere(name,diameter,x,y,z,material,sx=1,sy=1,sz=1) {
    const mesh=B.MeshBuilder.CreateSphere(name,{diameter,segments:20},scene);
    mesh.position.set(x,y,z);mesh.scaling.set(sx,sy,sz);mesh.material=material;mesh.receiveShadows=true;return mesh;
  }

  // Calle / ciudad pequeña.
  box('road',13,.18,46,0,-.09,0,mats.asphalt);
  box('walkL',4.4,.28,46,-8.7,.01,0,mats.sidewalk);
  box('walkR',4.4,.28,46,8.7,.01,0,mats.sidewalk);
  box('curbL',.38,.40,46,-6.62,.06,0,mats.curb);
  box('curbR',.38,.40,46,6.62,.06,0,mats.curb);
  box('grassL',9,.18,46,-15.2,-.03,0,mats.grass);
  box('grassR',9,.18,46,15.2,-.03,0,mats.grass);
  for(let z=-20;z<=20;z+=4.3) box('line'+z,.18,.03,2.2,0,.035,z,mats.line);

  function building(x,z,w,d,h,material) {
    const b=box('building',w,h,d,x,h/2+.13,z,material);
    shadows.addShadowCaster(b);
    const rows=Math.max(2,Math.floor(h/2.1)),cols=Math.max(2,Math.floor(w/2.1));
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const wx=x-w/2+1.1+c*((w-2.2)/Math.max(1,cols-1));
      const wy=.95+r*1.9;
      const wz=z+(z<0?d/2+.02:-d/2-.02);
      box('window',.9,.7,.04,wx,wy,wz,mats.window);
    }
    const roof=box('roof',w+.42,.26,d+.42,x,h+.27,z,mats.curb);
    shadows.addShadowCaster(roof);
  }

  building(-12,-13,8,7,7,mats.wallA);
  building(12,-12,8.5,8,9,mats.wallB);
  building(-12,12,8.5,7.5,8,mats.wallC);
  building(12,13,9,8,6.5,mats.wallA);

  function lamp(x,z){
    const p=cyl('pole',.15,3.6,x,1.8,z,mats.pole,16);
    const cap=sphere('lamp',.5,x,3.58,z,mats.lamp,1,.75,1);
    shadows.addShadowCaster(p);shadows.addShadowCaster(cap);
    const l=new B.PointLight('pl',new B.Vector3(x,3.45,z),scene);
    l.diffuse=B.Color3.FromHexString('#ffe7a1');l.intensity=5.5;l.range=7;
  }
  [-17,-8,1,10,18].forEach((z,i)=>{lamp(-6,z);if(i%2===0)lamp(6,z+2.2)});

  function tree(x,z,s=1){
    const t=cyl('trunk',.36*s,1.5*s,x,.75*s,z,mats.trunk,16);
    const a=sphere('leaf',1.7*s,x,1.9*s,z,mats.leaves,1,1.1,1);
    const b=sphere('leaf',1.2*s,x+.6*s,2.0*s,z-.1*s,mats.leaves);
    shadows.addShadowCaster(t);shadows.addShadowCaster(a);shadows.addShadowCaster(b);
  }
  [[-9,-3,1],[9,-1,.9],[-9,5,.85],[9,7,1],[-10,19,.9],[10,-19,.85]].forEach(p=>tree(...p));

  const goal=B.MeshBuilder.CreateTorus('goal',{diameter:2.6,thickness:.10,tessellation:32},scene);
  goal.position.set(0,.12,-17);
  goal.rotation.x=Math.PI/2;
  goal.material=mats.goal;
  const glow=new B.GlowLayer('glow',scene,{blurKernelSize:32});glow.intensity=.30;

  const avatar=new B.TransformNode('avatar',scene);
  avatar.position.set(0,0,12);
  const modelPivot=new B.TransformNode('modelPivot',scene);
  modelPivot.parent=avatar;

  // Cámara de seguimiento.
  const camera=new B.FreeCamera('camera',new B.Vector3(0,9.5,21),scene);
  camera.inputs.clear();
  camera.minZ=.08;
  camera.maxZ=150;
  camera.fov=.70;
  scene.activeCamera=camera;

  const keys=new Set();
  let runTouch=false;
  const prevent=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space']);

  window.addEventListener('keydown',e=>{
    keys.add(e.code);keys.add(e.key);
    if(prevent.has(e.code)||prevent.has(e.key))e.preventDefault();
  },{passive:false});
  window.addEventListener('keyup',e=>{keys.delete(e.code);keys.delete(e.key)});

  document.querySelectorAll('[data-key]').forEach(btn=>{
    const key=btn.dataset.key;
    const down=e=>{e.preventDefault();keys.add(key)};
    const up=e=>{e.preventDefault();keys.delete(key)};
    btn.addEventListener('pointerdown',down);
    btn.addEventListener('pointerup',up);
    btn.addEventListener('pointercancel',up);
    btn.addEventListener('pointerleave',up);
  });

  const runBtn=document.querySelector('[data-run]');
  runBtn?.addEventListener('pointerdown',e=>{e.preventDefault();runTouch=true});
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>runBtn?.addEventListener(ev,e=>{e.preventDefault();runTouch=false}));

  let modelReady=false;
  let t=0;
  let currentBob=0;

  async function loadBaby(){
    try{
      loadingText.textContent='Cargando Bebé Azul 3D de 30,000 triángulos…';
      const result=await B.SceneLoader.ImportMeshAsync('', 'assets/models/', 'bebe_azul_v2.glb', scene);

      const importedSet=new Set(result.meshes);
      const roots=result.meshes.filter(m=>!m.parent || !importedSet.has(m.parent));
      roots.forEach(m=>m.parent=modelPivot);

      const geometryMeshes=result.meshes.filter(m=>m.getTotalVertices?.()>0);
      if(!geometryMeshes.length)throw new Error('El GLB no contiene geometría visible.');

      geometryMeshes.forEach(m=>{
        m.material=mats.baby;
        m.receiveShadows=true;
        shadows.addShadowCaster(m);
      });

      // Calcular límites reales y normalizar a una altura jugable.
      scene.render();
      let min=new B.Vector3(Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY);
      let max=new B.Vector3(Number.NEGATIVE_INFINITY,Number.NEGATIVE_INFINITY,Number.NEGATIVE_INFINITY);
      geometryMeshes.forEach(m=>{
        m.computeWorldMatrix(true);
        const bb=m.getBoundingInfo().boundingBox;
        min=B.Vector3.Minimize(min,bb.minimumWorld);
        max=B.Vector3.Maximize(max,bb.maximumWorld);
      });

      const height=Math.max(.001,max.y-min.y);
      const targetHeight=2.25;
      const scale=targetHeight/height;
      modelPivot.scaling.setAll(scale);

      scene.render();
      min=new B.Vector3(Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY);
      max=new B.Vector3(Number.NEGATIVE_INFINITY,Number.NEGATIVE_INFINITY,Number.NEGATIVE_INFINITY);
      geometryMeshes.forEach(m=>{
        m.computeWorldMatrix(true);
        const bb=m.getBoundingInfo().boundingBox;
        min=B.Vector3.Minimize(min,bb.minimumWorld);
        max=B.Vector3.Maximize(max,bb.maximumWorld);
      });

      const centerX=(min.x+max.x)/2;
      const centerZ=(min.z+max.z)/2;
      modelPivot.position.x-=centerX;
      modelPivot.position.y-=min.y;
      modelPivot.position.z-=centerZ;

      modelReady=true;
      status.textContent='MODELO NUEVO listo · usa WASD o flechas para caminar';
      loading.classList.add('hidden');
    }catch(err){
      fail('No se pudo colocar el Bebé Azul en la escena.',err);
    }
  }

  scene.onBeforeRenderObservable.add(()=>{
    const dt=Math.min(.033,engine.getDeltaTime()/1000);
    t+=dt;

    let x=0,z=0;
    if(keys.has('ArrowUp')||keys.has('KeyW')||keys.has('w'))z-=1;
    if(keys.has('ArrowDown')||keys.has('KeyS')||keys.has('s'))z+=1;
    if(keys.has('ArrowLeft')||keys.has('KeyA')||keys.has('a'))x-=1;
    if(keys.has('ArrowRight')||keys.has('KeyD')||keys.has('d'))x+=1;

    const len=Math.hypot(x,z);
    const running=keys.has('ShiftLeft')||keys.has('ShiftRight')||keys.has('Shift')||runTouch;

    if(modelReady && len){
      x/=len;z/=len;
      const speed=running?5.3:3.15;
      avatar.position.x+=x*speed*dt;
      avatar.position.z+=z*speed*dt;
      avatar.position.x=B.Scalar.Clamp(avatar.position.x,-5.45,5.45);
      avatar.position.z=B.Scalar.Clamp(avatar.position.z,-20.5,20.5);

      const wanted=Math.atan2(x,z);
      let diff=((wanted-avatar.rotation.y+Math.PI)%(Math.PI*2))-Math.PI;
      avatar.rotation.y+=diff*(1-Math.exp(-12*dt));

      const gait=t*(running?12:8.5);
      currentBob=Math.abs(Math.sin(gait))*.055;
      modelPivot.rotation.z=Math.sin(gait)*.025;
    }else{
      currentBob=B.Scalar.Lerp(currentBob,0,1-Math.exp(-10*dt));
      modelPivot.rotation.z=B.Scalar.Lerp(modelPivot.rotation.z,0,1-Math.exp(-10*dt));
    }
    avatar.position.y=currentBob;

    // Cámara suave siguiendo al personaje.
    const desired=new B.Vector3(avatar.position.x,9.1,avatar.position.z+10.7);
    camera.position=B.Vector3.Lerp(camera.position,desired,1-Math.exp(-6*dt));
    camera.setTarget(B.Vector3.Lerp(camera.getTarget(),avatar.position.add(new B.Vector3(0,1.05,0)),1-Math.exp(-9*dt)));

    goal.rotation.z+=dt*.35;
  });

  engine.runRenderLoop(()=>{
    scene.render();
    const fps=document.getElementById('fps');
    if(fps)fps.textContent=Math.round(engine.getFps())+' FPS';
  });

  window.addEventListener('resize',()=>engine.resize());
  window.visualViewport?.addEventListener('resize',()=>engine.resize());

  loadBaby();
})();