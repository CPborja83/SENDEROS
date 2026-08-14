(function(){
  const L=window.Lajuj=window.Lajuj||{},U=L.Utils,C=L.CONFIG,W=L.World,Content=L.Content,Audio=L.Audio,MP=L.Multiplayer;
  const G=L.Game={state:null};
  function newState(form){return{name:form.name,age:form.age,band:form.band,room:form.room,selected:form.selected,id:U.uuid(),joinedAt:0,startedAt:Date.now(),world:null,discovered:[],player:{x:5,y:5},visualX:null,visualZ:null,temple:{x:5,y:5},jail:{x:5,y:5},questions:[],minis:[],distractions:[],mediaStations:[],eventRooms:[],webGames:[],signalSites:[],hazards:[],shadow:null,shadowFacing:0,facing:0,attention:100,points:0,insight:0,insightRequired:3,visitedRooms:{},players:{},started:false,inQuestion:false,inMini:false,imprisoned:false,jailUntil:0,reachedTemple:false,templeReveal:false,templeFoundAt:0,voiceDeck:[],moveCount:0,nextGuideAt:5,activeGuide:null,guideRoute:null,guideSuccesses:0,signalUntil:0,gatherUntil:0,finalShown:false,timePenaltyCount:0,timeDangerUntil:0,cooldowns:{pray:0,scripture:0,together:0,trust:0},lastZone:'CALLE CENTRAL'} }
  function setupState(s){
    s.world=W.generate(s.room);const R=U.rng(U.hash('SP19FULL:'+s.room+':'+s.id));
    const safe=W.safeSpawn(s.world,R),reachable=safe.component.cells,reachSet=safe.component.set;s.player=safe.point;
    const reachableRooms=s.world.rooms.filter(r=>W.roomOpenCells(s.world,r).some(p=>reachSet.has(p.x+','+p.y)));
    const byDistance=reachableRooms.map(r=>{const p=W.nearestOpenInRoom(s.world,r,reachSet);return{r,p,d:p?(W.path(s.world,s.player,p).length-1):-1}}).filter(x=>x.p&&x.d>0).sort((a,b)=>b.d-a.d);
    const stadiumPick=byDistance[Math.min(byDistance.length-1,Math.floor(byDistance.length*.35))]||byDistance[0],labPick=byDistance.find(x=>x.r!==stadiumPick?.r)||byDistance[1];
    if(stadiumPick){stadiumPick.r.special='stadium';stadiumPick.r.label='Estadio Lajuj'}
    if(labPick){labPick.r.special='lab';labPick.r.label='Laboratorio de Inventos'}
    s.eventRooms=[];
    const templeRoads=reachable.filter(p=>!W.roomAt(s.world,p.x,p.y)&&(s.world.kind[p.y][p.x]===1||s.world.kind[p.y][p.x]===3)&&W.degree(s.world,p.x,p.y)>=2);templeRoads.sort((a,b)=>(W.path(s.world,s.player,b).length)-(W.path(s.world,s.player,a).length));s.temple=templeRoads[0]||byDistance[0]?.p||s.player;
    const roomCells=reachable.filter(p=>s.world.kind[p.y][p.x]===2),roadCells=reachable.filter(p=>!W.roomAt(s.world,p.x,p.y)&&(s.world.kind[p.y][p.x]===1||s.world.kind[p.y][p.x]===3)),allCells=reachable.slice();
    s.jail=W.randomFromCells(roomCells.length?roomCells:allCells,R,[s.player,s.temple])||s.player;
    s.discovered=Array.from({length:C.MAP_H},()=>Array(C.MAP_W).fill(false));
    const used=new Set([s.player,s.temple,s.jail].map(p=>p.x+','+p.y));
    function pick(pool,filter){const p=W.randomFromCells(pool,R,[],(x,y)=>!used.has(x+','+y)&&(!filter||filter(x,y)));if(p)used.add(p.x+','+p.y);return p}

    // V17: las decisiones se viven caminando. Ya no se colocan cuestionarios ni minijuegos internos.
    s.questions=[];s.minis=[];s.distractions=[];
    s.signalSites=[];
    for(let i=0;i<4;i++){
      const pool=i%2===0&&roadCells.length?roadCells:(roomCells.length?roomCells:allCells);
      let p=pick(pool,(x,y)=>Math.abs(x-s.player.x)+Math.abs(y-s.player.y)>7&&Math.abs(x-s.temple.x)+Math.abs(y-s.temple.y)>4);
      if(!p)p=pick(allCells);
      if(p)s.signalSites.push({...p,active:true,index:i});
    }
    s.mediaStations=[];for(let i=0;i<4;i++){const p=pick(i%3===0&&roadCells.length?roadCells:roomCells.length?roomCells:allCells);if(p)s.mediaStations.push({...p,active:true,item:Content.mediaPortals[i%Content.mediaPortals.length]})}
    s.webGames=[];for(let i=0;i<18;i++){const pool=i%3!==0&&roadCells.length?roadCells:(roomCells.length?roomCells:allCells);const p=pick(pool);if(p)s.webGames.push({...p,active:true,gameIndex:i})}
    L.StreetEvents?.setup?.(s,R,reachable,used)
    s.voiceDeck=U.shuffle(Content.voices,U.rng(U.hash('V19FULL:'+s.room+':'+s.id)));reveal(s)
  }
  function reveal(s){const r=s.attention>=70?4:s.attention>=40?3:2;for(let y=Math.max(0,s.player.y-r);y<=Math.min(C.MAP_H-1,s.player.y+r);y++)for(let x=Math.max(0,s.player.x-r);x<=Math.min(C.MAP_W-1,s.player.x+r);x++)if(Math.hypot(x-s.player.x,y-s.player.y)<=r+.3)s.discovered[y][x]=true}
  function pathTemple(s){return W.path(s.world,s.player,s.temple)}

function compass(dx,dy){if(dx>0)return'ESTE';if(dx<0)return'OESTE';if(dy>0)return'SUR';return'NORTE'}
function angleFor(dx,dy){if(dx>0)return Math.PI/2;if(dx<0)return-Math.PI/2;if(dy<0)return Math.PI;return 0}
function roomKey(r){return r?`${r.x0},${r.y0},${r.x1},${r.y1}`:''}
function roomCenter(r){return{x:Math.floor((r.x0+r.x1)/2),y:Math.floor((r.y0+r.y1)/2)}}
function turnName(dx1,dy1,dx2,dy2){const cross=dx1*dy2-dy1*dx2,dot=dx1*dx2+dy1*dy2;if(dot<0)return'da media vuelta';if(cross<0)return'gira a la izquierda';if(cross>0)return'gira a la derecha';return'continúa de frente'}
function gainInsight(s,amount=1){const before=s.insight||0;s.insight=Math.min(s.insightRequired||3,before+amount);if(s.insight>before&&s.insight===(s.insightRequired||3)){s.nextGuideAt=Math.min(s.nextGuideAt,s.moveCount+2);Audio.say('Has comprendido suficientes señales. Ahora la guía puede orientarte hacia el Templo.','warm')}L.UI.updateMeters(s)}
function guideGoal(s){
  if((s.insight||0)>=(s.insightRequired||3))return{target:s.temple,kind:'temple',label:'Templo oculto'};
  let best=null,bestPath=null;
  (s.signalSites||[]).filter(n=>n.active).forEach(n=>{const path=W.path(s.world,s.player,n);if(path.length>1&&(!bestPath||path.length<bestPath.length)){best=n;bestPath=path}});
  if(best)return{target:best,kind:'signal',label:'señal de claridad'};
  return{target:s.temple,kind:'temple',label:'Templo oculto'};
}
function instruction(s,target){const p=W.path(s.world,s.player,target);if(p.length<2)return{dx:0,dy:0,next:target,steps:0,route:[]};const dx=p[1].x-p[0].x,dy=p[1].y-p[0].y;let steps=1;for(let i=2;i<p.length;i++){if(p[i].x-p[i-1].x!==dx||p[i].y-p[i-1].y!==dy)break;steps++}let ndx=0,ndy=0;if(p[steps+1]){ndx=p[steps+1].x-p[steps].x;ndy=p[steps+1].y-p[steps].y}return{dx,dy,next:p[1],steps,ndx,ndy,turn:ndx||ndy?turnName(dx,dy,ndx,ndy):'',route:p.slice(1)}}
function clarity(att){if(att>=85)return{level:'clara',lights:3,ms:1900};if(att>=70)return{level:'breve',lights:1,ms:1300};if(att>=50)return{level:'tenue',lights:0,ms:0};return{level:'débil',lights:0,ms:0}}
function nextVoice(s){if(!s.voiceDeck.length)s.voiceDeck=U.shuffle(Content.voices,U.rng(U.hash('VD12:'+s.room+':'+s.moveCount+':'+s.id)));const d=pathTemple(s).length-1;let i=-1;if(d<14)i=s.voiceDeck.findIndex(v=>v.group==='promise'||v.id==='mercy');else if(s.attention<55)i=s.voiceDeck.findIndex(v=>v.group==='warning'||v.id==='mercy');if(i<0)i=0;return s.voiceDeck.splice(i,1)[0]}
function voiceLead(v){return{servants:'Una enseñanza llama tu atención.',angels:'Una luz mensajera aparece por un instante.',god:'Una impresión clara llega a tu mente.',thunder:'El trueno rompe la distracción.',lightning:'Un relámpago revela algo por un instante.',storm:'La tempestad te obliga a mirar de nuevo.',quake:'El suelo tiembla y te hace reconsiderar.',hail:'La granizada interrumpe tu desvío.',famine:'La escasez te recuerda lo esencial.',pest:'La fragilidad de la vida reclama atención.',trumpet:'Una trompeta te llama.',judgment:'Sientes la necesidad de examinar tu rumbo.',mercy:'La misericordia te recuerda que aún puedes corregir.',glory:'La claridad aumenta por un momento.',honor:'Recuerdas por qué vale la pena perseverar.',eternal:'Tu deseo por el destino eterno se hace más fuerte.'}[v.id]||'Percibes una señal.'}
function guideText(v,i,goal,profile,s){const lead=voiceLead(v),heading=compass(i.dx,i.dy),where=goal.kind==='signal'?'Hay una señal de claridad en esa dirección. No tendrás que responder nada: encuéntrala caminando y observando el mundo.':'Las tres señales que descubriste permiten reconocer el rumbo al Templo.';if(profile.level==='débil')return`${lead} Tu atención está demasiado baja para distinguir el rumbo. Aléjate un momento de las distracciones, recupera atención y vuelve a escuchar.`;if(profile.level==='tenue')return`${lead} Percibes que la señal viene aproximadamente del ${heading}, pero no aparece ningún camino luminoso. ${where}`;if(profile.level==='breve')return`${lead} Una señal breve apunta al ${heading}. Solo verás un destello y desaparecerá. ${where}`;return`${lead} Con atención alta distingues el ${heading}. Verás únicamente tres destellos por un instante, no una ruta completa. ${where}`}

  G.emitGuide=function(manual=false){const s=G.state;if(!s||s.inQuestion||s.inMini||s.imprisoned||s.reachedTemple)return;const goal=guideGoal(s),i=instruction(s,goal.target),profile=clarity(s.attention);if(!i.steps){if(goal.kind==='temple')G.reachTemple();else{L.UI.showGuide({icon:'✨',name:'Señal cercana'},'La señal está muy cerca. Mira alrededor y camina hasta encontrarla.');s.nextGuideAt=s.moveCount+7}return}const v=nextVoice(s),text=guideText(v,i,goal,profile,s);s.activeGuide=profile.level==='débil'?null:{next:i.next,expires:s.moveCount+3};s.guideRoute=profile.lights?{route:i.route.slice(0,profile.lights),heading:compass(i.dx,i.dy),until:Date.now()+profile.ms}:null;L.UI.showGuide(v,text);Audio.effect(v,i.dx,i.dy);Audio.say(text,v.group==='warning'?'warning':v.group==='promise'?'warm':'normal');const gap=s.attention>=85?7:s.attention>=70?10:s.attention>=50?14:19;s.nextGuideAt=s.moveCount+(manual?Math.max(5,Math.floor(gap*.7)):gap+Math.floor(Math.random()*4));L.UI.updateMeters(s)};
  function evaluateGuide(s){if(!s.activeGuide)return;if(s.player.x===s.activeGuide.next.x&&s.player.y===s.activeGuide.next.y){s.points+=5;s.guideSuccesses=(s.guideSuccesses||0)+1;s.activeGuide=null;L.UI.updateMeters(s)}else if(s.moveCount>s.activeGuide.expires)s.activeGuide=null}
  G.move=function(dx,dy){const s=G.state;if(!s||!s.started||s.inQuestion||s.inMini||s.imprisoned||s.reachedTemple||s.templeReveal)return;L.StreetEvents?.tick?.(s);const nx=s.player.x+dx,ny=s.player.y+dy;if(L.StreetEvents&&!L.StreetEvents.beforeMove(s,nx,ny))return;if(W.isWall(s.world,nx,ny))return;s.player={x:nx,y:ny};s.facing=angleFor(dx,dy);s.moveCount++;L.StreetEvents?.refreshBlocks?.(s);reveal(s);evaluateGuide(s);checkEncounter(s);L.StreetEvents?.afterMove?.(s);moveShadow(s);checkRescue(s);MP.sync(s);updateLocation(s);if(nx===s.temple.x&&ny===s.temple.y){G.reachTemple();return}if(s.moveCount>=s.nextGuideAt)G.emitGuide();L.UI.updateMeters(s)};
  function collectSignal(s,n){n.active=false;s.points+=8;s.attention=Math.min(100,s.attention+3);gainInsight(s,1);L.UI.updateMeters(s);G.reconcileAttention(s,true);MP.sync(s);const left=Math.max(0,(s.insightRequired||3)-(s.insight||0));Audio.say(left?`Encontraste una señal de claridad jugando con el espacio y siguiendo el rumbo. Faltan ${left}.`:'Ya reuniste tres señales. Ahora puedes reconocer el camino al Templo.','warm');if(navigator.vibrate)navigator.vibrate([90,60,160])}
  function checkEncounter(s){
    const sig=(s.signalSites||[]).find(n=>n.active&&n.x===s.player.x&&n.y===s.player.y);if(sig){collectSignal(s,sig);return}
    const web=s.webGames.find(n=>n.active&&n.x===s.player.x&&n.y===s.player.y);if(web){web.active=false;const game=L.ExternalGames.at?.(web.gameIndex)||L.ExternalGames.random();L.ExternalGames.open(game,()=>{const st=G.state;if(st){st.points+=2;L.UI.updateMeters(st);MP.sync(st)}});return}
    const media=s.mediaStations.find(n=>n.active&&n.x===s.player.x&&n.y===s.player.y);if(media){media.active=false;openMedia(media.item)}
  }
  function openMedia(item){const s=G.state;s.inMini=true;L.MediaCenter.open(item,()=>{s.points+=2;MP.sync(s)})}
  function shadowDistance(s){if(!s?.shadow)return null;const p=W.path(s.world,s.shadow,s.player);return p.length?Math.max(0,p.length-1):Math.abs(s.shadow.x-s.player.x)+Math.abs(s.shadow.y-s.player.y)}
  function updateShadowAudio(s){Audio.setShadowThreat?.(s?.shadow?shadowDistance(s):null)}
  function spawnShadow(s){if(s.shadow||s.imprisoned||s.reachedTemple||s.attention>60)return;const cells=W.bfs(s.world,s.player).cells,R=U.rng(U.hash('SH16:'+s.id+':'+s.moveCount));s.shadow=W.randomFromCells(cells,R,[s.player,s.temple],(x,y)=>Math.abs(x-s.player.x)+Math.abs(y-s.player.y)>10)||cells[cells.length-1]||{...s.player};s.shadowFacing=Math.atan2(s.player.x-s.shadow.x,s.player.y-s.shadow.y);updateShadowAudio(s);Audio.say(`¡Cuidado! ${U.shadowBy(s.selected.shadow).label} comenzó a seguirte. La música de alerta aumentará cuando se acerque.`,'warning')}
  G.reconcileAttention=function(s=G.state,announce=true){if(!s)return null;if(s.attention>60&&s.shadow){s.shadow=null;s.shadowFacing=0;updateShadowAudio(s);if(announce)Audio.say('Recuperaste más de sesenta por ciento de atención. La sombra se retira y vuelve tu música.','warm');return'cleared'}if(s.attention<=60&&!s.shadow&&!s.imprisoned&&!s.reachedTemple){spawnShadow(s);return'spawned'}if(s.shadow)updateShadowAudio(s);return null};
  function moveShadow(s){G.reconcileAttention(s,false);if(!s.shadow||s.imprisoned)return;for(let i=0;i<(s.attention<=40?2:1);i++){const prev={...s.shadow},next=W.path(s.world,s.shadow,s.player)[1]||s.shadow;s.shadow=next;s.shadowFacing=Math.atan2(next.x-prev.x,next.y-prev.y);updateShadowAudio(s);if(s.shadow.x===s.player.x&&s.shadow.y===s.player.y){capture(s);break}}}
  function capture(s){s.imprisoned=true;s.jailUntil=Date.now()+50000;s.player={...s.jail};s.shadow=null;updateShadowAudio(s);U.$('jailModal').classList.add('show');L.UI.updateMeters(s);MP.sync(s);Audio.say(`¡Auxilio! ${s.name} fue atrapado por su sombra. Busca su círculo rojo en el mini mapa.`,'warning');if(navigator.vibrate)navigator.vibrate([250,120,250,120,450]);jailTick(s)}
  function jailTick(s){if(!s.imprisoned)return;const left=Math.max(0,Math.ceil((s.jailUntil-Date.now())/1000));U.$('jailCount').textContent=left;if(left<=0){alert('No llegó el rescate a tiempo. Volverás al inicio.');location.reload();return}setTimeout(()=>jailTick(s),500)}
  function checkRescue(s){Object.entries(s.players||{}).forEach(([id,p])=>{if(id===s.id||!p?.imprisoned)return;if(Math.abs(s.player.x-p.x)+Math.abs(s.player.y-p.y)<=1){MP.rescue(s,id);s.points+=25;Audio.say(`¡Rescataste a ${p.name}!`,'warm')}})}
  G.onPlayersUpdated=function(){const s=G.state;if(!s)return;const me=s.players[s.id];if(s.imprisoned&&me&&me.imprisoned===false&&me.status==='rescued'){s.imprisoned=false;U.$('jailModal').classList.remove('show');s.attention=Math.max(50,s.attention);Audio.say('¡Tu familia te rescató! Continúa el sendero.','warm')}L.UI.updateMeters(s);renderTeam(s);if(s.reachedTemple)renderWaiting(s);checkCompletion(s)};
  function renderTeam(s){const now=Date.now(),p=Object.entries(s.players).filter(([id,v])=>id!==s.id&&v?.imprisoned),g=Object.entries(s.players).filter(([id,v])=>id!==s.id&&(v?.gatherUntil||0)>now),si=Object.entries(s.players).filter(([id,v])=>id!==s.id&&(v?.signalUntil||0)>now);if(p.length)L.UI.teamMessage(`🚨 AUXILIO: ${p.map(x=>x[1].name).join(', ')} necesita rescate.`,true);else if(g.length)L.UI.teamMessage(`👥 ${g[g.length-1][1].name} pide que la familia se reúna.`,false);else if(si.length)L.UI.teamMessage(`✨ ${si[si.length-1][1].name} envió una señal.`,false);else L.UI.teamMessage('',false)}
  G.reachTemple=function(){const s=G.state;if(s.reachedTemple||s.templeReveal)return;if((s.insight||0)<(s.insightRequired||3)){Audio.say(`Sientes que este lugar es importante, pero todavía no comprendes suficientes señales. Explora la ciudad y encuentra ${s.insightRequired-s.insight} señal(es) de claridad más.`,'warning');s.nextGuideAt=s.moveCount+5;return}if(s.attention<50){Audio.say('Has llegado cerca del destino, pero tu atención es demasiado baja para reconocer la entrada. Recupera al menos cincuenta por ciento de atención.','warning');return}s.templeReveal=true;s.templeFoundAt=Date.now();s.shadow=null;updateShadowAudio(s);Audio.celestial();Audio.say('Una gran luz celestial aparece. Has encontrado el Templo. Entra en la luz.','warm');setTimeout(()=>{s.reachedTemple=true;s.templeReveal=false;MP.sync(s);U.$('templeModal').classList.add('show');renderWaiting(s);checkCompletion(s)},2900)};
  function renderWaiting(s){const host=U.$('familyGrid');host.innerHTML='';Object.entries(s.players).sort((a,b)=>(a[1]?.joinedAt||0)-(b[1]?.joinedAt||0)).forEach(([id,p])=>{const d=document.createElement('div');d.className='fam';d.innerHTML=`<img src="${U.charBy(p.character).src}"><b>${p.name}</b><small>${p.reachedTemple?'✨ En el Templo':'🧭 En camino'}</small>`;host.appendChild(d)});U.$('templeText').textContent=`Han llegado ${Object.values(s.players).filter(p=>p?.reachedTemple).length} de ${Object.keys(s.players).length} jugadores conectados.`}
  function checkCompletion(s){const active=Object.values(s.players||{}).filter(Boolean);if(active.length&&active.every(p=>p.reachedTemple))MP.finishRoom(s)}
  G.showFinal=function(){const s=G.state;if(!s||s.finalShown)return;s.finalShown=true;U.$('templeModal').classList.remove('show');const host=U.$('finalFamily');host.innerHTML='';Object.entries(s.players).sort((a,b)=>(a[1]?.joinedAt||0)-(b[1]?.joinedAt||0)).forEach(([id,p])=>{const d=document.createElement('div');d.className='fam';d.innerHTML=`<img src="${U.charBy(p.character).src}"><b>${p.name}</b><small>🌟 Llegó</small>`;host.appendChild(d)});U.$('finalModal').classList.add('show');Audio.celestial();Audio.say('¡Toda la familia llegó! Han completado juntos Senderos Lajuj.','warm')};
  function updateLocation(s){const room=W.roomAt(s.world,s.player.x,s.player.y);const text=(room?room.label:'CALLE / PLAZA').toUpperCase();if(text!==s.lastZone){s.lastZone=text;U.$('location').textContent=text;if(room){const k=roomKey(room);if(!s.visitedRooms[k]){s.visitedRooms[k]=true;s.points+=2;Audio.say(room.special==='stadium'?'Escuchas al público y ves jugadores esperando. El estadio puede atraparte en la diversión si pierdes de vista tu prioridad.':room.special==='lab'?'Luces y piezas se mueven dentro del laboratorio. La curiosidad puede hacerte querer descubrir qué están construyendo.':`Entraste a ${room.label}. Explora: aquí puede haber juegos en línea, música, señales o una nueva ruta.`,'warm')}}}}
  G.signal=function(){const s=G.state;s.signalUntil=Date.now()+12000;MP.sync(s);Audio.say('Enviaste una señal luminosa para tu familia.','warm')};
  G.gather=function(){const s=G.state;s.gatherUntil=Date.now()+14000;MP.sync(s);Audio.say('Llamaste a tu familia para reunirse contigo.','warm')};
  G.quick=function(type){const s=G.state,now=Date.now();if((s.cooldowns[type]||0)>now)return;if(type==='pray'){s.attention=Math.min(100,s.attention+4);s.cooldowns[type]=now+35000;Audio.say('Hicieron una pausa para orar. Recuperas atención.','warm')}if(type==='scripture'){s.attention=Math.min(100,s.attention+3);s.cooldowns[type]=now+35000;G.emitGuide(true)}if(type==='together'){const near=Object.entries(s.players).some(([id,p])=>id!==s.id&&!p.reachedTemple&&Math.abs(p.x-s.player.x)+Math.abs(p.y-s.player.y)<=5);if(near){s.attention=Math.min(100,s.attention+6);s.points+=5;Audio.say('Estar juntos fortalece a la familia.','warm')}else Audio.say('Tu familia está lejos. Usa Reunir o el mini mapa.');s.cooldowns[type]=now+25000}if(type==='trust'){if(s.attention<70){s.attention=Math.min(100,s.attention+5);G.emitGuide(true)}s.cooldowns[type]=now+40000;Audio.say('Confía, escucha y continúa.','warm')}L.UI.updateMeters(s);G.reconcileAttention(s,true);MP.sync(s)};


  G.tickTime=function(now=Date.now()){
    const s=G.state;if(!s||!s.started)return null;
    const effectiveNow=s.templeFoundAt||now,elapsed=Math.max(0,effectiveNow-s.startedAt),sec=Math.floor(elapsed/1000),periods=Math.floor(elapsed/600000);
    if(periods>(s.timePenaltyCount||0)){
      const missed=periods-(s.timePenaltyCount||0),loss=20*missed;s.timePenaltyCount=periods;s.attention=Math.max(0,s.attention-loss);s.timeDangerUntil=now+(s.attention<=40?14000:10000);
      const danger=U.$('timeDanger'),msg=U.$('timeDangerText');if(msg)msg.textContent=`${missed*10} MINUTOS · −${loss}% ATENCIÓN`;if(danger){danger.classList.add('show');danger.classList.toggle('critical',s.attention<=40)}
      L.UI.updateMeters(s);G.reconcileAttention(s,true);MP.sync(s);
      Audio.say(`El tiempo avanza. Han pasado ${missed*10} minutos más y perdiste ${loss} por ciento de atención. La señal roja te llama a reaccionar: recuerda tu objetivo y continúa.`, 'warning');
      if(navigator.vibrate)navigator.vibrate([180,100,180,100,300]);
    }
    const danger=U.$('timeDanger');if(danger&&now>(s.timeDangerUntil||0))danger.classList.remove('show','critical');
    const next=Math.max(0,600-Math.floor((elapsed%600000)/1000));
    return{sec,nextSec:next,periods:s.timePenaltyCount||0};
  };

G.drawMinimap=function(){const s=G.state,cv=U.$('minimap');if(!s||!cv.clientWidth)return;const d=Math.min(2,devicePixelRatio||1),w=cv.clientWidth,h=cv.clientHeight;if(cv.width!==Math.round(w*d)||cv.height!==Math.round(h*d)){cv.width=Math.round(w*d);cv.height=Math.round(h*d)}const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,w,h);c.fillStyle='#07152a';c.fillRect(0,0,w,h);const m=8,scale=s.minimapScale||1,sw=(w-2*m)/C.MAP_W*scale,sh=(h-2*m)/C.MAP_H*scale,ox=m-(C.MAP_W*sw-(w-2*m))/2,oy=m-(C.MAP_H*sh-(h-2*m))/2;for(let y=0;y<C.MAP_H;y++)for(let x=0;x<C.MAP_W;x++)if(s.discovered[y][x]&&!s.world.maze[y][x]){c.fillStyle=s.world.kind[y][x]===2?'#416486':'#314b68';c.fillRect(ox+x*sw,oy+y*sh,Math.max(1,sw),Math.max(1,sh))}
  function shadowMark(x,y,color='#c95cff'){const px=ox+(x+.5)*sw,py=oy+(y+.5)*sh,r=4.2;c.save();c.translate(px,py);c.rotate(Math.PI/4);c.fillStyle='#190b27';c.strokeStyle=color;c.lineWidth=1.8;c.fillRect(-r,-r,r*2,r*2);c.strokeRect(-r,-r,r*2,r*2);c.restore()}
  Object.entries(s.players).forEach(([id,p])=>{if(id===s.id||!p||p.reachedTemple)return;c.fillStyle=p.imprisoned?'#ff4058':L.UI.familyColor(id,s.players);c.beginPath();c.arc(ox+(p.x+.5)*sw,oy+(p.y+.5)*sh,p.imprisoned?4.5:3.4,0,Math.PI*2);c.fill();if(p.shadowX!=null&&p.shadowY!=null)shadowMark(p.shadowX,p.shadowY,'#e55cff')});
  (s.hazards||[]).forEach(h=>{if(!h.active||!s.discovered[h.y]?.[h.x])return;const px=ox+(h.x+.5)*sw,py=oy+(h.y+.5)*sh;if(h.type==='sinkhole'){c.fillStyle='#ff7838';c.fillRect(px-3.5,py-3.5,7,7)}else if(h.type==='vehicle'){c.fillStyle='#75d8ff';c.fillRect(px-3,py-2,6,4)}else if(h.type==='animal'){c.fillStyle='#ff5d70';c.beginPath();c.moveTo(px,py-4);c.lineTo(px-4,py+3);c.lineTo(px+4,py+3);c.closePath();c.fill()}else if(h.type==='tornado'){c.strokeStyle='#a8f1ff';c.lineWidth=2;c.beginPath();c.arc(px,py,4,0,Math.PI*1.6);c.stroke()}else if(h.type==='electric'){c.fillStyle='#d9fbff';c.font='9px sans-serif';c.fillText('⚡',px-4,py+3)}});
  if(s.shadow)shadowMark(s.shadow.x,s.shadow.y,'#ff61d7');c.fillStyle='#ffd43b';c.beginPath();c.arc(ox+(s.player.x+.5)*sw,oy+(s.player.y+.5)*sh,4.5,0,Math.PI*2);c.fill()};
G.start=async function(form){const s=newState(form);G.state=s;setupState(s);s.players[s.id]={name:s.name,age:s.age,character:s.selected.id,x:s.player.x,y:s.player.y,facing:s.facing,attention:s.attention,imprisoned:false,status:'active',reachedTemple:false,joinedAt:Date.now(),updatedAt:Date.now()};s.started=true;U.$('setup').style.display='none';U.$('game').classList.add('show');U.$('game').setAttribute('aria-hidden','false');L.UI.updateMeters(s);try{L.Renderer3D.init(U.$('gameCanvas'),s)}catch(err){console.error(err);U.$('setup').style.display='grid';U.$('game').classList.remove('show');L.UI.bootError('No se pudo iniciar el motor 3D WebGL: '+err.message);return false}Audio.startMusic(()=>s.attention);MP.connect(s);Audio.say(`Bienvenido ${s.name}. Estás probando una zona full-stack de solo dos habitaciones con las mecánicas principales. ${L.Controls?.isTouchMode?.()?'Usa los botones táctiles que configuraste antes de entrar.':'Usa las teclas que configuraste antes de entrar.'} La ciudad está cubierta por nubes de oscuridad. No hay cuestionarios: tus decisiones se verán en lo que haces. Explora, juega en los arcades, escucha música y descubre tres señales de claridad sin perder de vista el tiempo. Cada diez minutos de partida perderás veinte por ciento de atención. Cuanta más atención conserves, más clara será la guía.`,'warm');setTimeout(()=>G.emitGuide(),1700);setInterval(()=>G.drawMinimap(),160);return true};
  G.leave=async function(){
    const s=G.state;if(!s)return;
    try{MP.disconnect(s)}catch(e){}
    try{if(document.getElementById('webGameModal')?.classList.contains('show'))L.ExternalGames?.close?.()}catch(e){}
    try{L.MediaCenter?.stop?.()}catch(e){}
    try{Audio.stopMusic?.();if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}
    try{L.Renderer3D?.stop?.()}catch(e){}
    s.started=false;G.state=null;
    document.querySelectorAll('.modal.show').forEach(m=>m.classList.remove('show'));
    U.$('timeDanger')?.classList.remove('show','critical');
    U.$('game').classList.remove('show');U.$('game').setAttribute('aria-hidden','true');
    U.$('setup').style.display='grid';
    const b=U.$('start');if(b){b.disabled=false;b.textContent='Entrar al área de prueba 3D'}
    const info=U.$('setupInfo');if(info)info.textContent='Saliste de la partida. Puedes cambiar personaje, controles o sala y volver a entrar.';
  };

  document.addEventListener('DOMContentLoaded',()=>{
    U.$('leaveGame')?.addEventListener('click',()=>{if(confirm('¿Salir de esta partida y volver a la pantalla inicial?'))G.leave()});
    U.$('sosVoice').addEventListener('click',()=>G.state&&Audio.say(`¡Auxilio! Soy ${G.state.name}. Estoy encarcelado. Busca mi círculo rojo en el mini mapa.`,'warning'));
    U.$('playAgain').addEventListener('click',()=>G.state&&MP.resetRoom(G.state));
  });
})();
