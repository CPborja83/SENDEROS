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
  station:mat('station','#7d68c9',.42,'#302261'),
  consoleBody:mat('consoleBody','#343f4b',.64),consoleTrim:mat('consoleTrim','#1b242c',.62),
  consoleScreen:mat('consoleScreen','#0d748e',.22,'#3ac9ee'),shadowEye:mat('shadowEye','#c51f2c',.22,'#ff2338')
};

// Nubes de oscuridad visibles: no son un simple filtro de pantalla.
const cloudMat=new B.StandardMaterial('cloudMat',scene);
cloudMat.diffuseColor=B.Color3.FromHexString('#101722');
cloudMat.emissiveColor=B.Color3.FromHexString('#080d14');
cloudMat.alpha=.30;
cloudMat.backFaceCulling=false;

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

// Rótulo/grafiti de decisión integrado al mundo.
const decisionBoard=box('DecisionBoard',1.65,.92,.10,-5.72,1.25,11.2,mats.dark);
decisionBoard.rotation.y=Math.PI/2;
const decisionGlow=new B.PointLight('DecisionGlow',new B.Vector3(-5.25,1.3,11.2),scene);
decisionGlow.diffuse=B.Color3.FromHexString('#e4b968');decisionGlow.intensity=1.3;decisionGlow.range=3;
addCollider('rótulo decisión',-5.72,11.2,.28,1.7,.04);

// Consola de videojuego física dentro del local derecho.
const consoleRoot=new B.TransformNode('ArcadeConsole',scene);
consoleRoot.position.set(6.85,0,-5.0);

const consoleBody=box('ArcadeBody',1.05,1.55,.72,6.85,.78,-5.0,mats.consoleBody);
const consoleTop=box('ArcadeTop',1.12,.28,.78,6.85,1.62,-5.0,mats.consoleTrim);
const consoleScreen=box('ArcadeScreen',.73,.52,.05,6.85,1.18,-4.625,mats.consoleScreen);
consoleScreen.rotation.x=-.10;
const consolePanel=box('ArcadePanel',.82,.14,.42,6.85,.84,-4.75,mats.consoleTrim);
const joyBase=cyl('JoyBase',.18,.08,6.66,.95,-4.69,mats.station);
const joyStick=cyl('JoyStick',.09,.25,6.66,1.08,-4.69,mats.dark);
const arcadeBtn=sphere('ArcadeButton',.13,7.05,.97,-4.66,mats.red);

[consoleBody,consoleTop,consoleScreen,consolePanel,joyBase,joyStick,arcadeBtn].forEach(m=>shadows.addShadowCaster(m));
addCollider('consola arcade',6.85,-5.0,1.15,.85,.08);

const miniStation={position:new B.Vector3(6.85,0,-5.0)};
const miniHalo=B.MeshBuilder.CreateTorus('MiniHalo',{diameter:1.15,thickness:.045,tessellation:28},scene);
miniHalo.position.set(6.85,1.94,-5.0);miniHalo.rotation.x=Math.PI/2;miniHalo.material=mats.spirit;

// Sombra: versión oscura reconocible del mismo lenguaje visual.
// NO aparece al inicio; solo se habilita con atención <= 60.
const shadowNode=new B.TransformNode('ShadowFollower',scene);

const shHelmet=sphere('ShHelmet',1.10,0,1.58,0,mats.shadow);
shHelmet.parent=shadowNode;shHelmet.scaling.set(1.08,1.0,.92);
const shVisor=sphere('ShVisor',.78,0,1.60,-.43,mats.dark);
shVisor.parent=shadowNode;shVisor.scaling.set(1.05,.78,.25);

const shTorso=sphere('ShTorso',.92,0,.88,0,mats.shadow);
shTorso.parent=shadowNode;shTorso.scaling.set(.90,1.0,.72);
const shPack=box('ShPack',.68,.72,.35,0,1.0,.48,mats.shadow);shPack.parent=shadowNode;

const shArmL=cyl('ShArmL',.27,.75,-.53,1.02,0,mats.shadow);shArmL.parent=shadowNode;shArmL.rotation.z=-.25;
const shArmR=cyl('ShArmR',.27,.75,.53,1.02,0,mats.shadow);shArmR.parent=shadowNode;shArmR.rotation.z=.25;
const shLegL=cyl('ShLegL',.32,.65,-.23,.35,0,mats.shadow);shLegL.parent=shadowNode;
const shLegR=cyl('ShLegR',.32,.65,.23,.35,0,mats.shadow);shLegR.parent=shadowNode;

const eyeL=sphere('ShEyeL',.10,-.14,1.66,-.62,mats.shadowEye);eyeL.parent=shadowNode;
const eyeR=sphere('ShEyeR',.10,.14,1.66,-.62,mats.shadowEye);eyeR.parent=shadowNode;

shadowNode.position.set(0,0,14);
shadowNode.setEnabled(false);
let shadowActive=false;
let shadowWasActive=false;

// El aro dorado provisional fue eliminado: no forma parte de la guía oficial.
const glow=new B.GlowLayer('glow',scene,{blurKernelSize:32});glow.intensity=.3;

// Nubes de oscuridad: cubren sectores y se vuelven más densas con atención baja.
const darknessClouds=[];
function darkCloud(x,z,scale=1){
  const root=new B.TransformNode('DarkCloud',scene);
  root.position.set(x,1.25,z);
  for(const spec of [[0,0,1.5,.65,1],[1.05,.1,1.15,.55,.9],[-1.0,.05,1.25,.58,.85],[.35,.25,.9,.48,.75]]){
    const s=B.MeshBuilder.CreateSphere('cloudPart',{diameter:1.6,segments:10},scene);
    s.parent=root;s.position.set(spec[0],spec[1],0);
    s.scaling.set(spec[2]*scale,spec[3]*scale,spec[4]*scale);
    s.material=cloudMat;s.isPickable=false;
  }
  darknessClouds.push(root);
}
darkCloud(-1.8,12,1.05);
darkCloud(1.6,6,.95);
darkCloud(-1.4,0,1.15);
darkCloud(1.4,-7,1.0);
darkCloud(-1.2,-14,1.05);


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
let selectedSpanishVoice=null;
let audioCtx=null;
let quakeTimer=0;
let temporaryFogBoost=0;

const scoreEl=document.getElementById('score');
const attentionEl=document.getElementById('attention');
const lightsCountEl=document.getElementById('lightsCount');
const listenBtn=document.getElementById('listenBtn');
const voicesBtn=document.getElementById('voicesBtn');
const voicesPanel=document.getElementById('voicesPanel');
const voicesGrid=document.getElementById('voicesGrid');
const voicesClose=document.getElementById('voicesClose');
const eventFlash=document.getElementById('eventFlash');
const decisionEl=document.getElementById('decision');
const decisionClose=document.getElementById('decisionClose');
const actionPrompt=document.getElementById('actionPrompt');
const toastEl=document.getElementById('toast');
const miniEl=document.getElementById('minigame');
const miniText=document.getElementById('miniText');
const sequenceEl=document.getElementById('sequence');
const miniClose=document.getElementById('miniClose');

function loadVoices(){
  if(!('speechSynthesis' in window))return;
  const voices=speechSynthesis.getVoices();
  selectedSpanishVoice=
    voices.find(v=>/^es[-_](GT|MX|US|ES)/i.test(v.lang)) ||
    voices.find(v=>/^es/i.test(v.lang)) ||
    voices[0] || null;
}
loadVoices();
if('speechSynthesis' in window)speechSynthesis.addEventListener?.('voiceschanged',loadVoices);

function ensureAudio(){
  if(!audioCtx){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(AC)audioCtx=new AC();
  }
  audioCtx?.resume?.();
  return audioCtx;
}
function tone(freq=440,dur=.25,type='sine',vol=.08,delay=0){
  const ac=ensureAudio();if(!ac)return;
  const o=ac.createOscillator(),g=ac.createGain();
  o.type=type;o.frequency.value=freq;g.gain.value=0.0001;
  o.connect(g);g.connect(ac.destination);
  const t=ac.currentTime+delay;
  g.gain.exponentialRampToValueAtTime(Math.max(.001,vol),t+.015);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.start(t);o.stop(t+dur+.03);
}
function noiseBurst(dur=.8,vol=.09,lowpass=500){
  const ac=ensureAudio();if(!ac)return;
  const frames=Math.max(1,Math.floor(ac.sampleRate*dur));
  const buf=ac.createBuffer(1,frames,ac.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<frames;i++)d[i]=(Math.random()*2-1)*(1-i/frames);
  const src=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();
  src.buffer=buf;f.type='lowpass';f.frequency.value=lowpass;g.gain.value=vol;
  src.connect(f);f.connect(g);g.connect(ac.destination);src.start();
}
function speak(text,opts={}){
  voiceEnabled=true;
  if(!('speechSynthesis' in window)){toast('Tu navegador no ofrece síntesis de voz.');return;}
  loadVoices();
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang=selectedSpanishVoice?.lang||'es-GT';
  if(selectedSpanishVoice)u.voice=selectedSpanishVoice;
  u.rate=opts.rate||.92;u.pitch=opts.pitch||1;u.volume=1;
  speechSynthesis.speak(u);
}
function flash(color='#ffffff',ms=130,opacity=.72){
  eventFlash.style.background=color;
  eventFlash.style.opacity=String(opacity);
  eventFlash.classList.add('on');
  setTimeout(()=>{eventFlash.classList.remove('on');eventFlash.style.opacity='';},ms);
}

function spawnHail(){
  for(let i=0;i<22;i++){
    const h=sphere('hail',.10,
      player.position.x+(Math.random()*4-2),
      4+Math.random()*2,
      player.position.z+(Math.random()*5-2.5),
      mats.sidewalk);
    const start=performance.now();
    const obs=scene.onBeforeRenderObservable.add(()=>{
      h.position.y-=engine.getDeltaTime()/1000*5.5;
      if(h.position.y<.05||performance.now()-start>1600){
        scene.onBeforeRenderObservable.remove(obs);h.dispose();
      }
    });
  }
}
function spawnGlory(){
  for(let i=0;i<16;i++){
    const p=sphere('gloryParticle',.08,
      player.position.x+(Math.random()*2.2-1.1),
      .4+Math.random()*2.1,
      player.position.z+(Math.random()*2.2-1.1),
      mats.goal);
    const start=performance.now();
    const obs=scene.onBeforeRenderObservable.add(()=>{
      p.position.y+=engine.getDeltaTime()/1000*.55;
      p.scaling.scaleInPlace(.993);
      if(performance.now()-start>1800){
        scene.onBeforeRenderObservable.remove(obs);p.dispose();
      }
    });
  }
}

const VOICES=[
  ['siervos','1. Voz de Sus siervos','Escucha con humildad las palabras de quienes te enseñan y te invitan a volver al camino.'],
  ['angeles','2. Ministración de ángeles','No estás solo. Hay ayuda y mensajeros que pueden orientarte y fortalecerte.'],
  ['dios','3. La propia voz de Dios','Detente. Escucha. Recuerda a quién perteneces y hacia dónde quieres llegar.'],
  ['truenos','4. Voz de los truenos','Hay momentos en que una advertencia fuerte busca despertar tu atención.'],
  ['relampagos','5. Voz de los relámpagos','Mira con atención. A veces una señal breve ilumina el camino por un instante.'],
  ['tempestad','6. Voz de las tempestades','En medio de la confusión, busca una impresión clara y no avances sin discernir.'],
  ['terremoto','7. Voz de los terremotos','Cuando todo parece moverse, recuerda los fundamentos que no cambian.'],
  ['granizo','8. Voz de fuertes granizadas','Las consecuencias también pueden advertirte que necesitas corregir el rumbo.'],
  ['hambre','9. Voz de hambres','La escasez puede recordarte qué cosas son realmente necesarias.'],
  ['pestilencia','10. Voz de pestilencias','La fragilidad de la vida puede llamarte a prepararte, ayudar y volver a lo esencial.'],
  ['trompeta','11. Gran sonido de trompeta','Prepárate. Es tiempo de responder al llamado y reunir a tu familia.'],
  ['juicio','12. Voz del juicio','Tus decisiones tienen consecuencias. Elige pensando en aquello que verdaderamente importa.'],
  ['misericordia','13. Voz de misericordia','Puedes corregir el camino. La misericordia sigue invitándote a regresar.'],
  ['gloria','14. Voz de gloria','Hay una luz y una meta mayor que lo inmediato. Sigue avanzando hacia ella.'],
  ['honor','15. Voz de honor','La fidelidad y el servicio tienen valor, aun cuando nadie más los vea.'],
  ['riquezas','16. Riquezas de la vida eterna','No cambies una herencia eterna por una distracción momentánea.']
];

function triggerVoiceEvent(id){
  ensureAudio();
  const row=VOICES.find(v=>v[0]===id);if(!row)return;
  const text=row[2];
  toast(row[1]);

  if(id==='siervos'){tone(520,.18,'sine',.05);speak(text,{pitch:.95});}
  else if(id==='angeles'){tone(880,.28,'sine',.05);tone(1175,.36,'sine',.035,.16);flash('#b9f4ff',180,.28);speak(text,{pitch:1.12});}
  else if(id==='dios'){tone(180,.45,'sine',.04);speak(text,{pitch:.78,rate:.82});}
  else if(id==='truenos'){noiseBurst(1.25,.16,260);tone(58,.85,'sine',.12);flash('#cbd6df',80,.24);speak(text,{pitch:.82});}
  else if(id==='relampagos'){noiseBurst(.20,.14,2200);flash('#ffffff',75,.88);speak(text,{rate:.88});}
  else if(id==='tempestad'){noiseBurst(2.0,.085,850);temporaryFogBoost=.018;speak(text,{rate:.88});setTimeout(()=>temporaryFogBoost=0,2500);}
  else if(id==='terremoto'){quakeTimer=1.6;tone(46,1.25,'triangle',.09);speak(text,{pitch:.85});}
  else if(id==='granizo'){spawnHail();noiseBurst(.75,.07,1700);speak(text);}
  else if(id==='hambre'){scene.imageProcessingConfiguration.exposure=.72;speak(text,{rate:.88});setTimeout(()=>scene.imageProcessingConfiguration.exposure=1.02,2200);}
  else if(id==='pestilencia'){flash('#79b86a',500,.30);speak(text,{pitch:.92});}
  else if(id==='trompeta'){tone(392,.34,'sawtooth',.055);tone(523,.34,'sawtooth',.055,.34);tone(659,.55,'sawtooth',.055,.68);speak(text,{pitch:.95});}
  else if(id==='juicio'){flash('#b93434',250,.35);tone(95,.65,'square',.035);speak(text,{pitch:.78});}
  else if(id==='misericordia'){flash('#ffd7a0',350,.22);tone(660,.35,'sine',.035);speak(text,{pitch:1.08});}
  else if(id==='gloria'){flash('#ffe789',550,.34);spawnGlory();speak(text,{pitch:1.06});}
  else if(id==='honor'){tone(740,.22,'sine',.04);tone(988,.36,'sine',.03,.16);speak(text);}
  else if(id==='riquezas'){spawnGlory();tone(880,.28,'sine',.04);speak(text,{pitch:1.04});}
}

VOICES.forEach(([id,label])=>{
  const b=document.createElement('button');
  b.type='button';b.textContent=label;b.onclick=()=>triggerVoiceEvent(id);
  voicesGrid.appendChild(b);
});
voicesBtn?.addEventListener('click',()=>{
  ensureAudio();voiceEnabled=true;voicesPanel.classList.add('show');voicesPanel.setAttribute('aria-hidden','false');
  speak('Selecciona una de las voces o señales para probar cómo puede sentirse dentro del juego.',{pitch:1.03});
});
voicesClose?.addEventListener('click',()=>{voicesPanel.classList.remove('show');voicesPanel.setAttribute('aria-hidden','true');});

function nearestUncollectedLight(){
  let best=null,bestD=Infinity;
  for(const l of spiritLights){
    if(l.collected)continue;
    const d=Math.hypot(player.position.x-l.x,player.position.z-l.z);
    if(d<bestD){best=l;bestD=d;}
  }
  return best;
}
function listenForGuidance(){
  ensureAudio();voiceEnabled=true;
  const l=nearestUncollectedLight();
  if(!l){
    speak('Has recogido las luces cercanas. Detente y observa qué otra oportunidad de ayudar o aprender aparece.');
    return;
  }
  const dx=l.x-player.position.x,dz=l.z-player.position.z;
  let phrase='Detente y observa. Hay una señal cerca.';
  if(Math.abs(dz)>Math.abs(dx))phrase=dz<0?'Sientes que debes continuar un poco más adelante.':'Sientes que quizá dejaste atrás una impresión importante.';
  else phrase=dx<0?'Sientes una impresión suave hacia tu izquierda.':'Sientes una impresión suave hacia tu derecha.';
  l.halo.scaling.setAll(1.55);
  setTimeout(()=>l.halo?.scaling?.setAll?.(1),650);
  flash('#8cecff',140,.18);
  speak(phrase,{pitch:1.07});
  toast('👂 Impresión recibida');
}
listenBtn?.addEventListener('click',listenForGuidance);

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

let nearDecision=false;
let decisionCooldown=false;
function updateDecisionStation(){
  if(decisionCooldown)return;
  const dx=player.position.x-(-5.15),dz=player.position.z-11.2;
  nearDecision=(dx*dx+dz*dz)<1.55*1.55;
  // Si no estamos cerca de la consola, reutilizamos prompt para decisión.
  if(nearDecision&&!nearMiniStation&&!miniOpen){
    actionPrompt.textContent='E · TOMAR DECISIÓN';
    actionPrompt.classList.add('show');
  }
}
function openDecision(){
  if(decisionCooldown)return;
  decisionEl.classList.add('show');decisionEl.setAttribute('aria-hidden','false');
}
function closeDecision(){
  decisionEl.classList.remove('show');decisionEl.setAttribute('aria-hidden','true');
}
decisionClose?.addEventListener('click',closeDecision);
document.querySelectorAll('[data-decision]').forEach(btn=>btn.addEventListener('click',()=>{
  const delta=Number(btn.dataset.decision)||0;
  attention=B.Scalar.Clamp(attention+delta,0,100);
  if(delta<0){score=Math.max(0,score-5);toast(`⚠️ Atención ${delta}`);speak('La distracción hace más difícil percibir la guía.');}
  else if(delta===15){score+=10;toast('👂 Mejor decisión +10');speak('Al detenerte y escuchar, la señal se vuelve más clara.');}
  else{score+=20;toast('✨ Excelente decisión +20');speak('Seguiste la impresión y corregiste tu rumbo.');}
  updateHud();closeDecision();decisionCooldown=true;nearDecision=false;
  setTimeout(()=>decisionCooldown=false,9000);
}));

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
  if(e.key!=='e'&&e.key!=='E')return;
  if(nearMiniStation&&!miniOpen){
    e.preventDefault();openMiniGame();return;
  }
  if(nearDecision&&!miniOpen){
    e.preventDefault();openDecision();
  }
});

function updateMiniStation(){
  const dx=player.position.x-miniStation.position.x;
  const dz=player.position.z-miniStation.position.z;
  nearMiniStation=(dx*dx+dz*dz)<1.55*1.55;
  if(nearMiniStation&&!miniOpen){
    actionPrompt.textContent='E · JUGAR EN CONSOLA';
    actionPrompt.classList.add('show');
  }else if(!nearDecision){
    actionPrompt.classList.remove('show');
  }
  miniHalo.rotation.z+=.012;
}

function updateShadow(dt){
  const shouldBeActive=attention<=60;

  if(shouldBeActive&&!shadowActive){
    shadowActive=true;
    shadowNode.setEnabled(true);
    shadowNode.position.set(player.position.x,0,player.position.z+5.0);
    toast('⚠️ La sombra ha aparecido');
    tone(72,.8,'triangle',.06);
    if(voiceEnabled)speak('Tu atención ha bajado. La sombra ahora puede encontrarte.',{pitch:.82});
  }else if(!shouldBeActive&&shadowActive){
    shadowActive=false;
    shadowNode.setEnabled(false);
    toast('✨ Recuperaste claridad; la sombra se retira.');
  }

  if(!shadowActive)return;

  const dx=player.position.x-shadowNode.position.x;
  const dz=player.position.z-shadowNode.position.z;
  const dist=Math.max(.001,Math.hypot(dx,dz));

  // Entre 60 y 40: avanza torpemente y con pausas.
  // Por debajo de 40: acelera y produce urgencia.
  let speed=attention<40?4.45:1.15;
  const paused=attention>=40 && Math.sin(performance.now()/720)<-.35;
  if(!paused){
    shadowNode.position.x+=(dx/dist)*speed*dt;
    shadowNode.position.z+=(dz/dist)*speed*dt;
  }
  shadowNode.rotation.y=Math.atan2(dx,dz);

  // Solo una consecuencia cercana; caminar normalmente NO baja atención.
  if(dist<1.35){
    attention=Math.max(0,attention-dt*2.1);
    updateHud();
  }
}
updateHud();


function updateDarkness(){
  const low=(100-attention)/100;
  scene.fogDensity=.016+low*.040+temporaryFogBoost;
  cloudMat.alpha=.22+low*.32;
  const t=performance.now()/1000;
  darknessClouds.forEach((c,i)=>{
    c.position.x+=Math.sin(t*.22+i)*.0009;
    c.position.z+=Math.cos(t*.16+i*.7)*.0008;
  });
}

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
    setStatus(`TEMÁTICA v11 · ${groundBoneMode} · ${boneNames}`);
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
  updateDecisionStation();
  updateShadow(dt);
  updateDarkness();

  const baseCamX=player.position.x;
  const baseCamY=4.25;
  const baseCamZ=player.position.z+6.4;
  if(quakeTimer>0){
    quakeTimer-=dt;
    const q=.075*Math.min(1,quakeTimer);
    camera.position.set(baseCamX+(Math.random()-.5)*q,baseCamY+(Math.random()-.5)*q,baseCamZ+(Math.random()-.5)*q);
  }else{
    camera.position.set(baseCamX,baseCamY,baseCamZ);
  }
  camera.setTarget(new B.Vector3(player.position.x,.9,player.position.z));
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