(function(){
  const L=window.Lajuj=window.Lajuj||{};
  const A=L.Audio={voice:true,music:true,lastVoice:'',ctx:null,musicTimer:null,step:0,voiceReady:false,voiceCursor:0,shadowTimer:null,shadowDistance:null,shadowStep:0};

  function availableVoices(){return !('speechSynthesis' in window)?[]:speechSynthesis.getVoices().filter(v=>/^es/i.test(v.lang||''))}
  function scoreVoice(v){const name=(v.name||'').toLowerCase();let s=0;
    if(/google.*español|google.*spanish/.test(name))s+=120;
    if(/microsoft/.test(name))s+=90;
    if(/natural|online|neural|premium|enhanced/.test(name))s+=70;
    if(/mex|guatemala|latam|spanish/.test((v.lang||'').toLowerCase()))s+=25;
    return s
  }
  const femaleNames=/sabina|dalia|helena|laura|soledad|elvira|paulina|monica|mónica|luciana|sofia|sofía|paloma|marisol|isabela|elena|maria|maría|carmen|conchita|ines|inés|esperanza/i;
  const maleNames=/jorge|alvaro|álvaro|pablo|raul|raúl|diego|carlos|antonio|miguel|enrique|andres|andrés|mateo|juan|pedro|felipe|santiago/i;
  const profiles=[
    {id:'femaleWarm',gender:'female',rate:1.14,pitch:1.08},
    {id:'maleGuide',gender:'male',rate:1.13,pitch:.91},
    {id:'femaleBright',gender:'female',rate:1.18,pitch:1.16},
    {id:'maleDeep',gender:'male',rate:1.08,pitch:.82},
    {id:'neutralFast',gender:'any',rate:1.2,pitch:1.00}
  ];
  function voiceGender(v){const n=(v?.name||'');if(femaleNames.test(n))return'female';if(maleNames.test(n))return'male';return'any'}
  function nextProfile(style='normal'){
    const p={...profiles[Math.floor(A.voiceCursor++/2)%profiles.length]};
    if(style==='warning'){p.rate=Math.min(p.rate,1.12);p.pitch=Math.min(p.pitch,.96)}
    if(style==='warm'){p.pitch=Math.max(p.pitch,1.02)}
    return p
  }
  function chooseVoice(profile){
    const voices=availableVoices().slice().sort((a,b)=>scoreVoice(b)-scoreVoice(a));
    if(!voices.length)return null;
    const exact=voices.filter(v=>voiceGender(v)===profile.gender);
    const pool=profile.gender==='any'?voices:(exact.length?exact:voices);
    return pool[A.voiceCursor%pool.length]||pool[0]||voices[0]
  }
  function prepText(text){return String(text||'').replace(/\s+/g,' ').replace(/:/g,'. ').replace(/\s*,\s*/g,', ').replace(/\s*\.\s*/g,'. ').trim()}
  if('speechSynthesis' in window){speechSynthesis.onvoiceschanged=()=>A.voiceReady=true;setTimeout(()=>A.voiceReady=true,1200)}
  function speak(text,rate=1.14,pitch=1,profile=null){
    text=prepText(text);if(!A.voice||!('speechSynthesis' in window)||!text)return;
    const u=new SpeechSynthesisUtterance(text),p=profile||nextProfile(),v=chooseVoice(p);
    if(v){u.voice=v;u.lang=v.lang||'es-MX'}else u.lang='es-MX';
    u.rate=rate||p.rate;u.pitch=pitch||p.pitch;u.volume=1;speechSynthesis.speak(u)
  }
  A.say=function(text,style='normal'){
    A.lastVoice=text=prepText(text);if(!A.voice||!('speechSynthesis' in window)||!text)return;
    speechSynthesis.cancel();const p=nextProfile(style);
    speak(text,p.rate,p.pitch,p)
  };
  A.sayQuestion=function(question,options=[]){
    A.lastVoice=prepText(question+' '+options.join(' '));if(!A.voice||!('speechSynthesis' in window))return;
    speechSynthesis.cancel();const p=nextProfile('normal');
    speak(question,Math.max(1.18,p.rate),p.pitch,p);
    const labels=['Uno','Dos','Tres','Cuatro'];
    options.forEach((o,i)=>speak(`${labels[i]||('Opción '+(i+1))}. ${o}`,1.36,p.pitch,p))
  };

  function AC(){if(!A.ctx)A.ctx=new (window.AudioContext||window.webkitAudioContext)();if(A.ctx.state==='suspended')A.ctx.resume();return A.ctx}
  function tone(f,d=.18,g=.03,pan=0,type='sine',delay=0){const c=AC(),o=c.createOscillator(),gn=c.createGain(),p=c.createStereoPanner?c.createStereoPanner():null;o.type=type;o.frequency.value=f;gn.gain.setValueAtTime(.0001,c.currentTime+delay);gn.gain.exponentialRampToValueAtTime(g,c.currentTime+delay+.015);gn.gain.exponentialRampToValueAtTime(.0001,c.currentTime+delay+d);if(p){p.pan.value=pan;o.connect(gn).connect(p).connect(c.destination)}else o.connect(gn).connect(c.destination);o.start(c.currentTime+delay);o.stop(c.currentTime+delay+d+.03)}
  function noise(d=.5,g=.025,pan=0){const c=AC(),n=Math.floor(c.sampleRate*d),b=c.createBuffer(1,n,c.sampleRate),v=b.getChannelData(0);for(let i=0;i<n;i++)v[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource(),gn=c.createGain(),p=c.createStereoPanner?c.createStereoPanner():null;s.buffer=b;gn.gain.value=g;if(p){p.pan.value=pan;s.connect(gn).connect(p).connect(c.destination)}else s.connect(gn).connect(c.destination);s.start()}
  A.effect=function(v,dx,dy){const pan=dx<0?-.9:dx>0?.9:0;if(v.mode==='thunder'){tone(65,.7,.08,pan,'sawtooth');noise(.8,.03,pan)}else if(v.mode==='lightning'){const f=document.getElementById('flash');if(f){f.classList.remove('on');void f.offsetWidth;f.classList.add('on')}tone(900,.08,.05,pan,'square')}else if(v.mode==='quake'){tone(45,.8,.07,0,'triangle');document.getElementById('gameCanvas')?.animate?.([{transform:'translate(0)'},{transform:'translate(5px,-4px)'},{transform:'translate(-4px,3px)'},{transform:'translate(0)'}],{duration:650})}else if(v.mode==='trumpet'){[392,523,659].forEach((f,i)=>tone(f,.28,.04,pan,'sawtooth',i*.16))}else if(v.mode==='wind'){noise(.8,.025,pan)}else{[523,659].forEach((f,i)=>tone(f,.22,.027,pan,'sine',i*.08))}};

  A.startMusic=function(getAttention){
    if(!A.music||L.MediaCenter?.hasStation?.()||A.shadowDistance!=null)return;
    A.stopMusic();AC();
    const themes=[
      [261.63,329.63,392,523.25,440,392,349.23,293.66],
      [293.66,369.99,440,587.33,493.88,440,392,329.63],
      [220,277.18,329.63,440,392,329.63,293.66,246.94]
    ];
    let localStep=0,theme=Math.floor(Math.random()*themes.length);
    A.musicTimer=setInterval(()=>{const att=getAttention?getAttention():100,t=att<=40?.72:att<=60?.87:1,notes=themes[theme%themes.length];tone(notes[localStep++%notes.length]*t,.2,.011);if(localStep%32===0)theme=(theme+1)%themes.length},340)
  };
  A.stopMusic=()=>{if(A.musicTimer){clearInterval(A.musicTimer);A.musicTimer=null}};

  function threatLevel(d){if(d==null)return 0;if(d<=2)return 4;if(d<=5)return 3;if(d<=9)return 2;return 1}
  A.setShadowThreat=function(distance){
    if(distance==null){
      A.shadowDistance=null;if(A.shadowTimer){clearInterval(A.shadowTimer);A.shadowTimer=null}
      L.MediaCenter?.setThreat?.(0);
      if(A.music&&!L.MediaCenter?.hasStation?.()&&L.Game?.state)A.startMusic(()=>L.Game.state.attention);
      return
    }
    A.shadowDistance=Math.max(0,Number(distance)||0);A.stopMusic();L.MediaCenter?.setThreat?.(threatLevel(A.shadowDistance));
    if(A.shadowTimer)return;
    A.shadowStep=0;A.shadowTimer=setInterval(()=>{
      if(A.shadowDistance==null||!A.music)return;
      const level=threatLevel(A.shadowDistance),step=A.shadowStep++;
      const cadence=level===4?1:level===3?2:level===2?3:4;
      if(step%cadence)return;
      const base=level===4?92:level===3?110:level===2?138:165;
      const gain=level===4?.055:level===3?.043:level===2?.032:.022;
      tone(base,.16,gain,0,level>=3?'sawtooth':'triangle');
      if(level>=3&&step%(cadence*2)===0)tone(base*1.5,.11,gain*.7,0,'square',.06);
      if(level===4&&step%4===0)noise(.18,.018,0)
    },230)
  };
  A.getThreatLevel=()=>threatLevel(A.shadowDistance);

  A.pauseForExternal=function(){A.stopMusic();L.MediaCenter?.pauseForExternal?.();if('speechSynthesis' in window)speechSynthesis.cancel()};
  A.duckExternal=A.pauseForExternal;
  A.restoreExternal=function(){L.MediaCenter?.restoreAfterExternal?.();if(A.music&&!L.MediaCenter?.hasStation?.()&&A.shadowDistance==null&&L.Game?.state)A.startMusic(()=>L.Game.state.attention)};
  A.celestial=()=>[523,659,784,1046].forEach((f,i)=>tone(f,.8,.045,0,'sine',i*.13));
})();
