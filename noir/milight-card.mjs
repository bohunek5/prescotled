// The parent card controller owns intersection, visibility and focus lifecycle.
export function initMiLightCard(card){
  const stage=card.querySelector('[data-milight-stage]');
  const exhibits=[...card.querySelectorAll('[data-milight-exhibit]')];
  const buttons=[...card.querySelectorAll('[data-milight-select]')];
  if(!stage||!exhibits.length)return{start(){},stop(){},inspect:()=>({running:false})};
  const modes=exhibits.map(e=>e.dataset.milightExhibit);
  const tour=card.querySelector('[data-milight-tour]');
  const count=card.querySelector('[data-milight-count]');
  const timers=new Set();
  let running=false,reduced=false,automatic=true,current=modes[0],requested=null,phase='product',hoverTimer=0,tourTimer=0;
  const clearTimers=()=>{timers.forEach(clearTimeout);timers.clear();clearTimeout(hoverTimer);hoverTimer=0;tourTimer=0;};
  const later=(delay,fn)=>{const id=setTimeout(()=>{timers.delete(id);if(running)fn();},delay);timers.add(id);return id;};
  const setPhase=value=>{phase=value;card.dataset.milightPhase=value;};
  function syncTour(){
    const playing=running&&automatic&&!reduced;
    card.dataset.milightTour=playing?'playing':'paused';
    if(!tour)return;
    tour.disabled=reduced;
    tour.setAttribute('aria-pressed',String(playing));
    tour.setAttribute('aria-label',playing?'Wstrzymaj pokaz sterowania MiBoxer':'Uruchom pokaz sterowania MiBoxer');
    tour.querySelector('span').textContent=playing?'Pauza':'Odtwórz';
  }
  function syncSelection(){
    card.dataset.milightMode=current;
    exhibits.forEach(e=>{const selected=e.dataset.milightExhibit===current;e.classList.toggle('is-selected',selected);e.setAttribute('aria-hidden',String(!selected));});
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.milightSelect===current)));
    if(count)count.textContent='0'+(modes.indexOf(current)+1)+' / 05';
  }
  function present(){
    clearTimers();requested=null;card.dataset.milightSwitching='false';syncSelection();setPhase(reduced?'installed':'product');syncTour();
    if(!running||reduced)return;
    // The exact original remains at the same projective placement in every phase.
    // Only the clean architectural plate behind it is revealed.
    later(automatic?850:20,()=>setPhase('travel'));
    later(automatic?1500:660,()=>setPhase('installed'));
    if(automatic)tourTimer=later(8600,()=>{if(automatic)switchMode(modes[(modes.indexOf(current)+1)%modes.length]);});
  }
  function switchMode(mode){
    if(!modes.includes(mode)||requested===mode)return;
    clearTimers();requested=mode;
    if(reduced||!running){current=mode;present();return;}
    card.dataset.milightSwitching='true';
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.milightSelect===mode)));
    later(40,()=>{current=mode;present();});
  }
  function choose(mode){
    if(!modes.includes(mode))return;
    automatic=false;clearTimeout(tourTimer);timers.delete(tourTimer);tourTimer=0;syncTour();
    if(requested===mode)return;
    if(current===mode){
      if(requested){clearTimers();requested=null;card.dataset.milightSwitching='false';syncSelection();setPhase('installed');}
      else if(phase==='product'&&running&&!reduced){clearTimers();setPhase('travel');later(650,()=>setPhase('installed'));}
      return;
    }
    switchMode(mode);
  }
  buttons.forEach((button,index)=>{
    button.disabled=false;
    button.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>{hoverTimer=0;choose(button.dataset.milightSelect);},35);});
    button.addEventListener('pointerleave',()=>{clearTimeout(hoverTimer);hoverTimer=0;});
    button.addEventListener('focus',()=>choose(button.dataset.milightSelect));
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();choose(button.dataset.milightSelect);if(matchMedia('(max-width:760px)').matches)stage.scrollIntoView({block:'center',behavior:reduced?'instant':'smooth'});});
    button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
      event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?modes.length-1:(index+(['ArrowRight','ArrowDown'].includes(event.key)?1:modes.length-1))%modes.length;
      buttons[next].focus();
    });
  });
  tour?.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();automatic=!automatic;
    if(automatic)present();else{clearTimers();requested=null;card.dataset.milightSwitching='false';syncSelection();setPhase('installed');syncTour();}
  });
  // Scale one 1536×1024 photographic coordinate system for all products.
  // Resize never alters the product-to-room correspondence.
  const visual=card.querySelector('.milight-visual');
  const scaleProjection=()=>{if(visual)card.style.setProperty('--milight-scale',String(visual.getBoundingClientRect().width/1536));};
  const resizeObserver=new ResizeObserver(scaleProjection);
  if(visual)resizeObserver.observe(visual);scaleProjection();
  // Decoded image replacement is handled centrally by theme.mjs.
  const syncTheme=event=>{card.dataset.milightTheme=event?.detail?.theme||document.documentElement.dataset.theme||'night';};
  addEventListener('prescot:themechange',syncTheme);syncTheme();syncSelection();setPhase('product');syncTour();card.classList.add('milight-ready');
  return{
    start(options={}){if(running)return;running=true;reduced=!!options.reduced;card.classList.add('milight-active');present();},
    stop(){running=false;clearTimers();requested=null;card.dataset.milightSwitching='false';syncSelection();setPhase('product');card.classList.remove('milight-active');syncTour();},
    inspect:()=>({running,reduced,automatic,mode:current,requested,phase,pending:timers.size+(hoverTimer?1:0),theme:card.dataset.milightTheme})
  };
}
