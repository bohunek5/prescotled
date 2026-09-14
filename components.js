import {powerSupplies,controllers} from './data/components.js';

export function mountComponents(){
 const $=id=>document.getElementById(id),host=$('component-viewer'),loading=host.querySelector('.product-viewer-loading'),fallback=$('component-fallback');
 let type='power',selected=powerSupplies.find(m=>m.watts===100),viewer=null,viewerPromise=null,revision=0,voltage=12,lightColor='#ffd7a0';
 const list=()=>type==='power'?powerSupplies:controllers;
 function updateText(){
  const power=type==='power';
  $('component-name').textContent=selected.name;$('component-visual-name').textContent=selected.ref||selected.name;
  $('component-eyebrow').textContent=power?'AUTODETEKCJA 12 / 24 V':'STEROWANIE PRESCOT LED';
  $('component-description').textContent=selected.description;
  $('component-source').href=selected.sourceUrl;
  fallback.src=selected.image;fallback.alt=selected.name;
  $('power-demo').hidden=!power;$('controller-demo').hidden=power;
  const facts=power?[['Moc',`${selected.watts} W`],['Napięcie wyjściowe','12 / 24 V DC · auto'],['Wymiary',selected.dimensionsLabel],['Gwarancja',`${selected.warrantyYears} lata`]]:[['Napięcie',selected.voltage],['Obciążenie',`${selected.maxCurrentA} A łącznie`],['Komunikacja','RF 2,4 GHz'],['Gwarancja',`${selected.warrantyYears} lata`]];
  $('component-facts').replaceChildren(...facts.map(([label,value])=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;div.append(dt,dd);return div;}));
  $('component-models').replaceChildren(...list().map(model=>{const b=document.createElement('button');b.type='button';b.textContent=power?`${model.watts} W`:model.mode.toUpperCase();b.dataset.model=model.id;b.setAttribute('aria-pressed',String(model.id===selected.id));b.addEventListener('click',()=>selectModel(model));return b;}));
  document.querySelectorAll('[data-component-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.componentType===type)));
  if(!power){$('controller-mode').textContent=selected.mode.toUpperCase();let first=null;document.querySelectorAll('[data-light-color]').forEach((b,i)=>{const visible=selected.mode==='mono'?i===0:selected.mode==='cct'?i<2:selected.mode==='rgb'?i>=2:true;b.hidden=!visible;if(visible&&!first)first=b;});setColor(first.dataset.lightColor);}
 }
 async function loadViewer(){
  if(viewerPromise)return viewerPromise;
  viewerPromise=(async()=>{host.dataset.state='loading';loading.hidden=false;
   try{const {createProductViewer}=await import('./products3d.js');viewer=await createProductViewer(host,{type,model:selected});
    await viewer.setModel({...selected,type:type==='power'?'power-supply':'controller'});fallback.hidden=true;loading.hidden=true;host.dataset.state='ready';return viewer;
   }catch{loading.hidden=true;host.dataset.state='fallback';$('model-hint').textContent='Zdjęcie produktu · szczegóły w karcie';return null;}
  })();return viewerPromise;
 }
 async function selectModel(model){
  selected=model;const current=++revision;updateText();loading.hidden=false;
  const v=await loadViewer();if(current!==revision){return;}
  if(v){await v.setModel(model);fallback.hidden=true;host.dataset.state='ready';}
  loading.hidden=true;
 }
 document.querySelectorAll('[data-component-type]').forEach(b=>b.addEventListener('click',()=>{type=b.dataset.componentType;selectModel(list()[type==='power'?2:0]);}));
 $('reset-product-view').addEventListener('click',()=>viewer?.resetView?.());
 document.querySelectorAll('[data-demo-voltage]').forEach(b=>b.addEventListener('click',()=>{voltage=+b.dataset.demoVoltage;$('voltage-value').textContent=`${voltage} V`;$('voltage-caption').textContent=`Autodetekcja dopasowuje wyjście do taśmy ${voltage} V.`;$('power-demo').dataset.voltage=voltage;document.querySelectorAll('[data-demo-voltage]').forEach(x=>x.setAttribute('aria-pressed',String(+x.dataset.demoVoltage===voltage)));}));
 function setColor(color){lightColor=color;$('controller-demo').style.setProperty('--light-color',color);document.querySelectorAll('[data-light-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lightColor===color)));}
 document.querySelectorAll('[data-light-color]').forEach(b=>b.addEventListener('click',()=>setColor(b.dataset.lightColor)));
 $('controller-brightness').addEventListener('input',e=>{const value=+e.target.value;$('controller-brightness-value').textContent=value+'%';$('controller-demo').style.setProperty('--brightness',value/100);});
 updateText();
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();loadViewer();}},{rootMargin:'180px 0px'});observer.observe(host);
 window.addEventListener('pagehide',()=>{observer.disconnect();viewer?.dispose();},{once:true});
 window.componentsDebug={inspect:()=>({type,selected:selected.id,voltage,lightColor,viewer:viewer?.inspect()})};
}
