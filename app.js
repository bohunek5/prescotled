import {series} from './data/series.js';
import {applications,configuratorUrl,configurationLink} from './config.js';

const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
document.querySelectorAll('[data-config]').forEach(el=>el.href=configuratorUrl);
const menu=document.querySelector('.menu-toggle'),nav=$('site-nav');
function closeMenu(focus=false){if(!menu)return;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Otwórz menu');nav.classList.remove('is-open');if(focus)menu.focus();}
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Zamknij menu':'Otwórz menu');nav.classList.toggle('is-open',open);if(open)nav.querySelector('a')?.focus();});
nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true')closeMenu(true);});
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
matchMedia('(min-width: 961px)').addEventListener('change',e=>{if(e.matches)closeMenu();});

if(document.body.dataset.page==='home'){
 let warranty='7',application='kitchen',imageRequest=0;
 const tidy=value=>value.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('ł','l');
 function filter(){
  const query=tidy($('series-search').value.trim());let count=0;
  document.querySelectorAll('.series-card').forEach(card=>{const item=series.find(s=>s.id===card.dataset.series),visible=(warranty==='all'||item.warrantyYears===+warranty)&&(!query||tidy([item.name,item.eyebrow,item.description,...item.features,item.application].join(' ')).includes(query));card.hidden=!visible;if(visible)count++;});
  document.querySelectorAll('[data-warranty]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.warranty===warranty)));
  $('series-count').textContent=count===1?'1 seria':`${count} ${count>1&&count<5?'serie':'serii'}${warranty==='all'?' PRESCOT LED':` · ${warranty} ${warranty==='3'?'lata':'lat'} gwarancji`}`;
  $('series-empty').hidden=count!==0;
 }
 document.querySelectorAll('[data-warranty]').forEach(button=>button.addEventListener('click',()=>{warranty=button.dataset.warranty;filter();}));
 $('series-search').addEventListener('input',()=>{if($('series-search').value.trim())warranty='all';filter();});
 filter();
 async function chooseApplication(key){
  const item=applications[key];if(!item)return;application=key;const request=++imageRequest;
  document.querySelectorAll('[data-application]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.application===key)));
  $('application-title').textContent=item.title;$('application-description').textContent=item.description;$('application-config').href=configurationLink(item.state);
  const image=new Image();image.src=item.image;await image.decode().catch(()=>{});if(request!==imageRequest)return;
  $('application-image').src=item.image;$('application-image').alt=`Inspiracja oświetlenia: ${item.name.toLocaleLowerCase('pl')}`;
  document.querySelector('.scene-label').textContent=`INSPIRACJA / 0${Object.keys(applications).indexOf(key)+1}`;
 }
 document.querySelectorAll('[data-application]').forEach(button=>button.addEventListener('click',()=>chooseApplication(button.dataset.application)));
 $('application-config').href=configurationLink(applications.kitchen.state);

 const videoDialog=$('video-dialog'),video=videoDialog.querySelector('video');let videoOpener=null;
 $('production-play').addEventListener('click',()=>{videoOpener=document.activeElement;videoDialog.showModal();document.body.classList.add('modal-open');const source=matchMedia('(max-width:640px)').matches?'assets/production-mobile.mp4':'assets/production-desktop.mp4';if(video.getAttribute('src')!==source){video.src=source;video.load();}video.play().catch(()=>{});});
 videoDialog.querySelector('.close-button').addEventListener('click',()=>videoDialog.close());
 videoDialog.addEventListener('click',e=>{if(e.target===videoDialog){const r=videoDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)videoDialog.close();}});
 videoDialog.addEventListener('close',()=>{video.pause();document.body.classList.remove('modal-open');videoOpener?.focus();});

 let previewPromise;
 function startPreview(auto=false){return previewPromise??=(async()=>{const {mountAssemblyPreview}=await import('./preview.js?v=3');return mountAssemblyPreview($('assembly-film'),$('film-play'),$('film-phase'),{auto});})();}
 $('film-play').addEventListener('click',()=>{if(!previewPromise)startPreview(true);});
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();startPreview(!reduced.matches).catch(()=>{});}},{rootMargin:'100px 0px',threshold:.08});observer.observe($('pokaz'));
 window.siteDebug={get warranty(){return warranty;},get application(){return application;},get visibleSeries(){return[...document.querySelectorAll('.series-card:not([hidden])')].map(c=>c.dataset.series);}};
 import('./components.js').then(({mountComponents})=>mountComponents()).catch(()=>{});
 document.body.dataset.ready='true';
}
