(function(){
  const L=window.Lajuj=window.Lajuj||{};
  const M=L.MediaCenter={};
  const servers=['https://de1.api.radio-browser.info','https://nl1.api.radio-browser.info','https://at1.api.radio-browser.info'];
  let audio=null,current=null,baseVolume=.22,threat=0,enabled=true,externalPaused=false;
  function el(id){return document.getElementById(id)}
  function threatFactor(){return threat>=4?.04:threat===3?.14:threat===2?.34:threat===1?.65:1}
  function effectiveVolume(){return Math.max(0,Math.min(1,baseVolume*threatFactor()))}
  function applyVolume(){if(audio){audio.volume=effectiveVolume();audio.muted=!enabled}updatePersistent()}
  function updatePersistent(){
    const bar=el('radioNowBar'),name=el('radioNowName'),state=el('radioNowState');if(!bar)return;
    bar.classList.toggle('show',!!current);if(name)name.textContent=current?current.name:'Sin emisora';
    if(state)state.textContent=!current?'':(!enabled?'silenciada':threat?`alerta ${threat}/4`:`${Math.round(baseVolume*100)}%`);const tg=el('radioNowToggle');if(tg)tg.textContent=enabled?'⏸':'▶'
  }
  function stopAudioOnly(){if(audio){audio.pause();audio.src='';audio=null}}
  function stopStation(restore=true){stopAudioOnly();current=null;threat=0;updatePersistent();if(restore)L.Audio?.restoreExternal?.()}
  async function getJSON(path){let last;for(const base of servers){try{const r=await fetch(base+path,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json()}catch(e){last=e}}throw last||new Error('Sin servidor de radio')}
  function normalize(stations){const blocked=/(explicit|adult|erotic|sexo|sexual|xxx|hardcore|porn|reggaeton explícito|reggaeton explicit)/i;return(stations||[]).filter(s=>s&&s.url_resolved&&s.name&&!blocked.test([s.name,s.tags,s.homepage].filter(Boolean).join(' '))).slice(0,12)}
  async function searchStations(item){const p=new URLSearchParams({limit:'24',hidebroken:'true',order:'votes',reverse:'true'});if(item.tag)p.set('tag',item.tag);if(item.countrycode)p.set('countrycode',item.countrycode);if(item.language)p.set('language',item.language);if(item.nameQuery)p.set('name',item.nameQuery);let list=normalize(await getJSON('/json/stations/search?'+p.toString()));if(!list.length&&item.tag){p.delete('language');list=normalize(await getJSON('/json/stations/search?'+p.toString()))}return list}
  function playStation(st){
    stopAudioOnly();L.Audio?.stopMusic?.();current=st;enabled=L.Audio?.music!==false;
    audio=new Audio();audio.preload='none';audio.src=st.url_resolved;applyVolume();
    audio.play().catch(()=>{const n=el('mediaNow');if(n)n.textContent='No se pudo iniciar esta emisora. Prueba otra.'});
    const n=el('mediaNow');if(n)n.textContent=`▶ ${st.name}${st.country?' · '+st.country:''} · seguirá sonando al cerrar`;
    document.querySelectorAll('.station-row').forEach(b=>b.classList.toggle('playing',b.dataset.uuid===st.stationuuid));updatePersistent()
  }
  function renderStations(list){const host=el('mediaList');host.innerHTML='';if(!list.length){host.innerHTML='<div class="media-empty">No encontré una emisora disponible en este momento.</div>';return}list.forEach(st=>{const b=document.createElement('button');b.className='station-row';b.dataset.uuid=st.stationuuid||'';b.innerHTML=`<span>📻</span><div><b>${st.name}</b><small>${[st.country,st.tags?.split(',').slice(0,2).join(' · ')].filter(Boolean).join(' · ')}</small></div><i>▶</i>`;b.onclick=()=>playStation(st);host.appendChild(b)})}
  M.open=async function(item,onCredit){
    el('mediaTitle').textContent=item.name;el('mediaText').textContent=item.text;el('mediaIcon').textContent=item.icon||'🎵';
    el('mediaNow').textContent=current?`Ahora suena: ${current.name}. Puedes cambiarla.`:'Buscando emisoras…';el('mediaList').innerHTML='<div class="loading-online">📡 Conectando con radio en línea…</div>';
    el('mediaModal').classList.add('show');if(L.Game?.state)L.Game.state.inMini=true;
    try{const list=await searchStations(item);renderStations(list);if(!current)el('mediaNow').textContent=list.length?'Elige una emisora. Seguirá sonando durante la partida.':'Sin emisoras disponibles.';if(onCredit)onCredit()}
    catch(e){el('mediaNow').textContent=current?`Continúa sonando: ${current.name}`:'No hubo conexión con la radio.';el('mediaList').innerHTML='<div class="media-empty">Puedes seguir jugando sin conexión.</div>'}
  };
  M.close=function(){el('mediaModal')?.classList.remove('show');if(L.Game?.state)L.Game.state.inMini=false;updatePersistent()};
  M.hasStation=()=>!!current;
  M.currentStation=()=>current;
  M.setThreat=function(level){threat=Math.max(0,Math.min(4,Number(level)||0));applyVolume()};
  M.setEnabled=function(on){enabled=!!on;if(audio){audio.muted=false;if(enabled&&audio.paused)audio.play().catch(()=>{});if(!enabled&&!audio.paused)audio.pause()}const mm=el('mediaMute');if(mm)mm.textContent=enabled?'🔊 Silenciar':'🔇 Activar audio';updatePersistent()};
  M.setVolume=function(v){baseVolume=Math.max(0,Math.min(1,Number(v)));const slider=el('mediaVolume');if(slider)slider.value=Math.round(baseVolume*100);const txt=el('mediaVolumeValue');if(txt)txt.textContent=Math.round(baseVolume*100)+'%';applyVolume()};
  M.pauseForExternal=function(){externalPaused=!!(audio&&!audio.paused);if(externalPaused)audio.pause()};
  M.restoreAfterExternal=function(){if(externalPaused&&audio&&enabled)audio.play().catch(()=>{});externalPaused=false};
  M.stop=function(){externalPaused=false;stopStation(true)};
  document.addEventListener('DOMContentLoaded',()=>{
    el('mediaClose')?.addEventListener('click',M.close);
    el('mediaVolume')?.addEventListener('input',e=>M.setVolume(Number(e.target.value)/100));
    el('mediaMute')?.addEventListener('click',()=>{M.setEnabled(!enabled)});
    el('radioNowStop')?.addEventListener('click',()=>M.stop());
    el('radioNowToggle')?.addEventListener('click',()=>{enabled=!enabled;M.setEnabled(enabled);el('radioNowToggle').textContent=enabled?'⏸':'▶'});
    updatePersistent()
  });
})();
