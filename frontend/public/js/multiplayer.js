(function(){
  const L=window.Lajuj=window.Lajuj||{}; const M=L.Multiplayer={online:false,ws:null,retryTimer:null,heartbeatTimer:null,lastError:0};
  function serverWsUrl(){
    const configured=String(window.LajujRuntime?.serverUrl||'').trim().replace(/\/$/,'');
    if(configured){const base=configured.replace(/^http:/i,'ws:').replace(/^https:/i,'wss:');return base.endsWith('/ws')?base:base+'/ws'}
    return (location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws';
  }
  function send(type,payload={}){const ws=M.ws;if(ws&&ws.readyState===WebSocket.OPEN){ws.send(JSON.stringify({type,...payload}));return true}return false}
  M.playerPayload=function(s){return{id:s.id,name:s.name,age:s.age,character:s.selected.id,x:s.player.x,y:s.player.y,facing:s.facing||0,attention:s.attention,imprisoned:s.imprisoned,status:s.imprisoned?'jailed':'active',shadowX:s.shadow?.x??null,shadowY:s.shadow?.y??null,shadowFacing:s.shadowFacing||0,reachedTemple:s.reachedTemple,joinedAt:s.joinedAt||Date.now(),signalUntil:s.signalUntil||0,gatherUntil:s.gatherUntil||0,updatedAt:Date.now()}};
  function ensureSelf(s){if(!s.players[s.id])s.players[s.id]=M.playerPayload(s)}
  function handle(s,msg){
    if(!msg||!msg.type)return;
    if(msg.type==='snapshot'){
      s.players=msg.players||{};ensureSelf(s);L.UI.updateMeters(s);L.Game.onPlayersUpdated?.();if(msg.finished)L.Game.showFinal?.();return;
    }
    if(msg.type==='player_update'&&msg.id&&msg.player){s.players[msg.id]=msg.player;ensureSelf(s);L.Game.onPlayersUpdated?.();return}
    if(msg.type==='player_left'&&msg.id){delete s.players[msg.id];ensureSelf(s);L.Game.onPlayersUpdated?.();return}
    if(msg.type==='room_finished'){L.Game.showFinal?.();return}
    if(msg.type==='room_reset'){location.reload();return}
    if(msg.type==='error'){console.warn('Backend Senderos:',msg.message||msg);return}
  }
  M.connect=function(s){
    s.joinedAt=Date.now();s.players[s.id]=M.playerPayload(s);L.UI.updateMeters(s);
    clearTimeout(M.retryTimer);clearInterval(M.heartbeatTimer);
    let ws;try{ws=new WebSocket(serverWsUrl())}catch(e){console.warn(e);L.UI.teamMessage('Modo local: backend no disponible.',false);return}
    M.ws=ws;
    const failLocal=()=>{M.online=false;ensureSelf(s);if(Date.now()-M.lastError>5000){M.lastError=Date.now();L.UI.teamMessage('Modo local: no se pudo conectar al servidor multijugador.',false)}};
    ws.addEventListener('open',()=>{M.online=true;send('join',{room:s.room,player:M.playerPayload(s)});L.UI.teamMessage('🟢 Sala multijugador conectada.',false);clearInterval(M.heartbeatTimer);M.heartbeatTimer=setInterval(()=>send('ping'),6000)});
    ws.addEventListener('message',e=>{try{handle(s,JSON.parse(e.data))}catch(err){console.warn('Mensaje WS inválido',err)}});
    ws.addEventListener('close',()=>{if(M.ws===ws)M.ws=null;failLocal()});
    ws.addEventListener('error',()=>failLocal());
  };
  M.sync=function(s){s.players[s.id]=M.playerPayload(s);L.UI.updateMeters(s);if(!M.online)return;clearTimeout(M._syncTimer);M._syncTimer=setTimeout(()=>send('sync',{player:M.playerPayload(s)}),70)};
  M.rescue=async function(s,id){if(M.online)send('rescue',{targetId:id});else if(s.players[id]){s.players[id].imprisoned=false;s.players[id].status='rescued'}};
  M.finishRoom=async function(s){if(M.online)send('finish');else L.Game.showFinal?.()};
  M.resetRoom=async function(s){if(M.online){send('reset');setTimeout(()=>location.reload(),250)}else location.reload()};
  M.disconnect=function(s){clearInterval(M.heartbeatTimer);clearTimeout(M._syncTimer);if(M.ws){try{send('leave');M.ws.close(1000,'leave')}catch(e){}M.ws=null}M.online=false};
  M.serverUrl=serverWsUrl;
})();
