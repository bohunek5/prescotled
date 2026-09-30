/* One reversible scroll state drives every visual; no wheel/touch interception. */
for(const root of document.querySelectorAll('[data-strip-story]')){
 const config=JSON.parse(root.querySelector('[data-story-config]').textContent);
 const scenes=[...root.querySelectorAll('[data-scene]')],art=[...root.querySelectorAll('[data-geometry]')];
 const runway=root.querySelector('.strip-runway'),stage=root.querySelector('.strip-stage');
 const jumps=[...root.querySelectorAll('[data-story-jump]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const short=matchMedia('(max-height:600px), (max-width:760px) and (max-height:719px)');
 let index=-1,frame=0,active=true,visible=true,progress=0,staticMode=false;
 const clamp=n=>Math.max(0,Math.min(1,n));
 const staticView=()=>reduced.matches||short.matches;
 function setState(next){
  if(next===index)return;
  index=next;const state=config.states[index];
  root.dataset.scene=String(index);root.dataset.channel=state.channel;
  root.dataset.sku=config.models[state.model].sku;
  root.style.setProperty('--strip-light',state.color);
  root.style.setProperty('--strip-core',state.color);
  root.style.setProperty('--strip-strength',state.channel==='detail'?'.24':config.kind==='slim'&&state.model===3?'.95':config.kind==='bread'&&state.model===1?'.92':index===0?'.58':'.8');
  scenes.forEach((scene,i)=>{
   scene.dataset.state=i===index?'active':i<index?'seen':'upcoming';
   scene.setAttribute('aria-hidden',String(!staticMode&&i!==index));
   scene.inert=!staticMode&&i!==index;
  });
  art.forEach((layer,i)=>layer.dataset.active=String(i===state.geometry));
  for(const terminal of root.querySelectorAll('.strip-terminal')){
   const channel=terminal.dataset.channel;
   terminal.dataset.lit=String(channel.startsWith('+')||channel==='−'||state.channel===channel||state.channel==='RGB'&&['R','G','B'].includes(channel));
  }
  jumps.forEach((button,i)=>button.setAttribute('aria-current',i===index?'step':'false'));
 }
 function render(){
  frame=0;if(!active||document.hidden)return;
  staticMode=staticView();root.dataset.static=String(staticMode);
  const rect=runway.getBoundingClientRect();
  visible=rect.bottom>0&&rect.top<innerHeight;
  root.dataset.running=String(visible&&!staticMode);
  progress=staticMode?0:clamp(-rect.top/Math.max(1,runway.offsetHeight-stage.offsetHeight));
  const next=Math.min(scenes.length-1,Math.floor(progress*scenes.length));
  setState(next);
  root.style.setProperty('--strip-shift',`${-progress*(innerWidth<761?55:110)}px`);
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
 document.addEventListener('visibilitychange',()=>{if(document.hidden){root.dataset.running='false';if(frame)cancelAnimationFrame(frame);frame=0;}else schedule();});
 addEventListener('pagehide',()=>{active=false;root.dataset.running='false';if(frame)cancelAnimationFrame(frame);frame=0;});
 addEventListener('pageshow',()=>{active=true;schedule();});
 root.dataset.enhanced='true';
 root.stripStory={inspect:()=>({index,progress,staticMode,visible,sku:root.dataset.sku,channel:root.dataset.channel,sceneCount:scenes.length})};
 render();
}

// Open the exact catalog card from a variant summary, including keyboard activation.
function revealModel(hash){
 if(!hash.startsWith('#model-'))return;
 const card=document.getElementById(decodeURIComponent(hash.slice(1)));
 if(!card?.classList.contains('model-card'))return;
 const rail=card.closest('.model-rail');if(!rail)return;
 rail.scrollTo({left:card.offsetLeft-rail.offsetLeft,behavior:'instant'});
}
document.addEventListener('click',event=>{
 const link=event.target.closest('.strip-variant-links a[href^="#model-"]');
 if(!link)return;
 event.preventDefault();const hash=link.getAttribute('href');revealModel(hash);
 const card=document.getElementById(hash.slice(1));const showcase=card?.closest('.showcase');
 if(showcase){history.replaceState(null,'',hash);showcase.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
});
addEventListener('hashchange',()=>revealModel(location.hash));
revealModel(location.hash);
