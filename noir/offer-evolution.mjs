import {evolutionModels as models,chapterProgress,modelChapterProgress,modelIndex,storyProgress} from './evolution-models.mjs?v=20260926-light1';
const root=document.querySelector('[data-strip-evolution]');
if(root){
 const stage=root.querySelector('.evolution-stage'),hosts=[...root.querySelectorAll('.evolution-canvas')];
 const scenes=[];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const shortViewport=matchMedia('(max-height:739px), (max-width:1100px)');
 const staticView=()=>reduced.matches||shortViewport.matches;

 let scene=null,frame=0,progress=0,targetProgress=0,index=-1,pointerX=0,pointerY=0,manualIndex=null;
 let visible=false,pageActive=true,measureDirty=true,paintDirty=true,lastPaint=0,nextPaint=0,elapsedSeconds=0,renderedFrames=0;
 let lastPercent=-1;
 let theme=document.documentElement.dataset.theme==='day'?'day':'night';
 function palette(){
  const m=models[Math.max(0,index)];root.style.setProperty('--evo-ink',theme==='day'?m.dayInk:m.ink);
  root.querySelectorAll('[data-evo-jump]').forEach((button,i)=>{
   button.style.setProperty('--chapter-light',models[i].light);
   button.style.setProperty('--chapter-ink',theme==='day'?models[i].dayInk:models[i].ink);
   button.dataset.lightKind=models[i].family==='rgb'?'rgb':'white';
  });
 }
 const frameInterval=1000/30;
 const clamp=v=>Math.max(0,Math.min(1,v));
 const chapterRail=root.querySelector('.evolution-stops');
 const refreshRail=()=>chapterRail.classList.toggle('at-end',chapterRail.scrollLeft>=chapterRail.scrollWidth-chapterRail.clientWidth-1);
 chapterRail.addEventListener('scroll',refreshRail,{passive:true});
 addEventListener('resize',refreshRail,{passive:true});
 const inViewport=()=>{const r=stage.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;};
 const canPaint=()=>visible&&pageActive&&!document.hidden;
 const canRotate=()=>canPaint()&&!reduced.matches&&scene&&root.dataset.renderer==='ready';
 root.dataset.enhanced='true';
 visible=inViewport();
 function stop(){
  if(frame)cancelAnimationFrame(frame);
  frame=0;lastPaint=0;nextPaint=0;
 }
 function schedule(measure=false){
  if(measure)measureDirty=true;
  paintDirty=true;
  if(canPaint()&&!frame)frame=requestAnimationFrame(tick);
 }
 function updateContent(next){
  if(next===index)return;
  index=next;const m=models[index];root.dataset.evolutionMode=m.family;
  root.querySelector('[data-evo-family-label]').textContent=m.techLabel.replace('SMD / ','');
  for(const field of ['color','unit','colorCopy','tech','techLabel','index','copy','output','outputUnit','outputLabel','quality','qualityUnit','qualityLabel','detail'])root.querySelector('[data-evo-'+field.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+']').textContent=m[field];
  root.querySelector('[data-evo-title]').textContent=m.title.replace(/<br\s*\/?>(?:\s*)/gi,' ');
  root.querySelector('[data-evo-density]').innerHTML=m.density+' <small>LED/m</small>';
  root.querySelector('[data-evo-power]').innerHTML=m.power+' <small>W/m</small>';
  root.querySelector('[data-evo-voltage]').textContent=m.voltage+' V DC';
  root.querySelector('[data-evo-voltage-value]').textContent=m.voltage;
  root.querySelector('[data-evo-power-modes]').hidden=index>2;
  root.querySelectorAll('[data-evo-power-mode]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===m.mode)));
  root.querySelector('[data-evo-cut]').textContent='CIĘCIE '+m.cut+' mm';
  root.querySelector('[data-evo-width]').textContent='PCB '+m.width+' mm';
  root.querySelector('[data-evo-ip]').textContent=m.ip;
  root.querySelector('[data-evo-beam]').textContent=m.beam+'°';
  const link=root.querySelector('[data-evo-model]');link.href='/prescotled/katalog/#sku-'+m.sku.toLowerCase().replace(/[^a-z0-9]+/g,'-');link.innerHTML=m.sku+' <b>↗</b>';
  palette();root.style.setProperty('--evo-hue',m.hue);
  root.querySelectorAll('[data-evo-jump]').forEach((b,i)=>{b.setAttribute('aria-current',i===index?'step':'false');if(i===index){const rail=b.parentElement;rail.scrollLeft=Math.max(0,b.offsetLeft-rail.clientWidth/2+b.offsetWidth/2);refreshRail();}});
  if(!reduced.matches)root.querySelectorAll('.evolution-fact>strong,.evolution-color-hud>p,.evolution-caption').forEach(el=>el.animate([{opacity:.55,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:340,easing:'ease-out'}));
 }
 function tick(now){
  frame=0;
  if(!canPaint()){stop();return;}
  // Input may arrive at display refresh rate, but drawing never exceeds 30 fps.
  if(nextPaint&&now<nextPaint-.5){frame=requestAnimationFrame(tick);return;}
  const delta=lastPaint?Math.min(100,now-lastPaint):frameInterval;
  lastPaint=now;
  nextPaint=!nextPaint||now-nextPaint>frameInterval?now+frameInterval:nextPaint+frameInterval;
  if(measureDirty){
   targetProgress=staticView()?0:clamp(-root.getBoundingClientRect().top/Math.max(1,root.offsetHeight-stage.offsetHeight));
   measureDirty=false;
  }
  // 95% of a scroll change is followed within about 105 ms. Reduced/static
  // selection stays immediate and does not depend on a background animation.
  if(staticView())progress=targetProgress;
  else progress+=(targetProgress-progress)*(1-Math.exp(-delta/35));
  if(Math.abs(targetProgress-progress)<.0005)progress=targetProgress;
  updateContent(manualIndex??modelIndex(storyProgress(progress)));
  root.dataset.evoIntro='false';
  root.style.setProperty('--evo-progress',String(progress));
  const percent=Math.round(progress*100);
  if(percent!==lastPercent){root.querySelector('[data-evo-progress]').textContent=String(percent).padStart(2,'0');lastPercent=percent;}
  const sceneProgress=staticView()?modelChapterProgress[index]:storyProgress(progress);
  root.querySelectorAll('.evolution-fallback>path:last-child').forEach(fallbackLight=>{
   fallbackLight.style.stroke=models[index].light;
   fallbackLight.style.strokeDasharray=models[index].family.startsWith('cob')?'none':models[index].family==='rgb'?'5 10':'3 6';
  });
  if(canRotate())elapsedSeconds+=delta/1000;
  if(scene&&root.dataset.renderer==='ready'){
   scenes.forEach(item=>item.update(index,sceneProgress,pointerX,pointerY,elapsedSeconds));
   renderedFrames++;
  }
  paintDirty=false;
  if(canRotate()||Math.abs(targetProgress-progress)>.0005)frame=requestAnimationFrame(tick);
 }
 const observer=new IntersectionObserver(entries=>{
  const entry=entries[0];visible=entry.isIntersecting&&entry.intersectionRect.height>0&&entry.intersectionRect.width>0;
  if(visible)schedule(true);else stop();
 },{threshold:0});
 observer.observe(stage);
 addEventListener('scroll',()=>{if(!staticView())manualIndex=null;schedule(true);},{passive:true});
 addEventListener('resize',()=>{visible=inViewport();if(visible)schedule(true);else stop();},{passive:true});
 const viewModeChanged=()=>{
  manualIndex=staticView()?Math.max(0,index):null;pointerX=pointerY=0;
  scenes.forEach(item=>item.setMotion?.(!reduced.matches));stop();schedule(true);
 };
 reduced.addEventListener('change',viewModeChanged);shortViewport.addEventListener('change',viewModeChanged);
 function selectChapter(i){
  if(staticView()){
   // Copy and 3w1 controls change the art's vertical position. Measure the
   // selected model's layout, so its lower end stays above the mobile dock.
   manualIndex=i;updateContent(i);schedule(true);
   if(shortViewport.matches){const art=root.querySelector('.evolution-art').getBoundingClientRect();scrollTo({top:Math.max(0,scrollY+art.top+(art.height-innerHeight)/2),behavior:reduced.matches?'instant':'smooth'});}
   return;
  }
  scrollTo({top:Math.ceil(scrollY+root.getBoundingClientRect().top+chapterProgress[i]*(root.offsetHeight-stage.offsetHeight)),behavior:'smooth'});
 }
 root.querySelectorAll('[data-evo-jump]').forEach((button,i)=>{button.dataset.evoJump=String(chapterProgress[i]);button.addEventListener('click',()=>selectChapter(i));});
 root.querySelectorAll('[data-evo-power-mode]').forEach((button,i)=>button.addEventListener('click',()=>selectChapter(i)));
 stage.addEventListener('pointermove',event=>{
  if(staticView()||event.pointerType==='touch')return;
  const rect=stage.getBoundingClientRect();pointerX=(event.clientX-rect.left)/rect.width-.5;pointerY=(event.clientY-rect.top)/rect.height-.5;schedule();
 },{passive:true});
 stage.addEventListener('pointerleave',()=>{pointerX=pointerY=0;schedule();});
 root.evolution={inspect:()=>({progress,targetProgress,index,sku:models[index]?.sku,theme,chapterCount:models.length,renderer:root.dataset.renderer,reducedMotion:reduced.matches,shortViewport:shortViewport.matches,visible,playing:!!canRotate(),elapsedSeconds,renderedFrames,pendingFrame:!!frame,paintDirty,scene:scene?.inspect?.(),variants:scenes.map(item=>item.inspect?.())})};
 updateContent(0);schedule(true);
 import('./strip-evolution-scene.mjs?v=20260926-light1').then(({createEvolutionScene})=>{
  hosts.forEach((host,i)=>{
   const item=createEvolutionScene(host,{presentation:host.dataset.evolutionVersion==='renewed'});
   scenes.push(item);if(i===0)scene=item;
   item.ready?.then(()=>schedule());item.setTheme?.(theme);item.setMotion?.(!reduced.matches);
   const canvas=host.querySelector('canvas');
   canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();root.dataset.renderer='fallback';stop();schedule();});
   canvas.addEventListener('webglcontextrestored',()=>{root.dataset.renderer='ready';schedule(true);});
  });
  root.dataset.renderer='ready';schedule(true);
 }).catch(()=>{root.dataset.renderer='fallback';stop();schedule();});
 addEventListener('prescot:themechange',event=>{theme=event.detail?.theme==='day'?'day':'night';palette();scenes.forEach(item=>item.setTheme?.(theme));schedule();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else{visible=inViewport();schedule(true);}});
 addEventListener('pagehide',()=>{pageActive=false;stop();});
 addEventListener('pageshow',()=>{pageActive=true;visible=inViewport();schedule(true);});
}
