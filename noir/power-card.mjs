// Genuine PR-MAD manual, section 5: AUTO ↓↓, fixed 12 V ↑↓, fixed 24 V ↓↑.
// The two illustrated loads are alternative installations, never simultaneous.
export function initPowerCard(card, {playbackSpeed:requestedSpeed=1,stageDurationMs:requestedStage}={}) {
  const voltage=card.querySelector('[data-prmad-voltage]');
  const label=card.querySelector('[data-prmad-label]');
  const status=card.querySelector('[data-prmad-status]');
  const buttons=[...card.querySelectorAll('button[data-prmad-option]')];
  const hardware=[...card.querySelectorAll('[data-prmad-switch]')];
  const explanation=card.querySelector('[data-prmad-explanation]');
  if(!voltage||!label||!status||!buttons.length)return{start(){},stop(){}};
  const timers=new Set(),motion=matchMedia('(prefers-reduced-motion: reduce)');
  const preview=[['auto','12'],['auto','24'],['12','12'],['24','24']];
  const nativeTiming={connecting:210,detected:690,autoHold:3600,fixedHold:3200,fixedOn:690};
  // A presentation can slow this card alone; native pages retain speed 1.
  const speed=Number(requestedSpeed),playbackSpeed=Number.isFinite(speed)&&speed>0?speed:1;
  const timing=Object.fromEntries(Object.entries(nativeTiming).map(([key,ms])=>[key,ms/playbackSpeed]));
  const requestedHold=Number(requestedStage);
  const stageDurationMs=Number.isFinite(requestedHold)&&requestedHold>0?Math.max(requestedHold,Math.max(timing.detected,timing.fixedOn)+100/playbackSpeed):null;
  if(stageDurationMs!==null)timing.autoHold=timing.fixedHold=stageDurationMs;
  card.style.setProperty('--prmad-time-scale',String(1/playbackSpeed));
  let running=false,reduced=false,manual=false,lastSelection=-1000;
  function clear(){timers.forEach(clearTimeout);timers.clear();}
  function later(ms,fn){const id=setTimeout(()=>{timers.delete(id);if(running)fn();},ms);timers.add(id);}
  function phase(next,load){
    card.dataset.prmadPhase=next;
    card.dataset.prmadDirection=next==='detecting'?'to-supply':next==='supplying'?'to-strip':'none';
    card.dataset.prmadOn=String(next==='ready');
    const auto=card.dataset.prmadMode==='auto';
    if(explanation)explanation.textContent=auto?'Podłącz taśmę. Zasilacz rozpozna 12 lub 24 V.':`Ustaw ${load} V przełącznikami DIP. Podłącz taśmę ${load} V.`;
    label.textContent=auto?(next==='detecting'?'ROZPOZNAWANIE':'AUTODETEKCJA'):'STAŁE NAPIĘCIE';
    voltage.textContent=auto&&(next==='connecting'||next==='detecting')?'—':load;
    status.textContent=next==='idle'?'12 V LUB 24 V':next==='connecting'?'PODŁĄCZANIE':next==='detecting'?'SPRAWDZANIE NAPIĘCIA':next==='supplying'?`ZASILANIE ${load} V`:auto?`WYKRYTO ${load} V`:`TAŚMA ${load} V`;
  }
  function show(mode,load,connect){
    card.dataset.prmadOn='false';
    card.dataset.prmadMode=mode;
    card.dataset.prmadLoad=connect?load:'none';
    card.dataset.prmadConnected=String(connect);
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.prmadOption===mode)));
    hardware.forEach(toggle=>{
      const up=mode==='12'&&toggle.dataset.prmadSwitch==='1'||mode==='24'&&toggle.dataset.prmadSwitch==='2';
      toggle.dataset.position=up?'up':'down';
    });
    if(!connect){phase('idle',load);return;}
    if(reduced){phase('ready',load);return;}
    phase('connecting',load);
    if(mode==='auto'){
      later(timing.connecting,()=>phase('detecting',load));
      later(timing.detected,()=>phase('ready',load));
    }else{
      later(timing.connecting,()=>phase('supplying',load));
      later(timing.fixedOn,()=>phase('ready',load));
    }
  }
  function cycle(index=0){
    clear();const[mode,load]=preview[index];show(mode,load,true);
    later(mode==='auto'?timing.autoHold:timing.fixedHold,()=>cycle((index+1)%preview.length));
  }
  function automatic(load='12'){
    clear();show('auto',load,true);
    if(!reduced)later(timing.autoHold,()=>automatic(load==='12'?'24':'12'));
  }
  function select(mode){
    const now=performance.now();if(manual&&card.dataset.prmadMode===mode&&now-lastSelection<180)return;
    lastSelection=now;
    // A control's focus handler may run before the parent's focusin handler.
    running=true;reduced=motion.matches;manual=true;clear();
    if(mode==='auto')automatic();else show(mode,mode,true);
  }
  buttons.forEach((button,index)=>{
    button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'&&matchMedia('(hover:hover) and (pointer:fine)').matches)select(button.dataset.prmadOption);});
    button.addEventListener('focus',()=>select(button.dataset.prmadOption));
    button.addEventListener('click',()=>select(button.dataset.prmadOption));
    button.addEventListener('keydown',event=>{const next=event.key==='ArrowRight'?(index+1)%buttons.length:event.key==='ArrowLeft'?(index+buttons.length-1)%buttons.length:event.key==='Home'?0:event.key==='End'?buttons.length-1:null;if(next!==null){event.preventDefault();buttons[next].focus();}});
  });
  show('auto','12',false);
  return{
    start({reduced:useReduced=false}={}){if(running)return;running=true;reduced=useReduced;manual=false;if(reduced)show('auto','12',true);else cycle();},
    stop(){running=false;manual=false;clear();show('auto','12',false);},
    inspect(){return{running,reduced,manual,playbackSpeed,stageDurationMs,timing:{...timing},mode:card.dataset.prmadMode,phase:card.dataset.prmadPhase,direction:card.dataset.prmadDirection,load:card.dataset.prmadLoad,on:card.dataset.prmadOn==='true',pendingTimers:timers.size,switches:Object.fromEntries(hardware.map(toggle=>[toggle.dataset.prmadSwitch,toggle.dataset.position]))};}
  };
}
