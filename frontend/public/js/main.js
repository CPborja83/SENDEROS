(function(){
  const L=window.Lajuj=window.Lajuj||{},U=L.Utils;
  document.addEventListener('DOMContentLoaded',()=>{
    U.$('start').addEventListener('click',async()=>{const f=L.UI.form;if(!f||!f.selected)return;U.$('start').disabled=true;U.$('start').textContent='Preparando ciudad 3D…';const ok=await L.Game.start(f);if(!ok){U.$('start').disabled=false;U.$('start').textContent='Entrar a la ciudad 3D'}});
    function move(d){if(!L.Game.state)return;if(d==='up')L.Game.move(0,-1);if(d==='down')L.Game.move(0,1);if(d==='left')L.Game.move(-1,0);if(d==='right')L.Game.move(1,0)}
    window.addEventListener('keydown',e=>{
      const t=e.target,typing=t&&(t.matches?.('input, textarea, select')||t.isContentEditable);if(typing)return;
      const key=L.Controls?.canonicalKey(e)||e.key,map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};
      if(map[key]){e.preventDefault();move(map[key])}
    });
    U.$('listen').addEventListener('click',()=>L.Game.emitGuide(true));U.$('signal').addEventListener('click',()=>L.Game.signal());U.$('gather').addEventListener('click',()=>L.Game.gather());
    U.$('pray').addEventListener('click',()=>L.Game.quick('pray'));U.$('scripture').addEventListener('click',()=>L.Game.quick('scripture'));U.$('together').addEventListener('click',()=>L.Game.quick('together'));U.$('trust').addEventListener('click',()=>L.Game.quick('trust'));
    U.$('voiceBtn').addEventListener('click',()=>{L.Audio.voice=!L.Audio.voice;U.$('voiceBtn').textContent=L.Audio.voice?'🔊 Voz':'🔇 Voz';if(L.Audio.voice&&L.Audio.lastVoice)L.Audio.say(L.Audio.lastVoice)});
    U.$('musicBtn').addEventListener('click',()=>{L.Audio.music=!L.Audio.music;U.$('musicBtn').textContent=L.Audio.music?'🎵 Música':'🔕 Música';L.MediaCenter?.setEnabled?.(L.Audio.music);if(!L.Audio.music)L.Audio.stopMusic();else if(L.Game.state&&!L.MediaCenter?.hasStation?.()&&L.Audio.shadowDistance==null)L.Audio.startMusic(()=>L.Game.state.attention)});
    U.$('mapPlus').addEventListener('click',()=>{if(L.Game.state){L.Game.state.minimapScale=U.clamp((L.Game.state.minimapScale||1)+.2,1,2);L.Game.drawMinimap()}});U.$('mapMinus').addEventListener('click',()=>{if(L.Game.state){L.Game.state.minimapScale=U.clamp((L.Game.state.minimapScale||1)-.2,1,2);L.Game.drawMinimap()}});
    setInterval(()=>{const info=L.Game.tickTime?.(Date.now()),s=L.Game.state;if(!s||!s.started||!info)return;const sec=info.sec;U.$('clock').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');const left=info.nextSec,mm=Math.floor(left/60),ss=left%60;if(U.$('timePenaltyHint'))U.$('timePenaltyHint').textContent=`−20% atención en ${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`},1000);
    window.addEventListener('beforeunload',()=>L.Game.state&&L.Multiplayer.disconnect(L.Game.state));
  });
})();
