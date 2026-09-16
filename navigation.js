export function mountNavigation() {
 const menu=document.querySelector('.menu-toggle'),nav=document.getElementById('site-nav'),header=document.querySelector('.site-header');
 if(!menu||!nav)return;
 const groups=[...nav.querySelectorAll('details')],mobile=matchMedia('(max-width: 960px)');
 function closeMenu(focus=false){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Otwórz menu');nav.classList.remove('is-open');document.body.classList.remove('menu-open');groups.forEach(g=>g.open=false);if(focus)menu.focus();}
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';if(!open)return closeMenu(true);menu.setAttribute('aria-expanded','true');menu.setAttribute('aria-label','Zamknij menu');nav.classList.add('is-open');document.body.classList.add('menu-open');nav.querySelector('[data-current]')?.setAttribute('open','');nav.querySelector('a')?.focus();});
 groups.forEach(group=>group.addEventListener('toggle',()=>{if(group.open)groups.filter(g=>g!==group).forEach(g=>g.open=false);}));
 nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
 document.addEventListener('click',e=>{if(!header.contains(e.target))closeMenu();});
 document.addEventListener('focusin',e=>{if(!header.contains(e.target)&&!mobile.matches)groups.forEach(g=>g.open=false);});
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
   const group=groups.find(g=>g.open);
   if(group){group.open=false;group.querySelector('summary').focus();e.preventDefault();}
   else if(menu.getAttribute('aria-expanded')==='true'){closeMenu(true);e.preventDefault();}
  }
  if(e.key==='Tab'&&mobile.matches&&menu.getAttribute('aria-expanded')==='true'){
   const focusable=[...header.querySelectorAll('a,button,summary')].filter(el=>el.getClientRects().length&&(!el.closest('.nav-dropdown')||el.closest('details').open));
   const first=focusable[0],last=focusable.at(-1);
   if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}
   else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}
  }
 });
 mobile.addEventListener('change',()=>closeMenu());
 window.addEventListener('pageshow',()=>closeMenu());
}
