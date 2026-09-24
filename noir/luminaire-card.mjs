// Initial image: three colors of PROFFESA N. Installation scenes: separate K213/N/Z variants.
export function initLuminaireCard(card){
  const scene=card.querySelector('.proffesa-installations');
  if(!scene)return{start(){},stop(){}};
  const buttons=[...card.querySelectorAll('[data-proffesa-select]')],modes=['wall','ceiling','pendant'];
  const narrow=matchMedia('(max-width:900px)');
  let timers=[],running=false,reduced=false,manual=false,current='wall';
  const cancel=()=>{timers.forEach(clearTimeout);timers=[];};
  const later=(delay,fn)=>timers.push(setTimeout(()=>{if(running)fn();},delay));
  const select=mode=>{current=mode;card.dataset.proffesaView=mode;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.proffesaSelect===mode)));};
  const cycle=()=>{if(!running||reduced||manual||!narrow.matches)return;later(6500,()=>{select(modes[(modes.indexOf(current)+1)%modes.length]);cycle();});};
  const choose=mode=>{manual=true;cancel();card.classList.add('proffesa-lit');select(mode);};
  buttons.forEach((button,index)=>{
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();choose(button.dataset.proffesaSelect);});
    button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const next=(index+(event.key==='ArrowRight'?1:2))%3;choose(modes[next]);buttons[next].focus();});
  });
  narrow.addEventListener('change',()=>{if(running){cancel();card.classList.add('proffesa-lit');cycle();}});
  select('wall');
  return{
    start(options={}){
      if(running)return;running=true;reduced=!!options.reduced;manual=false;select(current);
      scene.setAttribute('aria-hidden','false');buttons.forEach(b=>b.tabIndex=0);card.classList.add('proffesa-installed');
      if(reduced)card.classList.add('proffesa-lit');else later(1100,()=>card.classList.add('proffesa-lit'));
      cycle();
    },
    stop(){running=false;cancel();card.classList.remove('proffesa-installed','proffesa-lit');scene.setAttribute('aria-hidden','true');buttons.forEach(b=>b.tabIndex=-1);},
  };
}
