(() => {
'use strict';

const B=window.BABYLON;
const statusEl=document.getElementById('status');
const loadingEl=document.getElementById('loading');
const loadingText=document.getElementById('loadingText');

function setStatus(msg,error=false){
  statusEl.textContent=msg;
  statusEl.classList.toggle('error',error);
  loadingText.textContent=msg;
}
if(!B){setStatus('No cargó Babylon.js.',true);return;}

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

// HIERARQUÍA:
// player = movimiento/rumbo
// recenter = traslación EN EJES DEL MUNDO (corrige centro y suelo)
// axisFix = corrige X/Y/Z del GLB
// scaleRoot = tamaño
// modelo importado
const player=new B.TransformNode('player',scene);
const recenter=new B.TransformNode('recenter',scene);recenter.parent=player;
const axisFix=new B.TransformNode('axisFix',scene);axisFix.parent=recenter;
const scaleRoot=new B.TransformNode('scaleRoot',scene);scaleRoot.parent=axisFix;

const camera=new B.FreeCamera('camera',new B.Vector3(0,4.8,7.4),scene);camera.inputs.clear();camera.fov=.68;camera.minZ=.08;camera.maxZ=150;scene.activeCamera=camera;

// controles
const keys=new Set(),touch=new Set();let runTouch=false;
const keyMap={ArrowUp:'up',KeyW:'up',w:'up',W:'up',ArrowDown:'down',KeyS:'down',s:'down',S:'down',ArrowLeft:'left',KeyA:'left',a:'left',A:'left',ArrowRight:'right',KeyD:'right',d:'right',D:'right'};
window.addEventListener('keydown',e=>{const d=keyMap[e.code]||keyMap[e.key];if(d){keys.add(d);e.preventDefault()}if(e.key==='Shift')keys.add('run')},{passive:false});
window.addEventListener('keyup',e=>{const d=keyMap[e.code]||keyMap[e.key];if(d){keys.delete(d);e.preventDefault()}if(e.key==='Shift')keys.delete('run')},{passive:false});
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

function getBounds(meshes){
  scene.render();
  let min=new B.Vector3(Infinity,Infinity,Infinity),max=new B.Vector3(-Infinity,-Infinity,-Infinity);
  meshes.forEach(m=>{
    m.computeWorldMatrix(true);
    const b=m.getBoundingInfo().boundingBox;
    min=B.Vector3.Minimize(min,b.minimumWorld);max=B.Vector3.Maximize(max,b.maximumWorld);
  });
  return {min,max,size:max.subtract(min),center:min.add(max).scale(.5)};
}

function findNode(nodes,tags){
  return nodes.find(n=>tags.some(t=>(n.name||'').toLowerCase().includes(t)))||null;
}
function nodeY(n){try{return n.getAbsolutePosition().y}catch(_){return 0}}

function stripRootMotion(groups){
  let changed=0;
  groups.forEach(g=>g.targetedAnimations?.forEach(ta=>{
    const anim=ta.animation,target=ta.target;
    if(!anim||!target||anim.targetProperty!=='position')return;
    const n=(target.name||'').toLowerCase();
    if(!/(hips|root|armature)/.test(n))return;
    const ks=anim.getKeys?.();if(!ks||ks.length<2)return;
    const first=ks[0].value;if(!first||typeof first.x!=='number')return;
    const bx=first.x,bz=first.z;
    anim.setKeys(ks.map(k=>{
      const c={...k},v=k.value;
      c.value=new B.Vector3(bx,v.y,bz);
      if(k.inTangent&&typeof k.inTangent.x==='number')c.inTangent=new B.Vector3(0,k.inTangent.y,0);
      if(k.outTangent&&typeof k.outTangent.x==='number')c.outTangent=new B.Vector3(0,k.outTangent.y,0);
      return c;
    }));
    changed++;
  }));
  return changed;
}

let ready=false,idle=null,walk=null,run=null,active=null;
function pick(groups,tags){return groups.find(g=>tags.some(t=>(g.name||'').toLowerCase().includes(t)))||null}
function play(g,speed=1){
  if(!g)return;
  if(active===g&&g.isPlaying){g.speedRatio=speed;return}
  [idle,walk,run].filter(Boolean).forEach(x=>{if(x!==g)x.stop()});
  g.start(true,speed,g.from,g.to,false);active=g;
}

async function loadCharacter(){
  try{
    setStatus('Cargando personaje…');

    // MUY IMPORTANTE: preparar todo con player en el origen.
    player.position.set(0,0,0);
    player.rotation.set(0,0,0);
    recenter.position.set(0,0,0);
    axisFix.rotation.set(0,0,0);
    scaleRoot.scaling.setAll(1);

    const r=await B.SceneLoader.ImportMeshAsync('','assets/models/','bebe_azul_animado.glb',scene);
    const imported=new Set(r.meshes);
    r.meshes.filter(m=>!m.parent||!imported.has(m.parent)).forEach(m=>m.parent=scaleRoot);

    const meshes=r.meshes.filter(m=>m.getTotalVertices?.()>0);
    if(!meshes.length)throw new Error('GLB sin geometría');
    meshes.forEach(m=>{m.receiveShadows=true;shadows.addShadowCaster(m)});

    // Detectar eje de altura.
    let b=getBounds(meshes);
    const s=b.size;
    const tallest=s.y>=s.x&&s.y>=s.z?'y':(s.z>=s.x?'z':'x');

    const nodes=[...(r.transformNodes||[]),...(r.meshes||[])];
    const head=findNode(nodes,['head','cabeza']);
    const feet=[
      findNode(nodes,['leftfoot','left_foot','foot.l','lefttoe']),
      findNode(nodes,['rightfoot','right_foot','foot.r','righttoe'])
    ].filter(Boolean);

    if(tallest==='z'){
      let best={angle:-Math.PI/2,score:-Infinity};
      for(const angle of [-Math.PI/2,Math.PI/2]){
        axisFix.rotation.set(angle,0,0);scene.render();
        const score=head&&feet.length ? nodeY(head)-feet.reduce((a,n)=>a+nodeY(n),0)/feet.length : getBounds(meshes).size.y;
        if(score>best.score)best={angle,score};
      }
      axisFix.rotation.set(best.angle,0,0);
    }else if(tallest==='x'){
      let best={angle:-Math.PI/2,score:-Infinity};
      for(const angle of [-Math.PI/2,Math.PI/2]){
        axisFix.rotation.set(0,0,angle);scene.render();
        const score=head&&feet.length ? nodeY(head)-feet.reduce((a,n)=>a+nodeY(n),0)/feet.length : getBounds(meshes).size.y;
        if(score>best.score)best={angle,score};
      }
      axisFix.rotation.set(0,0,best.angle);
    }

    // Escala uniforme.
    b=getBounds(meshes);
    scaleRoot.scaling.setAll(1.75/Math.max(.001,b.size.y));

    // AHORA el centrado se aplica en "recenter", que está por ENCIMA del giro de ejes.
    b=getBounds(meshes);
    recenter.position.set(-b.center.x,-b.min.y,-b.center.z);

    // Root motion.
    const groups=r.animationGroups||[];
    const rootTracks=stripRootMotion(groups);

    idle=pick(groups,['idle','stand'])||groups[0]||null;
    walk=pick(groups,['walk'])||groups[1]||idle;
    run=pick(groups,['run'])||groups[2]||walk;
    if(idle)play(idle,1);

    // Colocar al personaje EN EL CENTRO DE LA CALLE después de terminar su preparación.
    player.position.set(0,0,6);

    ready=true;
    setStatus(`VISIBLE · ${groups.length} animaciones · ${rootTracks} root motion neutralizados`);
    loadingEl.classList.add('hidden');
  }catch(e){
    console.error(e);
    setStatus('Error al preparar el Bebé Azul.',true);
  }
}

const velocity=new B.Vector3();
scene.onBeforeRenderObservable.add(()=>{
  const dt=Math.min(.022,engine.getDeltaTime()/1000);
  let dx=0,dz=0;
  if(pressed('up'))dz-=1;if(pressed('down'))dz+=1;if(pressed('left'))dx-=1;if(pressed('right'))dx+=1;
  const len=Math.hypot(dx,dz);if(len){dx/=len;dz/=len}

  const running=keys.has('run')||runTouch;
  const speed=running?2.0:1.25;
  const tx=ready?dx*speed:0,tz=ready?dz*speed:0;
  const response=1-Math.exp(-9*dt);
  velocity.x=B.Scalar.Lerp(velocity.x,tx,response);
  velocity.z=B.Scalar.Lerp(velocity.z,tz,response);
  if(!dx&&Math.abs(velocity.x)<.008)velocity.x=0;if(!dz&&Math.abs(velocity.z)<.008)velocity.z=0;

  player.position.x+=velocity.x*dt;player.position.z+=velocity.z*dt;
  player.position.x=B.Scalar.Clamp(player.position.x,-5.1,5.1);player.position.z=B.Scalar.Clamp(player.position.z,-20,20);

  const moving=Math.hypot(velocity.x,velocity.z)>.03;
  if(moving){
    const desired=Math.atan2(velocity.x,velocity.z)-Math.PI;
    let diff=((desired-player.rotation.y+Math.PI)%(Math.PI*2))-Math.PI;
    player.rotation.y+=diff*(1-Math.exp(-10*dt));
    play(running?(run||walk):walk,running?1.03:.95);
  }else play(idle,1);

  // Cámara fija al personaje: debe quedar visible y centrado.
  camera.position.set(player.position.x,4.25,player.position.z+6.4);
  camera.setTarget(new B.Vector3(player.position.x,.9,player.position.z));

  goal.rotation.z+=dt*.3;
});

engine.runRenderLoop(()=>{
  scene.render();
  const f=document.getElementById('fps');if(f)f.textContent=Math.round(engine.getFps())+' FPS';
});
window.addEventListener('resize',()=>engine.resize());
window.visualViewport?.addEventListener('resize',()=>engine.resize());

loadCharacter();
})();