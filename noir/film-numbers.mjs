// One clock for all changing numeric facts; exact catalogue strings at rest.
export function createNumberAnimator(){
  const running=new Map();let frame=0;
  const number=s=>/^\d+(?:[,.]\d+)?$/.test(s)?Number(s.replace(',','.')):NaN;
  function tick(now){
    frame=0;
    for(const [el,a] of running){
      const t=Math.min(1,(now-a.start)/850),ease=1-(1-t)**3;
      el.textContent=t===1?a.text:(a.from+(a.to-a.from)*ease).toFixed(a.precision).replace('.',',');
      if(t===1)running.delete(el);
    }
    if(running.size)frame=requestAnimationFrame(tick);
  }
  return {
    set(el,value,animate=true){
      const text=String(value),old=el.textContent,from=number(old),to=number(text);
      running.delete(el);el.dataset.value=text;
      if(!animate||!Number.isFinite(from)||!Number.isFinite(to)||from===to){el.textContent=text;return;}
      const precision=Math.max((old.split(/[,.]/)[1]||'').length,(text.split(/[,.]/)[1]||'').length);
      running.set(el,{from,to,text,precision,start:performance.now()});
      if(!frame)frame=requestAnimationFrame(tick);
    },
    finish(){for(const [el,a] of running)el.textContent=a.text;running.clear();cancelAnimationFrame(frame);frame=0;},
    inspect:()=>running.size,
  };
}
