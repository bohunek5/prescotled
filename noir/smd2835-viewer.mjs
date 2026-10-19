import * as T from '../konfigurator/vendor/three/build/three.module.min.js';
import {createCatalogStrip} from './catalog-strip-model.mjs?v=detail-3';
import {filmProducts} from './film-catalog.mjs';
import {samplePresentation,sampleVariant,presentationStart} from './strip-presentation.mjs?v=detail-3';
import {createStripRebuild} from './strip-rebuild.mjs';
import {powerModes} from './offer-series-models.mjs';
import {createFeatureIcons} from './film-feature-3d.mjs?v=detail-4';
import {createNumberAnimator} from './film-numbers.mjs';
import {createVoltageCue} from './strip-lighting.mjs?v=detail-6';
import {frameStripSection} from './strip-section-camera.mjs';

// Review these three constructions before extending the film to the catalogue.
const products=['3w1','slim','truecolor10'].map(id=>filmProducts.find(product=>product.id===id));

const PLAYBACK_RATE=1.15;
const modelOption=(product,sku=product.sku)=>`${product.range} · ${product.name.split(' · ')[0]} · ${sku}`;
let colorVariant=null,colorKey='';
let lightProgram=null;
const catalogueNumber=value=>{const text=String(value??'').trim().replace(',','.');return /^\d+(?:\.\d+)?$/.test(text)?Number(text):null;};
const smoothBlend=value=>{const x=T.MathUtils.clamp(value,0,1);return x*x*(3-2*x);};
const numbers=createNumberAnimator();let seeking=false;
function fact(key,value){numbers.set(document.querySelector(`[data-product="${key}"]`),value,!seeking&&!reduced.matches);}
function energy(value){
  const badge=document.querySelector('.energy-rating');badge.hidden=!value;
  document.querySelector('.energy-missing').hidden=!!value;
  badge.dataset.grade=value||'';badge.setAttribute('aria-label',`Klasa energetyczna ${value||''}, skala A–G`);
  document.querySelector('[data-product="energy"]').textContent=value||'';
  if(value){const artwork=badge.querySelector('img');artwork.src=`../noir/media/energy/class-${value.toLowerCase()}.png`;artwork.alt=`Klasa energetyczna ${value}, skala A–G`;}
}

const host=document.querySelector('#stage'),loading=document.querySelector('#loading'),intro=document.querySelector('.intro');
let pendingProductReveal=false;
const featureIcons=createFeatureIcons();
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}
catch(error){loading.textContent='Podgląd 3D wymaga włączonego WebGL w przeglądarce.';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
host.append(renderer.domElement);
const voltageCue=createVoltageCue(host,{nearPad:true,avoidElement:intro,sequence:true});
const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,1,2000);
let sectionFraming=null;
const models=products.map(product=>createCatalogStrip(product,{anisotropy:Math.min(8,renderer.capabilities.getMaxAnisotropy())}));
models.forEach((m,i)=>{scene.add(m.group);m.group.visible=i===0;});
let model=models[0],modelIndex=0,powerMode=0;


// A local studio environment provides actual reflected softboxes in the tin,
// copper and resin, with no remote HDR or runtime library dependencies.
const studio=new T.Scene();studio.background=new T.Color(0x343e38);
const studioResources=[];
for(const [position,scale,intensity,color] of [
  [[-8,6,5],[4,12,1],7,0xfff3e0],[[7,2,0],[3,14,1],5,0xe0edff],[[0,10,-4],[10,2,1],4,0xffffff],[[0,-5,7],[8,3,1],1.3,0xe7ede7]
]){
  const geometry=new T.PlaneGeometry(...scale.slice(0,2)),material=new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(intensity),side:T.DoubleSide});
  const panel=new T.Mesh(geometry,material);panel.position.set(...position);panel.lookAt(0,0,0);studio.add(panel);studioResources.push(geometry,material);
}
const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.07,.1,100);scene.environment=environment.texture;scene.environmentIntensity=.55;
pmrem.dispose();studioResources.forEach(r=>r.dispose());
const ambient=new T.HemisphereLight(0xe9f1e8,0x39463b,1.25);scene.add(ambient);
const key=new T.DirectionalLight(0xfff0d6,3.2);key.position.set(-130,140,210);key.castShadow=true;
key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-140,right:140,top:150,bottom:-150,near:1,far:600});key.shadow.bias=-.00006;key.shadow.normalBias=.035;key.shadow.radius=3;scene.add(key);
const fill=new T.DirectionalLight(0xdbe8ff,1.3);fill.position.set(140,20,100);scene.add(fill);
const rim=new T.DirectionalLight(0xffe4c0,2.4);rim.position.set(50,100,-180);scene.add(rim);
models.forEach((m,i)=>{m.setLight(false);m.setTemperature(products[i].color);});models[0].setPower(3/11);

let rotating=!reduced.matches,lit=false,zoom=0,targetZoom=0,rotation=-.22,tilt=-.04,view='full',theme='day',visible=true;
let touring=!reduced.matches,tourSeconds=0,shot=null,cameraTargetY=0,ready=false;
const rebuilds=[];let activeRebuild=null;
let raf=0,last=0,elapsed=0,disposed=false,painted=0,needsPaint=true,width=0,height=0,inRender=false;
function resize(){
  const w=host.clientWidth,h=host.clientHeight;if(w===width&&h===height)return;
  width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();needsPaint=true;
}
function render(now){
  raf=0;if(disposed||document.hidden||!visible||!ready)return;
  inRender=true;
  // Match the film clock to elapsed time even on slower graphics hardware.
  const delta=last?Math.max(0,(now-last)/1000):0;last=now;
  if(rotating){
    elapsed+=delta;
    if(touring){
      tourSeconds+=delta*PLAYBACK_RATE;shot=samplePresentation(tourSeconds,products.length);
      if(shot.model!==modelIndex)selectModel(shot.model);
      if(products[modelIndex].id==='3w1'&&!shot.rebuild&&powerMode!==shot.powerMode)setPowerMode(shot.powerMode);
      updateColorVariant(shot.productTime);
      updateLighting();
      targetZoom=shot.zoom;rotation=shot.rotation;tilt=shot.tilt;cameraTargetY=shot.targetY;
      if(shot.rebuild)applyRebuild(shot.rebuild.from,shot.rebuild.progress);else clearRebuild();
      view=shot.zoom>.35?'macro':'full';
    }
    needsPaint=true;
  }
  if(pendingProductReveal&&!activeRebuild){pendingProductReveal=false;intro.dataset.rebuilding='false';revealFacts('details');}
  if(Math.abs(zoom-targetZoom)>.0001){zoom=reduced.matches?targetZoom:T.MathUtils.lerp(zoom,targetZoom,1-Math.exp(-delta*8));needsPaint=true;}
  if(needsPaint){
    resize();
    const focusModel=shot?.rebuild?models[shot.rebuild.from]:model;
    sectionFraming=frameStripSection(camera,focusModel,{...shot,zoom,rotation,tilt},camera.aspect);
    model.group.rotation.copy(focusModel.group.rotation);activeRebuild?.group.rotation.copy(focusModel.group.rotation);
    voltageCue.update(model,products[modelIndex],camera,reduced.matches?null:shot,width,height,powerMode);
    renderer.render(scene,camera);featureIcons.render(shot?.iconTime??0,reduced.matches||!touring,reduced.matches,voltageCue.inspect().cueStages?.featureEmphasis??0);painted++;needsPaint=false;
  }
  inRender=false;
  if(rotating||Math.abs(zoom-targetZoom)>.0001)raf=requestAnimationFrame(render);
}
function schedule(){needsPaint=true;if(!raf&&!inRender&&!document.hidden&&!disposed&&visible&&ready)raf=requestAnimationFrame(render);}
function clearRebuild(){
  if(activeRebuild){activeRebuild.dispose();rebuilds.fill(null);activeRebuild=null;}
  models.forEach((m,i)=>{m.group.visible=i===modelIndex;});
}
function applyRebuild(from,progress){
  if(!rebuilds[from]){rebuilds[from]=createStripRebuild(models[from],models[(from+1)%models.length]);scene.add(rebuilds[from].group);}
  activeRebuild=rebuilds[from];activeRebuild.group.visible=true;
  models.forEach(m=>{m.group.visible=false;});activeRebuild.update(progress);
}
function setPowerMode(index){
  powerMode=index;const mode=powerModes[index];models[0].setPower(Number(mode.power)/11);
  if(products[modelIndex].id==='3w1'){
    fact('power',mode.power);
    fact('output',colorVariant?.outputs[index]??mode.output);
    fact('efficacy',colorVariant?.efficacies?.[index]??'—');
    document.querySelector('[data-product="output-label"]').textContent=mode.outputLabel;
    document.querySelectorAll('[data-power]').forEach(b=>{b.dataset.active=String(Number(b.dataset.power)===index);});
    featureIcons.setPower(index);
  }
  schedule();
}
function updateLighting(){
  const p=products[modelIndex],variants=p.colorVariants;
  const incoming=shot?.phase==='ready'||(shot?.rebuild&&shot.rebuild.to===modelIndex);
  const local=incoming?0:shot?.local??0,detailEnd=shot?.detailEnd??(p.id==='3w1'?13:18);
  // Addressable strips demonstrate from the opening shot. All constructions
  // power down before mechanical rebuilding, including the incoming model.
  const level=reduced.matches||incoming||shot?.rebuild?0:p.digital?(local<=detailEnd?1:shot?.lightLevel??0):shot?.lightLevel??0;
  const variantIndex=sampleVariant(shot?.productTime??0,variants.length);
  const previousVariant=p.id==='3w1'?colorVariant:variants[Math.max(0,variantIndex-1)]??colorVariant;
  const variantStart=variants.length?4+variantIndex*(detailEnd-4)/variants.length:0;
  const variantBlend=seeking||p.id==='3w1'?1:smoothBlend((local-variantStart)/.7);
  // Compare optical output only within the same construction, using catalogue
  // flux. This is presentation brightness, not a cross-product lux simulation.
  const outputs=variants.flatMap(v=>v.outputs).map(catalogueNumber).filter(n=>n>0);
  const reference=Math.max(1,...outputs,catalogueNumber(p.output)??0);
  function flux(v,mode){return catalogueNumber(v?.outputs[mode]??p.output)??reference;}
  function variantFlux(mode){return T.MathUtils.lerp(flux(previousVariant,mode),flux(colorVariant,mode),variantBlend);}
  let power=variantFlux(0)/reference;
  if(p.id==='3w1'&&shot)power=T.MathUtils.lerp(variantFlux(Math.max(0,powerMode-1)),variantFlux(powerMode),shot.powerBlend)/reference;
  lightProgram=model.updateLightAnimation(local,{lightLevel:level,power,variant:colorVariant?.kelvin??p.color,previousVariant:previousVariant?.kelvin??p.color,variantBlend});
  lit=level>0;
  const block=document.querySelector('.color-block');
  block.dataset.lightProgram=lit?'active':'off';
  if(lightProgram?.color)block.style.setProperty('--light-swatch',lightProgram.color);
  if(p.control!=='MONO'){
    let label=lit?lightProgram?.phase:null;
    if(lit&&p.digital)label=p.control==='CCT'?'Ciepła ↔ chłodna biel':'Kolor i biel · fala';
    else if(label==='Osobny kanał bieli')label=colorVariant?.label.replace(/^RGB \+ /,'')??'Kanał bieli';
    document.querySelector('[data-product="color"]').textContent=label||colorVariant?.label||p.colorCopy;
  }
}
function selectModel(index){
  model.setLight(false);lit=false;lightProgram=null;
  numbers.finish();
  colorVariant=null;colorKey='';
  modelIndex=index;model=models[index];models.forEach((m,i)=>{m.group.visible=i===index;});
  const p=products[index];document.body.dataset.model=p.id;
  document.querySelector('#model-select').value=String(index);
  document.querySelector('#model-count').textContent=`${String(index+1).padStart(2,'0')} / ${products.length}`;
  const fields={kelvin:p.color,'color-unit':p.unit,color:p.colorCopy,power:p.power,output:p.output,density:p.density,voltage:p.voltage,width:p.width,'output-label':p.outputLabel,'output-unit':p.outputUnit,quality:p.quality,'quality-unit':p.qualityUnit,'quality-label':p.qualityLabel,tech:p.tech.includes('COB')?p.tech:`SMD ${p.tech}`,ip:p.ip,beam:p.beam,section:p.tech.includes('COB')?`Cięcie ${p.cut} mm`:`${model.specification.ledsPerSection} LED / sekcja`};
  for(const [key,value] of Object.entries(fields))document.querySelector(`[data-product="${key}"]`).textContent=value;
  fact('efficacy',p.efficacy??'—');fact('copper',p.copperOz??'—');
  document.querySelector('[data-product="copper-unit"]').textContent=p.copperOz?'oz':'';
  const heading=document.querySelector('#product-title');heading.replaceChildren();const range=document.createElement('small');const series=document.createElement('b');series.className='series-caption';series.textContent='SERIA';const seriesName=document.createElement('span');seriesName.className='series-name';seriesName.textContent=p.range;range.append(series,seriesName);const name=document.createElement('span');const mainName=p.name.split(' \u00b7 ')[0];name.textContent=mainName;
  const reference=document.createElement('em');reference.className='model-variant';reference.dataset.product='sku';reference.setAttribute('aria-label','Symbol katalogowy');reference.textContent=p.sku;
  heading.append(range,name,reference);heading.dataset.long=String(mainName.length>13);
  document.querySelector('[data-product="warranty"]').textContent=`${p.warrantyYears} ${p.warrantyYears===3?'lata':'lat'} gwarancji`;
  document.querySelector('.polish-flag').hidden=!p.madeInPoland;document.querySelector('.assurance-origin').hidden=!p.madeInPoland;
  document.querySelector('.power-modes').hidden=p.id!=='3w1';
  featureIcons.update(p);energy(p.energyClass);buildColorVariants(p);updateColorVariant(p.id==='3w1'?6:0);
  host.setAttribute('aria-label',`${p.range} ${p.name}, model 3D, ${p.width} mm PCB.`);
  if(p.id==='3w1')setPowerMode(0);
  model.setLight(lit);
  pendingProductReveal=!!shot?.rebuild&&!reduced.matches;
  intro.style.opacity='1';intro.dataset.rebuilding=String(pendingProductReveal);
  revealFacts(pendingProductReveal?'heading':'all');
  schedule();
}
function swatch(k){return {czerwona:'#ed6957',niebieska:'#729ce8',różowa:'#e790ba',zielona:'#8fc497',żółta:'#f3d563'}[k]??(Number(k)<=2700?'#ffd393':Number(k)<3500?'#ffe0a4':Number(k)<=4500?'#fff3d6':Number(k)>6500?'#c0dbff':'#e0edff');}
function buildColorVariants(p){
  document.querySelector('.color-block').dataset.extreme='false';
  const container=document.querySelector('#color-variants');container.replaceChildren();document.querySelector('.color-block').dataset.numeric=String(/^\d+$/.test(p.color));
  document.querySelector('.color-availability').hidden=!p.colorVariants.length;
  for(const v of p.colorVariants){
    const item=document.createElement('span');item.dataset.kelvin=v.kelvin;
    item.style.setProperty('--swatch',swatch(v.kelvin));
    const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.textContent=/^\d+$/.test(v.kelvin)?`${p.control==='RGBW'?'RGB + ':''}${v.kelvin} K`:v.label;
    const outline=document.createElementNS('http://www.w3.org/2000/svg','svg');outline.setAttribute('class','variant-outline');outline.setAttribute('aria-hidden','true');outline.setAttribute('viewBox','0 0 100 36');outline.setAttribute('preserveAspectRatio','none');
    const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');for(const [key,value] of Object.entries({x:1,y:1,width:98,height:34,rx:4,pathLength:100}))rect.setAttribute(key,value);outline.append(rect);
    item.append(dot,label,outline);container.append(item);
  }
}
function updateColorVariant(local=0){
  const p=products[modelIndex],variants=p.colorVariants;
  if(!variants.length){document.querySelector('.color-block').dataset.multicolor=String(p.control.startsWith('RGB'));return;}
  const v=variants[sampleVariant(local,variants.length)],key=`${p.id}:${v.kelvin}`;
  if(key===colorKey)return;
  colorKey=key;colorVariant=v;model.setTemperature(v.kelvin);featureIcons.setColor(v.kelvin);
  const reference=document.querySelector('[data-product="sku"]');reference.textContent=v.sku;
  document.querySelector('#model-select').options[modelIndex].textContent=modelOption(p,v.sku);
  if(!seeking&&!reduced.matches){reference.getAnimations().forEach(animation=>animation.cancel());reference.animate([{opacity:.3,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,easing:'ease-out'});}
  fact('kelvin',p.control==='RGBW'?'RGBW':v.kelvin);
  document.querySelector('[data-product="color-unit"]').textContent=/^\d+$/.test(v.kelvin)&&p.control!=='RGBW'?'K':'';
  document.querySelector('[data-product="color"]').textContent=v.label;
  fact('output',v.outputs[p.id==='3w1'?powerMode:0]??'—');
  fact('efficacy',v.efficacies?.[p.id==='3w1'?powerMode:0]??p.efficacy??'—');
  if(p.id!=='3w1'&&v.power)fact('power',v.power);
  energy(v.energyClass??p.energyClass);
  const block=document.querySelector('.color-block');block.dataset.multicolor=String(p.control.startsWith('RGB'));block.style.setProperty('--swatch',swatch(v.kelvin));
  block.dataset.extreme=String(v.label.toLowerCase().includes('bardzo'));
  document.querySelectorAll('[data-kelvin]').forEach(item=>{const active=item.dataset.kelvin===v.kelvin;item.dataset.active=String(active);const outline=item.querySelector('rect');outline.getAnimations().forEach(a=>a.cancel());if(active&&!reduced.matches)outline.animate([{strokeDashoffset:100},{strokeDashoffset:0}],{duration:850,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'});});
  if(!reduced.matches)for(const el of [document.querySelector('.color-fact'),document.querySelector('[data-product="output"]')]){
    el.getAnimations().forEach(a=>a.cancel());el.animate([{opacity:.3,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,easing:'cubic-bezier(.22,.61,.36,1)'});
  }
}
function setTheme(next){
  theme=next==='day'?'day':'night';const day=theme==='day';document.body.dataset.theme=theme;
  document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme)));
  document.querySelector('meta[name="theme-color"]').content=day?'#e8e9e2':'#0b100f';
  ambient.intensity=day?.95:1.25;ambient.groundColor.set(day?0x6d7a6c:0x39463b);
  key.intensity=day?2.5:3.2;fill.intensity=day?.65:1.3;rim.intensity=day?1.4:2.4;
  scene.environmentIntensity=day?.35:.55;renderer.toneMappingExposure=day?.78:1.08;
  featureIcons.setTheme(theme);
  try{localStorage.setItem('prescot-smd-scene',theme);}catch{}
  schedule();
}
function revealFacts(part='all'){
  [...document.querySelectorAll('[data-reveal]')].filter(el=>part==='all'||el.matches('.product-assurance,#product-title')===(part==='heading')).forEach((el,i)=>{
    el.getAnimations().forEach(a=>a.cancel());
    if(!reduced.matches&&!seeking)el.animate([{opacity:0,transform:'translateX(-16px)'},{opacity:1,transform:'translateX(0)'}],{duration:380,delay:50+i*20,easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'});
  });
}
const observer=new ResizeObserver(()=>{resize();schedule();});observer.observe(host);
const visibilityObserver=new IntersectionObserver(([entry])=>{
  visible=entry.isIntersecting;if(visible){last=0;schedule();}else{cancelAnimationFrame(raf);raf=0;last=0;}
});visibilityObserver.observe(host);
function visibility(){if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else schedule();}
document.addEventListener('visibilitychange',visibility);
function motionChanged(){rotating=touring=!reduced.matches;if(reduced.matches){numbers.finish();clearRebuild();model.setLight(false);lit=false;document.querySelectorAll('[data-reveal]').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));}schedule();}reduced.addEventListener('change',motionChanged);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);raf=0;loading.hidden=false;loading.textContent='Podgląd 3D został wstrzymany. Odśwież stronę, aby go przywrócić.';disposed=true;});
function dispose(){disposed=true;numbers.finish();cancelAnimationFrame(raf);observer.disconnect();visibilityObserver.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motionChanged);rebuilds.forEach(r=>r?.dispose());models.forEach(m=>m.dispose());featureIcons.dispose();voltageCue.dispose();environment.dispose();renderer.dispose();}
addEventListener('pagehide',e=>{if(e.persisted){cancelAnimationFrame(raf);raf=0;last=0;}else dispose();});
addEventListener('pageshow',()=>{if(!disposed)schedule();});
// Deterministic film seeking for frame capture/export; no playback UI is shown.
function seek(seconds,{play=false}={}){
  if(!ready)return false;
  seeking=true;numbers.finish();
  tourSeconds=Math.max(0,seconds);shot=samplePresentation(tourSeconds,products.length);
  clearRebuild();selectModel(shot.model);
  if(products[modelIndex].id==='3w1')setPowerMode(shot.powerMode);
  updateColorVariant(shot.productTime);
  updateLighting();
  zoom=targetZoom=shot.zoom;rotation=shot.rotation;tilt=shot.tilt;cameraTargetY=shot.targetY;
  view=zoom>.35?'macro':'full';rotating=touring=play&&!reduced.matches;last=0;
  if(shot.rebuild&&!reduced.matches)applyRebuild(shot.rebuild.from,shot.rebuild.progress);
  seeking=false;schedule();return true;
}
window.smdViewer={seek,inspect:()=>({...model.inspect(),...voltageCue.inspect(),ready,modelIndex,productId:products[modelIndex].id,modelCount:products.length,models:products.map(p=>p.id),sectionFraming,featureIcons:featureIcons.inspect(),sku:colorVariant?.sku??products[modelIndex].sku,playbackRate:PLAYBACK_RATE,powerMode,touring,tourSeconds,phase:activeRebuild?'rebuild':shot?.phase,rebuild:activeRebuild?.inspect()??null,rotating,lit,view,theme,visible,kelvin:Number(colorVariant?.kelvin??products[modelIndex].color)||null,zoom,targetZoom,rotation,cameraPosition:camera.position.toArray(),elapsed,frames:painted,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,reducedMotion:reduced.matches})};
const modelSelect=document.querySelector('#model-select');
products.forEach((p,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=modelOption(p);modelSelect.append(option);});
function startModel(index){if(!ready)return;seek(presentationStart((index+products.length)%products.length),{play:true});}
modelSelect.addEventListener('change',()=>startModel(Number(modelSelect.value)));
document.querySelector('[data-model-step="-1"]').addEventListener('click',()=>startModel(modelIndex-1));
document.querySelector('[data-model-step="1"]').addEventListener('click',()=>startModel(modelIndex+1));
document.querySelector('[data-model-restart]').addEventListener('click',()=>startModel(modelIndex));
resize();setTheme('day');
Promise.all(models.map(m=>m.ready)).then(()=>{
  if(disposed)return;
  ready=true;loading.hidden=true;document.querySelectorAll('.film-preview-nav button,.film-preview-nav select').forEach(el=>el.disabled=false);selectModel(0);schedule();
}).catch(error=>{loading.textContent='Nie udało się wczytać nadruków modelu. Odśwież stronę.';console.error(error);});
