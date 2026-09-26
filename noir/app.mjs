import './theme.mjs';
import './scharfer-showcase.mjs';
import './sleeves-page.mjs';
if(document.querySelector('[data-evo-series-preview]')) import('./offer-series.mjs?v=20260926-rhythm1');
else import('./offer-evolution.mjs');
import './offer-families.mjs';
import './card-motion.mjs';
import './delux-story.mjs';
import('./language.mjs').catch(()=>{});
document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const smooth = () => reduce.matches ? 'instant' : 'smooth';

// Native controls remain available if animation or scroll support is absent.
const menu=document.querySelector('#more-menu');
let opener;
for(const button of document.querySelectorAll('.menu-toggle,.more-button'))button.addEventListener('click',()=>{
  opener=button;menu.showModal();document.body.style.overflow='hidden';
  document.querySelector('.menu-toggle').setAttribute('aria-expanded','true');
});
menu?.querySelector('[data-close]').addEventListener('click',()=>menu.close());
menu?.addEventListener('click',event=>{if(event.target===menu && event.clientX<menu.getBoundingClientRect().left)menu.close();});
menu?.addEventListener('close',()=>{document.body.style.overflow='';document.querySelector('.menu-toggle').setAttribute('aria-expanded','false');opener?.focus();});
for(const a of document.querySelectorAll('.desktop-nav a,.mobile-dock a')){
  if(a.pathname===location.pathname || (a.pathname==='/prescotled/oferta/'&& /\/prescotled\/(tasmy-led|zasilacze|sterowniki|akcesoria|profile|koszulki|oprawy)/.test(location.pathname)))a.setAttribute('aria-current','page');
}

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.remove('pending');observer.unobserve(entry.target);}
}),{threshold:.08,rootMargin:'0px 0px -30px 0px'});
for(const el of document.querySelectorAll('.section-heading,.category-card,.home-proof a,.system-section>h2')){
  if(!reduce.matches){el.classList.add('reveal-on-scroll','pending');observer.observe(el);}
}

for(const section of document.querySelectorAll('[data-rail]')){
  const rail=section.querySelector('.model-rail');
  const cards=[...rail.querySelectorAll('.model-card')];
  const picker=section.querySelector('select');
  const prev=section.querySelector('[data-prev]');
  const next=section.querySelector('[data-next]');
  const count=section.querySelector('.rail-count');
  let index=0,scheduled=false;
  const targetLeft=i=>cards[i].offsetLeft-cards[0].offsetLeft;
  function update(){
    let distance=Infinity;
    cards.forEach((card,i)=>{const d=Math.abs(targetLeft(i)-rail.scrollLeft);if(d<distance){distance=d;index=i;}});
    picker.value=String(index);prev.disabled=index===0;next.disabled=index===cards.length-1;
    count.textContent=`${String(index+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
    scheduled=false;
  }
  function go(i){index=Math.max(0,Math.min(cards.length-1,i));rail.scrollTo({left:targetLeft(index),behavior:smooth()});}
  prev.addEventListener('click',()=>go(index-1));next.addEventListener('click',()=>go(index+1));
  picker.addEventListener('change',()=>go(Number(picker.value)));
  rail.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}},{passive:true});
  rail.addEventListener('keydown',event=>{
    if(event.target!==rail)return;
    if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
      event.preventDefault();go(event.key==='Home'?0:event.key==='End'?cards.length-1:index+(event.key==='ArrowRight'?1:-1));
    }
  });
  // A focused card must be visible, including when reached using the Tab key.
  rail.addEventListener('focusin',event=>{const card=event.target.closest('.model-card');if(card){const i=cards.indexOf(card);if(i!==index)go(i);}});
  const ro=new ResizeObserver(update);ro.observe(rail);
  update();
  const hash=decodeURIComponent(location.hash.slice(1));
  if(hash){const i=cards.findIndex(card=>card.id===hash);if(i>=0){rail.scrollTo({left:targetLeft(i),behavior:'instant'});}}
}

// The light trace is driven by document scroll: no hijacked scrolling, timers or WebGL.
const anatomy=document.querySelector('[data-anatomy]');
if(anatomy){
  const stage=anatomy.querySelector('.anatomy-stage');let scheduled=false,visible=true;
  function update(){
    const r=anatomy.getBoundingClientRect();
    const p=reduce.matches?1:Math.max(0,Math.min(1,(-r.top+innerHeight*.13)/Math.max(1,r.height-innerHeight)));
    stage.style.setProperty('--scan',p.toFixed(4));stage.style.setProperty('--hud',Math.max(0,Math.min(1,(p-.15)*2)).toFixed(4));scheduled=false;
  }
  const sceneObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)update();});sceneObserver.observe(anatomy);
  const schedule=()=>{if(visible&&!scheduled){scheduled=true;requestAnimationFrame(update);}};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});reduce.addEventListener('change',update);update();
}

const normalize=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
const familySearch=document.querySelector('[data-family-search]');
familySearch?.addEventListener('input',()=>{
  let found=0;
  for(const a of document.querySelectorAll('.family-list [data-family-name]')){a.hidden=!normalize(a.dataset.familyName).includes(normalize(familySearch.value.trim()));if(!a.hidden)found++;}
  document.querySelector('[data-family-empty]').hidden=found>0;
});

const catalog=document.querySelector('[data-catalog]');
if(catalog)import('./catalog-search.mjs');

const video=document.querySelector('.home-hero video');
if(video){
  const button=document.querySelector('[data-video-toggle]');let userPaused=reduce.matches;
  function label(){button.textContent=video.paused?'Odtwórz film ▷':'Wstrzymaj film Ⅱ';button.setAttribute('aria-label',video.paused?'Odtwórz film':'Wstrzymaj film');}
  button.addEventListener('click',async()=>{if(video.paused){userPaused=false;await video.play().catch(()=>{});}else{userPaused=true;video.pause();}label();});
  video.addEventListener('play',label);video.addEventListener('pause',label);
  if(reduce.matches)video.pause();
  const videoObserver=new IntersectionObserver(entries=>{if(entries[0].isIntersecting&&!userPaused)video.play().catch(label);else video.pause();},{threshold:.1});videoObserver.observe(video);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(!userPaused&&video.getBoundingClientRect().bottom>0)video.play().catch(label);});
  label();
}
