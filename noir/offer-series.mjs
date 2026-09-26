import {evolutionModels as models,chapterProgress,modelChapterProgress,modelIndex,storyProgress,setPowerMode,brandState} from './offer-series-models.mjs?v=20260926-light1';
const root=document.querySelector('[data-evo-series-preview]');
if(root){
 const stage=root.querySelector('.evolution-stage'),hosts=[...root.querySelectorAll('.evolution-canvas')];
 const scenes=[];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const shortViewport=matchMedia('(max-height:739px), (max-width:1100px)');
 const staticView=()=>reduced.matches||shortViewport.matches;

 let scene=null,frame=0,progress=0,targetProgress=0,index=-1,pointerX=0,pointerY=0,manualIndex=null;
 let visible=false,pageActive=true,measureDirty=true,paintDirty=true,lastPaint=0,nextPaint=0,elapsedSeconds=0,renderedFrames=0;
 let lastPercent=-1,brandSeconds=0,lastBrandStep=-2,lastBrandHeadline='marka.';
 let theme=document.documentElement.dataset.theme==='day'?'day':'night';
 function palette(){
  const m=models[Math.max(0,index)];root.style.setProperty('--evo-ink',theme==='day'?m.dayInk:m.ink);
  root.querySelectorAll('[data-evo-jump]').forEach((button,i)=>{
   button.style.setProperty('--chapter-light',models[i].light);
   button.style.setProperty('--chapter-ink',theme==='day'?models[i].dayInk:models[i].ink);
   button.dataset.lightKind=['rgb','cobdigital','custom'].includes(models[i].family)?'rgb':'white';
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
 const field=(name)=>root.querySelector('[data-evo-'+name+']');
 function fillFacts(m){
  for(const key of ['color','density','power','output'])delete field(key).dataset.value;
  for(const name of ['color','unit','colorCopy','tech','techLabel','output','outputUnit','outputLabel','quality','qualityUnit','qualityLabel','detail'])field(name.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())).textContent=m[name];
  field('density').innerHTML=m.density+' <small>LED/m</small>';
  field('power').innerHTML=m.power+' <small>W/m</small>';
  field('voltage').textContent=m.voltage+' V DC';field('voltage-value').textContent=m.voltage;
  field('cut').textContent='CIĘCIE '+m.cut+' mm';field('width').textContent='PCB '+m.width+' mm';
  field('ip').textContent=m.ip;field('beam').textContent=m.beam==='—'?'—':m.beam+'°';
 }
 function updateContent(next,force=false){
  if(next===index&&!force)return;
  const changed=next!==index;index=next;const m=models[index],custom=m.family==='custom';
  root.dataset.evolutionMode=m.family;root.dataset.brandIntro=String(custom);if(changed){brandSeconds=0;lastBrandStep=-2;lastBrandHeadline='YOUR BRAND';field('range').getAnimations().forEach(a=>a.cancel());field('name').getAnimations().forEach(a=>a.cancel());}
  field('family-label').textContent=custom?'PROJEKT INDYWIDUALNY':m.range+' '+m.name;
  field('range').textContent=custom?'Twoja własna':m.range;
  field('name').textContent=custom?'marka.':m.name;
  field('series-description').textContent=custom?'zaprojektowana dla Twojej marki.':m.id==='3w1'?'z trzema poziomami mocy.':m.id==='cobip67'?'w przezroczystej osłonie.':'z serii '+m.range+' '+m.name+'.';
  field('index').textContent=m.index;field('title').textContent=m.title.replace(/<br\s*\/?>(?:\s*)/gi,' ');field('copy').textContent=m.copy;
  fillFacts(m);
  field('power-modes').hidden=index!==0;
  root.querySelectorAll('[data-evo-power-mode]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===m.mode)));
  field('years').textContent=custom?'01':m.warranty;
  field('warranty-label').textContent=custom?'Twoja konfiguracja':m.warranty===3?'lata gwarancji':'lat gwarancji';
  field('origin').hidden=!m.polish;
  field('config-note').hidden=!custom;
  const link=field('model');link.hidden=custom;link.href='/prescotled/tasmy-led/'+m.slug+'/#model-'+m.sku.toLowerCase().replace(/[^a-z0-9]+/g,'-');link.innerHTML=m.sku+' <b aria-hidden="true">↗</b>';
  const family=field('family-link');family.href=custom?'https://www.prescot.pl/tasmy-led-pod-marka-klienta/':'/prescotled/tasmy-led/'+m.slug+'/';family.innerHTML=(custom?'Porozmawiajmy o Twojej taśmie':'Poznaj rodzinę')+' <span aria-hidden="true">↗</span>';
  palette();root.style.setProperty('--evo-hue',m.hue);
  root.querySelectorAll('[data-evo-jump]').forEach((b,i)=>{b.setAttribute('aria-current',i===index?'step':'false');if(i===index&&changed){const rail=b.parentElement;rail.scrollLeft=Math.max(0,b.offsetLeft-rail.clientWidth/2+b.offsetWidth/2);refreshRail();}});
  if(!reduced.matches)root.querySelectorAll('.evolution-fact>strong,.evolution-color-hud>p,.evolution-caption').forEach(el=>el.animate([{opacity:.55,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:340,easing:'ease-out'}));
 }
 function paintBrand(state){
  const {a,b,blend,model:chosen,step,intro}=state;
  if(step!==lastBrandStep){fillFacts(chosen);field('years').textContent=intro?'00':String(step+1).padStart(2,'0');lastBrandStep=step;}
  const headline=intro?'marka.':chosen.headline;
  if(headline!==lastBrandHeadline){
   root.dataset.brandIntro=String(intro);
   field('range').textContent=intro?'Twoja własna':'A może…';field('name').textContent=headline;lastBrandHeadline=headline;
   field('title').textContent=intro?'Twój pomysł. Twoja marka.':chosen.title;
   field('copy').textContent=intro?models.at(-1).copy:chosen.copy;
   if(!reduced.matches)for(const el of[field('range'),field('name')]){el.getAnimations().forEach(a=>a.cancel());el.animate([{opacity:.3,filter:'blur(3px)',transform:'translateY(4px)'},{opacity:1,filter:'blur(0)',transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.2,.7,.2,1)'});}
  }
  // Animate only compatible quantities in the individual-project examples.
  for(const [key,selector,unit,digits]of[['density','density','LED/m',0],['power','power','W/m',1],['output','output','',0],['color','color','',0]]){
   if(key==='output'&&a.outputUnit!==b.outputUnit||key==='color'&&a.unit!==b.unit)continue;
   const x=Number(a[key].replace(',','.')),y=Number(b[key].replace(',','.'));if(!Number.isFinite(x)||!Number.isFinite(y))continue;
   const value=(x+(y-x)*blend).toLocaleString('pl-PL',{maximumFractionDigits:digits}),el=field(selector);
   if(el.dataset.value!==value){el.innerHTML=value+(unit?' <small>'+unit+'</small>':'');el.dataset.value=value;}
  }
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
  if(canRotate()){elapsedSeconds+=delta/1000;if(models[index].family==='custom')brandSeconds+=delta/1000;}
  const sample=models[index].family==='custom'?brandState(brandSeconds):null;
  if(sample)paintBrand(sample);
  if(scene&&root.dataset.renderer==='ready'){
   scenes.forEach(item=>item.update(index,sceneProgress,pointerX,pointerY,elapsedSeconds,sample));
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
 root.querySelectorAll('[data-evo-power-mode]').forEach((button,i)=>button.addEventListener('click',()=>{setPowerMode(i);updateContent(0,true);schedule();}));
 stage.addEventListener('pointermove',event=>{
  if(staticView()||event.pointerType==='touch')return;
  const rect=stage.getBoundingClientRect();pointerX=(event.clientX-rect.left)/rect.width-.5;pointerY=(event.clientY-rect.top)/rect.height-.5;schedule();
 },{passive:true});
 stage.addEventListener('pointerleave',()=>{pointerX=pointerY=0;schedule();});
 root.evolution={inspect:()=>({progress,targetProgress,index,sku:models[index]?.sku,theme,chapterCount:models.length,brandSeconds,brandStep:lastBrandStep,powerMode:models[0].mode,renderer:root.dataset.renderer,reducedMotion:reduced.matches,shortViewport:shortViewport.matches,visible,playing:!!canRotate(),elapsedSeconds,renderedFrames,pendingFrame:!!frame,paintDirty,scene:scene?.inspect?.(),variants:scenes.map(item=>item.inspect?.())})};
 updateContent(0);schedule(true);
 import('./offer-series-scene.mjs?v=20260926-light1').then(({createEvolutionScene})=>{
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
