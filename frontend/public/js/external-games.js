(function(){
  const L=window.Lajuj=window.Lajuj||{},E=L.ExternalGames={};
  let current=null,onClose=null,activated=false,lastIds=[];
  E.catalog=[
    {id:'varooom3d',icon:'🏎️',name:'Varooom 3D',genre:'Carreras 3D · GBA homebrew',url:'https://html-classic.itch.zone/html/4216427/index.html',page:'https://gvaliente.itch.io/varooom-3d',controls:'Flechas: conducir · Enter: Start · usa los botones A/B del emulador si aparecen.',note:'Homebrew GBA publicado por su autor para navegador.',mobileReady:false},
    {id:'butano',icon:'🚀',name:'Butano Fighter',genre:'Arcade · GBA homebrew',url:'https://html-classic.itch.zone/html/4107586/index.html',page:'https://gvaliente.itch.io/butano-fighter',controls:'Flechas: mover · Enter: Start · usa A/B del emulador para la acción.',note:'Homebrew GBA publicado por su autor.',mobileReady:false},
    {id:'goodboy',icon:'🐶',name:'Goodboy Galaxy DEMO',genre:'Exploración · GBA demo',url:'https://html-classic.itch.zone/html/4358013-563716/index.html',page:'https://goodboygalaxy.itch.io/goodboy-galaxy-demo',controls:'Flechas: mover · Enter: Start · prueba Z/X o los botones del emulador para A/B.',note:'Demo oficial de Game Boy Advance con versión web.',mobileReady:false},
    {id:'advance2048',icon:'🔢',name:'2048 Advance',genre:'Puzzle · GBA homebrew',url:'https://html-classic.itch.zone/html/18422874/index.html?v=1784605913',page:'https://basil-termini.itch.io/2048-advance',controls:'Flechas: mover fichas · Enter: Start · Shift: Select.',note:'Homebrew GBA jugable en navegador.',mobileReady:false},
    {id:'heartwrench',icon:'🔧',name:'Heartwrench Advance',genre:'Plataformas · GBA homebrew',url:'https://html-classic.itch.zone/html/15136569/gba_template/index.html',page:'https://michaelchase.itch.io/heartwrench-advance',controls:'Flechas: mover · X: A · Z: B · S: R · Enter: Start.',note:'Plataformas GBA con versión web.',mobileReady:false},
    {id:'knightowls',icon:'🦉',name:'Knight Owls',genre:'Estrategia · GBA homebrew',url:'https://html-classic.itch.zone/html/4231887/KnightOwlsTemplatev4/index.html?v=1782558356',page:'https://blaise-rascal.itch.io/knight-owls',controls:'Flechas: mover/menús · X/Z: A/B · Enter: Start.',note:'Estrategia GBA jugable en navegador.',mobileReady:false},

    {id:'footballkick3d',icon:'⚽',name:'Football Kick 3D',genre:'Fútbol 3D',url:'https://html5.gamemonetize.co/faldmlyi3o26ppqc18vmuvsd9dqierk2/',page:'https://gamemonetize.com/',controls:'PC: mouse. Celular: toca la pantalla. Sigue las indicaciones del propio juego.',note:'Juego HTML5 incrustado desde GameMonetize.',mobileReady:true},
    {id:'golf3d',icon:'⛳',name:'3D Golf Adventure',genre:'Golf 3D · habilidad',url:'https://html5.gamemonetize.co/lktavtmelnunk2sl1erg9q4hsn85islm/',page:'https://gamemonetize.com/3d-golf-adventure-game',controls:'Mouse o toque: apunta, ajusta la fuerza y lanza.',note:'Juego HTML5 3D para navegador.',mobileReady:true},
    {id:'minigolf3d',icon:'🏌️',name:'Mini Golf 3D',genre:'Mini golf 3D',url:'https://html5.gamemonetize.co/e3iz4assj31kbmfzgq647codbozk956c/',page:'https://gamemonetize.com/',controls:'Mouse o toque: apunta y controla la fuerza.',note:'Juego HTML5 incrustado desde GameMonetize.',mobileReady:true},
    {id:'citycoach',icon:'🚌',name:'City Coach Driving 3D',genre:'Conducción 3D',url:'https://html5.gamemonetize.co/mjhc5jxshmoh78fem4yu3repbmoobhsy/',page:'https://gamemonetize.com/',controls:'PC: WASD o flechas. Celular: botones que aparecen dentro del juego.',note:'Simulador de conducción 3D.',mobileReady:true},
    {id:'helicopterrescue',icon:'🚁',name:'Helicopter Rescue 3D',genre:'Vuelo y rescate 3D',url:'https://html5.gamemonetize.co/x9t21c9tq5voetkce7vs6z7dvzgrymzb/',page:'https://gamemonetize.com/',controls:'Usa los controles indicados por el juego; en móvil aparecen controles táctiles.',note:'Juego HTML5 3D de vuelo y rescate.',mobileReady:true},
    {id:'orbitrush',icon:'🪐',name:'Orbit Rush 3D',genre:'Reflejos · 3D',url:'https://html5.gamemonetize.co/1ti4ndc0ahrycs3dmvve6r5858cktiyi/',page:'https://gamemonetize.com/',controls:'Mouse o toque: controla el movimiento siguiendo las instrucciones del juego.',note:'Reto HTML5 3D de reflejos.',mobileReady:true},
    {id:'minipool3d',icon:'🎱',name:'Mini Pool 3D',genre:'Billar 3D',url:'https://html5.gamemonetize.co/ehi2vjrem0ya35imcjiofupvjerb5mhr/',page:'https://gamemonetize.com/',controls:'Mouse o toque: apunta, ajusta potencia y golpea.',note:'Billar HTML5 3D.',mobileReady:true},
    {id:'endlesspath',icon:'🛤️',name:'Endless Path: Twist & Turn',genre:'Habilidad · camino infinito',url:'https://html5.gamemonetize.co/l2z8hylz6j68hna8feme59e1kwu1qpty/',page:'https://gamemonetize.com/',controls:'Mouse o toque: cambia de dirección y mantente en el camino.',note:'Reto de habilidad HTML5.',mobileReady:true},
    {id:'basketball',icon:'🏀',name:'Basketball',genre:'Baloncesto',url:'https://html5.gamemonetize.co/7v6fe7ejbu9sb7ujjwglt0rg81ze6hdl/',page:'https://gamemonetize.com/',controls:'Mouse o toque: apunta y lanza.',note:'Juego de baloncesto HTML5.',mobileReady:true},
    {id:'restaurant',icon:'🍽️',name:'My Restaurant',genre:'Restaurante · administración',url:'https://html5.gamemonetize.co/po2wvhxijbtwbk6cnk4qm83zk7kppkh6/',page:'https://gamemonetize.com/',controls:'Mouse o toque: atiende, prepara y administra siguiendo las instrucciones.',note:'Juego HTML5 de restaurante.',mobileReady:true},
    {id:'dartduell',icon:'🎯',name:'Dart Duell',genre:'Dardos · habilidad',url:'https://html5.gamemonetize.co/61chjn7t8hxotsfbkngwexcggusvsiy3/',page:'https://gamemonetize.com/',controls:'Mouse o toque: apunta y lanza el dardo.',note:'Juego HTML5 de precisión.',mobileReady:true},
    {id:'baking',icon:'🧁',name:'Baking Cooking Fun',genre:'Cocina',url:'https://html5.gamemonetize.co/mzeyucryjbvkhdc4r4k9sqjr0c5wfmzn/',page:'https://gamemonetize.com/',controls:'Mouse o toque: sigue los pasos de cocina dentro del juego.',note:'Juego HTML5 de cocina.',mobileReady:true},
    {id:'bricktrain',icon:'🚂',name:'Labo Brick Train',genre:'Construcción · trenes',url:'https://html5.gamemonetize.co/sbtnxdebdebmvtoxmgvfey9vnkmjbhss/',page:'https://gamemonetize.com/',controls:'Mouse o toque: construye e interactúa con las piezas.',note:'Juego HTML5 de construcción.',mobileReady:true},
    {id:'tinyowl',icon:'🦉',name:'Tiny Owl',genre:'Arcade · reflejos',url:'https://html5.gamemonetize.co/qespg2np194ugda9jqf2sqbpej8sp1xu/',page:'https://gamemonetize.com/',controls:'Mouse o toque: controla el búho siguiendo las indicaciones.',note:'Arcade HTML5 breve.',mobileReady:true},
    {id:'pizza',icon:'🍕',name:'Pizza Cooking Game',genre:'Cocina · simulación',url:'https://html5.gamemonetize.co/qhbkjj8lnaf1pf4ws11dujkzqhcrm6kc/',page:'https://gamemonetize.com/pizza-cooking-game-game',controls:'Mouse o toque: prepara la pizza siguiendo cada paso.',note:'Juego HTML5 de cocina.',mobileReady:false}
  ];

  function eligible(){
    const touch=!!L.Controls?.isTouchMode?.();
    const arr=touch?E.catalog.filter(g=>g.mobileReady):E.catalog.slice();
    return arr.length?arr:E.catalog.slice();
  }
  E.random=function(){
    const pool=eligible(),fresh=pool.filter(g=>!lastIds.includes(g.id)),src=fresh.length?fresh:pool;
    const g=src[Math.floor(Math.random()*src.length)];
    lastIds.push(g.id);if(lastIds.length>5)lastIds.shift();return g;
  };
  E.at=function(index){
    const pool=eligible();
    if(!pool.length)return E.random();
    const start=((index||0)%pool.length+pool.length)%pool.length;
    for(let step=0;step<pool.length;step++){
      const g=pool[(start+step)%pool.length];
      if(!lastIds.includes(g.id)||step===pool.length-1){lastIds.push(g.id);if(lastIds.length>5)lastIds.shift();return g}
    }
    return pool[start];
  };
  E.count=()=>eligible().length;
  function focusGame(){const f=document.getElementById('webGameFrame'),cover=document.getElementById('webGameStartCover');activated=true;if(cover)cover.classList.add('hidden');try{f.focus()}catch(e){}}
  E.open=function(game,cb){
    current=game||E.random();onClose=cb||null;activated=false;const f=document.getElementById('webGameFrame'),cover=document.getElementById('webGameStartCover');
    document.getElementById('webGameTitle').textContent=`${current.icon} ${current.name}`;
    document.getElementById('webGameMeta').textContent=`${current.genre}. ${current.note}`;
    document.getElementById('webGameControls').textContent=`🎮 CÓMO JUGAR: ${current.controls} · Pulsa ACTIVAR JUEGO antes de usar el teclado.`;
    if(cover)cover.classList.remove('hidden');f.src=current.url;document.getElementById('webGameModal').classList.add('show');if(L.Game?.state)L.Game.state.inMini=true;L.Audio?.duckExternal?.();
    f.onload=()=>{if(activated)focusGame()};
  };
  E.close=function(){const f=document.getElementById('webGameFrame');if(f)f.src='about:blank';document.getElementById('webGameModal')?.classList.remove('show');if(L.Game?.state)L.Game.state.inMini=false;L.Audio?.restoreExternal?.();const cb=onClose;onClose=null;if(cb)cb(current);current=null;activated=false};
  window.addEventListener('keydown',e=>{if(!document.getElementById('webGameModal')?.classList.contains('show'))return;const a=L.Controls?.actionForEvent?.(e);if(a==='exit'&&!activated){e.preventDefault();E.close();return}if(!activated&&a==='action'){e.preventDefault();focusGame()}},true);
  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('webGameClose')?.addEventListener('click',E.close);
    document.getElementById('webGameActivate')?.addEventListener('click',focusGame);
    document.getElementById('webGameSource')?.addEventListener('click',()=>current&&window.open(current.page,'_blank','noopener,noreferrer'));
  });
})();
