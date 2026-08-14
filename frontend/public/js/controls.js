(function(){
  const L=window.Lajuj=window.Lajuj||{},K=L.Controls={};
  const defaults={
    mode:'computer',
    keys:{up:['ArrowUp','w'],down:['ArrowDown','s'],left:['ArrowLeft','a'],right:['ArrowRight','d'],action:['Enter',' '],secondary:['Shift'],exit:['Escape']},
    touch:{up:'up',left:'left',down:'down',right:'right',a:'action',b:'secondary',menu:'exit'}
  };
  const names={up:'Arriba',down:'Abajo',left:'Izquierda',right:'Derecha',action:'Acción',secondary:'Secundaria',exit:'Salir'};
  const canon={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',action:'Enter',secondary:'Shift',exit:'Escape'},touchSymbols={up:'▲',left:'◀',down:'▼',right:'▶',a:'A',b:'B',menu:'☰'};
  let cfg=load(),capture=null;
  function clone(v){return JSON.parse(JSON.stringify(v))}
  function load(){try{const v=JSON.parse(localStorage.getItem('lajujControlsV15')||'null');return v&&v.keys&&v.touch?Object.assign(clone(defaults),v):clone(defaults)}catch(e){return clone(defaults)}}
  function save(){try{localStorage.setItem('lajujControlsV15',JSON.stringify(cfg))}catch(e){};render()}
  function pretty(k){return ({ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Enter:'Enter',' ':'Espacio',Escape:'Esc',Shift:'Shift',Control:'Ctrl',Alt:'Alt',Tab:'Tab',Backspace:'Retroceso'}[k]||String(k).toUpperCase())}
  function actionForKey(key){for(const [a,keys] of Object.entries(cfg.keys))if((keys||[]).includes(key))return a;return null}
  K.actionForEvent=e=>actionForKey(e.key);
  K.canonicalKey=function(e){const a=K.actionForEvent(e);return a?canon[a]:e.key};
  K.normalizedEvent=function(e){const k=K.canonicalKey(e);return{key:k,originalEvent:e,preventDefault:()=>e.preventDefault(),stopPropagation:()=>e.stopPropagation(),stopImmediatePropagation:()=>e.stopImmediatePropagation()}};
  K.label=a=>(cfg.keys[a]||[]).map(pretty).join(' / ')||'—';
  K.touchLabel=a=>Object.entries(cfg.touch).filter(([,v])=>v===a).map(([slot])=>touchSymbols[slot]||slot).join(' / ')||'—';
  K.activeLabel=a=>cfg.mode==='mobile'?K.touchLabel(a):K.label(a);
  K.summary=()=>cfg.mode==='mobile'?`Táctil · Dirección: ${K.touchLabel('up')} ${K.touchLabel('left')} ${K.touchLabel('down')} ${K.touchLabel('right')} · Acción: ${K.touchLabel('action')} · Secundaria: ${K.touchLabel('secondary')} · Salir: ${K.touchLabel('exit')}`:`Teclado · Dirección: ${K.label('up')} ${K.label('left')} ${K.label('down')} ${K.label('right')} · Acción: ${K.label('action')} · Secundaria: ${K.label('secondary')} · Salir: ${K.label('exit')}`;
  K.describe=function(text=''){const A=K.activeLabel,map={'Flechas ↑ → ↓ ←':`${A('up')} ${A('right')} ${A('down')} ${A('left')}`,'Flechas':`Direcciones (${A('up')}, ${A('left')}, ${A('down')}, ${A('right')})`,'Enter/Espacio':A('action'),'Enter':A('action'),'Esc':A('exit'),'←/→':`${A('left')}/${A('right')}`,'←':A('left'),'→':A('right'),'↑':A('up'),'↓':A('down')};return text.replace(/Flechas ↑ → ↓ ←|Enter\/Espacio|Flechas|←\/→|Esc|Enter|←|→|↑|↓/g,m=>map[m]||m)};
  K.get=()=>clone(cfg);
  K.mode=()=>cfg.mode;
  K.isTouchMode=()=>cfg.mode==='mobile';
  K.setMode=m=>{cfg.mode=m==='mobile'?'mobile':'computer';save()};
  K.reset=()=>{cfg=clone(defaults);save()};
  K.emitAction=function(action){const key=canon[action]||action;window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));};
  K.emitTouchSlot=function(slot){const action=cfg.touch[slot];if(action)K.emitAction(action)};
  function setCapture(action,key){if(!key||['Tab'].includes(key))return;cfg.keys[action]=[key];capture=null;save()}
  function render(){
    const mode=document.querySelector('input[name="controlMode"]:checked');if(mode&&mode.value!==cfg.mode)mode.checked=false;const desired=document.querySelector(`input[name="controlMode"][value="${cfg.mode}"]`);if(desired)desired.checked=true;
    document.querySelectorAll('[data-key-action]').forEach(b=>{const a=b.dataset.keyAction;b.textContent=capture===a?'Presiona una tecla…':K.label(a);b.classList.toggle('capturing',capture===a)});
    document.querySelectorAll('[data-touch-slot]').forEach(sel=>{const slot=sel.dataset.touchSlot;sel.value=cfg.touch[slot]||''});
    const sum=document.getElementById('controlSummary');if(sum)sum.textContent=K.summary();
    document.querySelectorAll('[data-touch-control]').forEach(b=>{const slot=b.dataset.touchControl,a=cfg.touch[slot]||'';b.innerHTML=`<span>${touchSymbols[slot]||slot}</span><small>${names[a]||a}</small>`;b.title=names[a]||a;b.setAttribute('aria-label',`${touchSymbols[slot]||slot}: ${names[a]||a}`)});
    const pad=document.querySelector('.mobile-controls');if(pad)pad.classList.toggle('enabled',cfg.mode==='mobile');
    document.body.classList.toggle('touch-mode',cfg.mode==='mobile');
  }
  document.addEventListener('keydown',e=>{if(!capture)return;e.preventDefault();e.stopImmediatePropagation();setCapture(capture,e.key)},true);
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('input[name="controlMode"]').forEach(r=>r.addEventListener('change',()=>K.setMode(r.value)));
    document.querySelectorAll('[data-key-action]').forEach(b=>b.addEventListener('click',()=>{capture=b.dataset.keyAction;render()}));
    document.querySelectorAll('[data-touch-slot]').forEach(sel=>sel.addEventListener('change',()=>{cfg.touch[sel.dataset.touchSlot]=sel.value;save()}));
    document.getElementById('controlsReset')?.addEventListener('click',K.reset);
    document.querySelectorAll('[data-touch-control]').forEach(b=>{let timer=null;const fire=()=>K.emitTouchSlot(b.dataset.touchControl);b.addEventListener('pointerdown',e=>{e.preventDefault();fire();if(['up','down','left','right'].includes(b.dataset.touchControl))timer=setInterval(fire,185)});['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>{clearInterval(timer);timer=null}))});
    render();
  });
})();
