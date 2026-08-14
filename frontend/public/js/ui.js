(function(){
  const L=window.Lajuj=window.Lajuj||{},U=L.Utils,C=L.CONFIG;
  L.UI={selected:null};
  function validate(){
    const name=U.$('name').value.trim(),age=Number(U.$('age').value),band=U.bandFor(age),room=U.cleanRoom(U.$('room').value);
    L.UI.form={name,age,band,room,selected:L.UI.selected};
    U.$('setupInfo').textContent=band?`Nivel ${band.label}. La cantidad de familiares se detecta automáticamente según quienes se conecten a esta sala.`:'Ingresa una edad entre 5 y 99 años.';
    U.$('start').disabled=!(name.length>=2&&band&&L.UI.selected);
  }
  function select(c){L.UI.selected=c;document.querySelectorAll('.char').forEach(b=>b.classList.toggle('selected',b.dataset.id===c.id));validate()}
  function renderCharacters(){
    const host=U.$('characters');host.innerHTML='';
    C.characters.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='char';b.dataset.id=c.id;b.innerHTML=`<img src="${c.src}" alt="${c.label}"><small>${c.label}</small>`;b.addEventListener('click',()=>select(c));host.appendChild(b)});
    U.$('setupInfo').textContent='Selecciona un personaje, escribe tu nombre y edad.';
  }
  function familyColor(id,players){const arr=Object.entries(players||{}).sort((a,b)=>(a[1]?.joinedAt||0)-(b[1]?.joinedAt||0)||a[0].localeCompare(b[0]));const i=Math.max(0,arr.findIndex(x=>x[0]===id));return C.palette[i%C.palette.length]}
  L.UI.familyColor=familyColor;
  L.UI.renderFamily=function(state){const host=U.$('familyStrip');host.innerHTML='';const entries=Object.entries(state.players||{}).sort((a,b)=>(a[1]?.joinedAt||0)-(b[1]?.joinedAt||0));entries.forEach(([id,p])=>{if(!p)return;const d=document.createElement('div');d.className='member'+(p.imprisoned?' jailed':'')+(p.reachedTemple?' temple':'');d.style.setProperty('--member',p.imprisoned?'#ff5267':familyColor(id,state.players));d.title=p.name||'Jugador';d.innerHTML=`<img src="${U.charBy(p.character).src}" alt="${p.name||'Jugador'}">`;host.appendChild(d)});U.$('familyCount').textContent=`${entries.length||1} ${(entries.length||1)===1?'conectado':'conectados'}`}
  L.UI.showGuide=function(v,text){U.$('guideIcon').textContent=v.icon;U.$('guideName').textContent=v.name;U.$('guideText').textContent=text;U.$('guidePanel').classList.add('show');clearTimeout(L.UI._guideTimer);L.UI._guideTimer=setTimeout(()=>U.$('guidePanel').classList.remove('show'),4300)};
  L.UI.updateMeters=function(state){const spirit=U.clamp(Math.round(state.attention*.78+(state.activeGuide?17:8)),20,100),need=state.insightRequired||3,got=Math.min(need,state.insight||0);U.$('attention').textContent=state.attention+'%';U.$('attentionFill').style.width=state.attention+'%';U.$('spiritStrength').textContent=spirit+'%';U.$('spiritFill').style.width=spirit+'%';U.$('objectiveText').textContent=state.reachedTemple?'Espera a que toda tu familia llegue al Templo.':got<need?`Explora habitaciones y comprende señales: ${got}/${need}. La guía cambia según tu atención.`:'Ya comprendiste las señales necesarias. Conserva al menos 50% de atención y reconoce la guía hacia el Templo.';L.UI.renderFamily(state)};
  L.UI.teamMessage=function(text,sos){const b=U.$('teamBanner');if(!text){b.className='hud panel team-banner';return}b.textContent=text;b.className='hud panel team-banner show'+(sos?' sos':'')};
  L.UI.bootError=function(text){const e=U.$('bootError');e.hidden=false;e.textContent=text};
  document.addEventListener('DOMContentLoaded',()=>{
    try{renderCharacters();['name','age','room'].forEach(id=>U.$(id).addEventListener('input',validate));U.$('random').addEventListener('click',()=>select(C.characters[Math.floor(Math.random()*C.characters.length)]));validate()}catch(err){console.error(err);L.UI.bootError('No se pudo construir la selección de personajes: '+err.message)}
  });
})();
