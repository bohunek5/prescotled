import {mainFilmProducts, mainFilmProductIds, filmProductsForFamily} from '../noir/strip-film-selection.mjs?v=detail-4';
import {createPresentation, sampleVariant} from '../noir/strip-presentation.mjs?v=detail-9';
import {resolveFilmVariant} from '../noir/strip-product-variants.mjs?v=1';
import {getProductDetails} from '../tasmy-opcja-2/product-details.mjs';
import {formatStripSku} from '../noir/strip-display-sku.mjs';
import {describeStripFeature} from '../noir/strip-detail-cues.mjs?v=detail-9';

const $=selector=>document.querySelector(selector);
const products=mainFilmProducts;
const families=[['delux','DELUX'],['premium','PREMIUM'],['cob','COB / WCOB'],['special','SPECIAL']].map(([id,name])=>({id,name,products:filmProductsForFamily(id).filter(p=>mainFilmProductIds.includes(p.id))}));
const timeline=createPresentation(products,{cycleThreeInOneColors:true});
const pixelsPerSecond=64;
const totalSeconds=timeline.presentationStart(products.length);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=value=>Math.min(1,Math.max(0,value));
const pad=value=>String(value).padStart(2,'0');
const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase();
const familyOf=product=>families.find(family=>family.products.some(p=>p.id===product.id));
const baseName=product=>product.name.replace(/\s*·\s*\d+(?:[,.]\d+)?\s*(?:LED\/m)?$/,'').replace(/\s*\/\s*\d+$/,'');
const fullName=product=>`${baseName(product)} · ${product.density} LED/m`;
const frame=$('#model-frame'),explore=$('#explore'),sticky=$('.explore-sticky');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout=matchMedia('(max-width: 900px)');
let selected=Math.max(0,products.findIndex(p=>p.id===new URL(location.href).searchParams.get('model')));
let chapterIndex=selected,scrollSeconds=timeline.presentationStart(selected),leaving=false,dockFamily='';
let progress=0,filter='all',search='',api=null,requested=null,working=false,raf=0,detailKey='',lastTarget=null,ready=false,stopped=false;
window.__ready=false;

function populatePicker(){
  const current=products[selected],family=familyOf(current);
  $('#model-select').innerHTML=family.products.map(product=>`<option value="${escape(product.id)}" title="${escape(fullName(product))}"${product.id===current.id?' selected':''}>${escape(formatStripSku(product.sku))}</option>`).join('');
  $('#model-counter').textContent=`${pad(selected+1)} / ${products.length}`;
  document.querySelectorAll('[data-family]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.family===family.id)));
  document.querySelectorAll('[data-product-id]').forEach(button=>button.setAttribute('aria-current',String(button.dataset.productId===current.id)));
  frame.title=`${fullName(current)} — model 3D z parametrami i zbliżeniami`;
  if(dockFamily!==family.id){
    dockFamily=family.id;
    $('#model-dock').innerHTML=family.products.map(product=>`<button class="model-tile" data-dock-id="${escape(product.id)}" aria-pressed="false"><small>${escape(family.name)} · <span class="dock-density">${escape(product.density)}</span> LED/m</small><span>${escape(baseName(product))}</span></button>`).join('');
  }
  document.querySelectorAll('[data-dock-id]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.dockId===current.id)));
  const dock=$('#model-dock'),tile=dock.querySelector('[aria-pressed=true]');
  if(tile){const left=tile.offsetLeft-dock.offsetLeft;if(left<dock.scrollLeft)dock.scrollLeft=left;else if(left+tile.offsetWidth>dock.scrollLeft+dock.clientWidth)dock.scrollLeft=left+tile.offsetWidth-dock.clientWidth;}
}

function showDetails(seconds){
  const shot=timeline.samplePresentation(seconds),product=products[shot.model];
  const variant=sampleVariant(shot.productTime,product.colorVariants.length);
  const effective=resolveFilmVariant(product,variant);
  const key=`${selected}:${variant}:${product.id==='3w1'?shot.powerMode:0}`;
  if(key===detailKey)return;
  detailKey=key;
  const details=getProductDetails(effective,variant,shot.powerMode);
  const selectedOption=$('#model-select').selectedOptions[0];
  if(selectedOption)selectedOption.textContent=formatStripSku(details.sku);
  const density=$('#model-dock [aria-pressed=true] .dock-density');if(density)density.textContent=effective.density;
  frame.title=`${fullName(effective)} — model 3D z parametrami i zbliżeniami`;
  $('#mobile-heading').innerHTML=`<p class="mobile-assurance">${details.warranty.madeInPoland?'<span class="small-flag" role="img" aria-label="Polska"></span>':''}<span>${escape(details.warranty.label)}${details.warranty.madeInPoland?' · Produkowana w Polsce':''}</span></p><h2>${escape(baseName(effective))}<small>· ${escape(effective.density)} LED/m</small></h2><p class="mobile-sku">${escape(formatStripSku(details.sku))}</p>`;
  $('#mobile-specs').innerHTML=`<p class="mobile-color"><i aria-hidden="true" style="background:${escape(details.color.swatch)}"></i><b>${escape(details.color.value)}${details.color.unit?' '+escape(details.color.unit):''}</b><span>${escape(details.color.label)}</span></p><dl class="mobile-facts">${details.facts.map(fact=>`<div><dt>${escape(fact.label)}</dt><dd>${fact.image?`<img src="${escape(fact.image)}" alt="${escape(fact.imageAlt)}">`:`${escape(fact.value)} <small>${escape(fact.unit)}</small>`}</dd></div>`).join('')}</dl><p class="mobile-feature"><b>${escape(details.features[0].value)}</b><span>${escape(details.features[1].value)}</span><span>${escape(details.features[2].value)}</span><span>${escape(details.features[3].value)}</span></p>`;
}

function renderDirectory(){
  let count=0;
  $('#directory').innerHTML=families.map(family=>{
    if(filter!=='all'&&filter!==family.id)return '';
    const list=family.products.filter(product=>!search||normalize([product.name,product.sku,formatStripSku(product.sku),product.density,product.voltage+' V',...product.colorVariants.flatMap(v=>[v.sku,formatStripSku(v.sku)])].join(' ')).includes(search));
    count+=list.length;
    if(!list.length)return '';
    return `<section class="directory-group" aria-labelledby="group-${family.id}"><div class="group-heading"><h3 id="group-${family.id}">${escape(family.name)}</h3><span>${pad(list.length)} ${list.length===1?'model':list.length<5?'modele':'modeli'}</span></div><div class="product-list">${list.map(product=>{
      const detail=describeStripFeature(product);
      return `<button class="product-card" data-product-id="${escape(product.id)}" aria-current="${product.id===products[selected].id}" aria-label="Zobacz ${escape(fullName(product))}"><span><span class="card-name">${escape(baseName(product))}<small>${escape(product.density)} LED/m</small></span><span class="card-sku">${escape(formatStripSku(product.sku))}</span></span><span><span class="card-data"><span>${escape(product.voltage)} V DC</span><span>PCB ${escape(product.width)} mm</span><span>${escape(product.warrantyYears)} ${product.warrantyYears===3?'lata':'lat'} gwarancji</span></span><span class="card-feature">${escape(detail.title)}</span></span></button>`;
    }).join('')}</div></section>`;
  }).join('');
  $('#empty-results').hidden=count>0;
}

function scrollMetrics(){
  const header=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header'));
  return {start:explore.getBoundingClientRect().top+scrollY-header,range:Math.max(1,explore.offsetHeight-sticky.offsetHeight)};
}
function sizeScrollTrack(){explore.style.height=`${sticky.offsetHeight+totalSeconds*pixelsPerSecond}px`;}
function renderProgress(){
  $('#scroll-progress').style.transform=`scaleX(${progress})`;
  $('#progress-number').textContent=`${pad(Math.round(progress*100))}%`;
  const current=progress<.16?0:progress<.84?1:2;
  document.querySelectorAll('[data-progress]').forEach((button,index)=>button.setAttribute('aria-pressed',String(index===current)));
  $('#scroll-hint').textContent=progress>.985?'Przewijaj — przebudowa w kolejną taśmę':'Przewijaj — detale i kolejne taśmy';
}
function logicalTime(){
  if(!reducedMotion.matches)return scrollSeconds;
  const maxLocal=timeline.chapterDuration(chapterIndex)-5.08;
  const position=progress<.16?0:progress<.84?.5:1;
  return timeline.presentationStart(chapterIndex)+position*maxLocal;
}
function requestFrame(){
  renderProgress();
  const seconds=logicalTime();
  if(!api){showDetails(seconds);return;}
  if(lastTarget!==null&&Math.abs(seconds-lastTarget)<.0001)return;
  lastTarget=seconds;
  requested=seconds;
  flushFrame();
}
function fitViewerLayout(){
  if(!api)return;
  const doc=frame.contentDocument;
  doc.documentElement.classList.toggle('offer-mobile',mobileLayout.matches);
  if(mobileLayout.matches)return;
  const intro=doc.querySelector('.intro');
  intro.style.setProperty('--offer-ui-scale','1');
  const available=frame.contentWindow.innerHeight-intro.offsetTop*2;
  const scale=Math.min(1,available/Math.max(1,intro.scrollHeight));
  intro.style.setProperty('--offer-ui-scale',String(scale));
}
async function flushFrame(){
  if(working||!api||stopped)return;
  working=true;
  try{
    while(requested!==null&&!stopped){
      const seconds=requested;requested=null;
      await api.scrub(seconds);
      if(requested===null){
        showDetails(seconds);
        fitViewerLayout();
        $('#model-window').setAttribute('aria-busy','false');
        $('#model-loading').hidden=true;
        ready=true;window.__ready=true;
      }
    }
  }catch(error){showError(error);}finally{working=false;}
}
function onScroll(){
  if(raf||document.hidden||stopped)return;
  raf=requestAnimationFrame(()=>{
    raf=0;
    const {start,range}=scrollMetrics();
    let distance=scrollY-start;
    if(distance>=range){
      if(leaving)return;
      // The product stage loops. Leaving it is an explicit, always visible
      // action so a wheel gesture after the last detail never drops the page.
      window.scrollTo({top:start,behavior:'instant'});distance=0;
    }
    if(distance<0&&selected>0)return;
    leaving=false;
    const next=Math.max(0,Math.min(totalSeconds-.001,distance/pixelsPerSecond));
    if(Math.abs(next-scrollSeconds)<.00001&&ready)return;
    scrollSeconds=next;chapterIndex=0;
    while(chapterIndex<products.length-1&&next>=timeline.presentationStart(chapterIndex+1))chapterIndex++;
    const local=next-timeline.presentationStart(chapterIndex);
    progress=clamp(local/(timeline.chapterDuration(chapterIndex)-5.08));
    const displayed=timeline.samplePresentation(logicalTime()).model;
    if(displayed!==selected){selected=displayed;detailKey='';populatePicker();const url=new URL(location.href);url.searchParams.set('model',products[selected].id);history.replaceState(null,'',url);}
    requestFrame();
  });
}
function goToProgress(value,{smooth=true}={}){
  leaving=false;
  const {start}=scrollMetrics();
  const seconds=timeline.presentationStart(selected)+clamp(value)*(timeline.chapterDuration(selected)-5.08);
  window.scrollTo({top:start+seconds*pixelsPerSecond,behavior:smooth&&!reducedMotion.matches?'smooth':'instant'});
  if(!smooth||reducedMotion.matches){chapterIndex=selected;scrollSeconds=seconds;progress=clamp(value);requestFrame();}
}
function selectProduct(id,{scroll=true}={}){
  const index=products.findIndex(product=>product.id===id);
  if(index<0)return false;
  selected=chapterIndex=index;scrollSeconds=timeline.presentationStart(index);progress=0;detailKey='';lastTarget=null;leaving=false;
  populatePicker();
  $('#model-window').setAttribute('aria-busy','true');
  const url=new URL(location.href);url.searchParams.set('model',id);history.replaceState(null,'',url);
  if(scroll)goToProgress(0,{smooth:false});
  requestFrame();
  return true;
}
function leaveExplore(event){
  event?.preventDefault();leaving=true;
  const heading=$('#models-title');heading.tabIndex=-1;
  const header=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header'));
  window.scrollTo({top:$('#models').getBoundingClientRect().top+scrollY-header,behavior:'instant'});
  heading.focus({preventScroll:true});
}
function showError(error){
  $('#model-loading').hidden=false;
  $('#model-loading').dataset.error='true';
  $('#model-loading').innerHTML='<span>Nie udało się uruchomić podglądu 3D w tej przeglądarce.</span><span>Modele i parametry są dostępne na liście poniżej.</span><a href="../katalog/">Przejdź do katalogu →</a>';
  $('#model-window').setAttribute('aria-busy','false');
  console.error('PRESCOT offer viewer:',error);
}
async function connectViewer(){
  const started=performance.now();
  while(!stopped&&performance.now()-started<45000){
    const viewer=frame.contentWindow?.smdViewer;
    if(viewer?.inspect().ready&&typeof viewer.scrub==='function'){
      api=viewer;api.setPlaying(false);
      await frame.contentDocument.fonts.ready;
      await api.selectProduct(products[selected].id,{play:false});
      fitViewerLayout();lastTarget=null;requestFrame();return;
    }
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  if(!stopped)showError(new Error('Viewer did not become ready.'));
}

document.querySelectorAll('[data-family]').forEach(button=>button.addEventListener('click',()=>{
  const family=families.find(f=>f.id===button.dataset.family);
  if(family.id!==familyOf(products[selected]).id)selectProduct(family.products[0].id);
}));
$('#model-select').addEventListener('change',event=>selectProduct(event.target.value));
$('#model-dock').addEventListener('click',event=>{const tile=event.target.closest('[data-dock-id]');if(tile)selectProduct(tile.dataset.dockId);});
$('#leave-explore').addEventListener('click',leaveExplore);
document.querySelectorAll('a[href="#models"]').forEach(link=>link.addEventListener('click',leaveExplore));
document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{
  selectProduct(products[(selected+Number(button.dataset.step)+products.length)%products.length].id);
}));
document.querySelectorAll('[data-progress]').forEach(button=>button.addEventListener('click',()=>goToProgress(Number(button.dataset.progress))));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  filter=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  renderDirectory();
}));
$('#model-search').addEventListener('input',event=>{search=normalize(event.target.value.trim());renderDirectory();});
$('#directory').addEventListener('click',event=>{
  const button=event.target.closest('[data-product-id]');
  if(button){selectProduct(button.dataset.productId);$('#model-select').focus({preventScroll:true});}
});
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',()=>{sizeScrollTrack();onScroll();},{passive:true});
const frameResize=new ResizeObserver(fitViewerLayout);frameResize.observe($('.model-frame-wrap'));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)onScroll();});
document.addEventListener('focusin',event=>{if(event.target.closest('.model-directory,.catalog-link,footer'))leaving=true;});
document.addEventListener('keydown',event=>{
  if(event.key==='End')leaving=true;
  if(event.key==='Escape'&&scrollY>=scrollMetrics().start&&scrollY<scrollMetrics().start+scrollMetrics().range)leaveExplore(event);
});
reducedMotion.addEventListener('change',()=>{selected=timeline.samplePresentation(logicalTime()).model;populatePicker();const url=new URL(location.href);url.searchParams.set('model',products[selected].id);history.replaceState(null,'',url);lastTarget=null;requestFrame();});
addEventListener('pagehide',()=>{stopped=true;cancelAnimationFrame(raf);frameResize.disconnect();});
addEventListener('pageshow',event=>{if(event.persisted){stopped=false;frameResize.observe($('.model-frame-wrap'));lastTarget=null;onScroll();}});

populatePicker();renderDirectory();sizeScrollTrack();requestFrame();connectViewer();
if(selected>0)goToProgress(0,{smooth:false});
window.offer={
  selectProduct,
  goToProgress,
  leaveExplore,
  inspect:()=>({ready,productId:products[selected].id,modelIndex:selected,chapterIndex,modelCount:products.length,progress,working,requested,logicalTime:logicalTime(),reducedMotion:reducedMotion.matches,viewer:api?.inspect()}),
};
const jump=new URL(location.href).searchParams.get('jump');
if(jump!==null&&Number.isFinite(Number(jump)))requestAnimationFrame(()=>window.scrollTo(0,Number(jump)));
