(() => {
'use strict';

const B=window.BABYLON;
const statusEl=document.getElementById('status');
const loadingEl=document.getElementById('loading');
const loadingText=document.getElementById('loadingText');

function status(msg,error=false){
  statusEl.textContent=msg;
  statusEl.classList.toggle('error',error);
  loadingText.textContent=msg;
}
if(!B){status('No cargó Babylon.js.',true);return;}

const canvas=document.getElementById('renderCanvas');
const engine=new B.Engine(canvas,true,{antialias:true,stencil:true,powerPreference:'high-performance'});
engine.setHardwareScalingLevel(1/Math.min(devicePixelRatio||1,2));

const scene=new B.Scene(engine);
scene.clearColor=B.Color4.FromHexString('#071528ff');
scene.fogMode=B.Scene.FOGMODE_EXP2;
scene.fogColor=B.Color3.FromHexString('#0b1d2e');
scene.fogDensity=.009;
scene.imageProcessingConfiguration.contrast=1.12;
scene.imageProcessingConfiguration.exposure=1.02;
scene.imageProcessingConfiguration.toneMappingEnabled=true;
scene.imageProcessingConfiguration.toneMappingType=B.ImageProcessingConfiguration.TONEMAPPING_ACES;

const hemi=new B.HemisphericLight('hemi',new B.Vector3(-.2,1,.15),scene);hemi.intensity=1.05;
const sun=new B.DirectionalLight('sun',new B.Vector3(-.55,-1,-.45),scene);sun.position=new B.Vector3(16,28,18);sun.intensity=2;
const shadows=new B.ShadowGenerator(1024,sun);shadows.usePercentageCloserFiltering=true;shadows.filteringQuality=B.ShadowGenerator.QUALITY_MEDIUM;

function mat(name,hex,rough=.8,emissive=null){
  const m=new B.PBRMaterial(name,scene);m.albedoColor=B.Color3.FromHexString(hex);m.roughness=rough;
  if(emissive)m.emissiveColor=B.Color3.FromHexString(emissive);return m;
}
const mats={
  road:mat('road','#607d91',.95),sidewalk:mat('sidewalk','#c8d5db',.9),line:mat('line','#ffe875',.7,'#6b5400'),
  grass:mat('grass','#4c9b5d',.95),wall1:mat('wall1','#4f7898',.85),wall2:mat('wall2','#775c91',.85),
  wall3:mat('wall3','#b96e5a',.85),window:mat('window','#74d8ff',.35,'#103b52'),lamp:mat('lamp','#ffe69b',.4,'#e0b928'),
  pole:mat('pole','#34495d',.6),trunk:mat('trunk','#7b563b',.9),leaves:mat('leaves','#3b9050',.9),goal:mat('goal','#ffe276',.4,'#ffcf32')
};
function box(name,w,h,d,x,y,z,m){const q=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);q.position.set(x,y,z);q.material=m;q.receiveShadows=true;return q}
function cyl(name,d,h,x,y,z,m){const q=B.MeshBuilder.CreateCylinder(name,{diameter:d,height:h,tessellation:18},scene);q.position.set(x,y,z);q.material=m;q.receiveShadows=true;return q}
function sphere(name,d,x,y,z,m){const q=B.MeshBuilder.CreateSphere(name,{diameter:d,segments:18},scene);q.position.set(x,y,z);q.material=m;q.receiveShadows=true;return q}

// escenario
box('road',13,.18,46,0,-.09,0,mats.road);box('walkL',4.4,.28,46,-8.7,.01,0,mats.sidewalk);box('walkR',4.4,.28,46,8.7,.01,0,mats.sidewalk);
box('grassL',9,.18,46,-15.2,-.03,0,mats.grass);box('grassR',9,.18,46,15.2,-.03,0,mats.grass);
for(let z=-20;z<=20;z+=4.4)box('line'+z,.18,.03,2.15,0,.035,z,mats.line);
function building(x,z,w,d,h,m){
  const b=box('building',w,h,d,x,h/2+.12,z,m);shadows.addShadowCaster(b);
  for(let yy=1;yy<h-1;yy+=1.8)for(let xx=-w/2+1;xx<w/2-.5;xx+=1.8)box('window',.75,.55,.04,x+xx,yy,z+(z<0?d/2+.03:-d/2-.03),mats.window);
}
building(-12,-13,8,7,7,mats.wall1);building(12,-12,8.5,8,8,mats.wall2);building(-12,12,8.5,7.5,7.5,mats.wall3);building(12,13,9,8,6.5,mats.wall1);
function lamp(x,z){const p=cyl('pole',.15,3.6,x,1.8,z,mats.pole),s=sphere('light',.45,x,3.58,z,mats.lamp);shadows.addShadowCaster(p);shadows.addShadowCaster(s)}
[-17,-8,1,10,18].forEach((z,i)=>{lamp(-6,z);if(i%2===0)lamp(6,z+2.2)});
function tree(x,z){const t=cyl('trunk',.35,1.4,x,.7,z,mats.trunk),a=sphere('leaves',1.65,x,1.8,z,mats.leaves);shadows.addShadowCaster(t);shadows.addShadowCaster(a)}
[[-9,-3],[9,-1],[-9,5],[9,7],[-10,19],[10,-19]].forEach(p=>tree(...p));
const goal=B.MeshBuilder.CreateTorus('goal',{diameter:2.6,thickness:.1,tessellation:32},scene);goal.position.set(0,.12,-17);goal.rotation.x=Math.PI/2;goal.material=mats.goal;
const glow=new B.GlowLayer('glow',scene,{blurKernelSize:32});glow.intensity=.3;

// jerarquía separada: player = rumbo; axisFix = orientación del GLB; modelRoot = escala/centrado
const player=new B.TransformNode('player',scene);player.position.set(0,0,8);
const axisFix=new B.TransformNode('axisFix',scene);axisFix.parent=player;
const modelRoot=new B.TransformNode('modelRoot',scene);modelRoot.parent=axisFix;

const camera=new B.FreeCamera('camera',new B.Vector3(0,5.0,15),scene);camera.inputs.clear();camera.fov=.68;camera.minZ=.08;camera.maxZ=150;scene.activeCamera=camera;

// controles
const keys=new Set(),touch=new Set();let runTouch=false;
const map={ArrowUp:'up',KeyW:'up',w:'up',W:'up',ArrowDown:'down',KeyS:'down',s:'down',S:'down',ArrowLeft:'left',KeyA:'left',a:'left',A:'left',ArrowRight:'right',KeyD:'right',d:'right',D:'right'};
window.addEventListener('keydown',e=>{const d=map[e.code]||map[e.key];if(d){keys.add(d);e.preventDefault()}if(e.key==='Shift')keys.add('run')},{passive:false});
window.addEventListener('keyup',e=>{const d=map[e.code]||map[e.key];if(d){keys.delete(d);e.preventDefault()}if(e.key==='Shift')keys.delete('run')},{passive:false});
window.addEventListener('blur',()=>{keys.clear();touch.clear();runTouch=false});
document.querySelectorAll('[data-touch]').forEach(btn=>{
  const d=btn.dataset.touch;
  const down=e=>{e.preventDefault();touch.clear();touch.add(d);try{btn.setPointerCapture(e.pointerId)}catch(_){}};
  const up=e=>{e.preventDefault();touch.delete(d)};
  btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',up);
});
const runBtn=document.querySelector('[data-run]');runBtn?.addEventListener('pointerdown',e=>{e.preventDefault();runTouch=true});
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>runBtn?.addEventListener(ev,e=>{e.preventDefault();runTouch=false}));
const pressed=d=>keys.has(d)||touch.has(d);

// helpers de bounds
function bounds(meshes){
  let min=new B.Vector3(Infinity,Infinity,Infinity),max=new B.Vector3(-Infinity,-Infinity,-Infinity);
  scene.render();
  meshes.forEach(m=>{
    m.computeWorldMatrix(true);
    const b=m.getBoundingInfo().boundingBox;
    min=B.Vector3.Minimize(min,b.minimumWorld);max=B.Vector3.Maximize(max,b.maximumWorld);
  });
  return{min,max,size:max.subtract(min)};
}
function nodeByNames(nodes,patterns){
  return nodes.find(n=>patterns.some(p=>(n.name||'').toLowerCase().includes(p)))||null;
}
function absY(n){try{return n.getAbsolutePosition().y}catch(_){return null}}

// hace la animación "in place": conserva Y del hips, congela X/Z
function stripRootMotion(groups){
  const seen=new Set();
  groups.forEach(g=>g.targetedAnimations?.forEach(ta=>{
    const anim=ta.animation,target=ta.target;
    if(!anim||!target||anim.targetProperty!=='position')return;
    const name=(target.name||'').toLowerCase();
    if(!/(hips|root|armature)/.test(name))return;
    const keyId=(target.uniqueId||target.name)+'|'+anim.name;
    if(seen.has(keyId))return;seen.add(keyId);
    const ks=anim.getKeys?.();if(!ks||ks.length<2)return;
    const first=ks[0].value;if(!first||typeof first.x!=='number')return;
    const bx=first.x,bz=first.z;
    const changed=ks.map(k=>{
      const copy={...k};
      const v=k.value;
      copy.value=new B.Vector3(bx,v.y,bz);
      if(k.inTangent&&typeof k.inTangent.x==='number')copy.inTangent=new B.Vector3(0,k.inTangent.y,0);
      if(k.outTangent&&typeof k.outTangent.x==='number')copy.outTangent=new B.Vector3(0,k.outTangent.y,0);
      return copy;
    });
    anim.setKeys(changed);
  }));
  return seen.size;
}

let ready=false,idle=null,walk=null,run=null,active=null;
function pick(groups,tags){return groups.find(g=>tags.some(t=>(g.name||'').toLowerCase().includes(t)))||null}
function play(g,speed=1){
  if(!g)return;
  if(active===g&&g.isPlaying){g.speedRatio=speed;return}
  [idle,walk,run].filter(Boolean).forEach(x=>{if(x!==g)x.stop()});
  g.start(true,speed,g.from,g.to,false);active=g;
}

async function load(){
  try{
    status('Cargando personaje…');
    const r=await B.SceneLoader.ImportMeshAsync('','assets/models/','bebe_azul_animado.glb',scene);
    const imported=new Set(r.meshes);
    r.meshes.filter(m=>!m.parent||!imported.has(m.parent)).forEach(m=>m.parent=modelRoot);
    const meshes=r.meshes.filter(m=>m.getTotalVertices?.()>0);
    if(!meshes.length)throw new Error('GLB sin geometría');
    meshes.forEach(m=>{m.receiveShadows=true;shadows.addShadowCaster(m)});

    // 1) detectar qué eje contiene la altura del personaje
    let b=bounds(meshes);
    const s=b.size;
    const tallest = s.y>=s.x&&s.y>=s.z?'y':(s.z>=s.x?'z':'x');

    const allNodes=[...(r.transformNodes||[]),...(r.meshes||[])];
    const head=nodeByNames(allNodes,['head','cabeza']);
    const footL=nodeByNames(allNodes,['leftfoot','left_foot','foot.l','lef toe','lefttoe']);
    const footR=nodeByNames(allNodes,['rightfoot','right_foot','foot.r','righttoe']);
    const feet=[footL,footR].filter(Boolean);

    if(tallest==='z'){
      // Z es altura: probar +/- 90° en X y escoger donde cabeza quede sobre los pies
      let best=null;
      for(const angle of [-Math.PI/2,Math.PI/2]){
        axisFix.rotation.set(angle,0,0);
        scene.render();
        let score=0;
        if(head&&feet.length){
          const fy=feet.reduce((a,n)=>a+(absY(n)||0),0)/feet.length;
          score=(absY(head)||0)-fy;
        }else{
          const cb=bounds(meshes); score=cb.size.y;
        }
        if(!best||score>best.score)best={angle,score};
      }
      axisFix.rotation.set(best.angle,0,0);
    }else if(tallest==='x'){
      // X es altura: probar +/- 90° en Z
      let best=null;
      for(const angle of [-Math.PI/2,Math.PI/2]){
        axisFix.rotation.set(0,0,angle);
        scene.render();
        let score=0;
        if(head&&feet.length){
          const fy=feet.reduce((a,n)=>a+(absY(n)||0),0)/feet.length;
          score=(absY(head)||0)-fy;
        }else{
          const cb=bounds(meshes); score=cb.size.y;
        }
        if(!best||score>best.score)best={angle,score};
      }
      axisFix.rotation.set(0,0,best.angle);
    }else{
      axisFix.rotation.set(0,0,0);
    }

    // 2) scale/center DESPUÉS de corregir eje
    b=bounds(meshes);
    modelRoot.scaling.setAll(1.75/Math.max(.001,b.size.y));
    b=bounds(meshes);
    modelRoot.position.x-=(b.min.x+b.max.x)/2;
    modelRoot.position.y-=b.min.y;
    modelRoot.position.z-=(b.min.z+b.max.z)/2;

    // 3) quitar desplazamiento interno de la animación
    const groups=r.animationGroups||[];
    const rootTracks=stripRootMotion(groups);

    idle=pick(groups,['idle','stand'])||groups[0]||null;
    walk=pick(groups,['walk'])||groups[1]||idle;
    run=pick(groups,['run'])||groups[2]||walk;
    if(idle)play(idle,1);

    ready=true;
    status(`De pie · ${groups.length} animaciones · ${rootTracks} pista(s) de root motion neutralizadas`);
    loadingEl.classList.add('hidden');
  }catch(e){
    console.error(e);status('Error al preparar el modelo animado.',true);
  }
}

const velocity=new B.Vector3();
scene.onBeforeRenderObservable.add(()=>{
  const dt=Math.min(.022,engine.getDeltaTime()/1000);
  let dx=0,dz=0;
  if(pressed('up'))dz-=1;if(pressed('down'))dz+=1;if(pressed('left'))dx-=1;if(pressed('right'))dx+=1;
  const len=Math.hypot(dx,dz);
  if(len){dx/=len;dz/=len}
  const running=keys.has('run')||runTouch;
  const speed=running?2.2:1.35;

  const tx=ready?dx*speed:0,tz=ready?dz*speed:0;
  const response=1-Math.exp(-9*dt);
  velocity.x=B.Scalar.Lerp(velocity.x,tx,response);velocity.z=B.Scalar.Lerp(velocity.z,tz,response);
  if(!dx&&Math.abs(velocity.x)<.008)velocity.x=0;if(!dz&&Math.abs(velocity.z)<.008)velocity.z=0;

  player.position.x+=velocity.x*dt;player.position.z+=velocity.z*dt;
  player.position.x=B.Scalar.Clamp(player.position.x,-5.1,5.1);player.position.z=B.Scalar.Clamp(player.position.z,-20,20);

  const moving=Math.hypot(velocity.x,velocity.z)>.03;
  if(moving){
    // personaje base tratado como mirando hacia -Z
    const desired=Math.atan2(velocity.x,velocity.z)-Math.PI;
    let diff=((desired-player.rotation.y+Math.PI)%(Math.PI*2))-Math.PI;
    player.rotation.y+=diff*(1-Math.exp(-10*dt));
    play(running?(run||walk):walk,running?1.05:.95);
  }else play(idle,1);

  // cámara: personaje centro-bajo
  camera.position.set(player.position.x,4.55,player.position.z+7.2);
  camera.setTarget(new B.Vector3(player.position.x,.95,player.position.z-.7));
  goal.rotation.z+=dt*.3;
});

engine.runRenderLoop(()=>{scene.render();const f=document.getElementById('fps');if(f)f.textContent=Math.round(engine.getFps())+' FPS'});
window.addEventListener('resize',()=>engine.resize());
window.visualViewport?.addEventListener('resize',()=>engine.resize());
load();
})();