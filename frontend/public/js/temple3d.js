
(function(){
  const L=window.Lajuj=window.Lajuj||{},E=L.WebGLEngine;
  const T=L.Temple3D={};
  const c=(h,a=1)=>E.color(h,a);
  T.add=function(b,X,Z,pulse=1){
    const white='#f4efe3',stone='#ddd5c7',shadow='#c9c0b2',window='#96d5e8',gold='#d6ad2e',green='#3e7652',flower='#d5758f';
    // ceremonial stair / approach
    for(let i=0;i<5;i++)b.box(X,.05+i*.08,Z+2.35-i*.22,5.4-i*.35,.12,1.1,c(i%2?stone:white));
    // main nave and side wings
    b.box(X,1.0,Z,5.7,2.0,3.0,c(white));b.box(X-3.15,.78,Z+.25,1.45,1.55,2.35,c(stone));b.box(X+3.15,.78,Z+.25,1.45,1.55,2.35,c(stone));
    b.box(X-2.35,1.35,Z-.45,1.2,2.7,2.15,c(white));b.box(X+2.35,1.35,Z-.45,1.2,2.7,2.15,c(white));
    // gabled-like upper masses
    b.coneY(X-2.35,2.95,Z-.45,.9,1.1,4,c(stone));b.coneY(X+2.35,2.95,Z-.45,.9,1.1,4,c(stone));
    // central tower with buttresses
    b.box(X,2.25,Z-.35,1.85,4.5,1.85,c(white));for(const dx of[-.82,.82])for(const dz of[-.72,.72])b.cylY(X+dx,2.0,Z-.35+dz,.12,3.65,10,c(shadow));
    b.box(X,4.4,Z-.35,2.18,.46,2.18,c(stone));b.coneY(X,5.15,Z-.35,1.05,1.1,4,c(white));
    b.cylY(X,5.98,Z-.35,.15,1.55,12,c(white));b.coneY(X,6.95,Z-.35,.22,.55,10,c(gold));
    // gold figure/symbol on the spire — abstract, not an image
    b.cylY(X,7.38,Z-.35,.055,.48,8,c(gold));b.sphere(X,7.68,Z-.35,.09,4,8,c(gold));b.box(X-.16,7.46,Z-.35,.34,.055,.055,c(gold));b.box(X+.16,7.46,Z-.35,.34,.055,.055,c(gold));
    // entrance with columns and arch impression
    b.box(X,.92,Z+1.54,1.22,1.82,.12,c('#635f5a'));b.sphere(X,1.82,Z+1.61,.61,5,12,c(white),1,.52,.22);b.box(X,.82,Z+1.65,.82,1.52,.08,c('#4c5d62'));
    for(const dx of[-1.15,1.15]){b.cylY(X+dx,1.15,Z+1.45,.13,2.05,12,c(stone));b.box(X+dx,2.18,Z+1.45,.34,.16,.34,c(white));}
    // tall blue windows along facade
    for(const dx of[-2.15,-1.45,1.45,2.15]){b.box(X+dx,1.25,Z+1.53,.34,1.25,.05,c(window));b.sphere(X+dx,1.86,Z+1.57,.17,4,8,c(window),1,.55,.18)}
    for(const side of[-1,1]){b.box(X+side*3.18,.92,Z+1.43,.28,.88,.05,c(window));b.sphere(X+side*3.18,1.34,Z+1.47,.14,4,8,c(window),1,.55,.18)}
    // planters and landscaping like a real temple approach
    for(const dx of[-4.1,4.1]){b.cylY(X+dx,.18,Z+1.55,.42,.32,12,c('#8d816f'));b.sphere(X+dx,.54,Z+1.55,.42,5,10,c(green),1,.75,1);for(let k=0;k<5;k++){const a=k*1.256;b.sphere(X+dx+Math.cos(a)*.32,.66,Z+1.55+Math.sin(a)*.27,.08,4,8,c(flower))}}
  };
})();
