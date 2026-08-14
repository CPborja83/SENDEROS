(function(){
  const L=window.Lajuj=window.Lajuj||{},U=L.Utils,C=L.CONFIG;
  const W=L.World={};
  W.generate=function(roomCode){
    const R=U.rng(U.hash('CITY18DEMO:'+roomCode)),MW=C.MAP_W,MH=C.MAP_H;
    const maze=Array.from({length:MH},()=>Array(MW).fill(1)),kind=Array.from({length:MH},()=>Array(MW).fill(0));
    const xs=[],ys=[];for(let x=5;x<MW-5;x+=12)xs.push(x);for(let y=5;y<MH-5;y+=12)ys.push(y);const NX=xs.length,NY=ys.length,vis=Array.from({length:NY},()=>Array(NX).fill(false));
    function road(x1,y1,x2,y2){if(x1===x2){for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)for(let d=-1;d<=1;d++){maze[y][x1+d]=0;kind[y][x1+d]=1}}else{for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)for(let d=-1;d<=1;d++){maze[y1+d][x]=0;kind[y1+d][x]=1}}}
    function dfs(ix,iy){vis[iy][ix]=true;U.shuffle([[1,0],[-1,0],[0,1],[0,-1]],R).forEach(([dx,dy])=>{const nx=ix+dx,ny=iy+dy;if(nx<0||ny<0||nx>=NX||ny>=NY||vis[ny][nx])return;road(xs[ix],ys[iy],xs[nx],ys[ny]);dfs(nx,ny)})}
    for(let iy=0;iy<NY;iy++)for(let ix=0;ix<NX;ix++)for(let y=ys[iy]-2;y<=ys[iy]+2;y++)for(let x=xs[ix]-2;x<=xs[ix]+2;x++){maze[y][x]=0;kind[y][x]=1}
    dfs(0,0);for(let n=0;n<Math.max(12,Math.floor(NX*NY*.45));n++){const ix=Math.floor(R()*NX),iy=Math.floor(R()*NY);if(ix<NX-1&&R()>.45)road(xs[ix],ys[iy],xs[ix+1],ys[iy]);if(iy<NY-1&&R()>.45)road(xs[ix],ys[iy],xs[ix],ys[iy+1])}
    for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++)if(kind[y][x]===1)for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(maze[y+dy][x+dx]===1){maze[y+dy][x+dx]=0;kind[y+dy][x+dx]=3}
    const rooms=[];
    for(let iy=0;iy<NY-1;iy++)for(let ix=0;ix<NX-1;ix++){
      const x0=xs[ix]+4,x1=xs[ix+1]-4,y0=ys[iy]+4,y1=ys[iy+1]-4;if(x1-x0<3||y1-y0<3)continue;const type=(ix+iy*3+Math.floor(R()*3))%C.buildings.length;
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){maze[y][x]=0;kind[y][x]=2}
      const rm={x0,y0,x1,y1,type,label:C.buildings[type].name,special:null};rooms.push(rm);const midX=Math.floor((x0+x1)/2),midY=Math.floor((y0+y1)/2);
      if(R()>.5)for(let y=y0;y<=y1;y++)if(y!==midY){maze[y][midX]=1;kind[y][midX]=0}
      const side=Math.floor(R()*4);if(side===0)for(let y=ys[iy]+1;y<=y0;y++){maze[y][midX]=0;kind[y][midX]=3};if(side===1)for(let y=y1;y<=ys[iy+1]-1;y++){maze[y][midX]=0;kind[y][midX]=3};if(side===2)for(let x=xs[ix]+1;x<=x0;x++){maze[midY][x]=0;kind[midY][x]=3};if(side===3)for(let x=x1;x<=xs[ix+1]-1;x++){maze[midY][x]=0;kind[midY][x]=3}
    }
    rooms.forEach((rm,i)=>{const cx=Math.floor((rm.x0+rm.x1)/2),cy=Math.floor((rm.y0+rm.y1)/2),ix=i===0?5:29,iy=i===0?5:17;for(let x=Math.min(cx,ix);x<=Math.max(cx,ix);x++){maze[cy][x]=0;kind[cy][x]=3}for(let y=Math.min(cy,iy);y<=Math.max(cy,iy);y++){maze[y][ix]=0;kind[y][ix]=3}});
    return {maze,kind,rooms};
  };
  W.isWall=(world,x,y)=>x<0||y<0||x>=C.MAP_W||y>=C.MAP_H||world.maze[y][x]===1||world.dynamicBlocks?.has(x+','+y);
  W.degree=function(world,x,y){let n=0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(!W.isWall(world,x+dx,y+dy))n++;return n};
  W.openCells=function(world,filter){const a=[];for(let y=1;y<C.MAP_H-1;y++)for(let x=1;x<C.MAP_W-1;x++)if(!world.maze[y][x]&&(!filter||filter(x,y)))a.push({x,y});return a};
  W.randomOpen=function(world,R,exclude=[],filter){const B=new Set(exclude.map(p=>p.x+','+p.y)),a=W.openCells(world,filter).filter(p=>!B.has(p.x+','+p.y));return a.length?{...a[Math.floor(R()*a.length)]}:{x:5,y:5}};
  W.bfs=function(world,start){const q=[{x:start.x,y:start.y}],dist=new Map([[start.x+','+start.y,0]]),prev=new Map();for(let i=0;i<q.length;i++){const p=q[i],d=dist.get(p.x+','+p.y);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+dx,y:p.y+dy},k=n.x+','+n.y;if(!W.isWall(world,n.x,n.y)&&!dist.has(k)){dist.set(k,d+1);prev.set(k,p);q.push(n)}}}return{dist,prev,cells:q}};
  W.path=function(world,start,target){const q=[start],seen=new Set([start.x+','+start.y]),prev=new Map();for(let i=0;i<q.length;i++){const p=q[i];if(p.x===target.x&&p.y===target.y)break;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+dx,y:p.y+dy},k=n.x+','+n.y;if(W.isWall(world,n.x,n.y)||seen.has(k))continue;seen.add(k);prev.set(k,p);q.push(n)}}if(!seen.has(target.x+','+target.y))return[start];let cur=target,out=[target];while(!(cur.x===start.x&&cur.y===start.y)){cur=prev.get(cur.x+','+cur.y);if(!cur)break;out.push(cur)}return out.reverse()};
  W.roomAt=(world,x,y)=>world.rooms.find(r=>x>=r.x0&&x<=r.x1&&y>=r.y0&&y<=r.y1)||null;
  W.roomOpenCells=function(world,rm){return W.openCells(world,(x,y)=>x>=rm.x0&&x<=rm.x1&&y>=rm.y0&&y<=rm.y1)};
  W.nearestOpenInRoom=function(world,rm,allowedSet){const cx=(rm.x0+rm.x1)/2,cy=(rm.y0+rm.y1)/2,cells=W.roomOpenCells(world,rm).filter(p=>!allowedSet||allowedSet.has(p.x+','+p.y));cells.sort((a,b)=>Math.hypot(a.x-cx,a.y-cy)-Math.hypot(b.x-cx,b.y-cy));return cells[0]||null};
  W.mainComponent=function(world){
    const all=W.openCells(world),remaining=new Set(all.map(p=>p.x+','+p.y));let best=[];
    while(remaining.size){const key=remaining.values().next().value,[sx,sy]=key.split(',').map(Number),cells=W.bfs(world,{x:sx,y:sy}).cells;for(const p of cells)remaining.delete(p.x+','+p.y);if(cells.length>best.length)best=cells}
    return{cells:best,set:new Set(best.map(p=>p.x+','+p.y))};
  };
  W.randomFromCells=function(cells,R,exclude=[],filter){const B=new Set(exclude.map(p=>p.x+','+p.y)),pool=cells.filter(p=>!B.has(p.x+','+p.y)&&(!filter||filter(p.x,p.y)));return pool.length?{...pool[Math.floor(R()*pool.length)]}:null};
  W.safeSpawn=function(world,R){const main=W.mainComponent(world);let p=W.randomFromCells(main.cells,R,[],(x,y)=>{const k=world.kind[y][x];return(k===1||k===3)&&!W.roomAt(world,x,y)&&W.degree(world,x,y)>=2});if(!p)p=W.randomFromCells(main.cells,R,[],(x,y)=>!W.roomAt(world,x,y)&&W.degree(world,x,y)>=1);if(!p)p=main.cells[0]||{x:5,y:5};return{point:p,component:main}};
})();
