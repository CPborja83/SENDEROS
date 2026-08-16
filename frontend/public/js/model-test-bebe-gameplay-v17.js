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
scene.fogMode=B.Scene.FOGMODE_LINEAR;
scene.fogColor=B.Color3.FromHexString('#293743');
scene.fogStart=2.6;
scene.fogEnd=10.5;
scene.imageProcessingConfiguration.contrast=1.12;
scene.imageProcessingConfiguration.exposure=1.02;
scene.imageProcessingConfiguration.toneMappingEnabled=true;
scene.imageProcessingConfiguration.toneMappingType=B.ImageProcessingConfiguration.TONEMAPPING_ACES;

const hemi=new B.HemisphericLight('hemi',new B.Vector3(-.2,1,.15),scene);hemi.intensity=.76;
const sun=new B.DirectionalLight('sun',new B.Vector3(-.55,-1,-.45),scene);sun.position=new B.Vector3(16,28,18);sun.intensity=1.25;
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
  consoleScreen:mat('consoleScreen','#0d748e',.22,'#3ac9ee'),shadowEye:mat('shadowEye','#c51f2c',.22,'#ff2338'),
  leaves2:mat('leaves2','#2d7945',.90),leaves3:mat('leaves3','#65aa55',.88),
  roof:mat('roof','#344653',.84),door:mat('door','#5f4031',.86),awning:mat('awning','#d2775b',.72),
  question:mat('question','#2f6f96',.62,'#12384d'),stormGround:mat('stormGround','#26343e',.96)
};

// Nubes de tormenta suaves: gradiente radial, sin contornos geométricos.
const cloudTex=new B.DynamicTexture('cloudSoftTex',{width:128,height:128},scene,false);
const cctx=cloudTex.getContext();
const cg=cctx.createRadialGradient(64,64,8,64,64,62);
cg.addColorStop(0,'rgba(230,238,244,0.95)');
cg.addColorStop(.35,'rgba(185,198,208,0.86)');
cg.addColorStop(.70,'rgba(110,128,142,0.55)');
cg.addColorStop(1,'rgba(45,58,68,0.0)');
cctx.clearRect(0,0,128,128);
cctx.fillStyle=cg;
cctx.fillRect(0,0,128,128);
cloudTex.update();

function makeCloudMat(name,tint,alpha){
  const m=new B.StandardMaterial(name,scene);
  m.diffuseColor=B.Color3.FromHexString(tint);
  m.emissiveColor=B.Color3.FromHexString('#2a3540');
  m.opacityTexture=cloudTex;
  m.diffuseTexture=cloudTex;
  m.useAlphaFromDiffuseTexture=true;
  m.alpha=alpha;
  m.backFaceCulling=false;
  m.disableLighting=false;
  m.specularColor=new B.Color3(0,0,0);
  return m;
}
const cloudDark=makeCloudMat('cloudDark','#56636d',.88);
const cloudMid=makeCloudMat('cloudMid','#75838e',.80);
const cloudLight=makeCloudMat('cloudLight','#a9b6bf',.70);

function cartoonize(mesh,width=1.25,alpha=.58){
  try{
    mesh.enableEdgesRendering(.995);
    mesh.edgesWidth=width;
    mesh.edgesColor=new B.Color4(.025,.045,.060,alpha);
  }catch(_){}
  return mesh;
}
function box(name,w,h,d,x,y,z,m){
  const q=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);
  q.position.set(x,y,z);q.material=m;q.receiveShadows=true;
  return cartoonize(q,1.15,.48);
}
function cyl(name,d,h,x,y,z,m){
  const q=B.MeshBuilder.CreateCylinder(name,{diameter:d,height:h,tessellation:14},scene);
  q.position.set(x,y,z);q.material=m;q.receiveShadows=true;
  return cartoonize(q,1.15,.48);
}
function sphere(name,d,x,y,z,m){
  const q=B.MeshBuilder.CreateIcoSphere(name,{radius:d/2,subdivisions:2,flat:false},scene);
  q.position.set(x,y,z);q.material=m;q.receiveShadows=true;
  return cartoonize(q,1.05,.42);
}

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

// Escenario v15
// Base urbana amplia para que la cámara alta nunca muestre vacío fuera del mapa.
box('worldBase',54,.10,118,0,-.18,-28,mats.stormGround);

// La calle principal conserva el ancho aprobado.
const ROAD_W=4.8;
const WALK_W=2.15;
const ROAD_EDGE=ROAD_W/2;
const WALK_CENTER=ROAD_EDGE+WALK_W/2;

// Alturas físicas de las superficies.
const ROAD_SURFACE_Y=0.0;
const SIDEWALK_SURFACE_Y=0.15;
const CURB_SURFACE_Y=0.22;

box('road',ROAD_W,.18,112,0,-.09,-28,mats.road);
box('walkL',WALK_W,.28,112,-WALK_CENTER,.01,-28,mats.sidewalk);
box('walkR',WALK_W,.28,112, WALK_CENTER,.01,-28,mats.sidewalk);

// Bordillos para que se perciba mejor el límite de la calle.
box('curbL',.20,.34,112,-ROAD_EDGE,.05,-28,mats.sidewalk);
box('curbR',.20,.34,112, ROAD_EDGE,.05,-28,mats.sidewalk);

// Franjas pequeñas de área verde detrás de las banquetas.
box('grassL',4.4,.18,112,-8.0,-.03,-28,mats.grass);
box('grassR',4.4,.18,112, 8.0,-.03,-28,mats.grass);

// Línea central ligeramente más pequeña para la nueva escala.
for(let z=-82;z<=25;z+=4.1)box('line'+z,.14,.03,1.75,0,.035,z,mats.line);

// Calles transversales: hacen que el mapa se lea como 6 cuadras desde la vista alta.
const CROSS_STREETS=[21,11,1,-9,-19,-29,-39,-49,-59,-69,-79];
CROSS_STREETS.forEach((z,i)=>{
  box('crossRoad'+i,25,.12,2.15,0,-.105,z,mats.road);

  // Cruce peatonal en ambos lados de la intersección.
  for(let s=-2;s<=2;s++){
    const stripe=box('crossStripe'+i+'_'+s,.34,.025,1.65,s*.60,.075,z,mats.sidewalk);
    stripe.material.alpha=.90;
  }
});

function building(x,z,w,d,h,m){
  const b=box('building',w,h,d,x,h/2+.12,z,m);shadows.addShadowCaster(b);
  addCollider('edificio',x,z,w,d,.12);

  // techo sobresaliente
  const roof=box('roof',w+.28,.24,d+.28,x,h+.24,z,mats.roof);
  shadows.addShadowCaster(roof);

  // fachada orientada hacia la calle
  const frontZ=z<0?z+d/2+.035:z-d/2-.035;
  for(let yy=1.35;yy<h-1;yy+=1.65){
    for(let xx=-w/2+.85;xx<w/2-.55;xx+=1.45){
      const win=box('window',.72,.62,.045,x+xx,yy,frontZ,mats.window);
      shadows.addShadowCaster(win);
      // marco superior cartoon
      box('windowTop',.80,.06,.065,x+xx,yy+.35,frontZ,mats.dark);
    }
  }

  const doorX=x+(z<0?-.8:.8);
  const door=box('door',.78,1.35,.07,doorX,.78,frontZ,mats.door);
  shadows.addShadowCaster(door);
  const awning=box('awning',1.35,.16,.62,doorX,1.72,frontZ+(z<0?.25:-.25),mats.awning);
  awning.rotation.x=z<0?-.18:.18;
  shadows.addShadowCaster(awning);
}
building(-8.6,-14,5.2,6.2,6.0,mats.wall1);
building( 8.6,-12,5.5,6.6,6.8,mats.wall2);
building(-8.6, 12,5.6,6.0,6.4,mats.wall3);
building( 8.6, 14,5.8,6.2,5.8,mats.wall1);

// Siluetas/cartoon de edificios más alejados: dan escala urbana sin bloquear el recorrido.
function decorBuilding(x,z,w,d,h,m){
  const b=box('decorBuilding',w,h,d,x,h/2-.02,z,m);
  const r=box('decorRoof',w+.22,.20,d+.22,x,h+.09,z,mats.roof);
  shadows.addShadowCaster(b);shadows.addShadowCaster(r);
}
[
  [-13.2,19,4.8,5.0,5.0,mats.wall2],[13.2,19,4.5,5.2,6.0,mats.wall3],
  [-13.0,10,5.0,4.8,6.5,mats.wall1],[13.0,8.5,4.8,5.0,5.3,mats.wall2],
  [-13.2,1,4.6,5.0,5.8,mats.wall3],[13.2,.5,4.6,5.1,6.4,mats.wall1],
  [-13.0,-8,5.0,5.0,6.1,mats.wall2],[13.0,-8.5,4.7,5.0,5.2,mats.wall3],
  [-13.2,-18,4.8,5.0,5.8,mats.wall1],[13.2,-18,4.8,5.2,6.2,mats.wall2]
].forEach(p=>decorBuilding(...p));

// Más bloques urbanos hacia el fondo del mapa.
[
  [-13.2,-28,4.8,5.0,5.4,mats.wall1],[13.2,-29,4.5,5.0,6.1,mats.wall2],
  [-13.0,-38,5.1,5.0,6.4,mats.wall3],[13.1,-39,4.8,5.0,5.6,mats.wall1],
  [-13.2,-48,4.7,5.2,6.0,mats.wall2],[13.2,-49,4.7,5.0,6.4,mats.wall3],
  [-13.0,-58,5.0,5.0,6.3,mats.wall1],[13.2,-59,4.9,5.0,5.5,mats.wall2],
  [-13.1,-68,4.6,5.0,5.8,mats.wall3],[13.2,-69,4.8,5.1,6.2,mats.wall1],
  [-13.0,-78,4.9,5.0,6.0,mats.wall2],[13.1,-79,4.7,5.0,5.7,mats.wall3]
].forEach(p=>decorBuilding(...p));

function lamp(x,z){
  const p=cyl('pole',.15,3.6,x,1.8,z,mats.pole);
  addCollider('poste',x,z,.25,.25,.06);
  const s=sphere('light',.45,x,3.58,z,mats.lamp);
  shadows.addShadowCaster(p);shadows.addShadowCaster(s);
}
[-17,-8,1,10,18].forEach((z,i)=>{lamp(-2.78,z);if(i%2===0)lamp(2.78,z+2.2)});

function tree(x,z,s=1){
  const t=cyl('trunk',.44*s,1.75*s,x,.875*s,z,mats.trunk);
  addCollider('árbol',x,z,.58*s,.58*s,.08);
  shadows.addShadowCaster(t);

  // ramas visibles
  const br1=cyl('branch',.18*s,.85*s,x-.27*s,1.35*s,z,mats.trunk);
  br1.rotation.z=-.65;
  const br2=cyl('branch',.16*s,.72*s,x+.28*s,1.48*s,z+.05*s,mats.trunk);
  br2.rotation.z=.72;
  shadows.addShadowCaster(br1);shadows.addShadowCaster(br2);

  // copa compuesta de varias masas, estilo cartoon detallado
  const clusters=[
    [0,2.10,0,.90,1.0,mats.leaves],
    [-.62,1.98,.02,.68,.88,mats.leaves2],
    [.62,2.02,.04,.72,.90,mats.leaves3],
    [-.25,2.60,.02,.62,.78,mats.leaves3],
    [.36,2.48,-.08,.66,.82,mats.leaves2],
    [0,2.28,.46,.58,.75,mats.leaves]
  ];
  clusters.forEach((c,i)=>{
    const leaf=sphere('leafCluster'+i,1.45*s,x+c[0]*s,c[1]*s,z+c[2]*s,c[5]);
    leaf.scaling.set(c[3],c[4],c[3]*.92);
    shadows.addShadowCaster(leaf);
  });
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
  // Señal discreta: reflector luminoso sobre el suelo, no aro flotante.
  const orb=box('SpiritMarker'+id,.34,.045,.58,x,.17,z,mats.spirit);
  orb.rotation.y=(id%2?-.18:.18);
  const light=new B.PointLight('SpiritLamp'+id,new B.Vector3(x,.48,z),scene);
  light.diffuse=B.Color3.FromHexString('#8cecff');light.intensity=1.55;light.range=3.2;
  spiritLights.push({id,x,z,orb,light,collected:false});
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

// Destino de prueba: edificio luminoso al final del recorrido.
function makeDestination(){
  const z=-78.7;
  const base=box('DestinationBase',5.5,.32,3.5,0,.16,z,mats.sidewalk);
  const hall=box('DestinationHall',4.8,3.2,2.8,0,1.75,z-.15,mats.wall1);
  const roof=box('DestinationRoof',5.3,.30,3.25,0,3.45,z-.15,mats.roof);
  const door=box('DestinationDoor',1.25,2.15,.10,0,1.25,z+1.28,mats.door);
  const glowDoor=box('DestinationGlowDoor',.94,1.76,.035,0,1.27,z+1.34,mats.spirit);
  const spire=cyl('DestinationSpire',.18,1.35,0,4.25,z-.15,mats.goal);
  const cap=sphere('DestinationCap',.42,0,4.95,z-.15,mats.goal);
  shadows.addShadowCaster(hall);shadows.addShadowCaster(roof);
  addCollider('destino',0,z-.2,5.1,3.0,.08);

  const lamp=new B.PointLight('DestinationLight',new B.Vector3(0,2.0,z+1.3),scene);
  lamp.diffuse=B.Color3.FromHexString('#ffe7a2');lamp.intensity=4.5;lamp.range=9;

  // Camino corto de luz frente a la entrada.
  for(let i=0;i<5;i++){
    const p=box('DestinationPath'+i,.32,.04,.72,0,.18,z+2.4+i*.85,mats.goal);
    p.material.alpha=.78;
  }
}
makeDestination();

// Tres postes/carteles de preguntas en el recorrido, sin aros.
function makeQuestionPost(x,z,side,id){
  const poleX=x;
  const pole=cyl('QuestionPole'+id,.11,1.8,poleX,.90,z,mats.metal);
  const board=box('QuestionBoard'+id,1.05,.72,.08,poleX,1.70,z,mats.question);
  board.rotation.y=side<0?Math.PI:0;
  shadows.addShadowCaster(pole);shadows.addShadowCaster(board);
  addCollider('poste pregunta',poleX,z,.25,.25,.04);

  // Símbolo ? mediante textura dinámica sobre una placa pequeña.
  const dt=new B.DynamicTexture('QuestionTex'+id,{width:128,height:96},scene,false);
  const c=dt.getContext();c.fillStyle='#245879';c.fillRect(0,0,128,96);
  c.fillStyle='#e9f8ff';c.font='bold 70px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('?',64,50);dt.update();
  const dm=new B.StandardMaterial('QuestionMat'+id,scene);dm.diffuseTexture=dt;dm.emissiveColor=new B.Color3(.10,.18,.24);
  const face=box('QuestionFace'+id,.88,.56,.025,poleX,1.70,z+(side<0?.055:-.055),dm);
  face.rotation.y=side<0?Math.PI:0;
}
makeQuestionPost(-4.65,3.1,1,1);
makeQuestionPost(4.65,-6.2,-1,2);
makeQuestionPost(-4.65,-15.0,1,3);

// Consola de videojuego física dentro del local derecho.
const consoleRoot=new B.TransformNode('ArcadeConsole',scene);
consoleRoot.position.set(6.85,0,-5.0);

const consoleBody=box('ArcadeBody',1.05,1.55,.72,6.85,.78,-5.0,mats.consoleBody);
const consoleTop=box('ArcadeTop',1.12,.28,.78,6.85,1.62,-5.0,mats.consoleTrim);
const consoleScreen=box('ArcadeScreen',.73,.52,.05,6.85,1.18,-4.625,mats.consoleScreen);
const arcadeTex=new B.DynamicTexture('ArcadeTex',{width:256,height:160},scene,false);
const actx=arcadeTex.getContext();
actx.fillStyle='#082532';actx.fillRect(0,0,256,160);
actx.fillStyle='#7cecff';actx.font='bold 28px Arial';actx.textAlign='center';actx.fillText('SENDEROS',128,58);
actx.fillStyle='#ffd65d';actx.font='bold 24px Arial';actx.fillText('JUGAR',128,110);
arcadeTex.update();
const arcadeScreenMat=new B.StandardMaterial('ArcadeScreenMat',scene);
arcadeScreenMat.diffuseTexture=arcadeTex;arcadeScreenMat.emissiveTexture=arcadeTex;
consoleScreen.material=arcadeScreenMat;
consoleScreen.rotation.x=-.10;
const consolePanel=box('ArcadePanel',.82,.14,.42,6.85,.84,-4.75,mats.consoleTrim);
const joyBase=cyl('JoyBase',.18,.08,6.66,.95,-4.69,mats.station);
const joyStick=cyl('JoyStick',.09,.25,6.66,1.08,-4.69,mats.dark);
const arcadeBtn=sphere('ArcadeButton',.13,7.05,.97,-4.66,mats.red);

[consoleBody,consoleTop,consoleScreen,consolePanel,joyBase,joyStick,arcadeBtn].forEach(m=>shadows.addShadowCaster(m));
addCollider('consola arcade',6.85,-5.0,1.15,.85,.08);

// Segunda máquina arcade decorativa dentro del mismo local.
function makeArcade(x,z,labelColor){
  const body=box('ArcadeDecorBody',1.0,1.48,.72,x,.74,z,mats.consoleBody);
  const top=box('ArcadeDecorTop',1.06,.25,.76,x,1.57,z,mats.consoleTrim);
  const screen=box('ArcadeDecorScreen',.70,.48,.05,x,1.16,z-.37,labelColor);
  const panel=box('ArcadeDecorPanel',.78,.14,.40,x,.84,z-.30,mats.consoleTrim);
  const joy=cyl('ArcadeDecorJoy',.08,.23,x-.18,1.05,z-.29,mats.dark);
  const btn=sphere('ArcadeDecorBtn',.12,x+.20,.96,z-.31,mats.red);
  [body,top,screen,panel,joy,btn].forEach(m=>shadows.addShadowCaster(m));
  addCollider('consola decorativa',x,z,1.12,.84,.06);
}
makeArcade(6.85,-3.75,mats.station);

const miniStation={position:new B.Vector3(6.85,0,-5.0)};

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

// Tormenta cartoon densa: bancos de nubes en profundidad, techo nuboso y lluvia.
const darknessClouds=[];
const stormPuffs=[];
let stormSeed=27183;
function rand(){
  stormSeed=(stormSeed*1664525+1013904223)>>>0;
  return stormSeed/4294967296;
}
function cloudPuff(root,x,y,z,sx,sy,sz,material){
  // Plano suave orientado siempre a la cámara: elimina el aspecto de roca.
  const p=B.MeshBuilder.CreatePlane('StormPuff',{
    width:2.0,
    height:1.25,
    sideOrientation:B.Mesh.DOUBLESIDE
  },scene);
  p.parent=root;
  p.position.set(x,y,z);
  p.scaling.set(sx,sy,1);
  p.material=material;
  p.billboardMode=B.Mesh.BILLBOARDMODE_ALL;
  p.isPickable=false;
  p.receiveShadows=false;
  p.visibility=1;
  p.metadata={
    ceiling: root.name==='StormCeiling',
    targetVisibility:1
  };
  stormPuffs.push(p);
  return p;
}
function stormBank(z,width=9,height=4.0,depth=3.6,density=22){
  const root=new B.TransformNode('StormBank',scene);
  root.position.set(0,0,z);
  for(let i=0;i<density;i++){
    const x=(rand()-.5)*width;
    const y=.65+rand()*height;
    const zz=(rand()-.5)*depth;
    const base=.55+rand()*.62;
    const material=i%5===0?cloudLight:(i%2?cloudDark:cloudMid);
    cloudPuff(root,x,y,zz,base*(1.35+rand()*.85),base*(.72+rand()*.35),1,material);
  }
  darknessClouds.push(root);
}
function stormCeiling(z){
  const root=new B.TransformNode('StormCeiling',scene);
  root.position.set(0,0,z);
  for(let i=0;i<13;i++){
    const x=(rand()-.5)*12;
    const zz=(rand()-.5)*8;
    const base=.90+rand()*.75;
    cloudPuff(root,x,4.7+rand()*.8,zz,base*2.1,base*.78,1,i%3?cloudDark:cloudMid);
  }
  darknessClouds.push(root);
}

// Bancos colocados de forma que nunca se vea todo el camino de una vez.
stormBank(10,10,3.8,4.2,26);
stormBank(2,10,4.1,4.8,28);
stormBank(-7,10,4.0,4.6,28);
stormBank(-15,10,4.1,4.8,28);
stormCeiling(6);stormCeiling(-4);stormCeiling(-14);
stormBank(-25,14,4.2,5.2,32);
stormBank(-37,14,4.1,5.0,32);
stormBank(-49,14,4.3,5.3,34);
stormBank(-61,14,4.2,5.0,32);
stormBank(-73,14,4.3,5.2,34);
stormCeiling(-28);stormCeiling(-46);stormCeiling(-66);

// Manto bajo de nubes pequeñas: cubre todas las cuadras y permite
// despejar exactamente el lugar por donde camina el personaje.
const walkCloudRoot=new B.TransformNode('WalkCloudCover',scene);
for(let z=-86;z<=26;z+=2.25){
  for(let x=-18;x<=18;x+=2.25){
    // Pequeña irregularidad para que no parezca una cuadrícula.
    const ox=(rand()-.5)*.55;
    const oz=(rand()-.5)*.55;
    const base=.56+rand()*.24;
    const puff=cloudPuff(
      walkCloudRoot,
      x+ox,
      1.55+rand()*.65,
      z+oz,
      base*2.05,
      base*.82,
      1,
      rand()>.55?cloudDark:cloudMid
    );
    puff.metadata.trailCloud=true;
  }
}

// Lluvia procedural: no usa imágenes externas.
const rainTex=new B.DynamicTexture('rainTex',{width:8,height:32},scene,false);
const rctx=rainTex.getContext();
rctx.clearRect(0,0,8,32);
rctx.fillStyle='rgba(215,235,255,.92)';
rctx.fillRect(3,1,2,29);
rainTex.update();

const stormEmitter=new B.TransformNode('StormEmitter',scene);
const rain=new B.ParticleSystem('StormRain',1200,scene);
rain.particleTexture=rainTex;
rain.emitter=stormEmitter;
rain.minEmitBox=new B.Vector3(-26,5,-42);
rain.maxEmitBox=new B.Vector3(26,8,42);
rain.direction1=new B.Vector3(-.20,-12,.15);
rain.direction2=new B.Vector3(.15,-15,-.10);
rain.minLifeTime=.50;rain.maxLifeTime=.90;
rain.minSize=.035;rain.maxSize=.070;
rain.emitRate=1200;
rain.color1=new B.Color4(.72,.84,.92,.65);
rain.color2=new B.Color4(.52,.66,.78,.45);
rain.gravity=new B.Vector3(0,-6,0);
rain.blendMode=B.ParticleSystem.BLENDMODE_STANDARD;
rain.start();

let nextNaturalLightning=performance.now()+4800;

// ---------------------------------------------------------
// SISTEMA DE CAMINO GUIADO
// ---------------------------------------------------------
// El recorrido avanza desde Z≈14 hasta Z≈-20.
// Cada checkpoint representa una "voz" o señal que orienta al jugador.
const GUIDE_STEPS=[
  {z:15,id:'voz',label:'VOZ SUAVE',text:'No puedes ver todo el camino. Continúa atento hacia adelante.',mode:'voice'},
  {z:7,id:'luces',label:'LUZ',text:'Una señal luminosa confirma el siguiente tramo.',mode:'light'},
  {z:-3,id:'truenos',label:'TRUENOS',text:'El trueno te advierte que no te apartes del camino principal.',mode:'thunder'},
  {z:-13,id:'relampagos',label:'RELÁMPAGO',text:'El relámpago ilumina por un instante la siguiente cuadra.',mode:'lightning'},
  {z:-23,id:'terremoto',label:'TERREMOTO',text:'El suelo tiembla. Busca el camino firme y continúa.',mode:'quake'},
  {z:-33,id:'hambre',label:'HAMBRE',text:'La necesidad te recuerda qué cosas son realmente importantes.',mode:'hunger'},
  {z:-43,id:'honra',label:'HONRA',text:'Has mantenido tu compromiso. Sigue avanzando.',mode:'honor'},
  {z:-53,id:'gloria',label:'GLORIA',text:'Una claridad mayor confirma que el destino está más cerca.',mode:'glory'},
  {z:-63,id:'misericordia',label:'MISERICORDIA',text:'Todavía puedes corregir el camino y continuar hacia la meta.',mode:'voice'},
  {z:-72,id:'trompeta',label:'TROMPETA',text:'El llamado final indica que el destino está próximo.',mode:'trumpet'}
];

let guideIndex=0;
let lastGuideTime=0;
let reachedDestination=false;
let pathProgress=0;

// Cada banco de nubes conoce una "zona" Z.
// No desaparecen todas de golpe: se abren alrededor del jugador y delante del camino correcto.
darknessClouds.forEach((root,i)=>{
  root.metadata=root.metadata||{};
  root.metadata.homeZ=[10,2,-7,-15,6,-4,-14][i] ?? 0;
  root.metadata.baseScaling=root.scaling.clone();
  root.metadata.cleared=0;
});

function guideForwardPoint(distance=3.0){
  return new B.Vector3(player.position.x,.32,player.position.z-distance);
}

function createGuidingLights(fromZ,toZ,count=5){
  const nodes=[];
  const dz=(toZ-fromZ)/Math.max(1,count-1);
  for(let i=0;i<count;i++){
    const z=fromZ+dz*i;
    const p=box('GuideBreadcrumb',.18,.035,.42,0,.19,z,mats.spirit);
    p.scaling.set(.7,1,.7);
    const l=new B.PointLight('GuideBreadcrumbLight',new B.Vector3(0,.48,z),scene);
    l.diffuse=B.Color3.FromHexString('#9ceeff');l.intensity=1.1;l.range=2.0;
    nodes.push({p,l});
  }
  setTimeout(()=>nodes.forEach(n=>{n.p.dispose();n.l.dispose();}),5200);
}

function revealNextPath(duration=4.5){
  // En v15 las voces NO borran el camino futuro.
  // Solo refuerzan señales, relámpagos y luces; las nubes se quitan al caminar.
  lastGuideTime=performance.now();
}

function triggerGuide(step){
  currentGuideEl.textContent=step.label;
  toast(`📣 ${step.label}`);
  lastGuideTime=performance.now();

  // Todas las guías abren el corredor delante y registran la posición actual
  // como parte del camino despejado.
  revealNextPath(5.8);
  recordClearedTrail();

  if(step.mode==='voice'){
    speak(step.text,{pitch:1.04,rate:.90});
    createGuidingLights(player.position.z-1.2,player.position.z-5.2,4);
  }
  else if(step.mode==='light'){
    createGuidingLights(player.position.z-1.0,player.position.z-6.0,6);
    flash('#b9f5ff',150,.25);
    speak(step.text,{pitch:1.07,rate:.90});
  }
  else if(step.mode==='thunder'){
    noiseBurst(1.2,.13,300);tone(58,.75,'triangle',.08);
    speak(step.text,{pitch:.84,rate:.86});
  }
  else if(step.mode==='lightning'){
    flash('#ffffff',85,.92);
    setTimeout(()=>flash('#c9e5f5',55,.45),110);
    createGuidingLights(player.position.z-1.0,player.position.z-6.5,6);
    setTimeout(()=>speak(step.text,{pitch:.96,rate:.88}),340);
  }
  else if(step.mode==='quake'){
    quakeTimer=1.35;
    tone(48,1.0,'triangle',.07);
    speak(step.text,{pitch:.83,rate:.86});
  }
  else if(step.mode==='hunger'){
    scene.imageProcessingConfiguration.exposure=.74;
    tone(150,.38,'sine',.025);
    speak(step.text,{pitch:.92,rate:.88});
    setTimeout(()=>scene.imageProcessingConfiguration.exposure=1.02,1900);
  }
  else if(step.mode==='honor'){
    tone(660,.22,'sine',.032);tone(880,.32,'sine',.025,.17);
    createGuidingLights(player.position.z-1.0,player.position.z-5.0,5);
    speak(step.text,{pitch:1.0,rate:.90});
  }
  else if(step.mode==='glory'){
    flash('#ffe99b',480,.35);
    spawnGlory();
    createGuidingLights(player.position.z-1.0,player.position.z-7.0,7);
    speak(step.text,{pitch:1.08,rate:.90});
  }
  else if(step.mode==='trumpet'){
    tone(392,.30,'sawtooth',.05);
    tone(523,.30,'sawtooth',.05,.31);
    tone(659,.48,'sawtooth',.05,.62);
    createGuidingLights(player.position.z-.8,-77.0,10);
    speak(step.text,{pitch:.96,rate:.88});
  }
}

function updateGuidedPath(){
  // Progreso visual de 0 a 100%.
  pathProgress=B.Scalar.Clamp(((18-player.position.z)/(18-(-78)))*100,0,100);
  pathProgressEl.textContent=`${Math.round(pathProgress)}%`;

  // Activa la próxima guía al cruzar su punto.
  if(guideIndex<GUIDE_STEPS.length){
    const step=GUIDE_STEPS[guideIndex];
    if(player.position.z<=step.z){
      triggerGuide(step);
      guideIndex++;
    }
  }

  // Destino alcanzado.
  if(!reachedDestination && player.position.z<=-76.5 && Math.abs(player.position.x)<2.5){
    reachedDestination=true;
    currentGuideEl.textContent='DESTINO';
    destinationBanner.classList.add('show');
    score+=50;attention=Math.min(100,attention+10);updateHud();
    revealNextPath(7);
    flash('#ffe99b',650,.38);spawnGlory();
    tone(523,.30,'sine',.035);tone(659,.30,'sine',.035,.18);tone(784,.50,'sine',.035,.36);
    speak('Has llegado al destino. Las señales no caminaron por ti; te ayudaron a reconocer el camino y decidir seguirlo.',{pitch:1.04,rate:.88});
    setTimeout(()=>destinationBanner.classList.remove('show'),5500);
  }
}

// Huella despejada permanente: almacena los lugares por donde ya pasó el jugador.
const clearedTrail=[];
let lastTrailPoint=null;

function recordClearedTrail(){
  const p=new B.Vector3(player.position.x,0,player.position.z);
  if(!lastTrailPoint || B.Vector3.DistanceSquared(p,lastTrailPoint)>.38*.38){
    clearedTrail.push({x:p.x,z:p.z});
    lastTrailPoint=p.clone();
    // El mapa de prueba es corto; 90 puntos son más que suficientes.
    if(clearedTrail.length>1400)clearedTrail.shift();
  }
}

function puffInsideClearedTrail(wx,wz){
  // Corredor que queda despejado detrás del personaje.
  for(let i=clearedTrail.length-1;i>=0;i--){
    const t=clearedTrail[i];
    const dx=wx-t.x,dz=wz-t.z;
    if(dx*dx+dz*dz<5.20*5.20)return true;
  }
  return false;
}

function updateCloudClearing(){
  recordClearedTrail();

  for(const puff of stormPuffs){
    if(!puff || puff.isDisposed?.())continue;

    const wp=puff.getAbsolutePosition();
    const dx=wp.x-player.position.x;
    const dz=wp.z-player.position.z;

    // Gran área despejada alrededor del jugador.
    const aroundPlayer=(dx*dx+dz*dz)<5.6*5.6;

    // Toda huella ya recorrida queda TOTALMENTE despejada.
    const oldTrail=puffInsideClearedTrail(wp.x,wp.z);

    // No solo las nubes bajas: cualquier puff que invada la huella se elimina visualmente.
    // Así no quedan manchas transparentes sobre el camino.
    let target=1.0;

    if(oldTrail){
      target=0.0;
    }else if(aroundPlayer){
      target=0.0;
    }else if(puff.metadata?.ceiling){
      target=.86;
    }else{
      target=.98;
    }

    puff.metadata.targetVisibility=target;

    if(target===0){
      // Desaparición muy rápida y completa.
      puff.visibility=B.Scalar.Lerp(puff.visibility,0,.38);
      if(puff.visibility<.015)puff.visibility=0;
    }else{
      // Fuera de la huella vuelve lentamente a su densidad normal.
      puff.visibility=B.Scalar.Lerp(puff.visibility,target,.016);
    }
  }
}


// Jerarquía
const player=new B.TransformNode('player',scene);
const recenter=new B.TransformNode('recenter',scene);recenter.parent=player;
const headingFix=new B.TransformNode('headingFix',scene);headingFix.parent=recenter;
const axisFix=new B.TransformNode('axisFix',scene);axisFix.parent=headingFix;
const scaleRoot=new B.TransformNode('scaleRoot',scene);scaleRoot.parent=axisFix;

const camera=new B.FreeCamera('camera',new B.Vector3(0,42,20),scene);
camera.inputs.clear();
camera.fov=1.10;
camera.minZ=.08;
camera.maxZ=300;
scene.activeCamera=camera;

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

  // Calles transversales de las distintas cuadras.
  if(CROSS_STREETS.some(z=>Math.abs(player.position.z-z)<1.36) && ax<13.8){
    return ROAD_SURFACE_Y;
  }

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
const testAgeEl=document.getElementById('testAge');
const questionOverlay=document.getElementById('questionOverlay');
const questionAgeEl=document.getElementById('questionAge');
const questionNumberEl=document.getElementById('questionNumber');
const questionTextEl=document.getElementById('questionText');
const questionAnswersEl=document.getElementById('questionAnswers');
const pathProgressEl=document.getElementById('pathProgress');
const currentGuideEl=document.getElementById('currentGuide');
const destinationBanner=document.getElementById('destinationBanner');

// Estados que usa la interacción de la consola.
let nearMiniStation=false;
let miniOpen=false;

// HUD: estas funciones se perdieron accidentalmente al integrar v11.
function updateHud(){
  if(scoreEl) scoreEl.textContent=String(score);
  if(attentionEl) attentionEl.textContent=String(Math.round(attention));
  if(lightsCountEl) lightsCountEl.textContent=`${collectedLights}/3`;
}

function toast(msg){
  if(!toastEl) return;
  toastEl.textContent=msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t=setTimeout(()=>toastEl.classList.remove('show'),1700);
}

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

  // Si todavía quedan checkpoints, la impresión apunta hacia el siguiente.
  if(guideIndex<GUIDE_STEPS.length){
    const step=GUIDE_STEPS[guideIndex];
    currentGuideEl.textContent='IMPRESIÓN';
    revealNextPath(3.6);
    createGuidingLights(player.position.z-.8,Math.max(step.z,player.position.z-5.0),4);
    speak('Sientes que debes continuar con atención hacia adelante. No necesitas ver todo el camino; busca la siguiente señal.',{pitch:1.06,rate:.91});
    toast('👂 Impresión: continúa atento');
    return;
  }

  const l=nearestUncollectedLight();
  if(!l){
    speak('El destino está cerca. Continúa siguiendo la claridad que queda delante.');
    return;
  }
  const dx=l.x-player.position.x,dz=l.z-player.position.z;
  let phrase='Detente y observa. Hay una señal cerca.';
  if(Math.abs(dz)>Math.abs(dx)) phrase=dz<0?'Sientes que debes continuar un poco más adelante.':'Sientes que quizá dejaste atrás una impresión importante.';
  else phrase=dx<0?'Sientes una impresión suave hacia tu izquierda.':'Sientes una impresión suave hacia tu derecha.';
  l.orb.scaling.set(1.45,1.0,1.45);
  setTimeout(()=>l.orb?.scaling?.set?.(1,1,1),650);
  revealNextPath(3.2);
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
      l.collected=true;l.orb.setEnabled(false);l.light.dispose();
      collectedLights++;score+=10;attention=Math.min(100,attention+4);updateHud();
      toast(`✨ Luz encontrada +10`);
      if(collectedLights===1)speak('Bien. Una luz pequeña puede mostrarte el siguiente paso.');
      if(collectedLights===3){score+=15;updateHud();speak('Has seguido las tres luces. Busca ahora el desafío en la banqueta.');}
    }
  }
}

const QUESTION_BANK={
  '8':[
    {q:'Mientras juegas, recuerdas que prometiste ayudar en casa. ¿Qué haces?',a:[
      ['Ignoro el recuerdo y sigo jugando.',-30],['Termino lo que hago y voy después.',5],['Pauso el juego y ayudo ahora.',15],['Ayudo ahora y pregunto si alguien más necesita ayuda.',25]]},
    {q:'Un amigo se burla de otro niño. Sientes que deberías hacer algo.',a:[
      ['Me río también.',-30],['No digo nada.',5],['Le digo que pare.',15],['Defiendo al niño y busco a un adulto si hace falta.',25]]},
    {q:'Antes de dormir recuerdas que querías orar.',a:[
      ['Lo ignoro.',-30],['Digo algo rápido sin pensar.',5],['Me detengo y oro con atención.',15],['Oro con atención y doy gracias por alguien específico.',25]]}
  ],
  '12':[
    {q:'Recibes una notificación mientras estabas ayudando a tu familia. ¿Qué haces?',a:[
      ['Dejo todo para revisar el teléfono.',-30],['La reviso rápidamente y vuelvo.',5],['Termino primero lo que estaba haciendo.',15],['Termino, ayudo un poco más y luego reviso el teléfono.',25]]},
    {q:'Tus amigos quieren ver un video que sabes que no te hace sentir bien.',a:[
      ['Lo veo para no quedar mal.',-30],['Me quedo pero intento no mirar.',5],['Digo que prefiero otra cosa.',15],['Propongo algo divertido que todos puedan disfrutar.',25]]},
    {q:'Sientes una impresión de hablar con alguien que está solo.',a:[
      ['La ignoro.',-30],['Lo saludo desde lejos.',5],['Me acerco y converso.',15],['Me acerco, escucho y busco una forma concreta de ayudar.',25]]}
  ],
  '14':[
    {q:'Estás por publicar algo hiriente porque estás molesto. ¿Qué haces?',a:[
      ['Lo publico inmediatamente.',-30],['Lo publico y después veo si lo borro.',5],['No lo publico y espero a calmarme.',15],['No lo publico, me calmo y busco resolver el problema directamente.',25]]},
    {q:'Tienes una tarea importante pero tus amigos te invitan a jugar en línea.',a:[
      ['Ignoro la tarea.',-30],['Juego primero y veo si me alcanza el tiempo.',5],['Termino la tarea y luego juego.',15],['Organizo mi tiempo, termino bien y después disfruto sin preocupación.',25]]},
    {q:'Notas que un amigo está tomando una mala decisión.',a:[
      ['Lo animo a seguir.',-30],['No me meto.',5],['Le digo con respeto que me preocupa.',15],['Le hablo con respeto y me quedo disponible para ayudarlo.',25]]}
  ],
  'adult':[
    {q:'Llegas cansado y sientes que alguien de tu familia necesita hablar.',a:[
      ['Lo evito y me encierro en el teléfono.',-30],['Le digo que después.',5],['Me detengo y escucho unos minutos.',15],['Escucho con atención y busco cómo ayudar de forma concreta.',25]]},
    {q:'Tienes mucho trabajo pero habías apartado tiempo para una responsabilidad espiritual o familiar.',a:[
      ['La cancelo sin pensarlo.',-30],['La pospongo indefinidamente.',5],['Reorganizo lo posible para cumplir.',15],['Reorganizo prioridades y cumplo de manera consciente.',25]]},
    {q:'Percibes que llevas varios días reaccionando con impaciencia.',a:[
      ['Culpo a los demás.',-30],['Lo reconozco pero no hago nada.',5],['Busco corregir mi manera de responder.',15],['Me arrepiento, reparo el daño y establezco una acción concreta para cambiar.',25]]}
  ]
};

const questionZones=[
  {x:-3.9,z:3.1,done:false,index:0},
  {x:3.9,z:-6.2,done:false,index:1},
  {x:-3.9,z:-15.0,done:false,index:2}
];
let questionOpen=false;

function currentQuestion(zoneIndex){
  const age=testAgeEl?.value||'12';
  const bank=QUESTION_BANK[age]||QUESTION_BANK['12'];
  return bank[zoneIndex%bank.length];
}
function openQuestion(zone){
  if(questionOpen||miniOpen||decisionEl.classList.contains('show'))return;
  const q=currentQuestion(zone.index);
  questionOpen=true;
  questionAgeEl.textContent=`EDAD ${testAgeEl?.value==='adult'?'ADULTO':testAgeEl?.value+' AÑOS'}`;
  questionNumberEl.textContent=`${zone.index+1}/3`;
  questionTextEl.textContent=q.q;
  questionAnswersEl.innerHTML='';
  q.a.forEach(([label,value])=>{
    const b=document.createElement('button');
    b.type='button';
    const sign=value>0?`+${value}`:String(value);
    b.innerHTML=`${label}<b>${sign}</b>`;
    b.onclick=()=>{
      if(value<0){
        attention=B.Scalar.Clamp(attention+value,0,100);
        score=Math.max(0,score-5);
        toast(`⚠️ Atención ${value}`);
      }else{
        attention=B.Scalar.Clamp(attention+Math.min(value,10),0,100);
        score+=value;
        toast(`✅ +${value} puntos`);
      }
      updateHud();
      zone.done=true;
      questionOpen=false;
      questionOverlay.classList.remove('show');
      questionOverlay.setAttribute('aria-hidden','true');
      if(value>=15)speak('Buena decisión. Continúa atento a las siguientes impresiones.');
      else if(value<0)speak('La distracción oscurece el camino. Puedes corregir tu decisión en el siguiente momento.');
    };
    questionAnswersEl.appendChild(b);
  });
  questionOverlay.classList.add('show');
  questionOverlay.setAttribute('aria-hidden','false');
  speak(q.q,{rate:.94});
}
function updateQuestions(){
  if(questionOpen||miniOpen)return;
  for(const zone of questionZones){
    if(zone.done)continue;
    const dx=player.position.x-zone.x,dz=player.position.z-zone.z;
    if(dx*dx+dz*dz<1.55*1.55){openQuestion(zone);break;}
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

  // La cámara ve muchas cuadras; la tormenta física es la que oculta.
  scene.fogStart=34.0;
  scene.fogEnd=B.Scalar.Clamp(92.0-low*12.0,72.0,92.0);

  // Nubes gris-azuladas y suaves, más densas al bajar la atención.
  cloudDark.alpha=B.Scalar.Lerp(.72,.92,low);
  cloudMid.alpha=B.Scalar.Lerp(.64,.86,low);
  cloudLight.alpha=B.Scalar.Lerp(.54,.76,low);

  const t=performance.now()/1000;
  darknessClouds.forEach((c,i)=>{
    c.position.x=Math.sin(t*.060+i*.72)*.10;
    c.position.y=Math.sin(t*.045+i*.5)*.045;
  });

  stormEmitter.position.set(player.position.x,player.position.y,player.position.z);

  if(performance.now()>nextNaturalLightning){
    nextNaturalLightning=performance.now()+5500+rand()*7000;
    flash('#eef7ff',70,.68);
    setTimeout(()=>flash('#c9deed',55,.32),105);
    if(audioCtx){
      setTimeout(()=>{noiseBurst(.95,.08,300);tone(55,.65,'triangle',.045);},450+rand()*800);
    }
  }
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
    meshes.forEach(m=>{
      m.receiveShadows=true;shadows.addShadowCaster(m);
      try{
        m.enableEdgesRendering(.995);
        m.edgesWidth=1.0;
        m.edgesColor=new B.Color4(.025,.055,.12,.35);
      }catch(_){}
    });

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
    setStatus(`NUBES SUAVES v17 · ${groundBoneMode} · ${boneNames}`);
    loadingEl.classList.add('hidden');

    // Primera impresión, poco después de iniciar.
    setTimeout(()=>{
      currentGuideEl.textContent='ESCUCHA';
      speak('No puedes ver todo el camino. Avanza con atención y busca las señales que vayan apareciendo.',{pitch:1.05,rate:.91});
      revealNextPath(3.0);
    },900);
  }catch(e){
    console.error(e);
    setStatus('Error al preparar el Bebé Azul.',true);
  }
}

const velocity=new B.Vector3();
scene.onBeforeRenderObservable.add(()=>{
  const dt=Math.min(.022,engine.getDeltaTime()/1000);

  const uiBlocking=questionOpen||miniOpen||decisionEl.classList.contains('show')||voicesPanel.classList.contains('show');
  let dx=0,dz=0;
  if(!uiBlocking&&pressed('up'))dz-=1;
  if(!uiBlocking&&pressed('down'))dz+=1;

  // CORRECCIÓN solicitada:
  // en esta cámara el control anterior estaba invertido.
  if(!uiBlocking&&pressed('left'))dx+=1;
  if(!uiBlocking&&pressed('right'))dx-=1;

  const len=Math.hypot(dx,dz);
  if(len){dx/=len;dz/=len}

  const running=keys.has('run')||runTouch;
  const speed=running?6.2:3.75;

  const tx=ready?dx*speed:0;
  const tz=ready?dz*speed:0;

  const response=1-Math.exp(-9*dt);
  velocity.x=B.Scalar.Lerp(velocity.x,tx,response);
  velocity.z=B.Scalar.Lerp(velocity.z,tz,response);

  if(!dx&&Math.abs(velocity.x)<.008)velocity.x=0;
  if(!dz&&Math.abs(velocity.z)<.008)velocity.z=0;

  // Movimiento con colisiones: primero X y luego Z para poder deslizarse.
  let nextX=B.Scalar.Clamp(player.position.x+velocity.x*dt,-12.2,12.2);
  if(!blockedAt(nextX,player.position.z)){
    player.position.x=nextX;
  }else{
    velocity.x=0;
  }

  let nextZ=B.Scalar.Clamp(player.position.z+velocity.z*dt,-82,24);
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
    play(running?(run||walk):walk,running?1.42:1.24);
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
  updateQuestions();
  updateMiniStation();
  updateDecisionStation();
  updateShadow(dt);
  updateGuidedPath();
  updateCloudClearing();
  updateDarkness();

  // Vista muy alta tipo mapa táctico/cartoon.
// En pantalla deben caber aproximadamente 8–10 cuadras.
const baseCamX=player.position.x;
const baseCamY=45.0;
const baseCamZ=player.position.z+16.0;
const lookZ=player.position.z-11.0;

if(quakeTimer>0){
  quakeTimer-=dt;
  const q=.15*Math.min(1,quakeTimer);
  camera.position.set(
    baseCamX+(Math.random()-.5)*q,
    baseCamY+(Math.random()-.5)*q,
    baseCamZ+(Math.random()-.5)*q
  );
}else{
  camera.position.set(baseCamX,baseCamY,baseCamZ);
}
camera.setTarget(new B.Vector3(player.position.x,.45,lookZ));
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