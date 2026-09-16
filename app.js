import {series} from './data/series.js';
import {applications,configuratorUrl,configurationLink} from './config.js?v=4';
import {mountNavigation} from './navigation.js?v=4';

const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const asset=path=>new URL(path,import.meta.url).href;
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
document.querySelectorAll('[data-config]').forEach(el=>el.href=asset('konfigurator/'));
mountNavigation();
window.siteDebug={};

if($('series-search')){
 const params=new URLSearchParams(location.search);
 let warranty=['all','7','5','3'].includes(params.get('gwarancja'))?params.get('gwarancja'):(document.body.dataset.page==='tasmy-led'?'all':'7');
 $('series-search').value=params.get('szukaj')||'';
 const tidy=value=>value.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('ł','l');
 function filter(save=false){
  const query=tidy($('series-search').value.trim());let count=0;
  document.querySelectorAll('.series-card').forEach(card=>{const item=series.find(s=>s.id===card.dataset.series),visible=(warranty==='all'||item.warrantyYears===+warranty)&&(!query||tidy([item.name,item.eyebrow,item.description,...item.features,item.application].join(' ')).includes(query));card.hidden=!visible;if(visible)count++;});
  document.querySelectorAll('[data-warranty]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.warranty===warranty)));
  $('series-count').textContent=count===1?'1 seria':`${count} ${count>1&&count<5?'serie':'serii'}${warranty==='all'?' PRESCOT LED':` · ${warranty} ${warranty==='3'?'lata':'lat'} gwarancji`}`;
  $('series-empty').hidden=count!==0;
  if(save){const url=new URL(location.href);url.searchParams.set('gwarancja',warranty);if(query)url.searchParams.set('szukaj',$('series-search').value);else url.searchParams.delete('szukaj');history.replaceState(null,'',url);}
 }
 document.querySelectorAll('[data-warranty]').forEach(button=>button.addEventListener('click',()=>{warranty=button.dataset.warranty;filter(true);}));
 $('series-search').addEventListener('input',()=>{if($('series-search').value.trim())warranty='all';filter(true);});
 filter();
 Object.defineProperties(window.siteDebug,{warranty:{get:()=>warranty},visibleSeries:{get:()=>[...document.querySelectorAll('.series-card:not([hidden])')].map(c=>c.dataset.series)}});
}
if($('application-config')){
 let application='kitchen',imageRequest=0;
 async function chooseApplication(key){
  const item=applications[key];if(!item)return;application=key;const request=++imageRequest;
  document.querySelectorAll('[data-application]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.application===key)));
  $('application-title').textContent=item.title;$('application-description').textContent=item.description;$('application-config').href=asset(configurationLink(item.state));
  const image=new Image();image.src=asset(item.image);await image.decode().catch(()=>{});if(request!==imageRequest)return;
  $('application-image').src=asset(item.image);$('application-image').alt=`Inspiracja oświetlenia: ${item.name.toLocaleLowerCase('pl')}`;
  document.querySelector('.scene-label').textContent=`INSPIRACJA / 0${Object.keys(applications).indexOf(key)+1}`;
 }
 document.querySelectorAll('[data-application]').forEach(button=>button.addEventListener('click',()=>chooseApplication(button.dataset.application)));
 $('application-config').href=asset(configurationLink(applications.kitchen.state));
 Object.defineProperty(window.siteDebug,'application',{get:()=>application});
}
if($('production-play')){
 const videoDialog=$('video-dialog'),video=videoDialog.querySelector('video');let videoOpener=null;
 $('production-play').addEventListener('click',()=>{videoOpener=document.activeElement;videoDialog.showModal();document.body.classList.add('modal-open');const source=asset(matchMedia('(max-width:640px)').matches?'assets/production-mobile.mp4':'assets/production-desktop.mp4');if(video.src!==source){video.src=source;video.load();}video.play().catch(()=>{});});
 videoDialog.querySelector('.close-button').addEventListener('click',()=>videoDialog.close());
 videoDialog.addEventListener('click',e=>{if(e.target===videoDialog){const r=videoDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)videoDialog.close();}});
 videoDialog.addEventListener('close',()=>{video.pause();document.body.classList.remove('modal-open');videoOpener?.focus();});
}
if($('assembly-film')){
 let previewPromise;
 function startPreview(auto=false){return previewPromise??=(async()=>{const {mountAssemblyPreview}=await import('./preview.js?v=4');return mountAssemblyPreview($('assembly-film'),$('film-play'),$('film-phase'),{auto});})();}
 $('film-play').addEventListener('click',()=>{if(!previewPromise)startPreview(true).catch(()=>{});});
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();startPreview(!reduced.matches).catch(()=>{});}},{rootMargin:'100px 0px',threshold:.08});observer.observe($('pokaz'));
}
if($('component-viewer'))import('./components.js?v=4').then(({mountComponents})=>mountComponents()).catch(()=>{});

if($('configurator-frame')){
 const frame=$('configurator-frame'),loading=$('configurator-loading');
 function syncConfig(){
  // Only configuration fragments reach the existing application; the destination stays fixed.
  const fragment=location.hash.startsWith('#config=')?location.hash:'';
  const target=configuratorUrl+fragment;
  loading.hidden=false;frame.src=target;
  document.querySelectorAll('[data-open-studio]').forEach(a=>a.href=target);
 }
 let readinessTimer;
 frame.addEventListener('load',()=>{
  // Same-origin on GitHub Pages. Local previews use the cross-origin load event.
  let ready=false;
  function finish(){loading.hidden=true;clearTimeout(readinessTimer);ready=true;}
  try{
   const doc=frame.contentDocument;
   if(!doc){finish();return;}
   const back=doc.querySelector('.website-return'),brand=doc.querySelector('a.brand');
   if(back){back.href=asset('tasmy-led/');back.target='_parent';back.setAttribute('aria-label','Wróć do taśm LED');const label=back.querySelector('span');if(label)label.textContent='Wróć do taśm LED';}
   if(brand){brand.href=asset('./');brand.target='_parent';}
   if(doc.querySelector('canvas')){finish();return;}
   const observer=new MutationObserver(()=>{if(doc.querySelector('canvas')){observer.disconnect();finish();}});
   observer.observe(doc,{childList:true,subtree:true});
   setTimeout(()=>{observer.disconnect();if(!ready)finish();},12000);
  }catch{finish();}
 });
 syncConfig();
 readinessTimer=setTimeout(()=>{loading.hidden=true;},18000);
 window.addEventListener('hashchange',syncConfig);
}
document.body.dataset.ready='true';
