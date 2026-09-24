/** PR Touch: native controls, authentic remotes, one visible-card animation loop. */
let touchFilterSerial=0;
export function initTouchCard(card){
 const demo=card.querySelector('.touch-panels-demo');if(!demo)return{start(){},stop(){}};
 const compact=matchMedia('(max-width:900px)'),clamp=v=>Math.max(0,Math.min(1,v));
 let running=false,reduced=false,frame=0,last=0,elapsed=0,frames=0,selected='cct';
 let pointerFamily=null,focusFamily=null,dragFamily=null,engaged=null,preferFocus=false;
 let theme=document.documentElement.dataset.theme==='day'?'day':'night';
 const panels=[...demo.querySelectorAll('[data-touch-panel]')].map(el=>({el,family:el.dataset.touchPanel,kind:el.dataset.touchKind,white:false,value:el.dataset.touchPanel==='cct'?.35:.76,level:.7,shownLevel:.7,shownValue:el.dataset.touchPanel==='cct'?.35:.76,x:0,y:0,interacted:false,input:el.querySelector('[data-touch-value]'),levelInput:el.querySelector('[data-touch-level]'),readout:el.querySelector('[data-touch-readout]'),brightness:el.querySelector('[data-touch-brightness]')}));
 const visible=p=>!compact.matches||p.family===selected;
 function colour(p,v){
  if(p.family==='mono')return{rgb:[1,.86,.66],label:'Jedna barwa'};
  if(p.family==='cct'||p.white&&p.kind==='rgbcct'){
   const a=[1,.64,.29],b=[.53,.76,1],rgb=a.map((n,i)=>n+(b[i]-n)*v);
   return{rgb,label:v<.3?'Ciepła biel':v>.7?'Chłodna biel':'Neutralna biel'};
  }
  if(p.white)return{rgb:[1,.99,.94],label:'Osobny kanał bieli'};
  const hue=v*360;
  const h=(v*6)%6,c=.94,x=c*(1-Math.abs(h%2-1));
  const rgb=(h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x]).map(n=>n+.06);
  return{rgb,label:hue<25||hue>340?'Czerwień':hue<65?'Bursztyn':hue<165?'Zieleń':hue<210?'Turkus':hue<265?'Błękit':'Fiolet'};
 }
 function paint(p,dt=0){
  const idle=p.family!==engaged&&!reduced&&running,phase=(elapsed-(p.idleSince??0))*.27+(p.idleSince===undefined?(p.family==='cct'?1.3:p.family==='color'?2.2:0):0);
  const targetLevel=idle&&p.family==='mono'?clamp(p.level+Math.sin(phase)*.085):p.level;
  const targetValue=idle&&p.family!=='mono'?clamp(p.value+Math.sin(phase*.75)*.13):p.value;
  const alpha=reduced||!dt?1:1-Math.exp(-dt/60);
  p.shownLevel+=(targetLevel-p.shownLevel)*alpha;p.shownValue+=(targetValue-p.shownValue)*alpha;
  const light=colour(p,p.shownValue);
  p.lightRgb??=[...light.rgb];p.lightRgb=p.lightRgb.map((n,i)=>n+(light.rgb[i]-n)*alpha);
  p.el.style.setProperty('--tp-light',`rgb(${p.lightRgb.map(n=>Math.round(n*255)).join(' ')})`);p.el.style.setProperty('--tp-level',p.shownLevel.toFixed(3));
  // Relight the photograph itself, preserving its luminance, grain and depth.
  // Day retains ambient daylight; night can become dark when the LED is off.
  const ambient=theme==='day'?.24:.025,energy=(theme==='day'?.94:1.52)*Math.pow(p.shownLevel,.8);
  const gain=p.lightRgb.map(n=>ambient+energy*n),luma=[.2126,.7152,.0722],neutral=.57;
  const matrix=gain.flatMap((g,row)=>[...luma.map((l,col)=>g*(neutral*l+(row===col?1-neutral:0))),0,0]).concat([0,0,0,1,0]);
  const values=matrix.map(n=>n.toFixed(5)).join(' ');
  if(p.filter&&values!==p.filterValue){p.filter.setAttribute('values',values);p.filterValue=values;}
  p.el.style.setProperty('--tp-x',(reduced?0:p.x).toFixed(2)+'px');p.el.style.setProperty('--tp-y',(reduced?0:p.y).toFixed(2)+'px');p.el.style.setProperty('--tp-tilt',(reduced?0:p.x*.38).toFixed(2)+'deg');
  p.readout.textContent=light.label;p.brightness.textContent=String(Math.round(p.shownLevel*100));
  if(idle){p.levelInput.value=String(Math.round(p.shownLevel*100));if(p.input)p.input.value=String(Math.round(p.shownValue*100));}
 }
 function loop(now){
  frame=0;if(!running||reduced||document.hidden)return;
  if(last&&now-last<1000/30-.5){frame=requestAnimationFrame(loop);return;}
  const dt=last?Math.min(100,now-last):1000/30;last=now;elapsed+=dt/1000;panels.filter(visible).forEach(p=>paint(p,dt));frames++;frame=requestAnimationFrame(loop);
 }
 function settle(p){p.interacted=true;if(reduced||!running)paint(p);else if(!frame&&!document.hidden)frame=requestAnimationFrame(loop);}
 function mode(p,kind){
  p.kind=kind;p.el.dataset.touchKind=kind;if(kind==='rgb')p.white=false;
  p.el.querySelector('.tp-remote>img').src=`/prescotled/assets/showcase/${kind}-remote.webp`;
  
  p.el.querySelector('[data-touch-sku]').textContent='PR-'+kind.toUpperCase()+'-12A';
  p.el.querySelectorAll('[data-touch-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.touchMode===kind)));
  const channel=p.el.querySelector('.tp-channels');if(channel)channel.hidden=kind==='rgb';
  channelMode(p,p.white);settle(p);
 }
 function channelMode(p,white){
  p.white=white&&p.kind!=='rgb';p.el.dataset.touchWhite=String(p.white);
  p.el.querySelectorAll('[data-touch-channel]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.touchChannel==='white')===p.white)));
  p.el.querySelector('.tp-color-slider').hidden=p.white&&p.kind==='rgbw';
  p.el.querySelector('[data-touch-value-label]').textContent=p.white?'Temperatura bieli':'Barwa';
  p.input.setAttribute('aria-label','Kolor — '+(p.white?'temperatura bieli':'barwa'));settle(p);
 }
 for(const p of panels){
  const filter=p.el.querySelector('.tp-room-filter filter');p.filter=filter?.querySelector('feColorMatrix, fecolormatrix');
  if(filter){filter.id='pr-touch-room-'+(++touchFilterSerial);p.el.querySelector('.tp-room').style.filter=`url("#${filter.id}")`;}
  p.levelInput.addEventListener('input',()=>{p.level=Number(p.levelInput.value)/100;settle(p)});
  p.input?.addEventListener('input',()=>{p.value=Number(p.input.value)/100;settle(p)});
  p.el.querySelectorAll('[data-touch-mode]').forEach(b=>b.addEventListener('click',()=>mode(p,b.dataset.touchMode)));
  p.el.querySelectorAll('[data-touch-channel]').forEach(b=>b.addEventListener('click',()=>channelMode(p,b.dataset.touchChannel==='white')));
  paint(p);
 }
 function family(next){selected=next;demo.dataset.touchFamily=next;demo.querySelectorAll('[data-touch-family]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.touchFamily===next)));panels.filter(visible).forEach(p=>paint(p));}
 demo.querySelectorAll('[data-touch-family]').forEach(b=>b.addEventListener('click',()=>family(b.dataset.touchFamily)));
 compact.addEventListener('change',()=>family(selected));family(selected);
 addEventListener('prescot:themechange',e=>{theme=e.detail?.theme==='day'?'day':'night';panels.filter(visible).forEach(p=>paint(p))});
 function chooseEngaged(){
  const next=dragFamily||(preferFocus?(focusFamily||pointerFamily):(pointerFamily||focusFamily));if(next===engaged)return;
  const previous=panels.find(p=>p.family===engaged);if(previous)previous.idleSince=elapsed;
  engaged=next;
  // Hand control over at the currently displayed value, without a jump back.
  const p=panels.find(p=>p.family===next);if(p){p.level=p.shownLevel;p.value=p.shownValue;p.levelInput.value=String(Math.round(p.level*100));if(p.input)p.input.value=String(Math.round(p.value*100));}
 }
 card.addEventListener('pointermove',e=>{
  if(!running||e.pointerType==='touch')return;
  pointerFamily=null;preferFocus=false;
  for(const p of panels){if(!visible(p))continue;const r=p.el.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){pointerFamily=p.family;break;}}
  chooseEngaged();
 },{passive:true});
 card.addEventListener('pointerleave',()=>{pointerFamily=null;chooseEngaged()},{passive:true});
 card.addEventListener('pointerdown',e=>{if(e.target.matches('input[type=range]')){dragFamily=e.target.closest('[data-touch-panel]')?.dataset.touchPanel||null;chooseEngaged()}},{passive:true});
 addEventListener('pointerup',()=>{dragFamily=null;chooseEngaged()},{passive:true});
 addEventListener('pointercancel',()=>{dragFamily=null;chooseEngaged()},{passive:true});
 card.addEventListener('focusin',e=>{preferFocus=true;focusFamily=e.target.closest('[data-touch-panel]')?.dataset.touchPanel||null;chooseEngaged()});
 card.addEventListener('focusout',e=>{focusFamily=e.relatedTarget?.closest?.('[data-touch-panel]')?.dataset.touchPanel||null;chooseEngaged()});

 const controller={
  start(options={}){reduced=Boolean(options.reduced);running=true;last=0;panels.filter(visible).forEach(p=>paint(p));if(!reduced&&!frame&&!document.hidden)frame=requestAnimationFrame(loop)},
  stop(){running=false;cancelAnimationFrame(frame);frame=0;last=0;pointerFamily=dragFamily=null;engaged=focusFamily;panels.forEach(p=>{p.x=p.y=0;p.el.style.setProperty('--tp-x','0px');p.el.style.setProperty('--tp-y','0px');p.el.style.setProperty('--tp-tilt','0deg')})},
  inspect:()=>({running,reduced,theme,pendingFrame:!!frame,frames,selected,engaged,visiblePanels:panels.filter(visible).map(p=>p.family),panels:panels.map(p=>({family:p.family,kind:p.kind,white:p.white,value:p.shownValue,level:p.shownLevel,interacted:p.interacted,automatic:running&&!reduced&&p.family!==engaged,lightRgb:p.lightRgb,filter:p.filterValue}))})
 };
 return controller;
}
