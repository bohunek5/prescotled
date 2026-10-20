// Every quadrant embeds the actual master film. There is no second card layout,
// data renderer, miniature camera or independent light choreography here.
const BASE={width:1920,height:1080};
const overview=document.querySelector('.overview'),playback=document.querySelector('#playback');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const parameters=new URLSearchParams(location.search);
const film=parameters.get('film')==='1'||parameters.get('controls')==='0';
document.documentElement.dataset.film=String(film);
const names={delux:'DELUX',premium:'PREMIUM',cob:'COB i WCOB',special:'SPECIAL'};
let playing=!reduced.matches,ready=false,disposed=false;
let captureTime=null;
const cards=[...document.querySelectorAll('.family')].map(root=>{
 const group=root.dataset.group,frame=document.createElement('iframe');
 frame.className='master-frame';frame.title=names[group]+' · pokaz taśm LED';
 frame.width=BASE.width;frame.height=BASE.height;
 frame.setAttribute('scrolling','no');
 const card={root,group,frame,api:null,scale:1,error:null};
 root.setAttribute('aria-busy','true');root.append(frame);return card;
});
function resize(){
 const sceneScale=Math.min(innerWidth/BASE.width,innerHeight/BASE.height);
 overview.style.setProperty('--overview-scale',sceneScale);
 for(const card of cards){
  const scale=Math.min(card.root.clientWidth/BASE.width,card.root.clientHeight/BASE.height);
  card.scale=scale*sceneScale;
  card.frame.style.setProperty('--film-scale',scale);
  card.api?.setRenderScale(card.scale);
 }
}
function updatePlayback(){
 playback.textContent=playing?'Ⅱ':'▶';playback.setAttribute('aria-pressed',String(!playing));
 playback.setAttribute('aria-label',playing?'Zatrzymaj prezentację':'Wznów prezentację');
}
function setPlaying(value){
 playing=!!value;updatePlayback();
 if(ready)cards.forEach(card=>card.api?.setPlaying(playing));
}
async function load(card){
 await new Promise((resolve,reject)=>{
  card.frame.addEventListener('load',resolve,{once:true});
  card.frame.addEventListener('error',()=>reject(Error('Nie udało się wczytać podglądu.')),{once:true});
  const url=new URL('../model-smd-2835/',location.href);
  url.searchParams.set('family',card.group);url.searchParams.set('embed','1');url.searchParams.set('autoplay','0');
  if(film)url.searchParams.set('film','1');
  url.searchParams.set('scale',String(card.scale));url.searchParams.set('v','quad-master-4');
  card.frame.src=url.href;
 });
 // Apply the approved quadrant spacing only inside these embedded master frames.
 const frameDocument=card.frame.contentDocument;
 frameDocument.documentElement.dataset.overviewFamily=card.group;
 frameDocument.documentElement.dataset.overviewRow=['cob','special'].includes(card.group)?'lower':'upper';
 await new Promise((resolve,reject)=>{
  const stylesheet=frameDocument.createElement('link');stylesheet.rel='stylesheet';
  stylesheet.href=new URL('./master-frame.css?v=4',location.href).href;
  stylesheet.onload=resolve;stylesheet.onerror=()=>reject(Error('Nie udało się wczytać układu podglądu.'));
  frameDocument.head.append(stylesheet);
 });
 const started=performance.now();
 while(!disposed){
  const api=card.frame.contentWindow?.smdViewer;
  if(api?.inspect().ready){
   card.api=api;api.setPlaying(false);api.setRenderScale(card.scale);await api.seek(0);
   card.root.setAttribute('aria-busy','false');return;
  }
  if(performance.now()-started>90000)throw Error('Nie udało się wczytać podglądu.');
  await new Promise(resolve=>setTimeout(resolve,100));
 }
}
const find=group=>{const card=cards.find(card=>card.group===group);if(!card?.api)throw Error('Podgląd jeszcze się wczytuje: '+group);return card;};
async function captureFrame(realSeconds){
 if(!ready)throw Error('Podgląd jeszcze się wczytuje.');
 if(captureTime===null)setPlaying(false);
 captureTime=Math.max(0,Number(realSeconds)||0);
 await Promise.all(cards.map(card=>card.api.captureFrame(captureTime)));
 return window.ledOverview.inspect();
}
window.ledOverview={
 inspect:()=>({ready,playing,theme:'day',master:true,captureTime,
  exportDuration:Math.max(0,...cards.map(card=>card.api?.inspect().exportDuration??0)),
  cards:cards.map(card=>{
  const state=card.api?.inspect();return {group:card.group,ready:!!state?.ready,scale:card.scale,error:card.error,
   product:state?.productId,available:state?.models??[],model:state};
 })}),
 setPlaying,captureFrame,
 setProduct:(group,id,{play=playing}={})=>find(group).api.selectProduct(id,{play}),
 seek:(group,time)=>find(group).api.seek(time,{play:false}),
 dispose(){disposed=true;setPlaying(false);observer.disconnect();}
};
playback.addEventListener('click',()=>setPlaying(!playing));
window.addEventListener('resize',resize);
reduced.addEventListener('change',()=>{if(reduced.matches)setPlaying(false);});
window.addEventListener('pagehide',event=>{if(!event.persisted)window.ledOverview.dispose();});
const observer=new ResizeObserver(resize);observer.observe(overview);
resize();updatePlayback();
await Promise.all(cards.map(card=>load(card).catch(error=>{
 card.error=error.message;card.root.setAttribute('aria-busy','false');
 const notice=document.createElement('p');notice.className='frame-error';notice.textContent=error.message;card.root.append(notice);
})));
ready=cards.every(card=>!!card.api);resize();setPlaying(playing);
