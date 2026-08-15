(() => {
  'use strict';

  const B = window.BABYLON;
  const statusEl = document.getElementById('status');
  const loadingEl = document.getElementById('loading');
  const loadingTextEl = document.getElementById('loadingText');

  function setStatus(msg, error=false){
    statusEl.textContent=msg;
    statusEl.classList.toggle('error',error);
    loadingTextEl.textContent=msg;
  }

  if(!B){ setStatus('No se pudo cargar Babylon.js.',true); return; }

  const canvas=document.getElementById('renderCanvas');
  const engine=new B.Engine(canvas,true,{antialias:true,stencil:true,powerPreference:'high-performance'});
  engine.setHardwareScalingLevel(1/Math.min(window.devicePixelRatio||1,2));

  const scene=new B.Scene(engine);
  scene.clearColor=B.Color4.FromHexString('#071528ff');
  scene.fogMode=B.Scene.FOGMODE_EXP2;
  scene.fogColor=B.Color3.FromHexString('#0b1d2e');
  scene.fogDensity=.009;
  scene.imageProcessingConfiguration.contrast=1.15;
  scene.imageProcessingConfiguration.exposure=1.05;
  scene.imageProcessingConfiguration.toneMappingEnabled=true;
  scene.imageProcessingConfiguration.toneMappingType=B.ImageProcessingConfiguration.TONEMAPPING_ACES;

  const hemi=new B.HemisphericLight('hemi',new B.Vector3(-.2,1,.15),scene);
  hemi.intensity=1.05;
  const sun=new B.DirectionalLight('sun',new B.Vector3(-.55,-1,-.45),scene);
  sun.position=new B.Vector3(16,28,18);
  sun.intensity=2;
  const shadows=new B.ShadowGenerator(1024,sun);
  shadows.usePercentageCloserFiltering=true;
  shadows.filteringQuality=B.ShadowGenerator.QUALITY_MEDIUM;

  function mat(name,hex,rough=.8,emissive=null){
    const m=new B.PBRMaterial(name,scene);
    m.albedoColor=B.Color3.FromHexString(hex);
    m.roughness=rough;
    if(emissive)m.emissiveColor=B.Color3.FromHexString(emissive);
    return m;
  }

  const mats={
    road:mat('road','#607d91',.95),
    sidewalk:mat('sidewalk','#c8d5db',.9),
    line:mat('line','#ffe875',.7,'#6b5400'),
    grass:mat('grass','#4c9b5d',.95),
    wall1:mat('wall1','#4f7898',.85),
    wall2:mat('wall2','#775c91',.85),
    wall3:mat('wall3','#b96e5a',.85),
    window:mat('window','#74d8ff',.35,'#103b52'),
    lamp:mat('lamp','#ffe69b',.4,'#e0b928'),
    pole:mat('pole','#34495d',.6),
    trunk:mat('trunk','#7b563b',.9),
    leaves:mat('leaves','#3b9050',.9),
    goal:mat('goal','#ffe276',.4,'#ffcf32')
  };

  function box(name,w,h,d,x,y,z,material){
    const m=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);
    m.position.set(x,y,z);m.material=material;m.receiveShadows=true;return m;
  }
  function cyl(name,diameter,height,x,y,z,material){
    const m=B.MeshBuilder.CreateCylinder(name,{diameter,height,tessellation:18},scene);
    m.position.set(x,y,z);m.material=material;m.receiveShadows=true;return m;
  }
  function sphere(name,diameter,x,y,z,material){
    const m=B.MeshBuilder.CreateSphere(name,{diameter,segments:18},scene);
    m.position.set(x,y,z);m.material=material;m.receiveShadows=true;return m;
  }

  // escenario
  box('road',13,.18,46,0,-.09,0,mats.road);
  box('walkL',4.4,.28,46,-8.7,.01,0,mats.sidewalk);
  box('walkR',4.4,.28,46,8.7,.01,0,mats.sidewalk);
  box('grassL',9,.18,46,-15.2,-.03,0,mats.grass);
  box('grassR',9,.18,46,15.2,-.03,0,mats.grass);
  for(let z=-20;z<=20;z+=4.4)box('line'+z,.18,.03,2.15,0,.035,z,mats.line);

  function building(x,z,w,d,h,material){
    const b=box('building',w,h,d,x,h/2+.12,z,material);shadows.addShadowCaster(b);
    for(let yy=1;yy<h-1;yy+=1.8){
      for(let xx=-w/2+1;xx<w/2-.5;xx+=1.8){
        box('window',.75,.55,.04,x+xx,yy,z+(z<0?d/2+.03:-d/2-.03),mats.window);
      }
    }
  }
  building(-12,-13,8,7,7,mats.wall1);
  building(12,-12,8.5,8,8,mats.wall2);
  building(-12,12,8.5,7.5,7.5,mats.wall3);
  building(12,13,9,8,6.5,mats.wall1);

  function lamp(x,z){
    const p=cyl('pole',.15,3.6,x,1.8,z,mats.pole);
    const s=sphere('light',.45,x,3.58,z,mats.lamp);
    shadows.addShadowCaster(p);shadows.addShadowCaster(s);
  }
  [-17,-8,1,10,18].forEach((z,i)=>{lamp(-6,z);if(i%2===0)lamp(6,z+2.2)});

  function tree(x,z){
    const t=cyl('trunk',.35,1.4,x,.7,z,mats.trunk);
    const a=sphere('leaves',1.65,x,1.8,z,mats.leaves);
    shadows.addShadowCaster(t);shadows.addShadowCaster(a);
  }
  [[-9,-3],[9,-1],[-9,5],[9,7],[-10,19],[10,-19]].forEach(p=>tree(...p));

  const goal=B.MeshBuilder.CreateTorus('goal',{diameter:2.6,thickness:.1,tessellation:32},scene);
  goal.position.set(0,.12,-17);goal.rotation.x=Math.PI/2;goal.material=mats.goal;
  new B.GlowLayer('glow',scene,{blurKernelSize:32}).intensity=.3;

  const player=new B.TransformNode('player',scene);
  player.position.set(0,0,8);

  const modelPivot=new B.TransformNode('modelPivot',scene);
  modelPivot.parent=player;

  // cámara: el centro de la pantalla mira un poco DELANTE del personaje,
  // por lo que el bebé aparece más abajo y nunca debajo del panel superior.
  const camera=new B.FreeCamera('camera',new B.Vector3(0,4.9,15.2),scene);
  camera.inputs.clear();
  camera.minZ=.08;camera.maxZ=150;camera.fov=.66;scene.activeCamera=camera;

  const keyDirs=new Set(),touchDirs=new Set();
  let runTouch=false;
  const keyMap={
    ArrowUp:'up',KeyW:'up',w:'up',W:'up',
    ArrowDown:'down',KeyS:'down',s:'down',S:'down',
    ArrowLeft:'left',KeyA:'left',a:'left',A:'left',
    ArrowRight:'right',KeyD:'right',d:'right',D:'right'
  };

  window.addEventListener('keydown',e=>{
    const d=keyMap[e.code]||keyMap[e.key];
    if(d){keyDirs.add(d);e.preventDefault();}
  },{passive:false});
  window.addEventListener('keyup',e=>{
    const d=keyMap[e.code]||keyMap[e.key];
    if(d){keyDirs.delete(d);e.preventDefault();}
  },{passive:false});
  window.addEventListener('blur',()=>{keyDirs.clear();touchDirs.clear();runTouch=false;});

  document.querySelectorAll('[data-touch]').forEach(btn=>{
    const d=btn.dataset.touch;
    const down=e=>{e.preventDefault();touchDirs.clear();touchDirs.add(d);try{btn.setPointerCapture(e.pointerId)}catch(_){}};
    const up=e=>{e.preventDefault();touchDirs.delete(d)};
    btn.addEventListener('pointerdown',down);
    btn.addEventListener('pointerup',up);
    btn.addEventListener('pointercancel',up);
    btn.addEventListener('lostpointercapture',up);
  });
  const runBtn=document.querySelector('[data-run]');
  runBtn?.addEventListener('pointerdown',e=>{e.preventDefault();runTouch=true});
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>runBtn?.addEventListener(ev,e=>{e.preventDefault();runTouch=false}));

  function pressed(d){return keyDirs.has(d)||touchDirs.has(d)}

  let modelReady=false;
  const velocity=new B.Vector3(0,0,0);
  let idleGroup=null,walkGroup=null,runGroup=null,activeGroup=null;

  function pick(groups,tags){
    return groups.find(g=>tags.some(t=>(g.name||'').toLowerCase().includes(t)))||null;
  }
  function play(group,speed=1){
    if(!group)return;
    if(activeGroup===group&&group.isPlaying){group.speedRatio=speed;return;}
    [idleGroup,walkGroup,runGroup].filter(Boolean).forEach(g=>{if(g!==group)g.stop()});
    group.start(true,speed,group.from,group.to,false);
    activeGroup=group;
  }

  async function loadPlayer(){
    try{
      setStatus('Cargando GLB animado…');
      const r=await B.SceneLoader.ImportMeshAsync('','assets/models/','bebe_azul_animado.glb',scene);
      const imported=new Set(r.meshes);
      r.meshes.filter(m=>!m.parent||!imported.has(m.parent)).forEach(m=>m.parent=modelPivot);

      const meshes=r.meshes.filter(m=>m.getTotalVertices?.()>0);
      if(!meshes.length)throw new Error('No hay geometría.');
      meshes.forEach(m=>{m.receiveShadows=true;shadows.addShadowCaster(m)});

      scene.render();
      let min=new B.Vector3(Infinity,Infinity,Infinity),max=new B.Vector3(-Infinity,-Infinity,-Infinity);
      meshes.forEach(m=>{
        m.computeWorldMatrix(true);
        const b=m.getBoundingInfo().boundingBox;
        min=B.Vector3.Minimize(min,b.minimumWorld);
        max=B.Vector3.Maximize(max,b.maximumWorld);
      });

      // Más pequeño que la versión anterior.
      const h=Math.max(.001,max.y-min.y);
      modelPivot.scaling.setAll(1.70/h);

      scene.render();
      min=new B.Vector3(Infinity,Infinity,Infinity);max=new B.Vector3(-Infinity,-Infinity,-Infinity);
      meshes.forEach(m=>{
        m.computeWorldMatrix(true);
        const b=m.getBoundingInfo().boundingBox;
        min=B.Vector3.Minimize(min,b.minimumWorld);
        max=B.Vector3.Maximize(max,b.maximumWorld);
      });
      modelPivot.position.x-=(min.x+max.x)/2;
      modelPivot.position.y-=min.y;
      modelPivot.position.z-=(min.z+max.z)/2;

      // El modelo exportado está mirando al sentido contrario del desplazamiento.
      modelPivot.rotation.y=Math.PI;

      const groups=r.animationGroups||[];
      idleGroup=pick(groups,['idle','stand'])||groups[0]||null;
      walkGroup=pick(groups,['walk'])||groups[1]||idleGroup;
      runGroup=pick(groups,['run'])||groups[2]||walkGroup;
      if(idleGroup)play(idleGroup,1);

      modelReady=true;
      setStatus(`Listo · ${groups.length} animación(es) · orientación y control v2`);
      loadingEl.classList.add('hidden');
    }catch(err){
      console.error(err);
      setStatus('No se pudo cargar bebe_azul_animado.glb',true);
    }
  }

  scene.onBeforeRenderObservable.add(()=>{
    const dt=Math.min(.022,engine.getDeltaTime()/1000);

    let dx=0,dz=0;
    if(pressed('up'))dz-=1;
    if(pressed('down'))dz+=1;
    if(pressed('left'))dx-=1;
    if(pressed('right'))dx+=1;

    const running=runTouch||keyDirs.has('Shift')||keyDirs.has('ShiftLeft')||keyDirs.has('ShiftRight');

    // IMPORTANTE: lateral deliberadamente mucho más lento.
    const forwardSpeed=running?2.15:1.30;
    const lateralSpeed=running?0.95:0.52;

    let targetVX=modelReady?dx*lateralSpeed:0;
    let targetVZ=modelReady?dz*forwardSpeed:0;
    if(dx&&dz){targetVX*=.78;targetVZ*=.78;}

    const response=1-Math.exp(-7*dt);
    velocity.x=B.Scalar.Lerp(velocity.x,targetVX,response);
    velocity.z=B.Scalar.Lerp(velocity.z,targetVZ,response);

    if(!dx&&Math.abs(velocity.x)<.01)velocity.x=0;
    if(!dz&&Math.abs(velocity.z)<.01)velocity.z=0;

    player.position.x+=velocity.x*dt;
    player.position.z+=velocity.z*dt;
    player.position.x=B.Scalar.Clamp(player.position.x,-5.1,5.1);
    player.position.z=B.Scalar.Clamp(player.position.z,-20,20);

    const moving=Math.hypot(velocity.x,velocity.z)>.035;
    if(moving){
      const wanted=Math.atan2(velocity.x,velocity.z);
      let diff=((wanted-player.rotation.y+Math.PI)%(Math.PI*2))-Math.PI;
      player.rotation.y+=diff*(1-Math.exp(-8*dt));
      if(running)play(runGroup||walkGroup,1.05);
      else play(walkGroup,0.92);
    }else{
      play(idleGroup,1);
    }

    // cámara estable, centrada horizontalmente y con personaje más abajo.
    camera.position.x=player.position.x;
    camera.position.y=4.85;
    camera.position.z=player.position.z+7.6;
    camera.setTarget(new B.Vector3(player.position.x,.95,player.position.z-2.1));

    goal.rotation.z+=dt*.3;
  });

  engine.runRenderLoop(()=>{
    scene.render();
    const f=document.getElementById('fps');
    if(f)f.textContent=Math.round(engine.getFps())+' FPS';
  });

  window.addEventListener('resize',()=>engine.resize());
  window.visualViewport?.addEventListener('resize',()=>engine.resize());

  loadPlayer();
})();