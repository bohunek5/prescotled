import {initElbaCard} from './elba-card.mjs';
import {initMiLightCard} from './milight-card.mjs';
import {initProfileCard} from './profile-card.mjs';
import {initLuminaireCard} from './luminaire-card.mjs';
import {initSleeveCard} from './sleeve-card.mjs';
import {initPowerCard} from './power-card.mjs';
import {initTouchCard} from './touch-card.mjs';
import {initConnectorCard} from './connector-card.mjs';
const cards=[...document.querySelectorAll('[data-card-motion]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const touch=matchMedia('(hover: none), (pointer: coarse)');
const factories={power:initPowerCard,touch:initTouchCard,connector:initConnectorCard,luminaire:initLuminaireCard,sleeve:initSleeveCard,elba:initElbaCard,milight:initMiLightCard,profile:initProfileCard};
const controllers=new Map(cards.map(card=>{const controller=factories[card.dataset.cardMotion]?.(card);card.cardController=controller;return [card,controller];}));
function stop(card){controllers.get(card)?.stop();card.classList.remove('is-active');}
function play(card){
  if(card.classList.contains('is-active'))return;
  card.classList.add('is-active');controllers.get(card)?.start({reduced:reduced.matches});
}
for(const card of cards){
  card.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')play(card);});
  card.addEventListener('pointerleave',()=>{if(!card.matches(':focus-within')&&!touch.matches)stop(card);});
  card.addEventListener('focusin',()=>play(card));
  card.addEventListener('focusout',event=>{if(card.contains(event.relatedTarget))return;if(!touch.matches&&!card.matches(':hover'))stop(card);});
}
// Touch visitors watch the demonstration as they scroll; all anchors remain
// ordinary single-tap navigation. Running scenes stop outside the reading area.
const visible=new Set();
const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
    const enough=entry.intersectionRect.height>=Math.min(entry.boundingClientRect.height*.42,innerHeight*.5);
    if(entry.isIntersecting&&enough){visible.add(entry.target);if(touch.matches||entry.target.matches(':hover,:focus-within'))play(entry.target);}
    else{visible.delete(entry.target);stop(entry.target);}
  }
},{threshold:[0,.15,.25,.35,.42,.6,.8,1]});
cards.forEach(card=>observer.observe(card));
touch.addEventListener('change',()=>cards.forEach(card=>{stop(card);if(touch.matches&&visible.has(card))play(card);}));
reduced.addEventListener('change',()=>cards.forEach(card=>{const active=card.classList.contains('is-active');stop(card);if(active)play(card);}));
function resumeVisible(){
  if(document.hidden)return;
  visible.forEach(card=>{if(touch.matches||card.matches(':hover,:focus-within'))play(card);});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)cards.forEach(stop);else resumeVisible();});
addEventListener('pagehide',()=>cards.forEach(stop));
addEventListener('pageshow',resumeVisible);
