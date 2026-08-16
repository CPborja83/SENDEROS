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
  wall3:mat('wall3','#b96e5a',.85),window:mat('window','#74d8ff',.35,'#103b52'),
  lamp:mat('lamp','#ffe69b',.4,'#e0b928'),pole:mat('pole','#34495d',.6),
  trunk:mat('trunk','#7b563b',.9),leaves:mat('leaves','#3b9050',.9),goal:mat('goal','#ffe276',.4,'#ffcf32'),
  wood:mat('wood','#8b6345',.88),metal:mat('metal','#53677a',.55),dark:mat('dark','#1f3445',.72),
  orange:mat('orange','#f29b38',.65,'#5a2a00'),red:mat('red','#c94f4f',.72),blueSign:mat('blueSign','#3f8fc1',.58),
  planter:mat('planter','#765b47',.9),flower:mat('flower','#e36f9f',.82),boxMat:mat('boxMat','#9a754d',.92),
  spirit:mat('spirit','#8cecff',.25,'#58d9ff'),shadow:mat('shadow','#0b1018',.72,'#020407'),
  station:mat('station','#7d68c9',.42,'#302261')
};
function box(name,w,h,d,x,y,z,m){const q=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);q.position.set(x,y,z);q.material=m;q.receiveShadows=true;return q}
function cyl(name,d,h,x,y,z,m){const q=B.MeshBuilder.CreateCylinder(name,{diameter:d,height:h,tessellation:18},scene);q.position.set(x,y,z);q.material=m;q.receiveShadows=true;return q}
function sphere(name,d,x,y,z,m){const q=B.MeshBuilder.CreateSphere(name,{diameter:d,segments:18},scene);q.position.set(x,y,z);q.material=m;q.receiveShadows=true;return q}

// Colisiones 2D (X/Z). El personaje se mueve manualmente, así que hacemos
// resolución por ejes para permitir deslizarse alrededor de obstáculos.
const colliders=[];
const PLAYER_RADIUS=.31;
function addCollider(name,x,z,w,d,pad=0){
  colliders.push({name,x,z,hw:w/2+pad,hd:d/2+pad});
}
function circleHitsAABB(x,z,r,c){
  const cx=Math.max(c.x-c.hw,Math.min(x,c.x+c.hw));
  const cz=Math.max(c.z-c.hd,Math.min(z,c.z+c.hd));
  const dx=x-cx,dz=z-cz;
  return dx*dx+dz*dz < r*r;
}
function blockedAt(x,z){
  return colliders.some(c=>circleHitsAABB(x,z,PLAYER_RADIUS,c));
}

// Escenario v10
// La calle anterior medía 13 unidades. Ahora mide 6.5: exactamente la mitad.
const ROAD_W=6.5;
const WALK_W=2.8;
const ROAD_EDGE=ROAD_W/2;
const WALK_CENTER=ROAD_EDGE+WALK_W/2;

// Alturas físicas de las superficies.
const ROAD_SURFACE_Y=0.0;
const SIDEWALK_SURFACE_Y=0.15;
const CURB_SURFACE_Y=0.22;

box('road',ROAD_W,.18,46,0,-.09,0,mats.road);
box('walkL',WALK_W,.28,46,-WALK_CENTER,.01,0,mats.sidewalk);
box('walkR',WALK_W,.28,46, WALK_CENTER,.01,0,mats.sidewalk);

// Bordillos para que se perciba mejor el límite de la calle.
box('curbL',.20,.34,46,-ROAD_EDGE,.05,0,mats.sidewalk);
box('curbR',.20,.34,46, ROAD_EDGE,.05,0,mats.sidewalk);

// Franjas pequeñas de área verde detrás de las banquetas.
box('grassL',4.4,.18,46,-8.0,-.03,0,mats.grass);
box('grassR',4.4,.18,46, 8.0,-.03,0,mats.grass);

// Línea central ligeramente más pequeña para la nueva escala.
for(let z=-20;z<=20;z+=4.1)box('line'+z,.14,.03,1.75,0,.035,z,mats.line);

function building(x,z,w,d,h,m){
  const b=box('building',w,h,d,x,h/2+.12,z,m);shadows.addShadowCaster(b);
  addCollider('edificio',x,z,w,d,.12);
  for(let yy=1;yy<h-1;yy+=1.8){
    for(let xx=-w/2+1;xx<w/2-.5;xx+=1.8){
      box('window',.75,.55,.04,x+xx,yy,z+(z<0?d/2+.03:-d/2-.03),mats.window);
    }
  }
}
building(-8.6,-14,5.2,6.2,6.0,mats.wall1);
building( 8.6,-12,5.5,6.6,6.8,mats.wall2);
building(-8.6, 12,5.6,6.0,6.4,mats.wall3);
building( 8.6, 14,5.8,6.2,5.8,mats.wall1);

function lamp(x,z){
  const p=cyl('pole',.15,3.6,x,1.8,z,mats.pole);
  addCollider('poste',x,z,.25,.25,.06);
  const s=sphere('light',.45,x,3.58,z,mats.lamp);
  shadows.addShadowCaster(p);shadows.addShadowCaster(s);
}
[-17,-8,1,10,18].forEach((z,i)=>{lamp(-3.55,z);if(i%2===0)lamp(3.55,z+2.2)});

function tree(x,z){
  const t=cyl('trunk',.35,1.4,x,.7,z,mats.trunk);
  addCollider('árbol',x,z,.50,.50,.08);
  const a=sphere('leaves',1.65,x,1.8,z,mats.leaves);
  shadows.addShadowCaster(t);shadows.addShadowCaster(a);
}
[[-6.3,-3],[6.3,-1],[-6.3,5],[6.3,7],[-6.5,19],[6.5,-19]].forEach(p=>tree(...p));

// Más objetos cerca de la calle para que caminar no se sienta vacío.
function bench(x,z,rot=0){
  const seat=box('benchSeat',1.55,.16,.48,x,.48,z,mats.wood);
  addCollider('banca',x,z,rot?0.75:1.75,rot?1.75:0.75,.05);
  const back=box('benchBack',1.55,.62,.14,x,.80,z-.18,mats.wood);
  const leg1=box('benchLeg',.14,.48,.14,x-.52,.24,z,mats.metal);
  const leg2=box('benchLeg',.14,.48,.14,x+.52,.24,z,mats.metal);
  [seat,back,leg1,leg2].forEach(m=>{m.rotation.y=rot;shadows.addShadowCaster(m)});
}
function trashBin(x,z){
  const body=cyl('trashBin',.55,.82,x,.41,z,mats.dark);
  addCollider('basurero',x,z,.65,.65,.04);
  const rim=cyl('trashRim',.63,.10,x,.85,z,mats.metal);
  shadows.addShadowCaster(body);shadows.addShadowCaster(rim);
}
function trafficCone(x,z){
  const base=box('coneBase',.48,.08,.48,x,.04,z,mats.dark);
  addCollider('cono',x,z,.52,.52,.02);
  const cone=B.MeshBuilder.CreateCylinder('cone',{diameterTop:.10,diameterBottom:.38,height:.68,tessellation:16},scene);
  cone.position.set(x,.40,z);cone.material=mats.orange;shadows.addShadowCaster(cone);
}
function streetSign(x,z,textSide=1){
  const pole=cyl('signPole',.10,2.05,x,1.02,z,mats.metal);
  addCollider('señal',x,z,.26,.26,.05);
  const plate=box('signPlate',.78,.52,.08,x,1.90,z,mats.blueSign);
  plate.rotation.y=textSide<0?Math.PI:0;
  shadows.addShadowCaster(pole);shadows.addShadowCaster(plate);
}
function crate(x,z,scale=1){
  const c=box('crate',.70*scale,.62*scale,.70*scale,x,.31*scale,z,mats.boxMat);
  addCollider('caja',x,z,.75*scale,.75*scale,.04);
  shadows.addShadowCaster(c);
}
function planter(x,z){
  const pot=cyl('planter',.72,.48,x,.24,z,mats.planter);
  addCollider('macetero',x,z,.82,.82,.04);
  const bush=sphere('planterBush',.82,x,.72,z,mats.leaves);
  shadows.addShadowCaster(pot);shadows.addShadowCaster(bush);
}
function hydrant(x,z){
  const b=cyl('hydrant',.38,.72,x,.36,z,mats.red);
  addCollider('hidrante',x,z,.52,.52,.05);
  const top=sphere('hydrantTop',.42,x,.78,z,mats.red);
  shadows.addShadowCaster(b);shadows.addShadowCaster(top);
}

// Distribución a ambos lados de la vía, cerca de la cámara y del recorrido.
// Parque pequeño al lado izquierdo: las bancas salen de la banqueta.
const parkFloor=box('parkFloor',4.2,.18,10.5,-8.0,.06,5.2,mats.grass);
const parkPath=box('parkPath',1.55,.18,9.5,-7.0,.12,5.2,mats.sidewalk);

// Bancas dentro del parque, no bloqueando el paso peatonal.
[
  [-8.35,2.0,Math.PI/2],
  [-8.35,5.1,Math.PI/2],
  [-8.35,8.2,Math.PI/2]
].forEach(p=>bench(...p));

// Árboles y maceteros del parque.
tree(-9.0,1.2); tree(-9.0,9.2);
planter(-7.9,.8); planter(-7.9,9.6);


[[-5.55,18], [5.55,15], [-5.55,-9], [5.55,-15]].forEach(p=>trashBin(...p));
[[-3.05,13], [3.05,8], [-3.05,0], [3.05,-4], [-3.05,-13], [3.05,-19]].forEach(p=>trafficCone(...p));
[[-5.65,19,1], [5.65,12,-1], [-5.65,-11,1], [5.65,-18,-1]].forEach(p=>streetSign(...p));
[[-6.25,14,1], [6.25,6,.9], [-6.15,-2,.85], [6.25,-10,1], [-6.2,-18,.9]].forEach(p=>crate(...p));
[[-6.55,18], [6.55,16], [-6.55,9], [6.55,3], [-6.55,-7], [6.55,-14]].forEach(p=>planter(...p));
[[-4.65,10], [4.65,-8], [-4.65,-17]].forEach(p=>hydrant(...p));


// Dos pequeños espacios abiertos tipo habitación/local.
// La parte que mira a la calle queda abierta.
function openRoom(name,x,z,side,wallMat){
  const dir=side<0?-1:1;
  const roomW=4.0, roomD=3.6, roomH=2.7;

  // Piso.
  box(name+'Floor',roomW,.16,roomD,x,.08,z,mats.sidewalk);

  // Pared posterior, lejos de la calle.
  const back=box(name+'Back',.18,roomH,roomD,
                 x+dir*(roomW/2-.09),roomH/2,z,wallMat);

  // Paredes de arriba/abajo del cuarto.
  const sideA=box(name+'SideA',roomW,roomH,.18,x,roomH/2,z-roomD/2+.09,wallMat);
  const sideB=box(name+'SideB',roomW,roomH,.18,x,roomH/2,z+roomD/2-.09,wallMat);

  // Mobiliario visible desde la calle.
  const table=box(name+'Table',1.05,.14,.68,x-dir*.62,.72,z-.35,mats.wood);
  const leg1=box(name+'TableLeg1',.12,.66,.12,x-dir*.92,.34,z-.55,mats.metal);
  const leg2=box(name+'TableLeg2',.12,.66,.12,x-dir*.32,.34,z-.15,mats.metal);

  const bed=box(name+'Bed',1.45,.32,.78,x+dir*.58,.31,z+.68,mats.blueSign);
  const pillow=box(name+'Pillow',.46,.14,.48,x+dir*.58,.54,z+.68,mats.sidewalk);

  [back,sideA,sideB,table,leg1,leg2,bed,pillow].forEach(m=>shadows.addShadowCaster(m));

  addCollider(name+' pared fondo',x+dir*(roomW/2-.09),z,.30,roomD,.05);
  addCollider(name+' pared A',x,z-roomD/2+.09,roomW,.30,.05);
  addCollider(name+' pared B',x,z+roomD/2-.09,roomW,.30,.05);
  addCollider(name+' mesa',x-dir*.62,z-.35,1.15,.78,.04);
  addCollider(name+' cama',x+dir*.58,z+.68,1.55,.88,.04);
}

// Dos habitaciones/locales visibles al caminar.
openRoom('RoomLeft',-7.35,8,-1,mats.wall3);
openRoom('RoomRight',7.35,-5,1,mats.wall2);



// ---------------------------------------------------------
// ELEMENTOS DEL JUEGO PARA ESTA PRUEBA
// ---------------------------------------------------------
const spiritLights=[];
function makeSpiritLight(x,z,id){
  const orb=sphere('SpiritLight'+id,.40,x,.58,z,mats.spirit);
  const halo=B.MeshBuilder.CreateTorus('SpiritHalo'+id,{diameter:.78,thickness:.05,tessellation:24},scene);
  halo.position.set(x,.58,z);halo.rotation.x=Math.PI/2;halo.material=mats.spirit;
  const light=new B.PointLight('SpiritLamp'+id,new B.Vector3(x,.75,z),scene);
  light.diffuse=B.Color3.FromHexString('#8cecff');light.intensity=2.2;light.range=4;
  spiritLights.push({id,x,z,orb,halo,light,collected:false});
}
makeSpiritLight(0,-1,1);
makeSpiritLight(2.35,-8,2);
makeSpiritLight(-2.15,-15,3);

// Estación para mini juego, ubicada sobre la banqueta derecha.
const miniStation=B.MeshBuilder.CreateCylinder('MiniStation',{diameter:1.0,height:.22,tessellation:30},scene);
miniStation.position.set(4.45,.29,-4.6);miniStation.material=mats.station;miniStation.receiveShadows=true;
const miniHalo=B.MeshBuilder.CreateTorus('MiniHalo',{diameter:1.30,thickness:.08,tessellation:30},scene);
miniHalo.position.set(4.45,.72,-4.6);miniHalo.rotation.x=Math.PI/2;miniHalo.material=mats.spirit;

// Sombra simple de prueba: sigue al jugador a distancia.
const shadowNode=new B.TransformNode('ShadowFollower',scene);
const shadowBody=B.MeshBuilder.CreateCapsule('ShadowBody',{radius:.34,height:1.35,tessellation:18,subdivisions:4},scene);
shadowBody.parent=shadowNode;shadowBody.position.y=.68;shadowBody.material=mats.shadow;
const shadowHead=sphere('ShadowHead',.72,0,1.45,0,mats.shadow);shadowHead.parent=shadowNode;
shadowNode.position.set(0,0,14);

const goal=B.MeshBuilder.CreateTorus('goal',{diameter:2.6,thickness:.1,tessellation:32},scene);
goal.position.set(0,.12,-17);goal.rotation.x=Math.PI/2;goal.material=mats.goal;
const glow=new B.GlowLayer('glow',scene,{blurKernelSize:32});glow.intensity=.3;

// Jerarquía
const player=new B.TransformNode('player',scene);
const recenter=new B.TransformNode('recenter',scene);recenter.parent=player;
const headingFix=new B.TransformNode('headingFix',scene);headingFix.parent=recenter;
const axisFix=new B.TransformNode('axisFix',scene);axisFix.parent=headingFix;
const scaleRoot=new B.TransformNode('scaleRoot',scene);scaleRoot.parent=axisFix;

const camera=new B.FreeCamera('camera',new B.Vector3(0,4.8,7.4),scene);
camera.inputs.clear();camera.fov=.68;camera.minZ=.08;camera.maxZ=150;scene.activeCamera=camera;

// Controles
const keys=new Set(),touch=new Set();let runTouch=false;
const keyMap={
  ArrowUp:'up',KeyW:'up',w:'up',W:'up',
  ArrowDown:'down',KeyS:'down',s:'down',S:'down',
  ArrowLeft:'left',KeyA:'left',a:'left',A:'left',
  ArrowRight:'right',KeyD:'right',d:'right',D:'right'
};
window.addEventListener('keydown',e=>{
  const d=keyMap[e.code]||keyMap[e.key];
  if(d){keys.add(d);e.preventDefault()}
  if(e.key==='Shift')keys.add('run');
},{passive:false});
window.addEventListener('keyup',e=>{
  const d=keyMap[e.code]||keyMap[e.key];
  if(d){keys.delete(d);e.preventDefault()}
  if(e.key==='Shift')keys.delete('run');
},{passive:false});
window.addEventListener('blur',()=>{keys.clear();touch.clear();runTouch=false});

document.querySelectorAll('[data-touch]').forEach(btn=>{
  const d=btn.dataset.touch;
  const down=e=>{e.preventDefault();touch.clear();touch.add(d);try{btn.setPointerCapture(e.pointerId)}catch(_){}};
  const up=e=>{e.preventDefault();touch.delete(d)};
  btn.addEventListener('pointerdown',down);
  btn.addEventListener('pointerup',up);
  btn.addEventListener('pointercancel',up);
  btn.addEventListener('lostpointercapture',up);
});
const runBtn=document.querySelector('[data-run]');
runBtn?.addEventListener('pointerdown',e=>{e.preventDefault();runTouch=true});
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>runBtn?.addEventListener(ev,e=>{e.preventDefault();runTouch=false}));
const pressed=d=>keys.has(d)||touch.has(d);

function getBounds(meshes){
  scene.render();
  let min=new B.Vector3(Infinity,Infinity,Infinity),max=new B.Vector3(-Infinity,-Infinity,-Infinity);
  meshes.forEach(m=>{
    m.computeWorldMatrix(true);
    const b=m.getBoundingInfo().boundingBox;
    min=B.Vector3.Minimize(min,b.minimumWorld);
    max=B.Vector3.Maximize(max,b.maximumWorld);
  });
  return{min,max,size:max.subtract(min),center:min.add(max).scale(.5)};
}

// Neutraliza completamente la traslación del root/hips.
// Conserva las rotaciones de huesos (piernas, brazos, torso), pero evita
// que la animación levante o desplace al personaje entero.
function stripRootMotion(groups){
  const rootTracks=[];
  groups.forEach(g=>g.targetedAnimations?.forEach(ta=>{
    const anim=ta.animation,target=ta.target;
    if(!anim||!target||anim.targetProperty!=='position')return;
    const n=(target.name||'').toLowerCase();
    if(!/(hips|root|armature)/.test(n))return;
    const ks=anim.getKeys?.();
    if(!ks||ks.length<1)return;
    rootTracks.push({anim,target,keys:ks});
  }));

  if(!rootTracks.length)return 0;

  // Un mismo punto base para Idle / Walk / Run evita saltos entre acciones.
  const baseValue=rootTracks[0].keys[0].value;
  const base=new B.Vector3(baseValue.x,baseValue.y,baseValue.z);

  rootTracks.forEach(({anim,keys})=>{
    anim.setKeys(keys.map(k=>{
      const c={...k};
      c.value=base.clone();
      if(k.inTangent&&typeof k.inTangent.x==='number')c.inTangent=new B.Vector3(0,0,0);
      if(k.outTangent&&typeof k.outTangent.x==='number')c.outTangent=new B.Vector3(0,0,0);
      return c;
    }));
  });
  return rootTracks.length;
}

let ready=false,idle=null,walk=null,run=null,active=null;

// --- ANCLAJE REAL AL SUELO POR HUESOS ---
// Preferimos los huesos de los dedos (toe), porque están más cerca de la suela.
// Si no existen, usamos LeftFoot/RightFoot.
let groundSkeleton=null;
let groundMesh=null;
let groundBones=[];
let groundBoneMode='ninguno';
let groundFrame=0;

function findGroundBones(result, meshes){
  const skeletons=result.skeletons||[];
  groundSkeleton=skeletons[0]||null;
  groundMesh=meshes.find(m=>m.skeleton)||meshes[0]||null;
  if(!groundSkeleton||!groundMesh)return;

  const bones=groundSkeleton.bones||[];
  const by=(rx)=>bones.filter(b=>rx.test((b.name||'').toLowerCase()));

  const toes=by(/(lefttoe|righttoe|toe[_ .:-]?base|toe)/i);
  const feet=by(/(leftfoot|rightfoot|foot[_. :-]?[lr]?|foot)/i);

  if(toes.length>=2){
    groundBones=toes.slice(0,4);
    groundBoneMode='TOE';
  }else if(feet.length>=2){
    groundBones=feet.slice(0,4);
    groundBoneMode='FOOT';
  }else if(toes.length){
    groundBones=toes;
    groundBoneMode='TOE';
  }else if(feet.length){
    groundBones=feet;
    groundBoneMode='FOOT';
  }
}

function boneWorldY(bone){
  try{
    groundMesh.computeWorldMatrix(true);
    groundSkeleton?.computeAbsoluteTransforms?.();
    const p=bone.getAbsolutePosition(groundMesh);
    return Number.isFinite(p?.y)?p.y:null;
  }catch(_){
    return null;
  }
}

// Devuelve la altura real del piso bajo el personaje.
// La calle está en Y=0 y la banqueta en Y=0.15.
// Al cruzar el bordillo hacemos una transición suave para que no "salte".
function surfaceHeightAtPlayer(){
  const ax=Math.abs(player.position.x);

  // Calle
  if(ax <= ROAD_EDGE-0.10) return ROAD_SURFACE_Y;

  // Transición sobre el bordillo
  if(ax < ROAD_EDGE+0.18){
    const t=B.Scalar.Clamp((ax-(ROAD_EDGE-0.10))/0.28,0,1);
    const smooth=t*t*(3-2*t);
    return B.Scalar.Lerp(ROAD_SURFACE_Y,SIDEWALK_SURFACE_Y,smooth);
  }

  // Banqueta
  if(ax <= ROAD_EDGE+WALK_W) return SIDEWALK_SURFACE_Y;

  // Parque pavimentado/verde izquierdo: permitimos explorarlo.
  if(player.position.x < -(ROAD_EDGE+WALK_W) && player.position.x > -10.1 &&
     player.position.z > -.2 && player.position.z < 10.6){
    return .15;
  }

  // Resto de terreno exterior.
  return .06;
}

function pinFeetToGround(){
  if(!ready||!groundBones.length||!groundMesh)return false;

  const ys=groundBones.map(boneWorldY).filter(v=>v!==null);
  if(!ys.length)return false;

  // Toe debe quedar prácticamente sobre la superficie real bajo el jugador.
  // Foot es el tobillo, por eso su objetivo queda un poco más arriba.
  const surfaceY=surfaceHeightAtPlayer();
  const boneOffset=groundBoneMode==='TOE'?0.035:0.13;
  const targetY=surfaceY+boneOffset;
  const lowest=Math.min(...ys);
  const correction=targetY-lowest;

  // recenter está por encima del giro de ejes y debajo de player,
  // por lo que mover Y aquí es un ajuste vertical en coordenadas del mundo.
  if(Number.isFinite(correction)){
    // Corrección inmediata: evita que Idle/Walk/Run vuelvan a levantar todo el cuerpo.
    recenter.position.y += correction;
    return true;
  }
  return false;
}

function fallbackMeshGround(meshes){
  // Fallback solo si el GLB no expone huesos de pie.
  // Se ejecuta pocas veces para no cargar innecesariamente el render.
  try{
    meshes.forEach(m=>m.refreshBoundingInfo?.(true));
    const bb=getBounds(meshes);
    const target=surfaceHeightAtPlayer();
    if(Number.isFinite(bb.min.y))recenter.position.y+=(target-bb.min.y);
    return true;
  }catch(_){
    return false;
  }
}

function pick(groups,tags){return groups.find(g=>tags.some(t=>(g.name||'').toLowerCase().includes(t)))||null}
function play(g,speed=1){
  if(!g)return;
  if(active===g&&g.isPlaying){g.speedRatio=speed;return}
  [idle,walk,run].filter(Boolean).forEach(x=>{if(x!==g)x.stop()});
  g.start(true,speed,g.from,g.to,false);active=g;
}


// ---------------------------------------------------------
// HUD / VOZ / MINI JUEGO
// ---------------------------------------------------------
let score=0;
let attention=100;
let collectedLights=0;
let voiceEnabled=false;
let nearMiniStation=false;
let miniOpen=false;

const scoreEl=document.getElementById('score');
const attentionEl=document.getElementById('attention');
const lightsCountEl=document.getElementById('lightsCount');
const voiceBtn=document.getElementById('guideVoice');
const actionPrompt=document.getElementById('actionPrompt');
const toastEl=document.getElementById('toast');
const miniEl=document.getElementById('minigame');
const miniText=document.getElementById('miniText');
const sequenceEl=document.getElementById('sequence');
const miniClose=document.getElementById('miniClose');

function updateHud(){
  scoreEl.textContent=score;
  attentionEl.textContent=Math.round(attention);
  lightsCountEl.textContent=`${collectedLights}/3`;
}
function toast(msg){
  toastEl.textContent=msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t=setTimeout(()=>toastEl.classList.remove('show'),1700);
}
function speak(text){
  if(!voiceEnabled||!('speechSynthesis' in window))return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang='es-GT';u.rate=.96;u.pitch=1.0;u.volume=1;
  speechSynthesis.speak(u);
}
voiceBtn?.addEventListener('click',()=>{
  voiceEnabled=!voiceEnabled;
  voiceBtn.classList.toggle('on',voiceEnabled);
  voiceBtn.textContent=voiceEnabled?'🔊 GUÍA ACTIVADA':'🔊 ACTIVAR GUÍA';
  if(voiceEnabled)speak('Escucha con atención. Sigue las luces y no te alejes del camino.');
});

function collectSpiritLights(){
  for(const l of spiritLights){
    if(l.collected)continue;
    const dx=player.position.x-l.x,dz=player.position.z-l.z;
    if(dx*dx+dz*dz<.72*.72){
      l.collected=true;l.orb.setEnabled(false);l.halo.setEnabled(false);l.light.dispose();
      collectedLights++;score+=10;attention=Math.min(100,attention+4);updateHud();
      toast(`✨ Luz encontrada +10`);
      if(collectedLights===1)speak('Bien. Una luz pequeña puede mostrarte el siguiente paso.');
      if(collectedLights===3){score+=15;updateHud();speak('Has seguido las tres luces. Busca ahora el desafío en la banqueta.');}
    }
  }
}

const miniSymbols=['✨','📖','🤝'];
let miniSequence=[],miniInput=[],miniReady=false;

function createSequence(){
  miniSequence=Array.from({length:3},()=>miniSymbols[Math.floor(Math.random()*miniSymbols.length)]);
}
function openMiniGame(){
  if(miniOpen)return;
  miniOpen=true;miniEl.classList.add('show');miniEl.setAttribute('aria-hidden','false');
  miniInput=[];miniReady=false;createSequence();
  miniText.textContent='Memoriza la secuencia…';
  sequenceEl.textContent=miniSequence.join('  ');
  setTimeout(()=>{
    if(!miniOpen)return;
    sequenceEl.textContent='❔  ❔  ❔';
    miniText.textContent='Ahora repítela en el mismo orden.';
    miniReady=true;
  },1800);
}
function closeMiniGame(){
  miniOpen=false;miniReady=false;miniEl.classList.remove('show');miniEl.setAttribute('aria-hidden','true');
}
miniClose?.addEventListener('click',closeMiniGame);
document.querySelectorAll('[data-symbol]').forEach(btn=>btn.addEventListener('click',()=>{
  if(!miniReady)return;
  const symbol=btn.dataset.symbol;
  const idx=miniInput.length;
  if(symbol!==miniSequence[idx]){
    attention=Math.max(0,attention-6);updateHud();
    miniReady=false;miniText.textContent='No era esa secuencia. Observa otra vez.';
    sequenceEl.textContent='⚠️';
    speak('No te preocupes. Observa de nuevo y presta atención.');
    setTimeout(()=>{if(miniOpen){miniInput=[];createSequence();sequenceEl.textContent=miniSequence.join('  ');miniText.textContent='Memoriza la nueva secuencia…';setTimeout(()=>{if(miniOpen){sequenceEl.textContent='❔  ❔  ❔';miniText.textContent='Repítela.';miniReady=true;}},1500);}},900);
    return;
  }
  miniInput.push(symbol);
  if(miniInput.length===miniSequence.length){
    score+=25;attention=Math.min(100,attention+8);updateHud();
    miniReady=false;sequenceEl.textContent='✅';
    miniText.textContent='¡Correcto! +25 puntos';
    toast('🎮 Mini juego superado +25');
    speak('Muy bien. Recordaste la secuencia y mantuviste tu atención.');
    setTimeout(closeMiniGame,1300);
  }
}));

window.addEventListener('keydown',e=>{
  if((e.key==='e'||e.key==='E')&&nearMiniStation&&!miniOpen){
    e.preventDefault();openMiniGame();
  }
});

function updateMiniStation(){
  const dx=player.position.x-miniStation.position.x;
  const dz=player.position.z-miniStation.position.z;
  nearMiniStation=(dx*dx+dz*dz)<1.35*1.35;
  actionPrompt.classList.toggle('show',nearMiniStation&&!miniOpen);
  miniHalo.rotation.z+=.012;
}

function updateShadow(dt){
  const dx=player.position.x-shadowNode.position.x;
  const dz=player.position.z-shadowNode.position.z;
  const dist=Math.hypot(dx,dz);
  if(dist>3.8){
    const speed=.52;
    shadowNode.position.x+=(dx/dist)*speed*dt;
    shadowNode.position.z+=(dz/dist)*speed*dt;
  }
  // La sombra sirve para probar presión de juego, pero no captura aún.
  if(dist<2.2){
    attention=Math.max(0,attention-dt*1.4);
    updateHud();
  }
}
updateHud();


async function loadCharacter(){
  try{
    setStatus('Cargando personaje…');

    player.position.set(0,0,0);
    player.rotation.set(0,0,0);
    recenter.position.set(0,0,0);
    headingFix.rotation.set(0,0,0);
    axisFix.rotation.set(0,0,0);
    scaleRoot.scaling.setAll(1);

    const r=await B.SceneLoader.ImportMeshAsync('','assets/models/','bebe_azul_animado.glb',scene);
    const imported=new Set(r.meshes);
    r.meshes.filter(m=>!m.parent||!imported.has(m.parent)).forEach(m=>m.parent=scaleRoot);

    const meshes=r.meshes.filter(m=>m.getTotalVertices?.()>0);
    if(!meshes.length)throw new Error('GLB sin geometría');
    meshes.forEach(m=>{m.receiveShadows=true;shadows.addShadowCaster(m)});

    // Detectar los huesos reales que usaremos para tocar el suelo.
    findGroundBones(r,meshes);

    // Detectar el eje largo igual que en v4.
    let b=getBounds(meshes);
    const s=b.size;
    const tallest=s.y>=s.x&&s.y>=s.z?'y':(s.z>=s.x?'z':'x');

    // v4 ya lo dejó vertical pero cabeza-abajo.
    // Aquí usamos EL GIRO OPUESTO al de v4.
    if(tallest==='z'){
      axisFix.rotation.x=Math.PI/2;
    }else if(tallest==='x'){
      axisFix.rotation.z=Math.PI/2;
    }else{
      // Si ya viene vertical sobre Y pero invertido.
      axisFix.rotation.z=Math.PI;
    }

    // El cambio vertical puede invertir el frente; corregimos el frente en Y.
    headingFix.rotation.y=Math.PI;

    // Tamaño.
    b=getBounds(meshes);
    scaleRoot.scaling.setAll(1.75/Math.max(.001,b.size.y));

    const groups=r.animationGroups||[];
    const rootTracks=stripRootMotion(groups);

    idle=pick(groups,['idle','stand'])||groups[0]||null;
    walk=pick(groups,['walk'])||groups[1]||idle;
    run=pick(groups,['run'])||groups[2]||walk;

    // Aplicar primero la pose Idle real y DESPUÉS calcular el piso.
    if(idle){
      play(idle,1);
      idle.goToFrame?.(idle.from ?? 0);
      scene.render();
    }

    // Centrado definitivo con la pose y el root ya corregidos.
    b=getBounds(meshes);
    recenter.position.set(-b.center.x,-b.min.y,-b.center.z);

    // Segunda verificación: garantiza que el punto más bajo quede exactamente en Y=0.
    scene.render();
    b=getBounds(meshes);
    recenter.position.y-=b.min.y;

    player.position.set(0,0,6);

    ready=true;

    // Calibración REAL con la pose Idle ya activa.
    scene.render();
    let grounded=pinFeetToGround();
    if(!grounded)grounded=fallbackMeshGround(meshes);
    scene.render();
    pinFeetToGround();

    const boneNames=groundBones.map(b=>b.name).join(', ')||'sin huesos de pie detectados';
    setStatus(`GAMEPLAY v10 · ${groundBoneMode} · ${boneNames}`);
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
  if(pressed('up'))dz-=1;
  if(pressed('down'))dz+=1;

  // CORRECCIÓN solicitada:
  // en esta cámara el control anterior estaba invertido.
  if(pressed('left'))dx+=1;
  if(pressed('right'))dx-=1;

  const len=Math.hypot(dx,dz);
  if(len){dx/=len;dz/=len}

  const running=keys.has('run')||runTouch;
  const speed=running?4.0:2.35;

  const tx=ready?dx*speed:0;
  const tz=ready?dz*speed:0;

  const response=1-Math.exp(-9*dt);
  velocity.x=B.Scalar.Lerp(velocity.x,tx,response);
  velocity.z=B.Scalar.Lerp(velocity.z,tz,response);

  if(!dx&&Math.abs(velocity.x)<.008)velocity.x=0;
  if(!dz&&Math.abs(velocity.z)<.008)velocity.z=0;

  // Movimiento con colisiones: primero X y luego Z para poder deslizarse.
  let nextX=B.Scalar.Clamp(player.position.x+velocity.x*dt,-9.5,9.5);
  if(!blockedAt(nextX,player.position.z)){
    player.position.x=nextX;
  }else{
    velocity.x=0;
  }

  let nextZ=B.Scalar.Clamp(player.position.z+velocity.z*dt,-20,20);
  if(!blockedAt(player.position.x,nextZ)){
    player.position.z=nextZ;
  }else{
    velocity.z=0;
  }

  const moving=Math.hypot(velocity.x,velocity.z)>.03;
  if(moving){
    const desired=Math.atan2(velocity.x,velocity.z)-Math.PI;
    let diff=((desired-player.rotation.y+Math.PI)%(Math.PI*2))-Math.PI;
    player.rotation.y+=diff*(1-Math.exp(-10*dt));
    play(running?(run||walk):walk,running?1.18:1.08);
  }else{
    play(idle,1);
  }

  // Recalcular el contacto con el suelo DESPUÉS de que la animación haya cambiado la pose.
  // Esto impide que el personaje vuelva a quedar flotando al cambiar Idle/Walk/Run.
  groundFrame++;
  if(groundBones.length){
    pinFeetToGround();
  }else if(groundFrame%8===0){
    // Si no hay nombres de huesos compatibles, usamos bounds deformados como respaldo.
    fallbackMeshGround(scene.meshes.filter(m=>m.skeleton));
  }

  collectSpiritLights();
  updateMiniStation();
  updateShadow(dt);

  camera.position.set(player.position.x,4.25,player.position.z+6.4);
  camera.setTarget(new B.Vector3(player.position.x,.9,player.position.z));

  goal.rotation.z+=dt*.3;
});

engine.runRenderLoop(()=>{
  scene.render();
  const f=document.getElementById('fps');
  if(f)f.textContent=Math.round(engine.getFps())+' FPS';
});
window.addEventListener('resize',()=>engine.resize());
window.visualViewport?.addEventListener('resize',()=>engine.resize());

loadCharacter();
})();