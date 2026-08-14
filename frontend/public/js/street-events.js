(function(){
  const L=window.Lajuj=window.Lajuj||{},U=L.Utils,W=L.World,S=L.StreetEvents={},CELL=L.CONFIG.CELL;
  const animals=[
    {icon:'🐆',name:'jaguar',sound:'Un jaguar aparece entre las sombras, ruge y luego se aparta sin atacarte.'},
    {icon:'🐊',name:'cocodrilo',sound:'Un cocodrilo bloquea el paso por un instante y después se aleja.'},
    {icon:'🐗',name:'jabalí',sound:'Un jabalí corre hacia el camino, se detiene y termina huyendo.'},
    {icon:'🐺',name:'lobo',sound:'Un animal feroz gruñe frente a ti, pero finalmente se retira.'}
  ];
  const vehicles=[{icon:'🚗',kind:'auto',factor:.84},{icon:'🚕',kind:'taxi',factor:.86},{icon:'🚌',kind:'bus',factor:.96},{icon:'🚚',kind:'camión',factor:.94},{icon:'🚙',kind:'camioneta',factor:.9}];
  let alertTimer=null;
  function alert(text,kind='warn'){const e=U.$('streetAlert');if(!e)return;e.textContent=text;e.className='hud panel street-alert show '+kind;clearTimeout(alertTimer);alertTimer=setTimeout(()=>e.className='hud panel street-alert',1900)}
  function key(p){return p.x+','+p.y}
  function road(s,x,y){return !W.isWall(s.world,x,y)&&!W.roomAt(s.world,x,y)&&(s.world.kind[y]?.[x]===1||s.world.kind[y]?.[x]===3)}
  function roadCells(s,reachable){return reachable.filter(p=>road(s,p.x,p.y))}
  function take(pool,R,used,filter){const choices=pool.filter(p=>!used.has(key(p))&&(!filter||filter(p)));if(!choices.length)return null;const p={...choices[Math.floor(R()*choices.length)]};used.add(key(p));return p}
  function vehicleDir(s,p,R){const dirs=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>road(s,p.x+dx,p.y+dy));if(!dirs.length)return{dx:1,dy:0};const d=dirs[Math.floor(R()*dirs.length)];return{dx:d[0],dy:d[1]}}
  function holeCluster(s,p){const horiz=road(s,p.x-1,p.y)&&road(s,p.x,p.y)&&road(s,p.x+1,p.y),vert=road(s,p.x,p.y-1)&&road(s,p.x,p.y)&&road(s,p.x,p.y+1);const lr=(!W.isWall(s.world,p.x-2,p.y)?1:0)+(!W.isWall(s.world,p.x+2,p.y)?1:0),ud=(!W.isWall(s.world,p.x,p.y-2)?1:0)+(!W.isWall(s.world,p.x,p.y+2)?1:0);if(ud>=lr&&horiz)return[{x:p.x-1,y:p.y},{x:p.x,y:p.y},{x:p.x+1,y:p.y}];if(vert)return[{x:p.x,y:p.y-1},{x:p.x,y:p.y},{x:p.x,y:p.y+1}];return[{x:p.x,y:p.y}]}
  function farDistance(s){const p=W.path(s.world,s.player,s.temple);return p.length>1?p.length-1:0}
  function blockedBy(h,x,y){return (h.cells||[{x:h.x,y:h.y}]).some(c=>c.x===x&&c.y===y)}
  function routeDanger(s,blocks){
    if((s.hazards||[]).some(h=>h.active&&(h.type==='tornado'||h.type==='electric')))return;
    const d=farDistance(s);if(d<(L.CONFIG.demoMode?10:30)||s.moveCount<(s.nextRouteDangerAt??999))return;
    const path=W.path(s.world,s.player,s.temple);if(path.length<10){s.nextRouteDangerAt=s.moveCount+12;return}
    const candidates=[];for(let i=3;i<path.length-2;i++){const p=path[i];if(!road(s,p.x,p.y))continue;if((s.hazards||[]).some(h=>h.active&&h.x===p.x&&h.y===p.y))continue;candidates.push({p,i,priority:s.world.kind[p.y]?.[p.x]===1?2:1})}candidates.sort((a,b)=>b.priority-a.priority);
    U.shuffle(candidates).some(({p,i})=>{
      const k=key(p);blocks.add(k);const alt=W.path(s.world,s.player,s.temple);if(alt.length<2){blocks.delete(k);return false}
      const prev=path[i-1],next=path[i+1],dx=next.x-prev.x,dy=next.y-prev.y,type=(s.routeDangerSeq++%2===0)?'electric':'tornado';
      const h={...p,type,active:true,cells:[{...p}],startMove:s.moveCount,endMove:s.moveCount+9+(s.routeDangerSeq%4),phase:Math.random()*6.28,axis:Math.abs(dx)>Math.abs(dy)?'vertical':'horizontal',renderSize:type==='tornado'?CELL*.82:CELL*.92,lastContactMove:-1};
      s.hazards.push(h);s.nextRouteDangerAt=s.moveCount+16+Math.floor(Math.random()*8);
      alert(type==='electric'?'⚡ Cables eléctricos cayeron sobre la ruta. Cambia de calle hasta que pase el peligro.':'🌪️ Se formó un torbellino adelante. Busca otra ruta por unos momentos.','danger');return true
    });
    if(s.moveCount>=(s.nextRouteDangerAt??999))s.nextRouteDangerAt=s.moveCount+10;
  }
  S.setup=function(s,R,reachable,used){
    const roads=roadCells(s,reachable);s.hazards=[];s.routeDangerSeq=0;s.nextRouteDangerAt=(L.CONFIG.demoMode?8:18)+Math.floor(R()*5);
    for(let i=0;i<(L.CONFIG.demoMode?4:12);i++){const p=take(roads,R,used,x=>W.degree(s.world,x.x,x.y)>=2);if(!p)break;const a=animals[i%animals.length];s.hazards.push({...p,type:'animal',active:true,icon:a.icon,name:a.name,message:a.sound,phase:R()*6.28,renderSize:CELL*.58})}
    for(let i=0;i<(L.CONFIG.demoMode?4:11);i++){const p=take(roads,R,used,x=>W.degree(s.world,x.x,x.y)>=2);if(!p)break;const v=vehicles[i%vehicles.length],dir=vehicleDir(s,p,R);s.hazards.push({...p,type:'vehicle',active:true,icon:v.icon,vehicleKind:v.kind,dx:dir.dx,dy:dir.dy,phase:R()*6.28,length:CELL*v.factor,width:CELL*.42,height:CELL*.24})}
    let holes=0,attempts=0;while(holes<(L.CONFIG.demoMode?2:6)&&attempts++<120){const p=take(roads,R,used,x=>W.degree(s.world,x.x,x.y)>=2);if(!p)break;const cells=holeCluster(s,p);if(cells.some(c=>used.has(key(c))&&key(c)!==key(p)))continue;cells.forEach(c=>used.add(key(c)));const start=10+holes*9+Math.floor(R()*5);s.hazards.push({...p,type:'sinkhole',active:false,icon:'🕳️',cells,startMove:start,endMove:start+10+Math.floor(R()*6),warned:false,phase:R()*6.28,renderSize:CELL*.86});holes++}
    s.world.dynamicBlocks=new Set();S.refreshBlocks(s);
  };
  S.refreshBlocks=function(s){
    if(!s?.world)return;const blocks=new Set();s.world.dynamicBlocks=blocks;
    for(const h of s.hazards||[]){
      if(h.type==='sinkhole'){const should=s.moveCount>=h.startMove&&s.moveCount<h.endMove&&!h.cells.some(c=>c.x===s.player.x&&c.y===s.player.y);h.active=false;if(!should)continue;h.cells.forEach(c=>blocks.add(key(c)));const path=W.path(s.world,s.player,s.temple);if(path.length<2&&!(s.player.x===s.temple.x&&s.player.y===s.temple.y)){h.cells.forEach(c=>blocks.delete(key(c)));continue}h.active=true;if(!h.warned){h.warned=true;alert('⚠️ El pavimento comienza a hundirse. Esa ruta quedó cerrada temporalmente; busca otra calle.','danger')}}
      if(h.type==='tornado'||h.type==='electric'){if(s.moveCount>=h.endMove){h.active=false;continue}if(!h.active||blockedBy(h,s.player.x,s.player.y))continue;(h.cells||[{x:h.x,y:h.y}]).forEach(c=>blocks.add(key(c)));const p=W.path(s.world,s.player,s.temple);if(p.length<2){(h.cells||[]).forEach(c=>blocks.delete(key(c)));h.active=false}}
    }
    routeDanger(s,blocks);
  };
  function vehicleNeighbors(s,v,occupied){const dirs=[[1,0],[-1,0],[0,1],[0,-1]],out=[];for(const[dx,dy]of dirs){const x=v.x+dx,y=v.y+dy,k=x+','+y;if(W.isWall(s.world,x,y)||W.roomAt(s.world,x,y)||occupied.has(k)||(x===s.player.x&&y===s.player.y))continue;const kind=s.world.kind[y]?.[x];if(kind!==1&&kind!==3)continue;out.push({x,y,dx,dy,score:(dx===v.dx&&dy===v.dy)?5:(dx===-v.dx&&dy===-v.dy)?0:2})}return out.sort((a,b)=>b.score-a.score)}
  S.tick=function(s){if(!s?.hazards)return;S.refreshBlocks(s);const vs=s.hazards.filter(h=>h.type==='vehicle'&&h.active),occupied=new Set(vs.map(key));for(const v of vs){occupied.delete(key(v));const opts=vehicleNeighbors(s,v,occupied);if(opts.length){const best=opts.filter(o=>o.score===opts[0].score),n=best[Math.floor(Math.random()*best.length)];v.x=n.x;v.y=n.y;v.dx=n.dx;v.dy=n.dy}occupied.add(key(v))}}
  S.beforeMove=function(s,nx,ny){
    S.refreshBlocks(s);const danger=(s.hazards||[]).find(h=>h.active&&(h.type==='electric'||h.type==='tornado')&&blockedBy(h,nx,ny));
    if(danger){if(danger.lastContactMove!==s.moveCount){danger.lastContactMove=s.moveCount;const loss=danger.type==='electric'?4:3;s.attention=Math.max(0,s.attention-loss);L.UI?.updateMeters?.(s);L.Game?.reconcileAttention?.(s,true);L.Multiplayer?.sync?.(s);alert(danger.type==='electric'?`⚡ Te acercaste demasiado al cable: descarga leve, -${loss}% de atención. Busca otra ruta.`:`🌪️ El viento te golpeó al acercarte: -${loss}% de atención. Cambia de rumbo.`,'danger')}return false}
    const k=nx+','+ny;if(s.world.dynamicBlocks?.has(k)){alert('🕳️ No puedes cruzar: se abrió un agujero. Busca otra ruta.','danger');return false}
    const car=(s.hazards||[]).find(h=>h.active&&h.type==='vehicle'&&h.x===nx&&h.y===ny);if(car){alert(`${car.icon} Un ${car.vehicleKind||'vehículo'} está pasando. Espera un instante o toma otra calle.`,'warn');return false}
    const a=(s.hazards||[]).find(h=>h.active&&h.type==='animal'&&h.x===nx&&h.y===ny);if(a){a.active=false;alert(`${a.icon} ${a.message} No perdiste puntos ni atención.`,'danger');L.Audio?.effect?.({mode:'wind'},0,0);return false}
    return true;
  };
  S.afterMove=function(s){const near=(s.hazards||[]).find(h=>h.active&&h.type==='animal'&&Math.abs(h.x-s.player.x)+Math.abs(h.y-s.player.y)===1);if(near&&Math.random()<.16)alert(`${near.icon} Escuchas un gruñido cerca. Parece peligroso, pero todavía no sabes si realmente lo es.`,'warn')};
  S.debugSizes=function(){return{cell:CELL,maxVehicleLength:CELL*.96,vehicleWidth:CELL*.42,animal:CELL*.58,tornado:CELL*.82,electric:CELL*.92}};
})();
