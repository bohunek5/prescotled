const compact=matchMedia('(max-width:1100px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
document.querySelectorAll('[data-family-books]').forEach(root=>{
 const books=[...root.querySelectorAll('[data-family-book]')],buttons=books.map(book=>book.querySelector('[data-family-select]'));
 if(!books.length)return;
 let current=0;
 function measure(){root.style.setProperty('--family-panel-width',Math.max(0,root.clientWidth-books.length*58-6)+'px');}
 function select(index,follow=false){
  current=index;
  books.forEach((book,i)=>{const active=i===index;book.classList.toggle('is-active',active);buttons[i].setAttribute('aria-expanded',String(active));const panel=book.querySelector('.family-panel');panel.inert=!active;panel.setAttribute('aria-hidden',String(!active));});
  root.dataset.activeFamily=books[index].dataset.familyBook;
  if(follow&&compact.matches)requestAnimationFrame(()=>{const rect=buttons[index].getBoundingClientRect();if(rect.top<90||rect.bottom>innerHeight-85)scrollTo({top:Math.max(0,scrollY+rect.top-105),behavior:reduced.matches?'instant':'smooth'});});
 }
 buttons.forEach((button,i)=>{
  button.addEventListener('click',()=>select(i,true));
  button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(['ArrowRight','ArrowDown'].includes(event.key)?1:buttons.length-1))%buttons.length;buttons[next].focus({preventScroll:true});select(next,true);});
 });
 root.dataset.enhanced='true';measure();select(current);
 const observer=new ResizeObserver(measure);observer.observe(root);
 compact.addEventListener('change',measure);
 // The decorative trace has no JS clock. Only visible books may run its CSS scan.
 const visible=new Map(books.map(book=>[book,false]));
 let pageActive=!document.hidden;
 function motion(){books.forEach(book=>{book.dataset.familyMotion=pageActive&&!reduced.matches&&visible.get(book)?'on':'off';});}
 motion();
 const visibility=new IntersectionObserver(entries=>{entries.forEach(entry=>visible.set(entry.target,entry.isIntersecting&&entry.intersectionRatio>0));motion();},{threshold:[0,.01]});
 books.forEach(book=>visibility.observe(book));
 reduced.addEventListener('change',motion);
 document.addEventListener('visibilitychange',()=>{pageActive=!document.hidden;motion();});
 addEventListener('pagehide',()=>{pageActive=false;motion();});
 addEventListener('pageshow',()=>{pageActive=!document.hidden;motion();});
});
