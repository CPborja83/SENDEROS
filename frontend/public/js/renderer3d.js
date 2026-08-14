(function(){
  const L=window.Lajuj=window.Lajuj||{},U=L.Utils,C=L.CONFIG,E=L.WebGLEngine,M=L.Mat4,W=L.World,A3=L.Avatar3D,T3=L.Temple3D;
  const R=L.Renderer3D={};
  let canvas,gl,staticProgram,spriteProgram,staticBuffer,staticCount=0,dynBuffer,spriteBuffer;
  let state=null,eye=[0,14,14],target=[0,0,0],vp=M.identity(),basis={right:[1,0,0],up:[0,1,0]},running=false,last=0;
  const textures=new Map(),emojiTextures=new Map();
  const CELL=C.CELL;
  const gx=x=>(x-C.MAP_W/2)*CELL,gz=y=>(y-C.MAP_H/2)*CELL;
  R.gx=gx;R.gz=gz;

  const VS=`attribute vec3 aPos;attribute vec3 aNormal;attribute vec4 aColor;uniform mat4 uVP;uniform vec3 uLightDir;varying vec4 vColor;varying float vLight;void main(){gl_Position=uVP*vec4(aPos,1.0);vColor=aColor;vLight=.42+.58*max(dot(normalize(aNormal),normalize(uLightDir)),0.0);}`;
  const FS=`precision mediump float;varying vec4 vColor;varying float vLight;void main(){gl_FragColor=vec4(vColor.rgb*vLight,vColor.a);}`;
  const SVS=`attribute vec3 aPos;attribute vec2 aUV;uniform mat4 uVP;varying vec2 vUV;void main(){gl_Position=uVP*vec4(aPos,1.0);vUV=aUV;}`;
  const SFS=`precision mediump float;varying vec2 vUV;uniform sampler2D uTex;uniform float uAlpha;uniform vec4 uTint;void main(){vec4 c=texture2D(uTex,vUV);c*=uTint;c.a*=uAlpha;if(c.a<.05)discard;gl_FragColor=c;}`;

  function initPrograms(){staticProgram=E.createProgram(gl,VS,FS);spriteProgram=E.createProgram(gl,SVS,SFS);staticBuffer=gl.createBuffer();dynBuffer=gl.createBuffer();spriteBuffer=gl.createBuffer()}
  function col(hex,a=1){return E.color(hex,a)}
  function roomAt(x,y){return W.roomAt(state.world,x,y)}
  
function addRoomProps(b,rm){
  const s=C.buildings[rm.type],cx=gx((rm.x0+rm.x1)/2),cz=gz((rm.y0+rm.y1)/2),pts=[[-1.1,-.75],[1.1,-.75],[-1.1,.8],[1.1,.8]];
  function bx(dx,dy,dz,sx,sy,sz,c){b.box(cx+dx,dy,cz+dz,sx,sy,sz,col(c))}
  function cy(dx,dy,dz,r,h,c){b.cylY(cx+dx,dy,cz+dz,r,h,10,col(c))}
  function cone(dx,dy,dz,r,h,c){b.coneY(cx+dx,dy,cz+dz,r,h,10,col(c))}
  const brown='#80583a',metal='#536c79',blue='#567da1';
  if(rm.special==='stadium'){
    bx(0,.02,0,5.4,.04,5.4,'#2e7b3f');
    bx(0,.05,0,.05,.02,5.2,'#e9f2e8');
    bx(0,.05,-2.35,2.4,.04,.06,'#e9f2e8');bx(0,.72,-2.42,2.4,.08,.08,'#f7f7f2');
    for(const dx of[-1.15,1.15])cy(dx,.4,-2.42,.055,.75,'#f7f7f2');
    for(const z of[-1.8,-1.25,-.7,.7,1.25,1.8]){bx(-2.45,.24,z,.35,.35,.72,'#384d68');bx(2.45,.24,z,.35,.35,.72,'#6a4051')}
    return;
  }
  if(rm.special==='lab'){
    bx(0,.02,0,5.4,.04,5.4,'#183b49');
    for(const z of[-1.75,0,1.75]){bx(-1.55,.48,z,1.8,.12,.72,'#6d6f73');bx(1.55,.48,z,1.8,.12,.72,'#6d6f73')}
    for(const x of[-2.2,2.2]){cy(x,.72,-2.1,.08,1.35,'#5c7683');cone(x,1.55,-2.1,.28,.35,'#75eaff')}
    bx(0,1.0,2.15,2.8,1.25,.18,'#172631');bx(0,1.05,2.04,2.35,.78,.04,'#49d9ff');
    return;
  }
  function roundTable(x,z){cy(x,.58,z,.55,.08,'#b27d49');for(const d of[-.23,.23])cy(x+d,.28,z+d,.05,.46,'#63462d');cy(x,.28,z,.08,.56,'#63462d')}
  function familyTable(x,z){bx(x,.55,z,1.15,.12,.72,brown);for(const dx of[-.42,.42])for(const dz of[-.25,.25])cy(x+dx,.23,z+dz,.05,.45,'#5c4432')}
  function chair(x,z,rot=0){bx(x,.34,z,.42,.1,.42,blue);bx(x,.68,z+.18,.42,.52,.08,blue);cy(x-.12,.18,z-.12,.035,.3,'#4d6277');cy(x+.12,.18,z-.12,.035,.3,'#4d6277');cy(x-.12,.18,z+.12,.035,.3,'#4d6277');cy(x+.12,.18,z+.12,.035,.3,'#4d6277')}
  function couch(x,z){bx(x,.32,z,1.46,.44,.62,'#8c5367');bx(x,.66,z+.22,1.46,.7,.18,'#8c5367');bx(x-.66,.45,z,.18,.54,.65,'#8c5367');bx(x+.66,.45,z,.18,.54,.65,'#8c5367');bx(x,.28,z-.1,1.02,.16,.36,'#c9a9b5')}
  function shelf(x,z){bx(x,.78,z,1.45,1.55,.36,'#60452e');for(let rr=0;rr<3;rr++)for(let i=0;i<5;i++)bx(x-.52+i*.26,.33+rr*.45,z-.2,.16,.32,.2,['#4c8bc2','#d36c5a','#e0b84d','#66a46c','#8d6ab0'][i])}
  function desk(x,z){bx(x,.62,z,1.15,.1,.62,brown);for(const dx of[-.48,.48])cy(x+dx,.31,z,.045,.62,'#514638');bx(x,.98,z-.25,.58,.4,.07,'#243d52');bx(x,.84,z-.22,.46,.28,.03,'#66d6ff')}
  function bed(x,z){bx(x,.28,z,1.55,.35,.82,'#4f7790');bx(x,.54,z,1.3,.18,.68,'#d4e8ed');bx(x-.45,.69,z,.35,.14,.56,'#fff3df');cy(x-.62,.15,z-.26,.06,.25,'#3e596a');cy(x+.62,.15,z-.26,.06,.25,'#3e596a');cy(x-.62,.15,z+.26,.06,.25,'#3e596a');cy(x+.62,.15,z+.26,.06,.25,'#3e596a')}
  function plant(x,z){cy(x,.16,z,.22,.32,'#91684b');cy(x,.53,z,.18,.26,'#2e6b3d');cy(x+.08,.76,z-.02,.18,.3,'#58ae67');cy(x-.08,.76,z+.05,.15,.22,'#4ca75a')}
  function arcade(x,z){bx(x,.62,z,.74,1.28,.78,'#5f2b68');bx(x,.98,z-.34,.52,.4,.04,'#43d4ef');bx(x,.48,z-.4,.42,.12,.24,'#222a34');cone(x,1.34,z-.05,.3,.22,'#9b45a9')}
  function tv(x,z){bx(x,.84,z,1.08,.66,.14,'#171c24');bx(x,.86,z-.08,.92,.52,.03,'#2f89bd');cy(x,.23,z,.08,.45,'#596574');bx(x,.04,z,.7,.08,.38,'#596574')}
  function lamp(x,z){cy(x,.7,z,.05,1.35,'#41545e');cy(x,1.48,z,.16,.13,'#ffe7ad')}
  function gameConsole(x,z){bx(x,.33,z,.9,.66,.66,'#3d5263');bx(x,.78,z,.65,.08,.38,'#232a33');bx(x-.18,.84,z-.18,.12,.08,.12,'#65d8ff');bx(x+.18,.84,z-.18,.12,.08,.12,'#ff6b8b');bx(x,.84,z+.12,.16,.05,.16,'#ffe27d')}
  function tabletStand(x,z){cy(x,.34,z,.28,.68,'#3b4d5e');bx(x,.78,z,.56,.08,.78,'#1c2631');bx(x,.8,z-.04,.48,.03,.66,'#8aa0f4')}
  if(s.kind==='family'||s.kind==='home'){couch(pts[0][0],pts[0][1]);familyTable(.45,.7);chair(.95,.25);chair(0.2,1.0);plant(pts[1][0],pts[1][1]);lamp(-.1,-1.0)}
  if(s.kind==='library'){shelf(pts[0][0],pts[0][1]);shelf(pts[1][0],pts[1][1]);roundTable(0,.7);chair(-.55,.7);chair(.55,.7)}
  if(s.kind==='classroom'||s.kind==='study'){pts.forEach(p=>desk(p[0],p[1]));lamp(0,-1.0)}
  if(s.kind==='clinic'){bed(0,0);plant(pts[1][0],pts[1][1]);tv(pts[2][0],pts[2][1]);lamp(-1.0,-.85)}
  if(s.kind==='game'){arcade(pts[0][0],pts[0][1]);arcade(pts[1][0],pts[1][1]);tv(0,.75);gameConsole(0,-.85)}
  if(s.kind==='workshop'){desk(pts[0][0],pts[0][1]);bx(pts[1][0],.35,pts[1][1],.75,.7,.75,'#8a623e');bx(pts[2][0],.22,pts[2][1],.6,.44,.6,metal);lamp(1.1,.95)}
  if(s.kind==='comms'){desk(pts[0][0],pts[0][1]);tv(pts[1][0],pts[1][1]);cy(0,.95,.8,.08,1.35,'#7794a5');cone(0,1.75,.8,.65,.35,'#8baab9')}
  if(s.kind==='garden'){pts.forEach(p=>plant(p[0],p[1]));roundTable(0,0);chair(-.7,0);chair(.7,0)}
  if(s.kind==='chapel'){for(let z=-.8;z<=.8;z+=.8){bx(-.8,.35,z,1.25,.35,.42,brown);bx(.8,.35,z,1.25,.35,.42,brown)}familyTable(0,-1.2)}
  if(s.kind==='shop'){pts.forEach(p=>bx(p[0],.34,p[1],.8,.68,.58,'#8b633e'));tabletStand(0,.95)}
}

  
function addQuestionObject(b,node,q){
  const x=gx(node.x),z=gz(node.y),t=q.topic;
  b.cylY(x,.12,z,.44,.18,10,col('#223d4d')); b.cylY(x,.28,z,.3,.14,10,col('#2b5f7c'));
  if(t==='Oración'){b.box(x,.16,z,.84,.06,.96,col('#8f5a75'));b.cylY(x,.54,z+.08,.06,.64,10,col('#f4d080'));b.coneY(x,.95,z+.08,.11,.18,8,col('#ffd76b'))}
  else if(t==='Escrituras'){b.box(x,.23,z,.86,.18,.62,col('#b18148'));b.box(x,.38,z,.7,.14,.48,col('#f1dd98'));b.box(x,.38,z-.24,.08,.14,.08,col('#8b5b2d'))}
  else if(t==='Familia'){b.box(x,.5,z,1.18,.12,.74,col('#a36b45'));for(const dx of[-.42,.42])for(const dz of[-.25,.25])b.cylY(x+dx,.23,z+dz,.05,.44,8,col('#6c4a31'));b.box(x,.62,z,1.0,.02,.58,col('#ffe6b2'))}
  else if(t==='Servicio'){b.cylY(x,.66,z,.07,1.12,10,col('#8b6a45'));b.box(x,.18,z+.24,.76,.22,.28,col('#d6bd78'));b.box(x,.3,z-.18,.34,.14,.34,col('#fff2b0'))}
  else if(t==='Estudio / trabajo'){b.box(x,.52,z,1.02,.12,.68,col('#7c5b3d'));for(const dx of[-.42,.42])b.cylY(x+dx,.25,z,.04,.46,8,col('#5b4232'));b.box(x,.86,z-.08,.5,.3,.08,col('#6dd8ff'))}
  else if(t==='Tecnología'){b.cylY(x,.3,z,.26,.5,8,col('#4b6378'));b.box(x,.76,z,.42,.08,.7,col('#1d2731'));b.box(x,.79,z-.02,.34,.03,.58,col('#46c2f0'));b.box(x,.83,z+.26,.1,.02,.1,col('#ffd96c'))}
  else if(t==='Amistad'){b.cylY(x,.46,z,.38,.76,12,col('#ebaa41'));b.box(x,.46,z,.8,.08,.8,col('#fff4b5'));b.cylY(x,.94,z,.08,.18,10,col('#fff8d8'))}
  else if(t==='Honestidad'){b.box(x,.4,z,.82,.2,.6,col('#754933'));b.box(x,.56,z-.22,.22,.05,.18,col('#efc14e'));b.cylY(x,.52,z+.1,.08,.16,8,col('#ffe28f'))}
  else if(t==='Iglesia'){b.box(x,.28,z,1.18,.32,.44,col('#6a5a4e'));b.box(x,.62,z+.14,1.18,.54,.12,col('#6a5a4e'));b.coneY(x,.98,z+.17,.14,.24,8,col('#efe1a3'))}
  else {b.box(x,.24,z,1.4,.34,.8,col('#5e879f'));b.box(x,.53,z,1.14,.18,.66,col('#d2e5e9'));b.cylY(x,.1,z-.28,.08,.16,8,col('#445f70'))}
}

  
function addMiniObject(b,node){
  const x=gx(node.x),z=gz(node.y),type=node.mini.type;
  b.cylY(x,.12,z,.42,.18,10,col('#223d4d'));
  if(type==='arcade'){b.box(x,.66,z,.82,1.34,.82,col('#6d2f7a'));b.box(x,1.0,z-.34,.6,.44,.05,col('#5ae2ff'));b.box(x,.48,z-.41,.46,.12,.26,col('#202933'));b.coneY(x,1.42,z-.04,.3,.22,8,col('#bf5cdc'))}
  if(type==='console'){b.box(x,.35,z,.92,.7,.7,col('#41586a'));b.box(x,.78,z,.68,.08,.4,col('#232a33'));b.box(x-.18,.84,z-.18,.12,.08,.12,col('#65d8ff'));b.box(x+.18,.84,z-.18,.12,.08,.12,col('#ff6b8b'));b.box(x,.84,z+.12,.16,.05,.16,col('#ffe27d'))}
  if(type==='tv'){b.box(x,.86,z,1.18,.76,.18,col('#191e25'));b.box(x,.88,z-.09,1.0,.56,.04,col('#4ab7f2'));b.cylY(x,.24,z,.08,.46,8,col('#596574'));b.box(x,.04,z,.74,.08,.4,col('#596574'))}
  if(type==='phone'){b.cylY(x,.34,z,.28,.68,10,col('#425a6e'));b.box(x,.8,z,.36,.08,.66,col('#1c2631'));b.box(x,.82,z-.04,.28,.03,.52,col('#52bfe7'));b.box(x,.86,z+.26,.1,.02,.1,col('#fff48a'))}
  if(type==='tablet'){b.cylY(x,.34,z,.3,.68,10,col('#425a6e'));b.box(x,.8,z,.6,.08,.82,col('#1c2631'));b.box(x,.82,z-.04,.52,.03,.7,col('#8aa0f4'));b.box(x,.86,z+.3,.12,.02,.12,col('#fff48a'))}
}

function addDistractionObject(b,node){
  const x=gx(node.x),z=gz(node.y),t=node.item.type;
  b.cylY(x,.10,z,.38,.16,10,col('#3b2b46'));
  if(t==='social'){b.box(x,.72,z,.42,.08,.72,col('#1e2a34'));b.box(x,.74,z-.03,.34,.03,.6,col('#46c8ff'));b.sphere(x,.82,z+.3,.08,4,8,col('#ff5b8e'))}
  if(t==='games'){b.box(x,.55,z,.76,1.12,.72,col('#6b3578'));b.box(x,.88,z-.32,.54,.34,.04,col('#58e1ff'));b.coneY(x,1.25,z-.02,.26,.18,8,col('#ff76dc'))}
  if(t==='tv'){b.box(x,.82,z,1.15,.7,.16,col('#1a2027'));b.box(x,.84,z-.09,.98,.5,.04,col('#cf5dff'));b.cylY(x,.22,z,.4,.08,8,col('#58646f'))}
  if(t==='money'){b.box(x,.4,z,.82,.62,.6,col('#7a5837'));for(let k=0;k<5;k++)b.cylY(x+(k-2)*.12,.8,z,.11,.08,10,col('#e7c94e'))}
  if(t==='shopping'){b.box(x,.42,z,.74,.72,.48,col('#e584a9'));b.cylY(x-.22,.78,z,.035,.6,8,col('#f4d8e1'));b.cylY(x+.22,.78,z,.035,.6,8,col('#f4d8e1'))}
  if(t==='food'){b.cylY(x,.44,z,.46,.2,14,col('#f0ddcc'));b.cylY(x,.65,z,.34,.22,14,col('#d69b5d'));b.sphere(x,.83,z,.33,5,10,col('#ffb7c1'),1,.5,1)}
  if(t==='sleep'){b.box(x,.27,z,1.4,.36,.8,col('#5e879f'));b.box(x,.56,z,1.16,.18,.66,col('#d9ebef'));b.sphere(x-.45,.68,z,.18,4,8,col('#fff6df'))}
  if(t==='sports'){b.sphere(x,.55,z,.38,6,12,col('#f2f2e8'));for(let k=0;k<5;k++){const a=k*1.256;b.sphere(x+Math.cos(a)*.22,.56,z+Math.sin(a)*.22,.08,4,8,col('#31353b'))}}
  if(t==='gossip'){for(const dx of[-.25,.25]){b.sphere(x+dx,.78,z,.24,5,10,col(dx<0?'#67bfe2':'#e78aaf'));b.coneY(x+dx,.42,z,.13,.3,8,col(dx<0?'#67bfe2':'#e78aaf'))}b.sphere(x,1.25,z,.18,5,10,col('#ffe479'))}
  if(t==='work'){b.box(x,.48,z,.88,.62,.52,col('#674a34'));b.box(x,.82,z,.54,.07,.36,col('#65c8e8'));b.box(x,.18,z,.34,.12,.48,col('#3d4750'))}
}



function addMediaObject(b,node){const x=gx(node.x),z=gz(node.y);b.cylY(x,.15,z,.48,.22,12,col('#2e4460'));b.box(x,.82,z,1.15,.82,.22,col('#111922'));b.box(x,.84,z-.12,.96,.6,.04,col('#4ad2ff'));b.coneY(x,1.45,z-.05,.25,.32,10,col('#ffe25b'));b.cylY(x,.35,z,.08,.55,10,col('#5b6879'))}
function addWebGameObject(b,node){const x=gx(node.x),z=gz(node.y);b.box(x,.7,z,.9,1.4,.9,col('#3f2c66'));b.box(x,1.03,z-.37,.64,.46,.05,col('#76efff'));b.box(x,.48,z-.45,.55,.14,.3,col('#1d2530'));b.sphere(x-.16,.58,z-.56,.07,4,8,col('#ff6688'));b.sphere(x+.16,.58,z-.56,.07,4,8,col('#67f0a1'))}

  function buildStatic(){const b=new E.MeshBuilder(),world=state.world,MW=C.MAP_W,MH=C.MAP_H;
    for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const X=gx(x),Z=gz(y),k=world.kind[y][x];if(world.maze[y][x]){const st=neighborBuildingStyle(x,y);b.box(X,.65,Z,CELL,1.3,CELL,col(st?st.wall:'#233a49'));continue}let floor;if(k===1)floor=C.roads[(Math.floor(x/12)+Math.floor(y/10))%C.roads.length];else if(k===3)floor=['#b49670','#89949f','#aa8b6a','#7f9091'][(Math.floor(x/12)+Math.floor(y/10))%4];else{const rm=roomAt(x,y);floor=rm?.special==='stadium'?'#2e7b3f':rm?.special==='lab'?'#173d49':C.buildings[(rm?.type??0)].floor;}b.box(X,-.04,Z,CELL,.08,CELL,col(floor));if(k===1){b.box(X,.015,Z,.07,.03,CELL*.68,col('#e5c351',.55))}}
    state.world.rooms.forEach(rm=>addRoomProps(b,rm));
    for(let y=2;y<C.MAP_H-2;y+=5)for(let x=2;x<C.MAP_W-2;x+=6)if(state.world.kind[y][x]===3){const X=gx(x),Z=gz(y);if((x+y)%2){b.box(X,.7,Z,.1,1.4,.1,col('#384c55'));b.box(X,1.48,Z,.28,.16,.28,col('#ffe5a2'))}else{b.box(X,.35,Z,.24,.7,.24,col('#65472f'));b.box(X,.95,Z,.8,.8,.8,col('#3f8d53'))}}
    (state.mediaStations||[]).forEach(n=>addMediaObject(b,n));(state.webGames||[]).forEach(n=>addWebGameObject(b,n));
    const arr=new Float32Array(b.data);gl.bindBuffer(gl.ARRAY_BUFFER,staticBuffer);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);staticCount=arr.length/10
  }
  function roomAt(x,y){return W.roomAt(state.world,x,y)}
  function neighborBuildingStyle(x,y){for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const r=roomAt(x+dx,y+dy);if(r)return C.buildings[r.type]}return null}
  function setupStaticAttrib(buffer){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const stride=10*4;const aPos=gl.getAttribLocation(staticProgram,'aPos'),aNormal=gl.getAttribLocation(staticProgram,'aNormal'),aColor=gl.getAttribLocation(staticProgram,'aColor');gl.enableVertexAttribArray(aPos);gl.vertexAttribPointer(aPos,3,gl.FLOAT,false,stride,0);gl.enableVertexAttribArray(aNormal);gl.vertexAttribPointer(aNormal,3,gl.FLOAT,false,stride,12);gl.enableVertexAttribArray(aColor);gl.vertexAttribPointer(aColor,4,gl.FLOAT,false,stride,24)}
  function drawStatic(buffer,count,blend=false){gl.useProgram(staticProgram);setupStaticAttrib(buffer);gl.uniformMatrix4fv(gl.getUniformLocation(staticProgram,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(staticProgram,'uLightDir'),new Float32Array([-.5,.9,.35]));if(blend){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false)}gl.drawArrays(gl.TRIANGLES,0,count);if(blend){gl.depthMask(true);gl.disable(gl.BLEND)}}
  function drawBuilder(b,blend=false){if(!b||!b.data.length)return;const arr=new Float32Array(b.data);gl.bindBuffer(gl.ARRAY_BUFFER,dynBuffer);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.DYNAMIC_DRAW);drawStatic(dynBuffer,arr.length/10,blend)}
  function loadTexture(src){if(textures.has(src))return textures.get(src);const entry={tex:null,ready:false};textures.set(src,entry);const im=new Image();im.onload=()=>{try{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);entry.tex=t;entry.ready=true}catch(e){console.warn('Texture',src,e)}};im.src=src;return entry}
  function canvasTexture(canvas,key){if(emojiTextures.has(key))return emojiTextures.get(key);const e={tex:null,ready:true},t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);e.tex=t;emojiTextures.set(key,e);return e}
  function emojiTexture(icon){const key='emoji:'+icon;if(emojiTextures.has(key))return emojiTextures.get(key);const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.font='88px serif';x.textAlign='center';x.textBaseline='middle';x.fillText(icon,64,69);return canvasTexture(c,key)}
  function labelTexture(text,color='#dff4ff'){const key='label:'+text+color;if(emojiTextures.has(key))return emojiTextures.get(key);const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(5,20,33,.88)';x.fillRect(8,12,496,104);x.strokeStyle='#58bfff';x.lineWidth=5;x.strokeRect(8,12,496,104);x.font='700 42px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillStyle=color;x.fillText(text,256,64);return canvasTexture(c,key)}
  function softTexture(key,inner='rgba(255,255,255,.9)',outer='rgba(255,255,255,0)',stroke=null){if(emojiTextures.has(key))return emojiTextures.get(key);const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,10,64,64,58);g.addColorStop(0,inner);g.addColorStop(1,outer);x.fillStyle=g;x.beginPath();x.arc(64,64,58,0,Math.PI*2);x.fill();if(stroke){x.strokeStyle=stroke;x.lineWidth=6;x.beginPath();x.arc(64,64,40,0,Math.PI*2);x.stroke()}return canvasTexture(c,key)}
  function drawSprite(entry,x,y,z,w,h,alpha=1,tint=[1,1,1,1]){if(!entry||!entry.ready||!entry.tex)return;const r=basis.right,u=basis.up,hw=w/2;const p0=[x-r[0]*hw,y,z-r[2]*hw],p1=[x+r[0]*hw,y,z+r[2]*hw],p2=[x+r[0]*hw,y+h,z+r[2]*hw],p3=[x-r[0]*hw,y+h,z-r[2]*hw];const d=new Float32Array([...p0,0,1,...p1,1,1,...p2,1,0,...p0,0,1,...p2,1,0,...p3,0,0]);gl.useProgram(spriteProgram);gl.bindBuffer(gl.ARRAY_BUFFER,spriteBuffer);gl.bufferData(gl.ARRAY_BUFFER,d,gl.DYNAMIC_DRAW);const ap=gl.getAttribLocation(spriteProgram,'aPos'),au=gl.getAttribLocation(spriteProgram,'aUV');gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(au);gl.vertexAttribPointer(au,2,gl.FLOAT,false,20,12);gl.uniformMatrix4fv(gl.getUniformLocation(spriteProgram,'uVP'),false,vp);gl.uniform1f(gl.getUniformLocation(spriteProgram,'uAlpha'),alpha);gl.uniform4fv(gl.getUniformLocation(spriteProgram,'uTint'),new Float32Array(tint));gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,entry.tex);gl.uniform1i(gl.getUniformLocation(spriteProgram,'uTex'),0);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,6);gl.depthMask(true);gl.disable(gl.BLEND)}
  function drawFog(){const b=new E.MeshBuilder(),px=state.player.x,py=state.player.y;const rx=14,ry=10;for(let y=Math.max(0,py-ry);y<=Math.min(C.MAP_H-1,py+ry);y++)for(let x=Math.max(0,px-rx);x<=Math.min(C.MAP_W-1,px+rx);x++)if(!state.world.maze[y][x]&&!state.discovered[y][x]){const X=gx(x),Z=gz(y);b.plane(X-CELL/2,Z-CELL/2,X+CELL/2,Z+CELL/2,1.75,[.015,.025,.04,.72])}if(!b.data.length)return;const arr=new Float32Array(b.data);gl.bindBuffer(gl.ARRAY_BUFFER,dynBuffer);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.DYNAMIC_DRAW);drawStatic(dynBuffer,arr.length/10,true)}
  
function drawTemple(){
  if(!state.templeReveal&&!state.reachedTemple)return;
  const b=new E.MeshBuilder(),X=gx(state.temple.x),Z=gz(state.temple.y),pulse=.82+.18*Math.sin(performance.now()/210);
  T3.add(b,X,Z,pulse);drawBuilder(b,false);
  drawSprite(softTexture('celestialTemple','rgba(255,244,170,.55)','rgba(255,244,170,0)'),X,.3,Z,9.8,9.8,pulse);
  drawSprite(softTexture('celestialTemple2','rgba(207,235,255,.25)','rgba(207,235,255,0)'),X,1.1,Z,12.5,12.5,.7);
}

function drawInteractionSprites(){
  (state.signalSites||[]).forEach(n=>{if(n.active&&state.discovered[n.y]?.[n.x]){const X=gx(n.x),Z=gz(n.y),pulse=.82+.18*Math.sin(performance.now()/170+n.index);drawSprite(softTexture('signalclarity','rgba(255,245,158,.58)','rgba(255,245,158,0)'),X,.7,Z,2.8*pulse,2.8*pulse,.78);drawSprite(emojiTexture('✨'),X,1.38+.12*Math.sin(performance.now()/240+n.index),Z,1.05,1.05,1)}});
  (state.mediaStations||[]).forEach(n=>{if(n.active&&state.discovered[n.y]?.[n.x]){const X=gx(n.x),Z=gz(n.y);drawSprite(softTexture('vglow','rgba(90,220,255,.52)','rgba(90,220,255,0)'),X,1.0,Z,2.6,2.6,.8);drawSprite(emojiTexture('📻'),X,1.55,Z,1.05,1.05,1)}});
  (state.webGames||[]).forEach(n=>{if(n.active&&state.discovered[n.y]?.[n.x]){const X=gx(n.x),Z=gz(n.y),bob=.07*Math.sin(performance.now()/220+n.gameIndex);drawSprite(softTexture('wglow','rgba(180,110,255,.5)','rgba(180,110,255,0)'),X,1.0,Z,2.6,2.6,.8);drawSprite(emojiTexture('🕹️'),X,1.55+bob,Z,1.05,1.05,1)}})
}

function drawSpecialRooms(){
  const t=performance.now()/1000,b=new E.MeshBuilder();
  for(const rm of state.world.rooms){
    const cx=gx((rm.x0+rm.x1)/2),cz=gz((rm.y0+rm.y1)/2),rx=(rm.x1-rm.x0)*CELL*.42,rz=(rm.y1-rm.y0)*CELL*.42;
    const midx=Math.floor((rm.x0+rm.x1)/2),midy=Math.floor((rm.y0+rm.y1)/2);if(!state.discovered[midy]?.[midx])continue;
    if(rm.special==='stadium'){
      const bx=cx+Math.sin(t*1.7)*Math.min(2.2,rx*.35),bz=cz+Math.cos(t*1.35)*Math.min(1.7,rz*.3);b.sphere(bx,.38,bz,.22,5,10,col('#f6f2dd'));
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2+t*.22,x=cx+Math.cos(a)*Math.min(2.2,rx*.36),z=cz+Math.sin(a)*Math.min(1.8,rz*.32),team=i%2;b.capsuleY(x,.72+.06*Math.sin(t*4+i),z,.16,.9,col(team?'#e65b68':'#4ba7ef'));b.sphere(x,1.25,z,.13,4,8,col('#f0c9a0'))}
    }
    if(rm.special==='lab'){
      for(let i=0;i<7;i++){const a=t*(.45+i*.03)+i*.9,r=.65+(i%3)*.35,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,y=.65+.24*Math.sin(t*2+i);b.boxRotY(x,y,z,.28,.28,.28,a*1.8,col(['#69e7ff','#ffd56e','#9af28c','#d087ff'][i%4]))}
      b.cylY(cx,.72,cz,.16,1.15,10,col('#52d9ff',.7));
      drawSprite(softTexture('labcore','rgba(100,235,255,.58)','rgba(100,235,255,0)'),cx,.2,cz,3.0,3.0,.55+.25*Math.sin(t*3));
    }
  }
  drawBuilder(b,false);
}


function drawStreetHazards(){
  const t=performance.now()/1000,b=new E.MeshBuilder();
  for(const h of state.hazards||[]){
    if(!h.active||!state.discovered[h.y]?.[h.x])continue;
    const X=gx(h.x),Z=gz(h.y),bob=Math.sin(t*3+(h.phase||0));
    if(h.type==='vehicle'){
      const horizontal=Math.abs(h.dx||0)>0,rot=horizontal?Math.PI/2:0,len=Math.min(h.length||CELL*.84,CELL*.98),wid=Math.min(h.width||CELL*.42,CELL*.5),hei=Math.min(h.height||CELL*.24,CELL*.3);
      b.boxRotY(X,hei*.72,Z,wid,hei,len,rot,col(h.vehicleKind==='bus'?'#4d85c7':h.vehicleKind==='camión'?'#d8893f':'#e05252'));
      b.boxRotY(X,hei*1.42,Z,wid*.78,hei*.68,len*.54,rot,col('#9ddfff'));
      const lx=horizontal?len*.34:wid*.47,lz=horizontal?wid*.47:len*.34;
      for(const sx of[-1,1])for(const sz of[-1,1])b.sphere(X+sx*lx,.17,Z+sz*lz,.11,4,8,col('#111820'));
      drawSprite(softTexture('carGlow','rgba(255,190,90,.25)','rgba(255,190,90,0)'),X,.04,Z,wid*1.8,wid*1.8,.42);
    }else if(h.type==='animal'){
      const sz=Math.min(h.renderSize||CELL*.58,CELL*.64);drawSprite(softTexture('animalGlow','rgba(255,85,55,.28)','rgba(255,85,55,0)'),X,.05,Z,sz*1.7,sz*1.7,.52);drawSprite(emojiTexture(h.icon||'🐆'),X,.44+.07*bob,Z,sz,sz,1);
    }else if(h.type==='sinkhole'){
      for(const c of h.cells||[{x:h.x,y:h.y}]){const sx=gx(c.x),sz=gz(c.y),rr=Math.min(CELL*.31,.72);b.cylY(sx,.03,sz,rr,.07,14,col('#080a0c'));b.cylY(sx,.045,sz,rr*.72,.025,14,col('#23140e'));}
      for(let i=0;i<4;i++){const a=t*1.3+i*1.7,r=.2+.1*i;b.boxRotY(X+Math.cos(a)*r,.12+.05*Math.sin(a*2),Z+Math.sin(a)*r,.08,.08,.08,a,col('#8f7965',.8))}
      drawSprite(softTexture('holeWarn','rgba(255,110,50,.22)','rgba(255,110,50,0)'),X,.02,Z,CELL*1.15,CELL*1.15,.35+.12*Math.sin(t*4));
    }else if(h.type==='tornado'){
      const r=Math.min((h.renderSize||CELL*.82)*.42,CELL*.4);for(let i=0;i<5;i++){const a=t*(2.1+i*.22)+i*1.25,rr=r*(.35+i*.13),y=.18+i*.28;b.sphere(X+Math.cos(a)*rr,y,Z+Math.sin(a)*rr,.09+i*.018,4,8,col('#b9d8df',.55))}b.coneY(X,.72,Z,r,.95,14,col('#9fcbd2',.32));drawSprite(softTexture('tornadoGlow','rgba(170,230,240,.28)','rgba(170,230,240,0)'),X,.08,Z,CELL*.95,CELL*.95,.5);drawSprite(emojiTexture('🌪️'),X,.75+.05*bob,Z,CELL*.58,CELL*.58,.9);
    }else if(h.type==='electric'){
      const vertical=h.axis==='vertical',span=Math.min(h.renderSize||CELL*.92,CELL*.96);b.boxRotY(X,.09,Z,vertical?.07:span,.07,vertical?span:.07,0,col('#20242b'));for(let i=-2;i<=2;i++){const q=i/2,px=vertical?X:X+q*span*.42,pz=vertical?Z+q*span*.42:Z;b.sphere(px,.15+.05*Math.sin(t*9+i),pz,.07,4,7,col('#dff8ff'));drawSprite(softTexture('sparkGlow','rgba(100,220,255,.68)','rgba(100,220,255,0)'),px,.13,pz,.38,.38,.45+.35*Math.sin(t*10+i))}drawSprite(emojiTexture('⚡'),X,.65,Z,CELL*.5,CELL*.5,.95);
    }
  }
  drawBuilder(b,false);
}

function drawPlayers(){
  const phase=performance.now()/180,sx=state.visualX??gx(state.player.x),sz=state.visualZ??gz(state.player.y),b=new E.MeshBuilder();
  A3.add(b,state.selected.id,sx,sz,phase,1,state.facing||0);if(state.shadow)A3.addShadow(b,state.selected.shadow,gx(state.shadow.x),gz(state.shadow.y),phase,state.shadowFacing||0);
  Object.entries(state.players||{}).forEach(([id,p])=>{if(id===state.id||!p||p.reachedTemple)return;A3.add(b,p.character,gx(p.x),gz(p.y),phase+id.length*.4,.92,p.facing||0);if(p.shadowX!=null&&p.shadowY!=null)A3.addShadow(b,U.charBy(p.character).shadow,gx(p.shadowX),gz(p.shadowY),phase+.8,p.shadowFacing||0)});
  drawBuilder(b,false);
  drawSprite(labelTexture(state.name,'#ffe17a'),sx,2.22,sz,1.8,.43,.96);
  Object.entries(state.players||{}).forEach(([id,p])=>{if(id===state.id||!p||p.reachedTemple)return;drawSprite(labelTexture(p.name||'Jugador'),gx(p.x),2.12,gz(p.y),1.65,.4,.82)})
}


function drawGuideRoute(){if(!state.guideRoute?.route||Date.now()>(state.guideRoute.until||0))return;state.guideRoute.route.forEach((p,i)=>{const X=gx(p.x),Z=gz(p.y),a=.9-i*.06;drawSprite(softTexture('routeGlow','rgba(255,230,88,.75)','rgba(255,230,88,0)'),X,.06,Z,.85,.85,Math.max(.35,a));if(i===state.guideRoute.route.length-1)drawSprite(emojiTexture('✨'),X,.18,Z,.5,.5,.9)})}

function drawRoomLabels(){state.world.rooms.forEach(rm=>{const cx=Math.floor((rm.x0+rm.x1)/2),cy=Math.floor((rm.y0+rm.y1)/2);if(state.discovered[cy]?.[cx])drawSprite(labelTexture(rm.label),gx(cx),1.75,gz(rm.y0)-.5,2.7,.62,.9)})}
  function updateCamera(){const tx=state.visualX??gx(state.player.x),tz=state.visualZ??gz(state.player.y),portrait=innerHeight>innerWidth;target=[tx,.55,tz];eye=[tx,portrait?14.8:13.4,tz+(portrait?10.8:9.1)];const proj=M.perspective((portrait?52:45)*Math.PI/180,canvas.clientWidth/Math.max(1,canvas.clientHeight),.1,260),view=M.lookAt(eye,target,[0,1,0]);vp=M.multiply(proj,view);basis=M.cameraBasis(eye,target)}
  let lastFrame=0;function loop(t){if(!running)return;requestAnimationFrame(loop);if(!state)return;const dt=Math.min(.05,Math.max(.001,(t-(lastFrame||t-16))/1000));lastFrame=t;const follow=1-Math.exp(-11*dt),targetX=gx(state.player.x),targetZ=gz(state.player.y);state.visualX=(state.visualX??targetX)+(targetX-(state.visualX??targetX))*follow;state.visualZ=(state.visualZ??targetZ)+(targetZ-(state.visualZ??targetZ))*follow;updateCamera();gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.025,.055,.075,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);drawStatic(staticBuffer,staticCount);drawSpecialRooms();drawStreetHazards();drawInteractionSprites();drawGuideRoute();drawRoomLabels();drawPlayers();drawTemple();drawFog()}
  R.init=function(c,s){canvas=c;state=s;gl=canvas.getContext('webgl',{alpha:false,antialias:true,premultipliedAlpha:true,powerPreference:'high-performance',desynchronized:true})||canvas.getContext('experimental-webgl');if(!gl)throw new Error('Este navegador no ofrece WebGL.');gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);initPrograms();R.resize();buildStatic();L.CONFIG.characters.forEach(c=>loadTexture(c.src));L.CONFIG.shadows.forEach(s=>loadTexture(s.src));running=true;requestAnimationFrame(loop);return true};
  R.resize=function(){if(!canvas)return;const rect=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(rect.width||innerWidth)),h=Math.max(1,Math.round(rect.height||innerHeight));let d=Math.min(2.25,devicePixelRatio||1);const mobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent),budget=mobile?2600000:4800000;if(w*h*d*d>budget)d=Math.max(1,Math.sqrt(budget/(w*h)));const cw=Math.max(1,Math.round(w*d)),ch=Math.max(1,Math.round(h*d));if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch}};
  R.setState=s=>state=s;
  R.stop=()=>running=false;
  window.addEventListener('resize',()=>R.resize());window.visualViewport?.addEventListener('resize',()=>R.resize());window.addEventListener('orientationchange',()=>setTimeout(()=>R.resize(),120));
})();
