(function(){
  const L=window.Lajuj=window.Lajuj||{},E=L.WebGLEngine; const A=L.Avatar3D={};
  const specs={
    p01:{main:'#79c9ff',secondary:'#eef8ff',accent:'#f3c05a',type:'baby'},
    p02:{main:'#ff78b9',secondary:'#fff0f6',accent:'#ffb8d9',type:'pinkBow'},
    p03:{main:'#55d84c',secondary:'#f2f3e9',accent:'#ffd54d',type:'greenCap'},
    p04:{main:'#9d62ef',secondary:'#f4ebff',accent:'#d678ff',type:'purplePony'},
    p05:{main:'#ff842a',secondary:'#f6f0e9',accent:'#ffbf4d',type:'orangeHair'},
    p06:{main:'#ed625d',secondary:'#fff1dc',accent:'#ffdb77',type:'flowerHat'},
    p07:{main:'#1499a7',secondary:'#efe7d6',accent:'#65d5df',type:'tealCap'},
    p08:{main:'#9a78e8',secondary:'#f3ecff',accent:'#d9b5ff',type:'granny'},
    p09:{main:'#8c7b68',secondary:'#e9dfcf',accent:'#c9a675',type:'explorer'},
    p10:{main:'#f2c62d',secondary:'#fff4da',accent:'#69b9ff',type:'starGuide'}
  };
  const shadowSpecs={
    s01:{glow:'#ff3c27',type:'flames'},s02:{glow:'#26a8ff',type:'blueFlames'},s03:{glow:'#79ef20',type:'toxic'},s04:{glow:'#ff3b28',type:'claws'},s05:{glow:'#f02f45',type:'wings'},s06:{glow:'#dc43ff',type:'crown'},s07:{glow:'#69bcff',type:'lantern'},s08:{glow:'#ff4a24',type:'inferno'},s09:{glow:'#9e45ff',type:'spikes'},s10:{glow:'#ff3c2e',type:'scythe'}
  };
  function C(h,a=1){return E.color(h,a)}
  function rotPoint(x,z,lx,lz,a){const c=Math.cos(a),s=Math.sin(a);return[x+lx*c+lz*s,z-lx*s+lz*c]}
  function forward(a){return[Math.sin(a),Math.cos(a)]}
  function side(a){return[Math.cos(a),-Math.sin(a)]}
  function at(x,z,lx,lz,a){const p=rotPoint(x,z,lx,lz,a);return{x:p[0],z:p[1]}}
  function addHelmet(b,s,x,z,a,y,bob){
    b.sphere(x,y,z,.46,7,15,C(s.secondary),1.05,.94,1.0);
    const f=at(x,z,0,.33,a);b.ellipsoidRotY(f.x,y+.01,f.z,.35,7,15,C('#0d2449'),1.12,.82,.34,a);
    const hi=at(x,z,-.11,.455,a);b.ellipsoidRotY(hi.x,y+.13,hi.z,.085,5,10,C('#dff8ff',.95),1.5,.55,.28,a);
    const curl=at(x,z,.02,.46,a);b.sphere(curl.x,y+.34,curl.z,.085,5,10,C(s.accent));
    const left=at(x,z,-.45,0,a),right=at(x,z,.45,0,a);b.cylY(left.x,y,left.z,.11,.32,12,C(s.main));b.cylY(right.x,y,right.z,.11,.32,12,C(s.main));
  }
  function addSuit(b,s,x,z,a,phase,scale){
    const bob=Math.abs(Math.sin(phase))*.045,walk=Math.sin(phase)*.13;
    // backpack behind
    const bp=at(x,z,0,-.26,a);b.boxRotY(bp.x,.94+bob,bp.z,.64,.78,.26,a,C(s.main));b.boxRotY(bp.x,1.02+bob,bp.z,.45,.48,.3,a,C('#e9eef1'));
    // torso and belt
    b.capsuleY(x,.87+bob,z,.34,.88,C(s.secondary));b.capsuleY(x,.86+bob,z,.28,.76,C(s.main));b.cylY(x,.62+bob,z,.33,.16,14,C('#e9e4d7'));b.boxRotY(x,.61+bob,z,.52,.14,.22,a,C(s.accent));
    // legs step
    for(const sideX of[-.17,.17]){const lp=at(x,z,sideX,sideX<0?walk:-walk,a);b.capsuleY(lp.x,.31+bob,lp.z,.12,.46,C(s.main));b.ellipsoidRotY(lp.x,.1+bob,lp.z,.16,5,10,C(s.secondary),1.25,.55,1.45,a);b.cylY(lp.x,.31+bob,lp.z,.145,.09,12,C(s.accent))}
    // arms swing opposite legs
    for(const sideX of[-.46,.46]){const ap=at(x,z,sideX,sideX<0?-walk:walk,a);b.capsuleY(ap.x,.84+bob,ap.z,.105,.58,C(s.main));b.sphere(ap.x,.57+bob,ap.z,.12,5,10,C(s.secondary))}
    addHelmet(b,s,x,z,a,1.58+bob,bob);return bob;
  }
  function accessories(b,s,x,z,a,y){
    const f=forward(a),sd=side(a);
    if(s.type==='baby'){const top=at(x,z,0,-.03,a);b.coneY(top.x,2.08+y,top.z,.3,.4,14,C('#dcecff'));b.sphere(top.x,2.3+y,top.z,.08,5,10,C('#f6e7d4'));const p=at(x,z,0,.54,a);b.cylY(p.x,1.47+y,p.z,.1,.08,12,C('#c8eaff'))}
    if(s.type==='pinkBow'){const l=at(x,z,-.27,.02,a),r=at(x,z,.27,.02,a);b.ellipsoidRotY(l.x,2.02+y,l.z,.18,5,10,C('#ff7abb'),1.25,.78,.7,a);b.ellipsoidRotY(r.x,2.02+y,r.z,.18,5,10,C('#ff7abb'),1.25,.78,.7,a);const p=at(x,z,0,.55,a);b.cylY(p.x,1.47+y,p.z,.1,.08,12,C('#ffbfda'))}
    if(s.type==='greenCap'){b.cylY(x,2.02+y,z,.38,.16,14,C('#49c63f'));const brim=at(x,z,0,.32,a);b.boxRotY(brim.x,1.99+y,brim.z,.5,.07,.2,a,C('#39ad35'));b.sphere(x,2.13+y,z,.12,5,10,C('#ffdf5b'))}
    if(s.type==='purplePony'){const back=at(x,z,-.08,-.42,a);b.sphere(back.x,1.95+y,back.z,.26,6,12,C('#8e4cdb'),.9,1.45,.9);const tail=at(x,z,-.15,-.58,a);b.coneY(tail.x,1.92+y,tail.z,.24,.72,12,C('#a85cf0'));}
    if(s.type==='orangeHair'){const top=at(x,z,0,-.12,a);for(const lx of[-.25,-.08,.1,.26]){const p=at(x,z,lx,-.1,a);b.coneY(p.x,2.08+y,p.z,.13,.45,9,C('#7b4327'))}}
    if(s.type==='flowerHat'){b.cylY(x,2.02+y,z,.38,.16,14,C('#e75954'));const p=at(x,z,-.23,.15,a);b.sphere(p.x,2.17+y,p.z,.12,6,10,C('#fff0c7'));for(let i=0;i<5;i++){const q=at(p.x,p.z,Math.cos(i*1.256)*.12,Math.sin(i*1.256)*.12,a);b.sphere(q.x,2.17+y,q.z,.07,5,9,C('#fff7dc'))}}
    if(s.type==='tealCap'){b.cylY(x,2.04+y,z,.34,.15,14,C('#e8dfc8'));b.cylY(x,2.14+y,z,.3,.18,14,C('#1597a5'));b.cylY(x,2.24+y,z,.25,.14,14,C('#e8dfc8'))}
    if(s.type==='granny'){const bun=at(x,z,0,-.2,a);b.sphere(bun.x,2.08+y,bun.z,.26,6,12,C('#d7d0ef'));b.sphere(x,1.96+y,z,.33,6,12,C('#c8bdec'),1.1,.45,1);const gl=at(x,z,-.16,.43,a),gr=at(x,z,.16,.43,a);b.cylY(gl.x,1.6+y,gl.z,.12,.04,12,C('#e7d7ff'));b.cylY(gr.x,1.6+y,gr.z,.12,.04,12,C('#e7d7ff'))}
    if(s.type==='explorer'){b.cylY(x,2.03+y,z,.42,.12,14,C('#7a6858'));b.cylY(x,2.14+y,z,.3,.22,14,C('#8d7965'));const m1=at(x,z,-.1,.48,a),m2=at(x,z,.1,.48,a);b.ellipsoidRotY(m1.x,1.42+y,m1.z,.12,5,8,C('#efeee8'),1.5,.35,.4,a);b.ellipsoidRotY(m2.x,1.42+y,m2.z,.12,5,8,C('#efeee8'),1.5,.35,.4,a);const cane=at(x,z,.48,.1,a);b.cylY(cane.x,.62+y,cane.z,.04,1.1,9,C('#76563b'))}
    if(s.type==='starGuide'){const ant=at(x,z,-.06,-.03,a);b.cylY(ant.x,2.21+y,ant.z,.04,.38,9,C('#f3d65b'));b.sphere(ant.x,2.45+y,ant.z,.13,5,10,C('#ffe45b'));const lantern=at(x,z,-.46,.12,a);b.cylY(lantern.x,.83+y,lantern.z,.15,.38,10,C('#f2c62d'));b.sphere(lantern.x,.85+y,lantern.z,.09,5,10,C('#fff1a2'))}
  }
  A.add=function(b,id,x,z,phase=0,scale=1,facing=0){const s=specs[id]||specs.p01;const y=addSuit(b,s,x,z,facing,phase,scale);accessories(b,s,x,z,facing,y)};
  A.addShadow=function(b,sid,x,z,phase=0,facing=0){const s=shadowSpecs[sid]||shadowSpecs.s01,bob=Math.abs(Math.sin(phase*.7))*.06;
    b.ellipsoidRotY(x,.04,z,.52,4,12,C('#000000',.45),1,.12,.7,facing);b.capsuleY(x,.82+bob,z,.36,1.0,C('#111019'));b.sphere(x,1.5+bob,z,.42,7,14,C('#17121d'));
    const vis=at(x,z,0,.33,facing);b.ellipsoidRotY(vis.x,1.54+bob,vis.z,.34,6,14,C('#160d1e'),1.1,.78,.28,facing);const e1=at(x,z,-.14,.42,facing),e2=at(x,z,.14,.42,facing);b.sphere(e1.x,1.58+bob,e1.z,.05,4,8,C(s.glow));b.sphere(e2.x,1.58+bob,e2.z,.05,4,8,C(s.glow));
    // smoky tendrils around feet
    for(let i=0;i<6;i++){const a=i*Math.PI*2/6+phase*.05,p=at(x,z,Math.cos(a)*.34,Math.sin(a)*.24,facing);b.coneY(p.x,.16+bob,p.z,.09,.48,8,C(i%2?s.glow:'#24142c'))}
    if(['flames','blueFlames','toxic','inferno'].includes(s.type))for(const lx of[-.28,-.1,.12,.29]){const p=at(x,z,lx,-.12,facing);b.coneY(p.x,2.05+bob,p.z,.12,.55,9,C(s.glow))}
    if(s.type==='claws'){for(const lx of[-.55,.55]){const p=at(x,z,lx,.1,facing);b.capsuleY(p.x,.78+bob,p.z,.1,.75,C('#21151f'));const q=at(x,z,lx,.36,facing);b.coneY(q.x,.42+bob,q.z,.09,.45,8,C(s.glow))}}
    if(s.type==='wings'){for(const lx of[-.5,.5]){const p=at(x,z,lx,-.15,facing);b.coneY(p.x,1.28+bob,p.z,.32,1.15,8,C('#281029'));const t=at(x,z,lx*1.55,-.25,facing);b.coneY(t.x,1.5+bob,t.z,.16,.8,8,C(s.glow))}}
    if(s.type==='crown'){b.cylY(x,1.98+bob,z,.43,.1,12,C('#53205f'));for(let k=0;k<5;k++){const a=k*1.256,p=at(x,z,Math.cos(a)*.31,Math.sin(a)*.31,facing);b.coneY(p.x,2.15+bob,p.z,.07,.28,7,C(s.glow))}}
    if(s.type==='lantern'){const p=at(x,z,.48,.08,facing);b.cylY(p.x,.74+bob,p.z,.13,.42,10,C('#1e2430'));b.sphere(p.x,.77+bob,p.z,.09,5,10,C(s.glow))}
    if(s.type==='spikes')for(let k=0;k<7;k++){const a=k*1.256,p=at(x,z,Math.cos(a)*.38,Math.sin(a)*.3,facing);b.coneY(p.x,.95+bob,p.z,.08,.45,7,C(s.glow))}
    if(s.type==='scythe'){const p=at(x,z,.55,.05,facing);b.cylY(p.x,.9+bob,p.z,.045,1.5,9,C('#888a93'));const blade=at(x,z,.62,.32,facing);b.coneY(blade.x,1.65+bob,blade.z,.24,.72,8,C(s.glow))}
  };
})();