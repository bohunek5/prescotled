// The original product keeps its position through drawing, water and protection views.
export function initScharferImmersion(root){
 const stage=root.querySelector('[data-sch-water-stage]'),canvas=root.querySelector('[data-sch-water]'),ctx=canvas.getContext('2d'),fallback=root.querySelector('.sch-fallback');
 if(!ctx)return{inspect:()=>({supported:false}),destroy(){}};
 const buttons=[...root.querySelectorAll('[data-sch-voltage]')],tabs=[...root.querySelectorAll('[data-sch-feature-select]')],state=root.querySelector('[data-sch-state]');
 const abort=new AbortController(),signal=abort.signal,reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let width=0,height=0,voltage='24',theme=document.documentElement.dataset.theme||'night',feature='power',frames=0,timer=0,raf=0,lastFrame=0,visible=false,manual=false,pageActive=true,progress=0,waterTime=0,hoveredTab=null,focusedTab=null,dueAt=0,remaining=6500,productBounds=null;
 const photos=new Map(),drawings=new Map(),features=['power','water','protection'],durations={power:6500,water:7500,protection:9000};
 // A native canvas edge drawing follows the actual housing, ribs, screws and label.
 // It is built once from the original image, not an invented product silhouette.
 function technicalDrawing(img){
  const w=1200,h=Math.round(w*img.height/img.width),source=document.createElement('canvas');source.width=w;source.height=h;
  const sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(img,0,0,w,h);const pixels=sc.getImageData(0,0,w,h).data,lum=new Float32Array(w*h),edge=new Uint8ClampedArray(w*h);
  for(let i=0;i<lum.length;i++){const n=i*4;lum[i]=pixels[n]*.2126+pixels[n+1]*.7152+pixels[n+2]*.0722;}
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
   const i=y*w+x,n=i*4;if(pixels[n+3]<20)continue;
   const gx=-lum[i-w-1]-2*lum[i-1]-lum[i+w-1]+lum[i-w+1]+2*lum[i+1]+lum[i+w+1],gy=-lum[i-w-1]-2*lum[i-w]-lum[i-w+1]+lum[i+w-1]+2*lum[i+w]+lum[i+w+1];
   const silhouette=Math.min(pixels[(i-1)*4+3],pixels[(i+1)*4+3],pixels[(i-w)*4+3],pixels[(i+w)*4+3])<110;
   edge[i]=silhouette?210:Math.min(175,Math.max(0,(Math.hypot(gx,gy)-25)*1.3))*pixels[n+3]/255;
  }
  return ['night','day'].map(t=>{const c=document.createElement('canvas');c.width=w;c.height=h;const cc=c.getContext('2d'),data=cc.createImageData(w,h),rgb=t==='night'?[225,237,234]:[29,47,50];for(let i=0;i<edge.length;i++){const n=i*4;data.data[n]=rgb[0];data.data[n+1]=rgb[1];data.data[n+2]=rgb[2];data.data[n+3]=edge[i];}cc.putImageData(data,0,0);return c;});
 }
 for(const value of ['12','24']){const img=new Image();img.onload=()=>{photos.set(value,img);drawings.set(value,technicalDrawing(img));if(value===voltage){root.classList.add('sch-canvas-ready');paint();motion();}};img.src=`/prescotled/noir/media/scharfer-showcase/sch-400-${value}.webp`;}
 function wave(x,y){const a=reduced.matches?0:1.8;return y+a*Math.sin(x*.018+waterTime*.0012)+a*.42*Math.sin(x*.037-waterTime*.0009);}
 function waterPath(y,below){ctx.beginPath();ctx.moveTo(0,below?height:0);ctx.lineTo(0,wave(0,y));for(let x=0;x<=width+8;x+=8)ctx.lineTo(x,wave(x,y));ctx.lineTo(width,below?height:0);ctx.closePath();}
 function paint(){
  ctx.clearRect(0,0,width,height);const img=photos.get(voltage);if(!img)return;
  const pw=Math.min(width*.94,height*.92*img.width/img.height),ph=pw*img.height/img.width,left=(width-pw)/2,top=(height-ph)/2,waterY=top+ph*.48;
  productBounds={x:left,y:top,width:pw,height:ph};
  if(feature==='power'){
   const fill=reduced.matches?1:progress;
   const edge=drawings.get(voltage)?.[theme==='day'?1:0];if(edge&&fill<1){ctx.save();ctx.beginPath();ctx.rect(left+pw*fill,top,pw*(1-fill),ph);ctx.clip();ctx.drawImage(edge,left,top,pw,ph);ctx.restore();}
   if(fill>0){ctx.save();ctx.beginPath();ctx.rect(left,top,pw*fill,ph);ctx.clip();ctx.drawImage(img,left,top,pw,ph);ctx.restore();}
   if(fill>0&&fill<1){ctx.save();const x=left+pw*fill;ctx.beginPath();ctx.rect(x-1.5,top,3,ph);ctx.clip();ctx.drawImage(img,left,top,pw,ph);ctx.globalCompositeOperation='source-atop';ctx.fillStyle=theme==='day'?'#f8964370':'#e1f6ee70';ctx.fillRect(x-1.5,top,3,ph);ctx.restore();}
  }else if(feature==='water'){
   ctx.save();waterPath(waterY,false);ctx.clip();ctx.drawImage(img,left,top,pw,ph);ctx.restore();
   ctx.save();waterPath(waterY,true);ctx.clip();ctx.globalAlpha=theme==='day'?.86:.82;ctx.drawImage(img,left+1.2,top+.6,pw,ph);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-atop';ctx.fillStyle=theme==='day'?'#6bafbd19':'#217b962b';ctx.fillRect(0,waterY-5,width,height-waterY+5);ctx.restore();
   ctx.save();ctx.beginPath();for(let x=0;x<=width+8;x+=8){const y=wave(x,waterY);x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle=theme==='day'?'#d3eff25e':'#acd9e545';ctx.lineWidth=.8;ctx.stroke();ctx.restore();
  }else ctx.drawImage(img,left,top,pw,ph);
  stage.style.setProperty('--sch-waterline',waterY+'px');stage.style.setProperty('--sch-wave-offset',feature==='water'?(Math.sin(waterTime*.001)*.8).toFixed(2)+'px':'0px');
  root.dataset.immersionPhase=feature==='water'?'immersed':feature==='power'&&progress<1?'drawing':feature;frames++;
 }
 function copy(){
  const label=root.querySelector('[data-sch-label]'),value=root.querySelector('[data-sch-value]');
  label.textContent=feature==='water'?'SZCZELNA OBUDOWA':feature==='power'?'PEŁNA MOC · PEŁNE OBCIĄŻENIE':'OCHRONA WYJŚCIA';
  value.textContent=feature==='water'?'IP67':feature==='power'?'100%':'SCP · OLP';
  state.textContent=feature==='water'?'Ochrona przed wodą i pyłem.':feature==='power'?`400 W · ${voltage==='12'?'33,3':'16,7'} A · ${voltage} V DC`:'Samoczynny powrót do pracy.';
  const note=root.querySelector('[data-sch-note]');
  if(note)note.textContent=feature==='water'?'Ochrona przed pyłem i skutkami czasowego zanurzenia.':'Pełne obciążenie zgodnie z warunkami karty produktu.';
 }
 function permitted(){return visible&&pageActive&&!document.hidden;}
 function stopMotion(){cancelAnimationFrame(raf);raf=0;lastFrame=0;}
 function motion(){
  if(!permitted()||reduced.matches){stopMotion();if(reduced.matches&&feature==='power'){progress=1;paint();}return;}
  if(raf||feature==='protection'||(feature==='power'&&progress>=1))return;
  raf=requestAnimationFrame(tick);
 }
 function tick(now){
  raf=0;if(!permitted()||reduced.matches){
   stopTimer();if(reduced.matches&&feature==='power'&&progress<1){progress=1;paint();}return;
  }
  if(!lastFrame)lastFrame=now;const delta=now-lastFrame;
  if(delta>=32){lastFrame=now;const elapsed=Math.min(delta,80);if(feature==='power')progress=Math.min(1,progress+elapsed/1450);if(feature==='water')waterTime+=elapsed;paint();}
  if(feature==='water'||(feature==='power'&&progress<1))raf=requestAnimationFrame(tick);else lastFrame=0;
 }
 function stopTimer(preserve=true){if(timer&&preserve)remaining=Math.max(0,dueAt-performance.now());clearTimeout(timer);timer=0;dueAt=0;}
 function schedule(){
  motion();
  if(!permitted()||reduced.matches||hoveredTab||focusedTab){stopTimer();return;}
  if(timer)return;
  dueAt=performance.now()+remaining;
  timer=setTimeout(()=>{
   timer=0;dueAt=0;
   if(!permitted()||reduced.matches||hoveredTab||focusedTab){remaining=durations[feature];motion();return;}
   manual=false;chooseFeature(features[(features.indexOf(feature)+1)%3],false);
  },remaining);
 }
 function chooseFeature(next,user=true,replay=false){
  if(!features.includes(next))return;if(user)manual=true;
  stopTimer(false);remaining=durations[next];
  const changed=feature!==next;feature=next;if(changed||replay){stopMotion();if(feature==='power')progress=reduced.matches?1:0;}
  root.dataset.schFeature=feature;tabs.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.schFeatureSelect===feature)));copy();paint();schedule();
 }
 function chooseVoltage(value){if(!['12','24'].includes(value))return;voltage=value;root.dataset.voltage=value;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.schVoltage===value)));root.querySelector('[data-sch-model]').textContent=`SCH-400-${value} · 400 W`;fallback.src=`/prescotled/noir/media/scharfer-showcase/sch-400-${value}.webp`;fallback.alt=`Zasilacz Scharfer SCH-400-${value}, aluminiowa obudowa IP67`;copy();paint();}
 buttons.forEach(b=>b.addEventListener('click',()=>chooseVoltage(b.dataset.schVoltage),{signal}));
 tabs.forEach((b,index)=>{
  b.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'){hoveredTab=b;chooseFeature(b.dataset.schFeatureSelect);}},{signal});
  b.addEventListener('pointerleave',()=>{if(hoveredTab===b)hoveredTab=null;schedule();},{signal});
  b.addEventListener('pointerdown',()=>{focusedTab=null;},{signal});
  b.addEventListener('click',()=>chooseFeature(b.dataset.schFeatureSelect,true,true),{signal});
  b.addEventListener('focus',()=>{focusedTab=b.matches(':focus-visible')?b:null;chooseFeature(b.dataset.schFeatureSelect);},{signal});
  b.addEventListener('blur',()=>{if(focusedTab===b)focusedTab=null;schedule();},{signal});
  b.addEventListener('keydown',e=>{const n=e.key==='ArrowRight'?(index+1)%3:e.key==='ArrowLeft'?(index+2)%3:e.key==='Home'?0:e.key==='End'?2:null;if(n!==null){e.preventDefault();tabs[n].focus();}},{signal});
 });
 function resize(){const r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.75);width=r.width;height=r.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);paint();}
 const ro=new ResizeObserver(resize);ro.observe(stage);
 function actualVisibility(){const r=root.getBoundingClientRect();visible=Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(0,r.top))>Math.min(r.height,innerHeight)*.12;}
 const io=new IntersectionObserver(()=>{actualVisibility();schedule();},{threshold:[0,.01,.12,.5]});io.observe(root);
 function motionPreferenceChanged(){if(reduced.matches)progress=1;actualVisibility();paint();schedule();}
 // Keep this native MediaQueryList listener explicit; remove it at teardown.
 reduced.addEventListener('change',motionPreferenceChanged);
 document.addEventListener('visibilitychange',()=>{actualVisibility();schedule();},{signal});
 addEventListener('pagehide',()=>{pageActive=false;stopTimer();stopMotion();},{signal});
 addEventListener('pageshow',()=>{pageActive=true;actualVisibility();schedule();},{signal});
 addEventListener('prescot:themechange',e=>{theme=e.detail?.theme||document.documentElement.dataset.theme;paint();},{signal});
 root.dataset.schFeature='power';if(reduced.matches)progress=1;copy();resize();actualVisibility();schedule();
 return root.scharferController={inspect:()=>({voltage,theme,feature,running:!!timer||!!raf,pending:!!timer||!!raf,static:!raf,phase:root.dataset.immersionPhase,frames,manual,powerProgress:progress,waterTime,visible,active:permitted(),held:!!hoveredTab||!!focusedTab,remainingMs:timer?Math.max(0,dueAt-performance.now()):remaining,stageDurationMs:durations[feature],productBounds,reduced:reduced.matches}),destroy(){stopTimer();stopMotion();reduced.removeEventListener('change',motionPreferenceChanged);abort.abort();ro.disconnect();io.disconnect();delete root.scharferController;}};
}
