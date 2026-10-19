import * as T from '../konfigurator/vendor/three/build/three.module.min.js';
import {filmProducts} from '../noir/film-catalog.mjs';
import {createCatalogStrip} from '../noir/catalog-strip-model.mjs?v=detail-3';
import {createStripRebuild} from '../noir/strip-rebuild.mjs';
import {createFeatureIcons} from '../noir/film-feature-3d.mjs';
import {createNumberAnimator} from '../noir/film-numbers.mjs';
import {createVoltageCue} from '../noir/strip-lighting.mjs?v=detail-3';
import {sampleMiniShot,frameMiniCamera} from './mini-shot.mjs';
import {groups} from './assortment.mjs?v=7';
import {additionalProducts} from './five-volt.mjs';
import {getProductDetails} from './product-details.mjs';

const allProducts=[...filmProducts,...additionalProducts],byId=new Map(allProducts.map(p=>[p.id,p]));
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),events=new AbortController();
const groupNames={delux:'DELUX',premium:'PREMIUM',cob:'COB / WCOB',special:'SPECIAL'};
const firstModels={delux:'3w1',premium:'smd24',cob:'wcob',special:'onecut'};
const smooth=x=>{const v=T.MathUtils.clamp(x,0,1);return v*v*(3-2*v);};
const numeric=x=>Number(String(x).replace(',','.'));
const DETAIL_START=9,REBUILD_SECONDS=3.2;
let ready=false,disposed=false,playing=!reduced.matches,raf=0,last=0,width=0,height=0,seconds=0;
const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.domElement.className='overview-canvas';renderer.domElement.setAttribute('aria-hidden','true');document.body.append(renderer.domElement);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.97;
const studio=new T.Scene();studio.background=new T.Color(0x566056);const resources=[];
for(const [x,y,z,w,h,intensity] of [[-7,6,5,4,12,6],[7,2,0,3,14,5],[0,10,-4,10,2,4]]){
 const g=new T.PlaneGeometry(w,h),m=new T.MeshBasicMaterial({color:new T.Color(0xffffff).multiplyScalar(intensity),side:T.DoubleSide}),panel=new T.Mesh(g,m);
 panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);resources.push(g,m);
}
const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.08);pmrem.dispose();resources.forEach(r=>r.dispose());
const factKeys=['voltage','power','output','efficacy','density','quality','width','copper','energy'];
const features=['tech','section','ip','beam','detail'];
const views=[...document.querySelectorAll('.family')].map((root,index)=>{
 const group=root.dataset.group,products=groups[group].flatMap(f=>f.ids.length?f.ids.map(id=>byId.get(id)):additionalProducts);
 root.innerHTML='<header class="product-header"><div class="series-line"><span class="series-name">'+groupNames[group]+'</span><span class="assurance"><i class="flag" role="img" aria-label="Produkcja w Polsce"></i><span class="warranty"></span><span class="assurance-origin"> · Polska produkcja</span></span></div><h2></h2><span class="product-sku" aria-label="Symbol katalogowy"></span></header>'+
 '<div class="details"><div class="color-fact"><strong class="color-value"><span></span><small></small></strong><i class="color-dot" aria-hidden="true"></i><span class="color-label"></span></div><div class="color-variants" role="group" aria-label="Dostępne barwy"></div>'+
 '<dl class="product-facts">'+factKeys.map(key=>'<div data-fact="'+key+'"><dt></dt><dd><span class="fact-value"></span><small></small><img class="energy-image" hidden alt=""></dd></div>').join('')+'</dl>'+
 '<div class="power-modes" role="group" aria-label="Trzy poziomy jasności" hidden></div>'+
 '<div class="product-bottom">'+features.map(key=>'<div class="product-feature" data-feature="'+key+'"><span class="feature-icon"></span><strong data-product="'+key+'"></strong><small'+(key==='detail'?' data-product="detail-label"':'')+'></small>'+(key==='detail'?'<span class="brightness-steps" hidden><i>LOW</i><i>MEDIUM</i><i>HIGH</i></span>':'')+'</div>').join('')+'</div></div>'+
 '<div class="strip-view" role="img"></div><nav class="model-nav" aria-label="Wybór modelu '+groupNames[group]+'"><label></label><button data-step="-1" aria-label="Poprzedni model">‹</button><select aria-label="Model '+groupNames[group]+'"></select><button data-step="1" aria-label="Następny model">›</button></nav>';
 const select=root.querySelector('select');
 products.forEach((p,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=p.name+' · '+p.sku;select.append(o);});
 const scene=new T.Scene();scene.environment=environment.texture;scene.environmentIntensity=.55;scene.add(new T.HemisphereLight(0xffffff,0x4e6251,1.25));
 for(const [x,y,z,color,intensity] of [[-130,140,210,0xfff3df,3.2],[140,20,100,0xd9e8ff,1.4],[50,100,-180,0xffffff,2.4]]){const l=new T.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l);}
 const host=root.querySelector('.strip-view');
 const v={root,group,index,products,scene,host,camera:new T.PerspectiveCamera(32,1,1,2000),icons:createFeatureIcons({root,renderer}),voltageCue:createVoltageCue(host,{compact:true}),numbers:createNumberAnimator(),model:null,modelIndex:-1,clock:0,turn:0,colorIndex:0,powerIndex:0,revision:0,pending:false,transition:null,details:null,key:'',shot:null,framing:null};
 select.addEventListener('change',()=>pick(v,Number(select.value)),{signal:events.signal});
 root.addEventListener('click',e=>{const step=e.target.closest('[data-step]'),color=e.target.closest('[data-color]'),power=e.target.closest('[data-power]');
  if(step)pick(v,v.modelIndex+Number(step.dataset.step));
  if(color)setVariant(v,Number(color.dataset.color));
  if(power)setPower(v,Number(power.dataset.power));
 },{signal:events.signal});
 return v;
});

function finishTransition(v){
 if(!v.transition)return;v.transition.rebuild.dispose();v.transition.old.dispose();v.transition=null;v.model.group.visible=true;
}
async function pick(v,index,{animate=true}={}){
 index=(index+v.products.length)%v.products.length;
 const revision=++v.revision;v.pending=true;v.root.setAttribute('aria-busy','true');
 const p=v.products[index],next=createCatalogStrip(p,{anisotropy:4});next.setLight(false);
 try{await next.ready;}catch(error){next.dispose();if(revision===v.revision){v.pending=false;v.root.setAttribute('aria-busy','false');}throw error;}
 if(disposed||revision!==v.revision){next.dispose();return;}
 finishTransition(v);const old=v.model;
 v.model=next;v.modelIndex=index;v.clock=0;v.colorIndex=0;v.powerIndex=0;v.key='';v.scene.add(next.group);
 if(old&&animate&&playing&&!reduced.matches){old.setLight(false);old.group.visible=false;next.group.visible=false;const rebuild=createStripRebuild(old,next);v.scene.add(rebuild.group);v.transition={old,rebuild,time:0};}
 else old?.dispose();
 v.icons.update(p);v.icons.setTheme(document.body.dataset.theme);v.pending=false;v.root.setAttribute('aria-busy','false');
 v.root.dataset.productId=p.id;v.root.querySelector('select').value=String(index);v.root.querySelector('.model-nav label').textContent=String(index+1).padStart(2,'0')+' / '+v.products.length;
 v.host.setAttribute('aria-label',p.range+' '+p.name+', przestrzenny model taśmy LED');
 update(v,true);schedule();
}
function update(v,immediate=false){
 if(!v.model)return;const p=v.products[v.modelIndex],count=Math.max(1,p.colorVariants.length),step=p.id==='3w1'?12:6;
 const detailTime=Math.max(0,v.clock-DETAIL_START);
 v.colorIndex=Math.min(count-1,Math.floor(detailTime/step));v.powerIndex=p.id==='3w1'?Math.min(2,Math.floor((detailTime-v.colorIndex*12)/4)):0;
 const key=p.id+':'+v.colorIndex+':'+v.powerIndex;if(key===v.key)return;v.key=key;
 const d=getProductDetails(p,v.colorIndex,v.powerIndex);v.details=d;
 const root=v.root;root.querySelector('h2').textContent=d.name;root.querySelector('.product-sku').textContent=d.sku;
 root.querySelector('select').options[v.modelIndex].textContent=p.name+' · '+d.sku;
 root.querySelector('.warranty').textContent=d.warranty.label;root.querySelector('.flag').hidden=!d.warranty.madeInPoland;root.querySelector('.assurance-origin').hidden=!d.warranty.madeInPoland;
 root.querySelector('.color-value span').textContent=d.color.value;root.querySelector('.color-value small').textContent=d.color.unit;root.querySelector('.color-label').textContent=d.color.label;root.style.setProperty('--swatch',d.color.swatch);
 const variants=root.querySelector('.color-variants');variants.replaceChildren();
 for(const c of d.color.variants){const b=document.createElement('button');b.dataset.color=c.index;b.setAttribute('aria-pressed',String(c.active));b.style.setProperty('--swatch',c.swatch);const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');b.append(dot,Number.isFinite(Number(c.value))?c.value+' K':c.label);variants.append(b);}
 for(const f of d.facts){const cell=root.querySelector('[data-fact="'+f.key+'"]');cell.querySelector('dt').textContent=f.label;cell.querySelector('small').textContent=f.unit;
  const image=cell.querySelector('img'),value=cell.querySelector('.fact-value');image.hidden=!f.image;value.hidden=!!f.image;
  if(f.image){image.src=f.image;image.alt=f.imageAlt;}v.numbers.set(value,f.value,!immediate&&!reduced.matches);
 }
 const modes=root.querySelector('.power-modes');modes.hidden=!d.powerLevels.length;modes.replaceChildren();
 for(const mode of d.powerLevels){const b=document.createElement('button');b.dataset.power=mode.index;b.setAttribute('aria-pressed',String(mode.active));b.append(mode.name);const watts=document.createElement('b');watts.textContent=mode.power+' W/m';b.append(watts);modes.append(b);}
 for(const f of d.features){const el=root.querySelector('[data-feature="'+f.key+'"]');el.querySelector('strong').textContent=f.value;el.querySelector('small').textContent=f.label;}
 v.icons.setPower(v.powerIndex);v.icons.setColor(d.variant?.kelvin??p.color);v.model.setTemperature(d.variant?.kelvin??p.color);
}
function duration(v){const p=v.products[v.modelIndex];return Math.max(p.id==='3w1'?44:24,DETAIL_START+Math.max(1,p.colorVariants.length)*(p.id==='3w1'?12:6)+6);}
function setVariant(v,index){finishTransition(v);const p=v.products[v.modelIndex];v.clock=DETAIL_START+T.MathUtils.clamp(index,0,Math.max(0,p.colorVariants.length-1))*(p.id==='3w1'?12:6)+1;update(v);schedule();}
function setPower(v,index){if(v.products[v.modelIndex].id!=='3w1')return;v.clock=DETAIL_START+v.colorIndex*12+T.MathUtils.clamp(index,0,2)*4+1;update(v);schedule();}
function paint(now=0){
 raf=0;if(disposed||document.hidden||!ready)return;
 const delta=last?Math.min(.05,(now-last)/1000):0;last=now;if(playing&&!reduced.matches)seconds+=delta;
 if(width!==innerWidth||height!==innerHeight){width=innerWidth;height=innerHeight;renderer.setSize(width,height,false);}
 renderer.setScissorTest(false);renderer.setClearColor(0x000000,0);renderer.clear();renderer.setScissorTest(true);
 for(const v of views){
  if(!v.model)continue;
  if(v.transition){
   if(playing&&!reduced.matches)v.transition.time+=delta;
   v.transition.rebuild.update(reduced.matches?1:Math.min(1,v.transition.time/REBUILD_SECONDS));
   if(v.transition.time>=REBUILD_SECONDS||reduced.matches)finishTransition(v);
  }else if(playing&&!reduced.matches&&!v.pending){v.clock+=delta;v.turn+=delta*.19;if(v.clock>=duration(v))pick(v,v.modelIndex+1);update(v);}
  const p=v.products[v.modelIndex],r=v.host.getBoundingClientRect();if(r.bottom<=0||r.top>=height||!r.width||!r.height)continue;
  const shot=sampleMiniShot(v.clock,duration(v),{product:p,turn:v.turn,rebuilding:!!v.transition});
  shot.powerMode=v.powerIndex;shot.powerBlend=v.powerIndex===0?1:smooth((v.clock-DETAIL_START-v.colorIndex*12-v.powerIndex*4)/.9);v.shot=shot;
  const level=shot.lightLevel;
  const outputs=p.colorVariants.flatMap(c=>c.outputs).map(numeric).filter(n=>n>0),reference=Math.max(1,...outputs,numeric(p.output)||0);
  const output=numeric(v.details.facts.find(f=>f.key==='output').value);
  let power=Number.isFinite(output)?output/reference:1;
  if(p.id==='3w1'&&v.powerIndex>0){const previousOutput=numeric(v.details.variant?.outputs[v.powerIndex-1]);if(Number.isFinite(previousOutput))power=T.MathUtils.lerp(previousOutput/reference,power,shot.powerBlend);}
  const colorStart=DETAIL_START+v.colorIndex*(p.id==='3w1'?12:6),previousVariant=p.colorVariants[Math.max(0,v.colorIndex-1)]?.kelvin??p.color;
  const lighting=v.model.updateLightAnimation(v.clock,{lightLevel:level,power,variant:v.details.variant?.kelvin??p.color,previousVariant,variantBlend:smooth((v.clock-colorStart)/.7)});
  if(level>0&&lighting?.color)v.root.querySelector('.color-dot').style.background=lighting.color;else v.root.querySelector('.color-dot').style.background='';
  if(level>0&&p.control!=='MONO'&&lighting?.phase)v.root.querySelector('.color-label').textContent=lighting.phase;else v.root.querySelector('.color-label').textContent=v.details.color.label;
  v.framing=frameMiniCamera(v.camera,v.model,shot,r.width/r.height);
  v.transition?.rebuild.group.rotation.copy(v.model.group.rotation);
  v.voltageCue.update(v.model,p,v.camera,shot,r.width,r.height,v.powerIndex);
  renderer.setViewport(r.left,height-r.bottom,r.width,r.height);renderer.setScissor(Math.max(0,r.left),Math.max(0,height-r.bottom),Math.min(r.right,width)-Math.max(0,r.left),Math.min(r.bottom,height)-Math.max(0,r.top));renderer.render(v.scene,v.camera);
 }
 for(const v of views){const r=v.root.querySelector('.product-bottom').getBoundingClientRect();if(r.bottom>0&&r.top<height)v.icons.render(v.clock,!playing,reduced.matches);}
 if(playing&&!reduced.matches)raf=requestAnimationFrame(paint);
}
function schedule(){if(!raf&&ready&&!disposed&&!document.hidden)raf=requestAnimationFrame(paint);}
function setPlaying(value){playing=!!value;last=0;const b=document.querySelector('#playback');b.textContent=playing?'Ⅱ':'▶';b.setAttribute('aria-pressed',String(!playing));b.setAttribute('aria-label',playing?'Zatrzymaj prezentację':'Wznów prezentację');schedule();}
function setTheme(){document.body.dataset.theme='day';views.forEach(v=>v.icons.setTheme('day'));schedule();}
document.querySelectorAll('.theme-switch button[data-theme]').forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.theme),{signal:events.signal}));
document.querySelector('#playback').addEventListener('click',()=>setPlaying(!playing),{signal:events.signal});
window.addEventListener('resize',schedule,{signal:events.signal});window.addEventListener('scroll',schedule,{passive:true,signal:events.signal});
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;last=0;if(!document.hidden)schedule();},{signal:events.signal});
reduced.addEventListener('change',()=>{views.forEach(v=>v.numbers.finish());if(reduced.matches)setPlaying(false);schedule();},{signal:events.signal});
function dispose(){disposed=true;cancelAnimationFrame(raf);events.abort();views.forEach(v=>{finishTransition(v);v.model?.dispose();v.icons.dispose();v.voltageCue.dispose();v.numbers.finish();});environment.dispose();renderer.dispose();}
window.addEventListener('pagehide',e=>{if(!e.persisted)dispose();},{signal:events.signal});
const find=group=>{const v=views.find(v=>v.group===group);if(!v)throw Error('Unknown group '+group);return v;};
window.ledOverview={
 inspect:()=>({ready,playing,theme:document.body.dataset.theme,catalogueCount:allProducts.length,models:views.map(v=>v.products[v.modelIndex]?.id),cards:views.map(v=>({group:v.group,product:v.products[v.modelIndex]?.id,available:v.products.map(p=>p.id),clock:v.clock,duration:v.model?duration(v):null,pending:v.pending,rebuilding:!!v.transition,rebuildProgress:v.transition?.time/REBUILD_SECONDS||0,shot:v.shot,framing:v.framing,voltageCue:v.voltageCue.inspect(),details:v.details,icons:v.icons.inspect(),model:v.model?.inspect()}))}),
 setProduct:async(group,id,options={animate:false})=>{const v=find(group),index=v.products.findIndex(p=>p.id===id);if(index<0)throw Error('Unknown product '+id);await pick(v,index,options);},
 setVariant:(group,index)=>setVariant(find(group),index),setPower:(group,index)=>setPower(find(group),index),
 seek:(group,time)=>{const v=find(group);finishTransition(v);v.clock=Math.max(0,time);update(v,true);schedule();},
 setPlaying,setTheme,dispose
};
await Promise.all(views.map(v=>pick(v,v.products.findIndex(p=>p.id===firstModels[v.group]),{animate:false})));
ready=true;setPlaying(playing);schedule();
