/* One reversible scroll state drives every visual; no wheel/touch interception. */
for(const root of document.querySelectorAll('[data-strip-story]')){
 const config=JSON.parse(root.querySelector('[data-story-config]').textContent);
 const scenes=[...root.querySelectorAll('.strip-scene')],art=[...root.querySelectorAll('[data-geometry]')];
 const runway=root.querySelector('.strip-runway'),stage=root.querySelector('.strip-stage');
 const jumps=[...root.querySelectorAll('[data-story-jump]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const short=matchMedia('(max-height:600px), (max-width:760px) and (max-height:719px)');
 const details=root.querySelector('.strip-details'),benefits=[...root.querySelectorAll('[data-strip-benefit]')];
 let index=-1,frame=0,active=true,visible=true,progress=0,staticMode=false,detailIndex=-1,detailBeat=0,detailTimer=0,lastVisual='';
 const clamp=n=>Math.max(0,Math.min(1,n));
 const staticView=()=>reduced.matches||short.matches;
 function setState(next){
  if(next===index)return;
  root.style.setProperty('--copy-entry',next<index?'-18px':'18px');
  index=next;const state=config.states[index];
  root.dataset.scene=String(index);
  scenes.forEach((scene,i)=>{
   scene.hidden=!staticMode&&i!==index;
   scene.dataset.state=i===index?'active':i<index?'seen':'upcoming';
   scene.setAttribute('aria-hidden',String(scene.hidden));
   scene.inert=scene.hidden;
  });
  jumps.forEach((button,i)=>button.setAttribute('aria-current',i===index?'step':'false'));
 }
 function setVisual(state,night,callout){
  const key=JSON.stringify([state,night,callout?.value]);if(key===lastVisual)return;lastVisual=key;
  root.dataset.channel=state.channel;
  root.dataset.sku=config.models[state.model].sku;
  root.style.setProperty('--strip-light',state.color);
  root.style.setProperty('--strip-core',state.color);
  root.style.setProperty('--strip-strength',night?'.76':state.channel==='detail'?'.24':config.kind==='slim'&&state.model===3?'.95':config.kind==='bread'&&state.model===1?'.92':index===0?'.58':'.8');
  const geometry=state.geometry??config.models[state.model].geometry;
  art.forEach((layer,i)=>layer.dataset.active=String(i===geometry));
  root.style.setProperty('--pcb-half',Number(art[geometry].querySelector('.strip-board').dataset.width)*10/180*50+'%');
  for(const terminal of root.querySelectorAll('.strip-terminal')){
   const channel=terminal.dataset.channel;
   terminal.dataset.lit=String(channel.startsWith('+')||['−','D','GND'].includes(channel)||state.channel==='CCT'&&['CW','WW'].includes(channel)||state.channel===channel||state.channel==='RGB'&&['R','G','B'].includes(channel));
  }
  for(const led of root.querySelectorAll('[data-led-channel]')){
   const ch=led.dataset.ledChannel;
   const lit=ch==='ALL'||state.channel==='detail'||state.channel===ch||state.channel==='RGB'&&['R','G','B'].includes(ch)||state.channel==='CCT'&&['CW','WW'].includes(ch)||ch==='RGB'&&['R','G','B'].includes(state.channel);
   led.style.setProperty('--emitter',lit?'1':'.035');
  }
  const model=config.models[state.model];
  const readout=root.querySelector('.strip-detail-readout');
  if(readout){readout.dataset.wide=String((callout?.value||state.label||state.channel).length>9);readout.querySelector('[data-detail-value]').textContent=callout?.value||state.label||state.channel;readout.querySelector('[data-detail-caption]').textContent=callout?.label||'';readout.querySelector('[data-detail-spec]').textContent=model.spec;readout.querySelector('[data-detail-sku]').textContent=model.sku;}
  const facts=readout?.querySelector('[data-detail-facts]');
  if(facts){
   facts.replaceChildren(...(callout?.facts||[]).filter(key=>model.facts[key]&&!model.facts[key].includes('—')).map(key=>{
    const row=document.createElement('div'),label=document.createElement('dt'),value=document.createElement('dd');
    label.textContent=key;value.textContent=model.facts[key];row.append(label,value);return row;
   }));
  }
 }
 function cycleDetail(running){
  if(!running){if(detailTimer)clearTimeout(detailTimer);detailTimer=0;return;}
  if(!detailTimer)detailTimer=setTimeout(()=>{detailTimer=0;detailBeat++;schedule();},2400);
 }
 function render(){
  frame=0;if(!active||document.hidden)return;
  staticMode=staticView();root.dataset.static=String(staticMode);
  const rect=runway.getBoundingClientRect();
  const fullRect=root.getBoundingClientRect();visible=fullRect.bottom>0&&fullRect.top<innerHeight;
  root.dataset.running=String(visible&&!staticMode);
  progress=staticMode?0:clamp(-rect.top/Math.max(1,runway.offsetHeight-stage.offsetHeight));
  const next=Math.min(scenes.length-1,Math.floor(progress*scenes.length));
  setState(next);
  const detailTop=details?.getBoundingClientRect().top??Infinity;
  const night=staticMode?0:clamp((innerHeight-detailTop)/(innerHeight*.35));
  root.style.setProperty('--night',`${(night*100).toFixed(2)}%`);root.style.setProperty('--night-progress',String(night));
  const inDetails=!staticMode&&detailTop<innerHeight*.7;root.dataset.details=String(inDetails);
  let current=-1;benefits.forEach((el,i)=>{if(el.getBoundingClientRect().top<innerHeight*.57)current=i;});
  if(current!==detailIndex){detailIndex=current;detailBeat=0;}
  const detail=config.details?.[Math.max(0,detailIndex)];
  const visual=inDetails&&detail?detail.colors[detailBeat%detail.colors.length]:config.states[index];
  setVisual(visual,inDetails,inDetails?detail:null);
  cycleDetail(inDetails&&visible&&!staticMode&&detail?.colors.length>1);
  const shift=progress*(innerWidth<761?55:110)+Math.max(0,-detailTop)*.025;
  root.style.setProperty('--strip-shift',`${-Math.min(shift,innerWidth<761?140:240)}px`);
 }
 function schedule(){if(!frame&&active&&!document.hidden)frame=requestAnimationFrame(render);}
 function reset(){index=-1;schedule();}
 jumps.forEach((button,i)=>button.addEventListener('click',()=>{
  const total=Math.max(0,runway.offsetHeight-stage.offsetHeight);
  // Chapter selection opens the requested state directly, without playing intermediate states.
  scrollTo({top:scrollY+runway.getBoundingClientRect().top+total*(i+.25)/scenes.length,behavior:'instant'});
  schedule();
 }));
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',reset,{passive:true});
 reduced.addEventListener('change',reset);short.addEventListener('change',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cycleDetail(false);root.dataset.running='false';if(frame)cancelAnimationFrame(frame);frame=0;}else schedule();});
 addEventListener('pagehide',()=>{active=false;cycleDetail(false);root.dataset.running='false';if(frame)cancelAnimationFrame(frame);frame=0;});
 addEventListener('pageshow',()=>{active=true;schedule();});
 root.dataset.enhanced='true';
 root.stripStory={inspect:()=>({index,progress,staticMode,visible,detailIndex,detailBeat,night:root.style.getPropertyValue('--night'),sku:root.dataset.sku,channel:root.dataset.channel,sceneCount:scenes.length})};
 render();
}
