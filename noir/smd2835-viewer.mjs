import * as T from '../konfigurator/vendor/three/build/three.module.min.js';
import {createCatalogStrip} from './catalog-strip-model.mjs?v=detail-9';
import {mainFilmProducts,filmProductsForFamily} from './strip-film-selection.mjs?v=detail-4';
import {resolveFilmVariant} from './strip-product-variants.mjs?v=1';
import {createPresentation,sampleVariant} from './strip-presentation.mjs?v=detail-9';
import {createStripRebuild} from './strip-rebuild.mjs';
import {powerModes} from './offer-series-models.mjs';
import {createFeatureIcons} from './film-feature-3d.mjs?v=detail-11';
import {createNumberAnimator} from './film-numbers.mjs?v=capture-1';
import {createVoltageCue} from './strip-lighting.mjs?v=detail-10';
import {frameStripSection} from './strip-section-camera.mjs?v=detail-4';
import {createFactHighlight} from './strip-fact-highlight.mjs';
import {createWcobSectionDetail} from './wcob-section-detail.mjs?v=end-1';
import {sampleWcobDetailCue} from './wcob-detail-cues.mjs?v=end-1';
import {formatStripSku} from './strip-display-sku.mjs';

const PLAYBACK_RATE=1.15;
const parameters=new URLSearchParams(location.search);
const offer=parameters.get('offer')==='1';
const offerStyles=offer?new Promise((resolve,reject)=>{
  const link=document.createElement('link');link.rel='stylesheet';
  link.href=new URL('../oferta/viewer.css?v=3',import.meta.url).href;
  link.onload=resolve;link.onerror=()=>reject(new Error('Nie udało się wczytać układu oferty.'));
  document.documentElement.dataset.offer='true';document.head.append(link);
}):Promise.resolve();
const family=['delux','premium','cob','special'].includes(parameters.get('family'))?parameters.get('family'):null;
const embedded=parameters.get('embed')==='1';
const products=family?filmProductsForFamily(family):mainFilmProducts;
const {samplePresentation,presentationStart}=createPresentation(products,{canonicalMotion:!!family,cycleThreeInOneColors:offer});
let renderScale=embedded?T.MathUtils.clamp(Number(parameters.get('scale'))||1,.15,1):1;
document.documentElement.dataset.filmEmbed=String(embedded);
document.documentElement.dataset.film=String(parameters.get('film')==='1');
const smdVoltageName=product=>/^(?:SMD|COB)\s+(?:12|24|48)\s*V(?:\s*·|$)/.test(product.name)?`${product.name.split(' · ')[0]} · ${product.density}\u00a0LED/m`:product.tech.includes('COB')?product.name:null;
const originalModelName=product=>(smdVoltageName(product)??product.name.split(' \u00b7 ')[0]).replace(/(\d+(?:[,.]\d+)?)\s+mm\b/g,'$1\u00a0mm');
const densityModelName=product=>{
  const base=originalModelName(product).replace(/\s*·\s*\d+(?:[,.]\d+)?\s*(?:LED\/m)?$/,'').replace(/\s*\/\s*\d+$/,'');
  return `${base} · ${product.density}\u00a0LED/m`;
};
const modelOption=(product,sku=product.sku)=>`${product.range} · ${densityModelName(product)} · ${formatStripSku(sku)}`;
function updateModelName(product){
  const heading=document.querySelector('#product-title'),name=heading.querySelector(':scope>.product-model-name');
  if(!name)return;
  const original=originalModelName(product);
  heading.dataset.long=String(original.length>12);
  name.style.cssText='';name.textContent=original;
  const style=getComputedStyle(name),fontSize=parseFloat(style.fontSize),spacing=parseFloat(style.letterSpacing)||0;
  const rowHeight=name.getBoundingClientRect().height;
  name.textContent=densityModelName(product);
  name.style.whiteSpace='nowrap';name.style.height=`${rowHeight}px`;name.style.lineHeight=`${rowHeight}px`;
  name.style.letterSpacing=`${spacing/fontSize}em`;
  const range=document.createRange();range.selectNodeContents(name);
  const width=range.getBoundingClientRect().width,available=name.clientWidth;
  if(width>available)name.style.fontSize=`${Math.floor(fontSize*available/width*100)/100}px`;
}
let colorVariant=null,colorKey='',effectiveProduct=products[0];
let lightProgram=null;
const catalogueNumber=value=>{const text=String(value??'').trim().replace(',','.');return /^\d+(?:\.\d+)?$/.test(text)?Number(text):null;};
const smoothBlend=value=>{const x=T.MathUtils.clamp(value,0,1);return x*x*(3-2*x);};
const numbers=createNumberAnimator();let seeking=false;
let capturing=false,captureTime=0,captureRenderTime=0;
let captureAnimations=new Map();
function fact(key,value){numbers.set(document.querySelector(`[data-product="${key}"]`),value,!seeking&&!reduced.matches);}
function energy(value){
  const badge=document.querySelector('.energy-rating');badge.hidden=!value;
  document.querySelector('.energy-missing').hidden=!!value;
  badge.dataset.grade=value||'';badge.setAttribute('aria-label',`Klasa energetyczna ${value||''}, skala A–G`);
  document.querySelector('[data-product="energy"]').textContent=value||'';
  if(value){const artwork=badge.querySelector('img');artwork.src=`../noir/media/energy/class-${value.toLowerCase()}.png`;artwork.alt=`Klasa energetyczna ${value}, skala A–G`;}
}

const host=document.querySelector('#stage'),loading=document.querySelector('#loading'),intro=document.querySelector('.intro');
const factHighlight=createFactHighlight(intro);
let pendingProductReveal=false;
const featureIcons=createFeatureIcons();
featureIcons.setRenderScale?.(renderScale);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}
catch(error){loading.textContent='Podgląd 3D wymaga włączonego WebGL w przeglądarce.';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2)*renderScale);renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
host.append(renderer.domElement);
const voltageCue=createVoltageCue(host,{nearPad:true,avoidElement:intro,sequence:true});
const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,1,2000);
let sectionFraming=null,wcobDetail=null;
// Keep the reviewed opening and adjacent chapters ready. The catalogue is
// loaded on demand instead of retaining every model's textures on the GPU.
const models=Array(products.length).fill(null),modelPromises=[],modelLoaded=[];
function ensureModel(index){
  if(models[index])return models[index];
  const product=products[index],cut=Number(product.cut);
  const m=createCatalogStrip(product,{anisotropy:Math.min(8,renderer.capabilities.getMaxAnisotropy()),turns:Math.min(2.25,112.5/cut)});
  models[index]=m;modelLoaded[index]=false;scene.add(m.group);m.group.visible=false;
  m.setLight(false);m.setTemperature(product.color);
  modelPromises[index]=m.ready.then(()=>{if(models[index]===m)modelLoaded[index]=true;return m;});
  return m;
}
function keepAdjacent(index){
  const next=(index+1)%products.length,previous=(index+products.length-1)%products.length;
  ensureModel(next);
  const retained=new Set([0,1,2,index,next,previous]);
  models.forEach((m,i)=>{
    if(!m||retained.has(i))return;
    scene.remove(m.group);m.dispose();models[i]=null;modelLoaded[i]=false;modelPromises[i]=null;
  });
}
function shotModelsReady(candidate){
  const indices=candidate.rebuild?[candidate.rebuild.from,candidate.rebuild.to]:[candidate.model];
  indices.forEach(ensureModel);return indices.every(i=>modelLoaded[i]);
}
const initialModels=[0,1,2].filter(index=>index<products.length);
initialModels.forEach(ensureModel);models[0].group.visible=true;
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
const endFill=new T.DirectionalLight(0xffffff,0);scene.add(endFill,endFill.target);
if(products[0].id==='3w1')models[0].setPower(3/11);

let rotating=!reduced.matches,lit=false,zoom=0,targetZoom=0,rotation=-.22,tilt=-.04,view='full',theme='day',visible=true;
let touring=!offer&&!reduced.matches&&parameters.get('autoplay')!=='0',tourSeconds=0,shot=null,cameraTargetY=0,ready=false;
rotating=touring;
const rebuilds=[];let activeRebuild=null;
let raf=0,last=0,elapsed=0,disposed=false,painted=0,needsPaint=true,width=0,height=0,inRender=false;
let offerAmbientTime=0,offerAmbientLast=0;
function offerShot(candidate){
  if(!offer)return candidate;
  const product=products[candidate.rebuild?.from??candidate.model];
  const cut=Number(product.cut)||50;
  // Shorter cut sections need a tighter opening than 50 mm constructions.
  // Keep the approved macro endpoint, with only a restrained pullback between
  // products instead of exposing the full, several-turn display ribbon.
  const minimum=.97*(1-Math.min(.3,Math.max(.02,cut*.006)));
  return {...candidate,zoom:T.MathUtils.lerp(minimum,.97,T.MathUtils.clamp(candidate.zoom/.97,0,1))};
}
function resize(){
  const w=host.clientWidth,h=host.clientHeight;if(w===width&&h===height)return;
  width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();needsPaint=true;
  updateModelName(effectiveProduct);
}
function render(now){
  raf=0;if(disposed||(!capturing&&(document.hidden||!visible))||!ready)return;
  inRender=true;
  // Match the film clock to elapsed time even on slower graphics hardware.
  const delta=capturing?Math.max(0,(now-captureRenderTime)/1000):last?Math.max(0,(now-last)/1000):0;last=now;
  if(capturing)captureRenderTime=now;
  const ambient=offer&&!capturing&&!reduced.matches;
  if(ambient){offerAmbientTime+=offerAmbientLast?Math.max(0,(now-offerAmbientLast)/1000):0;offerAmbientLast=now;updateLighting();needsPaint=true;}
  if(rotating){
    elapsed+=delta;
    if(touring){
      const nextSeconds=tourSeconds+delta*PLAYBACK_RATE,nextShot=samplePresentation(nextSeconds,products.length);
      if(!shotModelsReady(nextShot)){inRender=false;raf=requestAnimationFrame(render);return;}
      tourSeconds=nextSeconds;shot=nextShot;
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
    if(wcobDetail){
      wcobDetail.update(shot?.wcobDetail??0,{lightLevel:0,kelvin:colorVariant?.kelvin,product:effectiveProduct});
    }
    if(wcobDetail)wcobDetail.group.visible=!activeRebuild;
    const detailBounds=null;
    sectionFraming=frameStripSection(camera,focusModel,{...shot,zoom,rotation,tilt,detailBounds},camera.aspect);
    endFill.intensity=2.1*(sectionFraming.endReveal??0);
    if(endFill.intensity){endFill.position.copy(camera.position);endFill.target.position.copy(focusModel.frame(focusModel.specification.length).p.applyMatrix4(focusModel.group.matrixWorld));endFill.target.updateMatrixWorld();}
    model.group.rotation.copy(focusModel.group.rotation);activeRebuild?.group.rotation.copy(focusModel.group.rotation);
    let cueShot=shot;
    if(wcobDetail){
      wcobDetail.group.rotation.copy(model.group.rotation);wcobDetail.group.updateMatrixWorld(true);
      if(shot?.wcobDetail!==null&&shot?.wcobDetail!==undefined)cueShot={...shot,detailCue:sampleWcobDetailCue(wcobDetail,shot.local)};
    }
    voltageCue.update(model,effectiveProduct,camera,reduced.matches?null:cueShot,width,height,powerMode);
    const cueStages=voltageCue.inspect().cueStages;
    factHighlight.update(cueStages?.highlightFacts,cueStages?.highlightLevel);
    renderer.render(scene,camera);featureIcons.render(ambient?offerAmbientTime:shot?.iconTime??0,reduced.matches||(!touring&&!ambient),reduced.matches,cueStages?.featureEmphasis??0);painted++;needsPaint=false;
  }
  inRender=false;
  if(!capturing&&(ambient||rotating||Math.abs(zoom-targetZoom)>.0001))raf=requestAnimationFrame(render);
}
function schedule(){needsPaint=true;if(!capturing&&!raf&&!inRender&&!document.hidden&&!disposed&&visible&&ready)raf=requestAnimationFrame(render);}
function clearRebuild(){
  if(activeRebuild){activeRebuild.dispose();rebuilds.fill(null);activeRebuild=null;}
  models.forEach((m,i)=>{if(m)m.group.visible=i===modelIndex;});
}
function applyRebuild(from,progress){
  if(!rebuilds[from]){rebuilds[from]=createStripRebuild(models[from],models[(from+1)%models.length]);scene.add(rebuilds[from].group);}
  activeRebuild=rebuilds[from];activeRebuild.group.visible=true;
  models.forEach(m=>{if(m)m.group.visible=false;});activeRebuild.update(progress);
}
function setPowerMode(index){
  powerMode=index;const mode=powerModes[index];
  if(products[modelIndex].id==='3w1'){
    model.setPower(Number(mode.power)/11);
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
  const p=effectiveProduct,variants=products[modelIndex].colorVariants;
  const incoming=shot?.phase==='ready'||(shot?.rebuild&&shot.rebuild.to===modelIndex);
  const local=incoming?0:shot?.local??0,detailEnd=shot?.detailEnd??(p.id==='3w1'?13:18);
  // Addressable strips demonstrate from the opening shot. All constructions
  // power down before mechanical rebuilding, including the incoming model.
  const level=reduced.matches||incoming||shot?.rebuild?0:p.digital?(local<=detailEnd?1:shot?.lightLevel??0):shot?.lightLevel??0;
  const variantIndex=sampleVariant(shot?.productTime??0,variants.length);
  const previousVariant=p.id==='3w1'?colorVariant:variants[Math.max(0,variantIndex-1)]??colorVariant;
  const variantBegin=shot?.variantStart??4;
  const variantDuration=((shot?.variantEnd??detailEnd)-variantBegin)/Math.max(1,variants.length);
  const variantStart=variantBegin+variantIndex*variantDuration;
  const variantProgress=T.MathUtils.clamp((local-variantStart)/variantDuration,0,1);
  const variantBlend=seeking||p.id==='3w1'?1:smoothBlend((local-variantStart)/.7);
  // Compare optical output only within the same construction, using catalogue
  // flux. This is presentation brightness, not a cross-product lux simulation.
  const outputs=variants.flatMap(v=>v.outputs).map(catalogueNumber).filter(n=>n>0);
  const reference=Math.max(1,...outputs,catalogueNumber(p.output)??0);
  function flux(v,mode){return catalogueNumber(v?.outputs[mode]??p.output)??reference;}
  function variantFlux(mode){return T.MathUtils.lerp(flux(previousVariant,mode),flux(colorVariant,mode),variantBlend);}
  let power=variantFlux(0)/reference;
  if(p.id==='deluxlow'||p.id==='slimlow'||p.id==='coblow')power*=.23;
  if(p.id==='3w1'&&shot)power=T.MathUtils.lerp(variantFlux(Math.max(0,powerMode-1)),variantFlux(powerMode),shot.powerBlend)/reference;
  const ambient=offer&&!capturing&&!reduced.matches;
  lightProgram=model.updateLightAnimation(local+(ambient?offerAmbientTime:0),{activeProduct:p,lightLevel:level,power,variant:colorVariant?.kelvin??p.color,previousVariant:previousVariant?.kelvin??p.color,variantBlend,variantProgress:ambient&&(p.control!=='MONO'||p.digital)?null:variantProgress});
  lit=level>0;
  if(offer){
    const state=model.inspect(),sample=state.digital?state.lightSamples?.[Math.floor((state.lightSamples?.length??0)/2)]:null;
    const strength=T.MathUtils.clamp(sample?.intensity??state.lightLevel*state.lightPower,0,1);
    host.style.setProperty('--offer-glow',state.lightColor);
    host.style.setProperty('--offer-glow-strength',String(.3+.34*Math.sqrt(strength)));
  }
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
  wcobDetail?.dispose();wcobDetail=null;
  model.setLight(false);lit=false;lightProgram=null;
  factHighlight.update();
  numbers.finish();
  colorVariant=null;colorKey='';
  modelIndex=index;model=models[index];models.forEach((m,i)=>{if(m)m.group.visible=i===index;});
  keepAdjacent(index);
  const p=products[index];effectiveProduct=p;document.body.dataset.model=p.id;
  if(p.id.startsWith('wcob')){wcobDetail=createWcobSectionDetail(model,p);scene.add(wcobDetail.group);}
  document.querySelector('#model-select').value=String(index);
  const modelCountLabel=`${String(index+1).padStart(2,'0')} / ${products.length}`;
  document.querySelector('#model-count').textContent=modelCountLabel;
  document.querySelector('#film-model-count').textContent=modelCountLabel;
  const fields={kelvin:p.color,'color-unit':p.unit,color:p.colorCopy,power:p.power,output:p.output,density:p.density,voltage:p.voltage,width:p.width,'output-label':p.outputLabel,'output-unit':p.outputUnit,quality:p.quality,'quality-unit':p.qualityUnit,'quality-label':p.qualityLabel,tech:p.tech.includes('COB')?p.tech:`SMD ${p.tech}`,ip:p.ip,beam:p.beam,section:`Cięcie co ${p.cut} mm`};
  for(const [key,value] of Object.entries(fields))document.querySelector(`[data-product="${key}"]`).textContent=value;
  fact('efficacy',p.efficacy??'—');fact('copper',p.copperOz??'—');
  document.querySelector('[data-product="copper-unit"]').textContent=p.copperOz?'oz':'';
  const heading=document.querySelector('#product-title');heading.replaceChildren();const range=document.createElement('small');const series=document.createElement('b');series.className='series-caption';series.textContent='SERIA';const seriesName=document.createElement('span');seriesName.className='series-name';seriesName.textContent=p.range;range.append(series,seriesName);const name=document.createElement('span');name.className='product-model-name';
  const reference=document.createElement('em');reference.className='model-variant';reference.dataset.product='sku';reference.setAttribute('aria-label','Symbol katalogowy');reference.textContent=formatStripSku(p.sku);
  heading.append(range,name,reference);updateModelName(p);
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
function swatch(k){return k==='CCT'?'linear-gradient(100deg,#ffd393 0%,#fff3d6 48%,#c0dbff 100%)':{czerwona:'#ed6957',niebieska:'#729ce8',różowa:'#e790ba',zielona:'#8fc497',żółta:'#f3d563'}[k]??(Number(k)<=2700?'#ffd393':Number(k)<3500?'#ffe0a4':Number(k)<=4500?'#fff3d6':Number(k)>6500?'#c0dbff':'#e0edff');}
function buildColorVariants(p){
  document.querySelector('.color-block').dataset.extreme='false';
  const container=document.querySelector('#color-variants');container.replaceChildren();document.querySelector('.color-block').dataset.numeric=String(/^\d+$/.test(p.color));
  document.querySelector('.color-availability').hidden=!p.colorVariants.length;
  for(const v of p.colorVariants){
    const item=document.createElement('span');item.dataset.kelvin=v.kelvin;
    item.style.setProperty('--swatch',swatch(v.kelvin));
    const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.textContent=/^\d+$/.test(v.kelvin)?`${p.control==='RGBW'?'RGB + ':''}${v.kelvin} K`:v.label;
    item.append(dot,label);container.append(item);
  }
}
function updateColorVariant(local=0){
  const p=products[modelIndex],variants=p.colorVariants;
  if(!variants.length){document.querySelector('.color-block').dataset.multicolor=String(p.control.startsWith('RGB'));return;}
  const v=variants[sampleVariant(local,variants.length)],key=`${p.id}:${v.kelvin}`;
  if(key===colorKey)return;
  const previousSource=effectiveProduct.sourceProductId??effectiveProduct.id;
  colorKey=key;colorVariant=v;effectiveProduct=resolveFilmVariant(p,v);
  model.setPrintedProduct?.(effectiveProduct);
  if(previousSource!==effectiveProduct.sourceProductId)featureIcons.update(effectiveProduct);
  model.setTemperature(v.kelvin);featureIcons.setColor(v.kelvin);
  model.group.userData.catalogueDensity=Number(effectiveProduct.density);
  model.group.userData.catalogueCut=Number(effectiveProduct.cut);
  const reference=document.querySelector('[data-product="sku"]');reference.textContent=formatStripSku(v.sku);
  document.querySelector('#model-select').options[modelIndex].textContent=modelOption(effectiveProduct,v.sku);
  updateModelName(effectiveProduct);
  if(!seeking&&!reduced.matches){reference.getAnimations().forEach(animation=>animation.cancel());reference.animate([{opacity:.3,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,easing:'ease-out'});}
  fact('kelvin',effectiveProduct.control==='RGBW'?'RGBW':v.kelvin);
  document.querySelector('[data-product="color-unit"]').textContent=/^\d+$/.test(v.kelvin)&&effectiveProduct.control!=='RGBW'?'K':'';
  document.querySelector('[data-product="color"]').textContent=v.label;
  fact('output',v.outputs[p.id==='3w1'?powerMode:0]??'—');
  fact('efficacy',v.efficacies?.[p.id==='3w1'?powerMode:0]??effectiveProduct.efficacy??'—');
  if(p.id!=='3w1'&&v.power)fact('power',v.power);
  for(const field of ['density','voltage','width','quality'])fact(field,effectiveProduct[field]);
  for(const [field,value] of Object.entries({'output-label':effectiveProduct.outputLabel,'output-unit':effectiveProduct.outputUnit,'quality-unit':effectiveProduct.qualityUnit,'quality-label':effectiveProduct.qualityLabel,tech:effectiveProduct.tech.includes('COB')?effectiveProduct.tech:`SMD ${effectiveProduct.tech}`,ip:effectiveProduct.ip,beam:effectiveProduct.beam,section:`Cięcie co ${effectiveProduct.cut} mm`}))document.querySelector(`[data-product="${field}"]`).textContent=value;
  document.querySelector('[data-feature="section"] small').textContent='Moduł cięcia';
  fact('copper',effectiveProduct.copperOz??'—');
  document.querySelector('[data-product="copper-unit"]').textContent=effectiveProduct.copperOz?'oz':'';
  energy(effectiveProduct.energyClass);
  const block=document.querySelector('.color-block');block.dataset.multicolor=String(effectiveProduct.control.startsWith('RGB'));block.dataset.numeric=String(/^\d+$/.test(v.kelvin));block.style.setProperty('--swatch',swatch(v.kelvin));
  block.dataset.extreme=String(v.label.toLowerCase().includes('bardzo'));
  document.querySelectorAll('[data-kelvin]').forEach(item=>{item.dataset.active=String(item.dataset.kelvin===v.kelvin);});
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
  visible=entry.isIntersecting;if(visible){last=offerAmbientLast=0;schedule();}else{cancelAnimationFrame(raf);raf=0;last=offerAmbientLast=0;}
});visibilityObserver.observe(host);
function visibility(){if(document.hidden){cancelAnimationFrame(raf);raf=0;last=offerAmbientLast=0;}else schedule();}
document.addEventListener('visibilitychange',visibility);
function motionChanged(){rotating=touring=!offer&&!reduced.matches;offerAmbientLast=0;if(reduced.matches){numbers.finish();clearRebuild();model.setLight(false);lit=false;document.querySelectorAll('[data-reveal]').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));}schedule();}reduced.addEventListener('change',motionChanged);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);raf=0;loading.hidden=false;loading.textContent='Podgląd 3D został wstrzymany. Odśwież stronę, aby go przywrócić.';disposed=true;});
function dispose(){disposed=true;wcobDetail?.dispose();numbers.finish();cancelAnimationFrame(raf);observer.disconnect();visibilityObserver.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motionChanged);rebuilds.forEach(r=>r?.dispose());models.forEach(m=>m?.dispose());featureIcons.dispose();factHighlight.dispose();voltageCue.dispose();environment.dispose();renderer.dispose();}
addEventListener('pagehide',e=>{if(e.persisted){cancelAnimationFrame(raf);raf=0;last=0;}else dispose();});
addEventListener('pageshow',()=>{if(!disposed)schedule();});
// Deterministic film seeking for frame capture/export; no playback UI is shown.
let seekRequest=0;
function seek(seconds,{play=false}={}){
  if(!ready)return false;
  endCapture();
  const request=++seekRequest,candidate=samplePresentation(Math.max(0,seconds),products.length);
  if(!shotModelsReady(candidate)){
    rotating=touring=false;last=0;
    const indices=candidate.rebuild?[candidate.rebuild.from,candidate.rebuild.to]:[candidate.model];
    return Promise.all(indices.map(i=>modelPromises[i])).then(()=>request===seekRequest?seekReady(seconds,{play}):false);
  }
  return seekReady(seconds,{play});
}
function seekReady(seconds,{play=false}={}){
  seeking=true;numbers.finish();
  tourSeconds=Math.max(0,seconds);shot=offerShot(samplePresentation(tourSeconds,products.length));
  clearRebuild();selectModel(shot.model);
  if(products[modelIndex].id==='3w1')setPowerMode(shot.powerMode);
  updateColorVariant(shot.productTime);
  updateLighting();
  zoom=targetZoom=shot.zoom;rotation=shot.rotation;tilt=shot.tilt;cameraTargetY=shot.targetY;
  view=zoom>.35?'macro':'full';rotating=touring=play&&!offer&&!reduced.matches;last=0;
  if(shot.rebuild&&!reduced.matches)applyRebuild(shot.rebuild.from,shot.rebuild.progress);
  seeking=false;schedule();return true;
}
// Scroll scrubbing reuses the current model, icons and section detail. Unlike
// film seeking, it must not reconstruct those objects for every wheel event.
function scrub(seconds){
  if(!ready||disposed)return false;
  endCapture();rotating=touring=false;last=0;
  const time=T.MathUtils.clamp(Number(seconds)||0,0,presentationStart(products.length)-.000001);
  const request=++seekRequest,candidate=samplePresentation(time,products.length);
  const apply=()=>request===seekRequest&&!disposed?scrubReady(time,candidate):false;
  if(!shotModelsReady(candidate)){
    const indices=candidate.rebuild?[candidate.rebuild.from,candidate.rebuild.to]:[candidate.model];
    return Promise.all(indices.map(index=>modelPromises[index])).then(apply);
  }
  return apply();
}
function scrubReady(seconds,candidate){
  seeking=true;numbers.finish();
  if(activeRebuild&&(!candidate.rebuild||activeRebuild!==rebuilds[candidate.rebuild.from]))clearRebuild();
  tourSeconds=seconds;elapsed=seconds/PLAYBACK_RATE;shot=offerShot(candidate);
  if(shot.model!==modelIndex)selectModel(shot.model);
  if(products[modelIndex].id==='3w1'&&powerMode!==shot.powerMode)setPowerMode(shot.powerMode);
  updateColorVariant(shot.productTime);seeking=false;updateLighting();
  zoom=targetZoom=shot.zoom;rotation=shot.rotation;tilt=shot.tilt;cameraTargetY=shot.targetY;
  if(shot.rebuild&&!reduced.matches)applyRebuild(shot.rebuild.from,shot.rebuild.progress);
  view=zoom>.35?'macro':'full';rotating=touring=false;last=0;
  seeking=false;schedule();return true;
}
function setPlaying(value){endCapture();rotating=touring=!!value&&!offer&&!reduced.matches;last=0;schedule();return touring;}
function setRenderScale(value=1){
  renderScale=T.MathUtils.clamp(Number(value)||1,.15,1);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2)*renderScale);
  featureIcons.setRenderScale?.(renderScale);schedule();return renderScale;
}
function selectProduct(id,{play=touring}={}){
  const index=products.findIndex(product=>product.id===id);
  if(index<0)throw new Error(`Brak modelu w tej rodzinie: ${id}`);
  return seek(presentationStart(index),{play});
}

function advanceCaptureAnimations(milliseconds,initial=false){
  // Includes CSS keyframes, pseudo-element outlines, transitions and the
  // number/reveal WAAPI effects; none may follow wall time during encoding.
  const animations=document.getAnimations(),active=new Set(animations);
  for(const animation of captureAnimations.keys())if(!active.has(animation))captureAnimations.delete(animation);
  for(const animation of animations){
    if(!captureAnimations.has(animation))captureAnimations.set(animation,initial?0:milliseconds);
    if(animation.playState!=='paused')animation.pause();
    animation.currentTime=Math.max(0,milliseconds-captureAnimations.get(animation));
  }
}
function endCapture(){
  if(!capturing)return;
  capturing=false;numbers.setTime(null);
  for(const animation of captureAnimations.keys())if(animation.playState==='paused')animation.play();
  captureAnimations.clear();last=0;
}

// Sequential offline capture follows the normal state changes without
// rebuilding the same model or restarting its feature icons every frame.
// The caller supplies real movie seconds, including the approved 1.15 speed.
async function captureFrame(realSeconds){
  if(!ready||disposed)throw new Error('Film nie jest gotowy do eksportu.');
  const seconds=Math.max(0,Number(realSeconds)||0),milliseconds=seconds*1000;
  const initial=!capturing||seconds<captureTime;
  capturing=true;rotating=false;touring=true;seeking=false;
  cancelAnimationFrame(raf);raf=0;
  if(initial){numbers.finish();captureAnimations.clear();captureRenderTime=milliseconds;}
  captureTime=seconds;numbers.setTime(milliseconds);
  if(!initial)advanceCaptureAnimations(milliseconds);
  const candidate=samplePresentation(seconds*PLAYBACK_RATE,products.length);
  if(!shotModelsReady(candidate)){
    const indices=candidate.rebuild?[candidate.rebuild.from,candidate.rebuild.to]:[candidate.model];
    await Promise.all(indices.map(index=>modelPromises[index]));
  }
  if(disposed)throw new Error('Film został zamknięty podczas eksportu.');
  if(initial||(activeRebuild&&(!candidate.rebuild||activeRebuild!==rebuilds[candidate.rebuild.from])))clearRebuild();
  tourSeconds=seconds*PLAYBACK_RATE;elapsed=seconds;shot=candidate;
  if(initial||shot.model!==modelIndex)selectModel(shot.model);
  if(products[modelIndex].id==='3w1'&&!shot.rebuild&&powerMode!==shot.powerMode)setPowerMode(shot.powerMode);
  updateColorVariant(shot.productTime);updateLighting();
  targetZoom=shot.zoom;rotation=shot.rotation;tilt=shot.tilt;cameraTargetY=shot.targetY;
  if(initial)zoom=targetZoom;
  if(shot.rebuild)applyRebuild(shot.rebuild.from,shot.rebuild.progress);
  view=shot.zoom>.35?'macro':'full';
  if(initial&&seconds>0)numbers.finish();else numbers.setTime(milliseconds);
  needsPaint=true;render(milliseconds);
  advanceCaptureAnimations(milliseconds,initial);
  await Promise.all([...document.images].filter(image=>!image.complete).map(image=>image.decode().catch(()=>{})));
  await new Promise(resolve=>requestAnimationFrame(resolve));
  advanceCaptureAnimations(milliseconds,initial);
  return {time:seconds,filmTime:tourSeconds,model:products[modelIndex].id,frame:painted};
}
window.smdViewer={seek,scrub,captureFrame,setPlaying,setRenderScale,selectProduct,inspect:()=>({...model.inspect(),...voltageCue.inspect(),ready,family,embedded,offer,capturing,captureTime,filmDuration:presentationStart(products.length),exportDuration:presentationStart(products.length)/PLAYBACK_RATE,renderScale,pixelRatio:renderer.getPixelRatio(),modelIndex,productId:products[modelIndex].id,activeVariant:{sourceProductId:effectiveProduct.sourceProductId??effectiveProduct.id,control:effectiveProduct.control,density:effectiveProduct.density,cut:effectiveProduct.cut,power:effectiveProduct.power,output:effectiveProduct.output,efficacy:effectiveProduct.efficacy,energyClass:effectiveProduct.energyClass},modelUuid:model.group.uuid,modelCount:products.length,loadedModelCount:models.filter(Boolean).length,chapterStarts:products.map((_,i)=>presentationStart(i)),models:products.map(p=>p.id),sectionFraming,wcobDetail:wcobDetail?.inspect()??null,featureIcons:featureIcons.inspect(),factHighlight:factHighlight.inspect(),sku:colorVariant?.sku??products[modelIndex].sku,playbackRate:PLAYBACK_RATE,powerMode,touring,tourSeconds,phase:activeRebuild?'rebuild':shot?.phase,rebuild:activeRebuild?.inspect()??null,rotating,lit,view,theme,visible,kelvin:Number(colorVariant?.kelvin??products[modelIndex].color)||null,zoom,targetZoom,rotation,cameraPosition:camera.position.toArray(),elapsed,frames:painted,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,reducedMotion:reduced.matches})};
const modelSelect=document.querySelector('#model-select');
products.forEach((p,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=modelOption(p);modelSelect.append(option);});
function startModel(index){if(!ready)return;seek(presentationStart((index+products.length)%products.length),{play:true});}
modelSelect.addEventListener('change',()=>startModel(Number(modelSelect.value)));
document.querySelector('[data-model-step="-1"]').addEventListener('click',()=>startModel(modelIndex-1));
document.querySelector('[data-model-step="1"]').addEventListener('click',()=>startModel(modelIndex+1));
document.querySelector('[data-model-restart]').addEventListener('click',()=>startModel(modelIndex));
resize();setTheme('day');
Promise.all([...initialModels.map(i=>modelPromises[i]),offerStyles]).then(()=>{
  if(disposed)return;
  ready=true;loading.hidden=true;document.querySelectorAll('.film-preview-nav button,.film-preview-nav select').forEach(el=>el.disabled=false);selectModel(0);schedule();
  if(embedded&&parent!==window)parent.postMessage({type:'prescot-film-ready',family,modelCount:products.length},location.origin);
}).catch(error=>{loading.textContent='Nie udało się wczytać nadruków modelu. Odśwież stronę.';console.error(error);});
