const root=document.querySelector('[data-delux-story]');
if(root){
 root.dataset.enhanced='true';
 const runway=root.querySelector('.delux-runway'),stage=root.querySelector('.delux-stage'),benefits=root.querySelector('.delux-benefits');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const short=matchMedia('(max-height:600px), (max-width:760px) and (max-height:719px)');
 const staticView=()=>reduced.matches||short.matches;
 const clamp=x=>Math.max(0,Math.min(1,x));
 const ease=(p,a,b)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t);};
 const buttons=[...root.querySelectorAll('[data-delux-power]')],nav=[...root.querySelectorAll('[data-delux-jump]')];
 const copy=root.querySelector('.delux-room-copy'),specs=root.querySelector('.delux-specs');
 const drawing=root.querySelector('.delux-technical');
 let frame=0,visible=true,pageActive=true,lastMode=-1,manual=null,manualY=0,progress=0,detailProgress=0,renderedFrames=0;
 const names=['low','medium','high'],powers=[3,6,11],flux=[460,930,1750];
 const inViewport=()=>{const r=root.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;};
 function mode(value){
  if(value===lastMode)return;lastMode=value;
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===value)));
  root.querySelector('[data-delux-mode]').textContent=names[value].toUpperCase();
  root.querySelector('[data-delux-mode-copy]').textContent=['Światło, które buduje nastrój.','Światło na co dzień.','Więcej światła do działania.'][value];
  root.dataset.currentMode=names[value];drawing?.setAttribute('data-power',names[value]);
  root.querySelector('[data-circuit-mode]').textContent=names[value].toUpperCase();
  root.querySelector('[data-circuit-watts]').textContent=powers[value];
  root.querySelector('[data-circuit-lumens]').textContent=flux[value];
  root.style.setProperty('--current-strength',[.32,.61,1][value]);
 }
 function running(){root.dataset.flowRunning=String(visible&&pageActive&&!document.hidden&&!reduced.matches);}
 function stop(){if(frame)cancelAnimationFrame(frame);frame=0;root.dataset.flowRunning='false';}
 function render(){
  frame=0;if(!visible||!pageActive||document.hidden)return;renderedFrames++;
  const rect=runway.getBoundingClientRect(),br=benefits.getBoundingClientRect();
  progress=staticView()?0:clamp(-rect.top/Math.max(1,runway.offsetHeight-stage.offsetHeight));
  detailProgress=clamp((innerHeight*.65-br.top)/Math.max(1,benefits.offsetHeight-innerHeight*.3));
  if(manual!==null&&Math.abs(scrollY-manualY)>40)manual=null;
  const inDetails=br.top<innerHeight*.62;
  let detailMode=0;
  benefits.querySelectorAll('.delux-benefit').forEach((article,i)=>{if(article.getBoundingClientRect().top<innerHeight*.55)detailMode=i;});
  const band=manual??(inDetails?detailMode:progress<.57?0:progress<.72?1:2);mode(band);
  const room=ease(progress,.22,.49)*(1-ease(progress,.84,1));
  const light=[.25,.56,1][band];
  const values={'--p':progress,'--room':room,'--light':light,'--object':1-ease(progress,.28,.51),'--hud':1-ease(progress,.19,.32),'--room-copy':ease(progress,.30,.43)*(1-ease(progress,.84,.94)),'--modes':ease(progress,.31,.43)*(1-ease(progress,.84,.94)),'--wash':ease(progress,.85,1),'--detail-intro':ease(progress,.90,.98)};
  for(const [name,value] of Object.entries(values))stage.style.setProperty(name,value.toFixed(4));
  const presence=staticView()?ease(innerHeight*.9-br.top,0,innerHeight*.4):ease(progress,.28,.45);
  root.style.setProperty('--circuit-presence',presence.toFixed(4));
  const storyY=Math.max(0,-root.getBoundingClientRect().top),shift=staticView()?0:Math.min(innerWidth<761?110:250,storyY*.055);
  root.style.setProperty('--circuit-shift',shift.toFixed(2)+'px');
  // The bright front advances with reading position; a smaller repeating pulse
  // remains visible during pauses. Neither represents an electrical schematic.
  root.style.setProperty('--circuit-scroll',String((storyY*.55)%600));
  const controls=progress>.33&&progress<.92&&!staticView();
  root.dataset.modeControls=String(controls);root.dataset.final=String(progress>.95);root.dataset.detailVisible=String(inDetails);
  root.dataset.staticView=String(staticView());
  buttons.forEach(b=>b.tabIndex=controls?0:-1);root.querySelector('.delux-modes').inert=!controls;
  copy.setAttribute('aria-hidden',String(progress<.3||progress>.95||staticView()));specs.setAttribute('aria-hidden',String(progress>.32));
  nav.forEach((b,i)=>b.setAttribute('aria-current',(progress<.28?0:progress<.6?1:2)===i?'step':'false'));
  running();
 }
 function schedule(){
  visible=inViewport();
  if(!visible){stop();return;}
  if(pageActive&&!document.hidden&&!frame)frame=requestAnimationFrame(render);
 }
 const observer=new IntersectionObserver(entries=>{
  const e=entries[0];visible=e.isIntersecting&&e.intersectionRect.height>0;
  if(visible)schedule();else stop();
 },{threshold:.001});observer.observe(root);
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
 const viewChanged=()=>{manual=null;stop();schedule();};reduced.addEventListener('change',viewChanged);short.addEventListener('change',viewChanged);
 nav.forEach(b=>b.addEventListener('click',()=>{manual=null;const travel=runway.offsetHeight-stage.offsetHeight;scrollTo({top:scrollY+runway.getBoundingClientRect().top+Number(b.dataset.deluxJump)*travel,behavior:reduced.matches?'instant':'smooth'});}));
 buttons.forEach((b,i)=>b.addEventListener('click',()=>{manual=i;manualY=scrollY;schedule();}));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else schedule();});
 addEventListener('pagehide',()=>{pageActive=false;stop();});addEventListener('pageshow',()=>{pageActive=true;schedule();});
 root.deluxStory={inspect:()=>({progress,detailProgress,mode:lastMode,manual,reducedMotion:reduced.matches,shortViewport:short.matches,visible,pageActive,renderedFrames,pendingFrame:!!frame,flowRunning:root.dataset.flowRunning==='true',currentMode:root.dataset.currentMode})};
 visible=inViewport();render();
}
