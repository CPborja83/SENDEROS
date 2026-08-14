(function(){
  const L=window.Lajuj=window.Lajuj||{};
  const U=L.Utils={};
  U.$=id=>document.getElementById(id);
  U.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  U.hash=s=>{let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
  U.rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  U.shuffle=(a,r=Math.random)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  U.cleanRoom=s=>String(s||'FAMILIA123').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12)||'FAMILIA123';
  U.bandFor=age=>L.CONFIG.bands.find(b=>age>=b.min&&age<=b.max)||null;
  U.charBy=id=>L.CONFIG.characters.find(c=>c.id===id)||L.CONFIG.characters[0];
  U.shadowBy=id=>L.CONFIG.shadows.find(s=>s.id===id)||L.CONFIG.shadows[0];
  U.hexToRgb=h=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255]};
  U.uuid=()=>crypto.randomUUID?crypto.randomUUID().replace(/-/g,'').slice(0,24):('p'+Date.now()+Math.random().toString(36).slice(2)).slice(0,24);
  U.delay=ms=>new Promise(r=>setTimeout(r,ms));
})();
