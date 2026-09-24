import {sleevePageModels as models,sleevePageFamilies as families,createPageScene} from './sleeves-page.mjs';
let sceneModules;
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const rest={insert:0,light:0,bend:0,phase:'insert',progress:0};
const final={insert:1,light:1,bend:1,phase:'bend',progress:1};

// The card and the accepted product page share the same real model data and
// section renderer. This controller owns only the banner's selected family.
export function initSleeveCard(card){
 const root=card.querySelector('.demo-sleeve');
 if(!root)return{start(){},stop(){}};
 const buttons=[...root.querySelectorAll('[data-sc-select]')],panels=[...root.querySelectorAll('[data-sc-family]')];
 let family='basic',activePanel=panels[0],scene,pending,running=false,reduced=false,failed=false,frame=0,then=0,elapsed=0,pose=rest,pageActive=true;
 function halt(){cancelAnimationFrame(frame);frame=0;then=0;}
 function paint(next){
  pose=next;card.dataset.sleevePhase=next.phase;card.style.setProperty('--sc-progress',String(next.progress));card.style.setProperty('--sc-light',String(next.light));
  const text=next.phase==='insert'?['01 / WPROWADZENIE TAŚMY',family==='side'?'PCB ustawiona pionowo':'PCB w dolnym kanale']:next.phase==='light'?['02 / ŚWIATŁO W KOSZULCE','Mleczne okno rozprasza światło']:['03 / FORMA ŚWIATŁA','Promień gięcia > 60 mm'];
  const step=activePanel.querySelector('[data-sc-step]'),note=activePanel.querySelector('[data-sc-note]');if(step.textContent!==text[0])step.textContent=text[0];if(note.textContent!==text[1])note.textContent=text[1];scene?.update(next);
 }
 function mount(){if(!scene)return;scene.mount(activePanel.querySelector('.sc-canvas'),families.find(f=>f.id===family).models.map(id=>models[id]));paint(reduced&&running?final:rest);}
 function tick(now){
  frame=0;if(!running||reduced||document.hidden||!pageActive||!scene)return;
  if(!then)then=now;const delta=now-then;
  if(delta>=1000/30-1){elapsed+=Math.min(delta,100)/1000;then=now;const t=elapsed%15;
   paint({insert:t<11.5?ease((t-.55)/3.2):1-ease((t-11.5)/2.7),light:ease((t-3.85)/1.25)*(1-ease((t-10.4)/1)),bend:ease((t-5.6)/2.4)*(1-ease((t-10.6)/.9)),phase:t>=5.6&&t<11.5?'bend':t>=3.85&&t<11.5?'light':'insert',progress:t/15});
  }frame=requestAnimationFrame(tick);
 }
 function resume(){halt();if(!running||!scene||document.hidden||!pageActive)return;if(reduced)paint(final);else frame=requestAnimationFrame(tick);}
 async function prepare(){
  if(scene||failed)return;
  pending ||= (async()=>{try{sceneModules ||= Promise.all([import('../konfigurator/vendor/three/build/three.module.min.js'),import('../konfigurator/sleeve-sections.js')]);const[T,{sleeveSections}]=await sceneModules;scene=createPageScene(T,sleeveSections);mount();card.dataset.sleeveReady='true';resume();}catch(_){failed=true;card.dataset.sleeveReady='fallback';}})();
  await pending;
 }
 function select(id){
  if(!families.some(f=>f.id===id))return;halt();family=id;elapsed=0;activePanel=panels.find(p=>p.dataset.scFamily===id);panels.forEach(p=>p.hidden=p!==activePanel);buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scSelect===id)));card.dataset.sleeveFamily=id;
  if(!running){running=true;card.classList.add('is-active');reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;}
  if(scene){mount();resume();}else{paint(reduced?final:rest);prepare();}
 }
 buttons.forEach(button=>button.addEventListener('click',()=>select(button.dataset.scSelect)));
 const resize=new ResizeObserver(()=>{if(scene&&running)paint(pose);});panels.forEach(panel=>resize.observe(panel.querySelector('.sc-canvas')));
 document.addEventListener('visibilitychange',resume);addEventListener('pagehide',()=>{pageActive=false;halt();});addEventListener('pageshow',()=>{pageActive=true;resume();});
 card.dataset.sleeveFamily=family;
 return{
  start(options={}){reduced=!!options.reduced;if(running){resume();return;}running=true;elapsed=0;paint(reduced?final:rest);if(scene){mount();resume();}else prepare();},
  stop(){running=false;halt();},
  inspect(){return{running,reduced,family,phase:pose.phase,elapsed,rendererReady:!!scene,failed,playing:!!frame,...pose,...scene?.inspect()};},
  select,
 };
}
