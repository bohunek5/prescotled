import {microProducts,finishes} from './micro-catalog.mjs';
import {microApplications} from './micro-slide-scenes.mjs';
import {extraProducts} from './klus-film-catalog.mjs';
import {extraApplications} from './klus-film-scenes.mjs';

const microBase=new URL('./media/micro/photos/',import.meta.url);
const extraBase=new URL('./media/klus-film/photos/',import.meta.url);
const $=s=>document.querySelector(s);
const interval=4000,fadeDuration=650;
const categories=[
  ['surface','Nawierzchniowe'],['recessed','Wpustowe'],['built-in','Do zabudowy'],['suspended','Zwieszane'],
  ['corner','Narożne'],['indirect','Światło pośrednie'],['handrail','W poręczy'],['floor','W posadzce']
];
const microCategory={'micro-plus':'surface','micro-nk':'recessed','micro-h':'surface','micro-hg':'surface','micro-30deg-koz':'built-in'};
const products=[...microProducts.map(p=>({...p,category:microCategory[p.id],lengths:[1000,2005,3010]})),...extraProducts];
const applications={...microApplications,...extraApplications};
const order=products.map(p=>p.id);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const events=new AbortController(),decoded=new Map(),frames=new Map();
const productLayers=[],sceneLayers=[];
let manifest,slides=[],slideIndex=0,product=null,ready=false,disposed=false;
let activeLayer=0,changeSequence=0,timer=0,due=0,remaining=interval,requestedPlayback=true;
const fmt=n=>String(n).replace('.',',');
const assetURL=data=>new URL(data.file,data.base).href;
document.body.dataset.theme='day';

function originalImage(data,label,box=data.box){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox',box.join(' '));svg.setAttribute('role','img');svg.setAttribute('aria-label',label);
  const image=document.createElementNS(svg.namespaceURI,'image');
  image.setAttribute('href',assetURL(data));image.setAttribute('width',data.size[0]);image.setAttribute('height',data.size[1]);
  svg.append(image);return svg;
}
function decode(data){
  const url=assetURL(data);
  if(!decoded.has(url)){
    const image=new Image();image.src=url;decoded.set(url,image.decode().catch(error=>{decoded.delete(url);throw error;}));
  }
  return decoded.get(url);
}
function assetsFor(slide){
  const data=manifest[slide.product.id];
  return [data.products[slide.finish],data.scenes[slide.application.index],data.drawing];
}
function preloadNext(){
  const next=slides[(slideIndex+1)%slides.length];
  if(next)void Promise.all(assetsFor(next).map(decode)).catch(()=>{});
}
function chapter(id){return slides.filter(slide=>slide.product.id===id);}
function refreshLengths(p,finish){
  const lengths=p.lengthsByFinish?.[finish]||p.lengths,lengthNodes=[];
  lengths.forEach((length,index)=>{
    if(index){const divider=document.createElement('i');divider.textContent='/';lengthNodes.push(divider);}
    lengthNodes.push(document.createTextNode(fmt(length)));
  });
  const unit=document.createElement('small');unit.textContent=' mm';lengthNodes.push(unit);
  $('#profile-lengths').replaceChildren(...lengthNodes);
}
function stopClock(){clearTimeout(timer);timer=0;}
function schedule(delay=interval){
  stopClock();remaining=delay;
  if(disposed||!ready||!requestedPlayback||document.hidden||reducedMotion.matches)return;
  due=performance.now()+delay;
  timer=setTimeout(()=>{timer=0;void setSlide(slideIndex+1);},delay);
}
function refreshProduct(p){
  product=p;
  $('#product-title').textContent=p.name;$('#product-title').dataset.long=String(p.name.length>12);
  $('#product-mount').textContent=('Profil '+p.mount).toLocaleUpperCase('pl-PL');
  $('.product-line').textContent=p.headline;
  $('#profile-size').textContent=fmt(p.width)+' × '+fmt(p.height);
  $('#profile-channel').textContent=fmt(p.channel);$('#profile-ip').textContent=p.ip;
  $('#profile-ip').dataset.multiple=String(p.ip.split('/').length>2);
  $('#model-select').value=p.id;
  $('#model-count').textContent=String(order.indexOf(p.id)+1).padStart(2,'0')+' / '+String(order.length).padStart(2,'0');
  document.querySelectorAll('.application-tab').forEach(b=>b.setAttribute('aria-current',b.dataset.category===p.category?'true':'false'));
  $('.visual').setAttribute('aria-label','Zastosowanie '+p.name);
  const variants=chapter(p.id);
  $('#finish-heading').textContent=variants.length===1?'WYKOŃCZENIE':'WYKOŃCZENIA';
  $('#finish-options').replaceChildren(...variants.map(slide=>{
    const b=document.createElement('button');b.className='finish-option';b.dataset.finish=slide.finish;
    b.style.setProperty('--swatch',finishes[slide.finish].color);
    const swatch=document.createElement('i');swatch.setAttribute('aria-hidden','true');b.append(swatch,finishes[slide.finish].short);
    b.addEventListener('click',()=>setFinish(slide.finish),{signal:events.signal});return b;
  }));
  $('#scene-options').replaceChildren(...variants.map(slide=>{
    const b=document.createElement('button');b.className='scene-option';b.dataset.scene=slide.application.key;b.textContent=slide.application.label;
    b.addEventListener('click',()=>setScene(slide.application.key),{signal:events.signal});return b;
  }));
  $('#drawing-image').replaceChildren(originalImage(manifest[p.id].drawing,'Oryginalny rysunek techniczny KLUŚ · przekrój '+p.name));
}
async function setSlide(index,{immediate=false,delay=interval}={}){
  if(disposed||!slides.length)return;
  index=((index%slides.length)+slides.length)%slides.length;
  const sequence=++changeSequence,slide=slides[index],p=slide.product,application=slide.application;
  const photo=manifest[p.id].products[slide.finish],scene=manifest[p.id].scenes[application.index];
  stopClock();remaining=delay;
  // Decode before one synchronous commit: images, captions, parameters and
  // finish-specific reference change on the same frame.
  try{await Promise.all([decode(photo),decode(scene),decode(manifest[p.id].drawing)]);}
  catch(error){
    if(sequence===changeSequence&&!disposed){
      $('#loading').hidden=false;$('#loading').textContent='Fotografia nie została wczytana. Spróbuj ponownie wybrać profil.';
      console.error(error);
    }
    return;
  }
  if(disposed||sequence!==changeSequence)return;
  $('#loading').hidden=true;
  const initial=!product,modelChanged=product?.id!==p.id,changed=initial||index!==slideIndex;
  if(changed){
    const next=initial?activeLayer:1-activeLayer,duration=immediate||initial||reducedMotion.matches?'0ms':fadeDuration+'ms';
    productLayers[next].replaceChildren(originalImage(photo,p.name+' · '+finishes[slide.finish].name+' · zdjęcie KLUŚ',frames.get(p.id)));
    sceneLayers[next].src=assetURL(scene);sceneLayers[next].alt=application.alt;sceneLayers[next].style.objectPosition=application.position||'50% 50%';
    for(const layer of [...productLayers,...sceneLayers])layer.style.transitionDuration=duration;
    productLayers[next].getBoundingClientRect();sceneLayers[next].getBoundingClientRect();
    for(const layers of [productLayers,sceneLayers])layers.forEach((layer,i)=>{
      layer.classList.toggle('active',i===next);layer.setAttribute('aria-hidden',String(i!==next));
    });
    activeLayer=next;slideIndex=index;
    if(modelChanged)refreshProduct(p);
    $('#finish-name').textContent=finishes[slide.finish].name;
    $('#finish-ref').textContent=p.codes[p.finishes.indexOf(slide.finish)];
    refreshLengths(p,slide.finish);
    $('#scene-title').textContent=application.title;$('#scene-description').textContent=application.description;
    document.querySelectorAll('.finish-option').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.finish===slide.finish)));
    document.querySelectorAll('.scene-option').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===application.key)));
    if(!initial&&!immediate&&!reducedMotion.matches){
      const animated=modelChanged?[$('.product-heading'),$('.facts'),$('.scene-copy'),$('#drawing-image')]:[$('.scene-copy')];
      animated.forEach(el=>{
        el.getAnimations().forEach(animation=>animation.cancel());
        el.animate([{opacity:.25},{opacity:1}],{duration:650,easing:'ease-out'});
      });
    }
  }
  // An immediate seek can target the slide already fading in. Settle that
  // transition as well so deterministic captures never retain the old image.
  if(immediate||reducedMotion.matches){
    for(const layer of [...productLayers,...sceneLayers]){
      layer.style.transitionDuration='0ms';layer.getAnimations().forEach(animation=>animation.finish());
    }
    document.querySelectorAll('.product-heading,.facts,.scene-copy,#drawing-image').forEach(el=>el.getAnimations().forEach(animation=>animation.cancel()));
    document.querySelectorAll('.application-tab,.finish-option,.scene-option').forEach(el=>el.getAnimations({subtree:true}).forEach(animation=>animation.finish()));
  }
  schedule(delay);
  preloadNext();
}
function setFinish(key,options){
  const index=slides.findIndex(slide=>slide.product.id===product?.id&&slide.finish===key);
  if(index>=0)return setSlide(index,options);
}
function setScene(key,options){
  const index=slides.findIndex(slide=>slide.product.id===product?.id&&slide.application.key===key);
  if(index>=0)return setSlide(index,options);
}
function setProduct(id,options){
  const index=slides.findIndex(slide=>slide.product.id===id);if(index>=0)return setSlide(index,options);
}
function setCategory(key,options){
  const first=products.find(p=>p.category===key);if(first)return setProduct(first.id,options);
}
function stepModel(direction){
  return setProduct(order[(order.indexOf(product?.id)+direction+order.length)%order.length]);
}
function refreshPlayback(){
  const paused=!requestedPlayback||reducedMotion.matches;
  $('#play-toggle').setAttribute('aria-pressed',String(paused));
  $('#play-toggle').setAttribute('aria-label',paused?'Odtwórz prezentację':'Wstrzymaj prezentację');
}
function setPlaying(value){
  if(timer)remaining=Math.max(0,due-performance.now());
  requestedPlayback=value;refreshPlayback();schedule(remaining);
}
async function seek(seconds,{play=false}={}){
  const milliseconds=((seconds*1000%(slides.length*interval))+slides.length*interval)%(slides.length*interval);
  requestedPlayback=play;refreshPlayback();
  await setSlide(Math.floor(milliseconds/interval),{immediate:true,delay:interval-milliseconds%interval});
  return inspect();
}
function inspect(){
  const slide=slides[slideIndex],left=timer?Math.max(0,due-performance.now()):remaining;
  return {ready,mode:'synchronized-photographic-film',id:product?.id,category:product?.category,modelCount:order.length,modelIndex:order.indexOf(product?.id),
    slideIndex,slideCount:slides.length,finish:slide?.finish,sceneIndex:slide?.application.index,application:slide?.application.key,
    applicationCount:product?chapter(product.id).length:0,interval,sceneInterval:interval,fadeDuration,frame:frames.get(product?.id),
    playing:ready&&!disposed&&requestedPlayback&&!document.hidden&&!reducedMotion.matches,
    time:(slideIndex*interval+interval-left)/1000,filmDuration:slides.length*interval/1000,
    theme:document.body.dataset.theme,drawing:manifest?.[product?.id]?.drawing.file,lengths:product?.lengthsByFinish?.[slide?.finish]||product?.lengths,
    sequence:slides.map(s=>({id:s.product.id,finish:s.finish,application:s.application.key,sceneIndex:s.application.index}))};
}
$('#model-select').addEventListener('change',event=>void setProduct(event.target.value),{signal:events.signal});
$('#previous-model').addEventListener('click',()=>void stepModel(-1),{signal:events.signal});
$('#next-model').addEventListener('click',()=>void stepModel(1),{signal:events.signal});
$('#play-toggle').addEventListener('click',()=>setPlaying(!requestedPlayback),{signal:events.signal});
$('#restart-film').addEventListener('click',()=>{requestedPlayback=true;refreshPlayback();void setSlide(0);},{signal:events.signal});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(timer)remaining=Math.max(0,due-performance.now());stopClock();}
  else schedule(remaining);
},{signal:events.signal});
reducedMotion.addEventListener('change',()=>{
  if(timer)remaining=Math.max(0,due-performance.now());refreshPlayback();schedule(remaining);
},{signal:events.signal});
function dispose(){disposed=true;ready=false;++changeSequence;stopClock();events.abort();decoded.clear();}
window.addEventListener('pagehide',event=>{if(!event.persisted)dispose();},{signal:events.signal});
window.microViewer={setFinish,setScene,setProduct,setCategory,setPlaying,seek,dispose,inspect};

try{
  const sources=await Promise.all([microBase,extraBase].map(async base=>{
    const response=await fetch(new URL('manifest.json',base),{signal:events.signal});
    if(!response.ok)throw new Error('Brak danych fotografii');
    const data=await response.json();
    for(const entry of Object.values(data)){
      for(const image of [...Object.values(entry.products),...entry.scenes,entry.drawing])image.base=base.href;
    }
    return data;
  }));
  manifest=Object.assign({},...sources);
  for(const id of order){
    const p=products.find(item=>item.id===id),photos=manifest[id].products;
    // Unavailable photographs never become recoloured substitutes or drawings
    // labelled as product photos.
    const available=['white','silver','black','raw'].filter(key=>p.finishes.includes(key)&&photos[key]);
    const images=available.map(key=>photos[key]);
    const x=Math.min(...images.map(item=>item.box[0])),y=Math.min(...images.map(item=>item.box[1]));
    frames.set(id,[x,y,Math.max(...images.map(item=>item.box[0]+item.box[2]))-x,Math.max(...images.map(item=>item.box[1]+item.box[3]))-y]);
    available.forEach((finish,i)=>slides.push({product:p,finish,application:applications[id][i%applications[id].length]}));
  }
  $('#application-nav').replaceChildren(...categories.map(([key,label],index)=>{
    const button=document.createElement('button');button.className='application-tab';button.dataset.category=key;
    const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');
    button.append(number,label);button.addEventListener('click',()=>void setCategory(key),{signal:events.signal});return button;
  }));
  $('#model-select').replaceChildren(...categories.map(([key,label])=>{
    const group=document.createElement('optgroup');group.label=label;
    products.filter(p=>p.category===key).forEach(p=>{
      const option=document.createElement('option');option.value=p.id;option.textContent=p.name;group.append(option);
    });return group;
  }));
  for(let index=0;index<2;index++){
    const layer=document.createElement('div');layer.className='product-layer';layer.setAttribute('aria-hidden','true');
    productLayers.push(layer);$('#product-image').append(layer);
  }
  const sceneImage=$('#scene-image'),secondScene=sceneImage.cloneNode();secondScene.removeAttribute('id');secondScene.classList.remove('active');
  secondScene.setAttribute('aria-hidden','true');sceneImage.after(secondScene);sceneLayers.push(sceneImage,secondScene);
  const requested=new URLSearchParams(location.search).get('model');
  const initial=Math.max(0,slides.findIndex(slide=>slide.product.id===requested));
  await setSlide(initial,{immediate:true});ready=Boolean(product);refreshPlayback();schedule();
}catch(error){
  if(!disposed){$('#loading').hidden=false;$('#loading').textContent='Nie udało się wczytać fotografii. Odśwież podgląd.';console.error(error);}
}
