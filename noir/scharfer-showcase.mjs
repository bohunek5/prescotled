import {initScharferImmersion} from './scharfer-immersion.mjs';
export function initScharferShowcase(root) {
  if (!root || root.scharferController) return root?.scharferController;
  if(root.classList.contains('scharfer-offer-card'))return initScharferImmersion(root);
  const stage=root.querySelector('[data-scharfer-scene]'),canvas=stage.querySelector('canvas'),ctx=canvas.getContext('2d');
  const buttons=[...root.querySelectorAll('[data-scharfer-voltage]')],products=[...root.querySelectorAll('[data-scharfer-product]')],motion=root.querySelector('[data-scharfer-motion]');
  const media=matchMedia('(prefers-reduced-motion: reduce)'),abort=new AbortController(),signal=abort.signal;
  let reduced=media.matches,visible=false,pageHidden=false,paused=false,raf=0,last=0,nextDrop=0,lastPointer=0,width=0,height=0,voltage=root.dataset.voltage||'24',theme=document.documentElement.dataset.theme||'night',rings=[];
  const canRun=()=>visible&&!pageHidden&&!document.hidden&&!reduced&&!paused&&!!ctx;
  function burst(x=width*.3,y=height*.73,time=performance.now()) { if(!canRun())return;rings.push({x,y,born:time});if(rings.length>10)rings.shift(); }
  function paint(now) {
    if(!ctx)return;ctx.clearRect(0,0,width,height);
    rings=rings.filter(r=>now-r.born<4700);
    for(const ring of rings){const p=(now-ring.born)/4700,r=8+p*Math.min(240,width*.38),alpha=(1-p)*.28;
      for(let i=0;i<3;i++){const radius=r-i*6;if(radius<1)continue;ctx.beginPath();ctx.ellipse(ring.x,ring.y,radius,radius*.28,0,0,Math.PI*2);ctx.strokeStyle=theme==='day'?`rgba(23,73,86,${alpha*(1-i*.2)})`:`rgba(176,219,226,${alpha*(1-i*.2)})`;ctx.lineWidth=1-i*.15;ctx.stroke();}
    }
  }
  function tick(now){raf=0;if(!canRun())return;if(now-last>32){if(now>nextDrop){burst(width*(.16+Math.random()*.66),height*(.55+Math.random()*.3),now);nextDrop=now+2400;}paint(now);last=now;}raf=requestAnimationFrame(tick);}
  function sync(){motion.disabled=reduced;motion.setAttribute('aria-pressed',String(paused));motion.innerHTML=reduced?'Fale zatrzymane':paused?'Uruchom fale <span aria-hidden="true">▶</span>':'Wstrzymaj fale <span aria-hidden="true">Ⅱ</span>';root.dataset.scharferRunning=String(canRun());if(canRun()){if(!raf){nextDrop=performance.now()+800;burst();raf=requestAnimationFrame(tick);}}else{cancelAnimationFrame(raf);raf=0;rings=[];paint(performance.now());}}
  function choose(value){if(!['12','24'].includes(value))return;voltage=value;root.dataset.voltage=value;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scharferVoltage===value)));products.forEach(p=>p.setAttribute('aria-hidden',String(p.dataset.scharferProduct!==value)));root.querySelector('[data-scharfer-model]').textContent=`SCH-400-${value}`;root.querySelector('[data-scharfer-output]').textContent=value;burst(width*.6,height*.68);}
  for(const button of buttons){button.disabled=false;button.addEventListener('click',()=>choose(button.dataset.scharferVoltage),{signal});button.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const b=buttons[event.key==='Home'?0:event.key==='End'?1:button===buttons[0]?1:0];b.focus();choose(b.dataset.scharferVoltage);}},{signal});}
  motion.addEventListener('click',()=>{paused=!paused;sync();},{signal});
  stage.addEventListener('pointermove',event=>{const now=performance.now();if(event.pointerType==='touch'||now-lastPointer<380||!canRun())return;lastPointer=now;const r=stage.getBoundingClientRect();burst(event.clientX-r.left,event.clientY-r.top,now);},{passive:true,signal});
  function resize(){const r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=r.width;height=r.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);if(!canRun())paint(performance.now());}
  const ro=new ResizeObserver(resize);ro.observe(stage);
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>.06;if(visible)root.classList.add('is-revealed');sync();},{threshold:[0,.07,.2]});io.observe(stage);
  function actualVisibility(){const r=stage.getBoundingClientRect();visible=Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(0,r.top))>Math.min(r.height,innerHeight)*.07;if(visible)root.classList.add('is-revealed');}
  media.addEventListener('change',()=>{reduced=media.matches;actualVisibility();sync();},{signal});
  document.addEventListener('visibilitychange',()=>{actualVisibility();sync();},{signal});
  addEventListener('pagehide',()=>{pageHidden=true;sync();},{signal});addEventListener('pageshow',()=>{pageHidden=false;actualVisibility();sync();},{signal});
  addEventListener('prescot:themechange',event=>{theme=event.detail?.theme||document.documentElement.dataset.theme;},{signal});
  resize();choose(voltage);sync();
  return root.scharferController={inspect:()=>({voltage,reduced,visible,paused,running:canRun(),pending:!!raf,rings:rings.length,theme}),destroy(){abort.abort();io.disconnect();ro.disconnect();cancelAnimationFrame(raf);rings=[];paint(performance.now());delete root.scharferController;}};
}
for(const root of document.querySelectorAll('[data-scharfer-showcase]'))initScharferShowcase(root);
