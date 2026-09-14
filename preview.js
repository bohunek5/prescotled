import {configuratorUrl,configuratorVersion} from './config.js';

export async function mountAssemblyPreview(host,button,caption,{auto=false}={}){
 const fallback=host.querySelector('.film-fallback'),loading=host.querySelector('.film-loading');
 const captions={tape:'4 przewody · 3 poziomy mocy',turn:'PRESCOT DELUX 3 w 1',profile:'Profil KLUŚ MICRO-PLUS',peel:'Odklej podkład 3M',seat:'Wklej taśmę w profil',cover:'Zatrzaśnij osłonę',caps:'Zaślepki i cztery przewody',light:'Włącz światło',complete:'Zobacz, jakie to proste!'};
 loading.hidden=false;button.disabled=true;host.dataset.state='loading';let film=null;
 try{
  const {createWelcomeFilm}=await import(`${configuratorUrl}welcome-film.js?v=${configuratorVersion}`);
  film=await createWelcomeFilm(host,{onPhase:phase=>caption.textContent=captions[phase],onPlaying:playing=>{button.textContent=playing?'Ⅱ  Pauza':'▷  Odtwórz pokaz';button.setAttribute('aria-pressed',String(playing));}});
  fallback.hidden=true;button.disabled=false;loading.hidden=true;host.dataset.state='ready';
  button.onclick=()=>{if(film.inspect().playing)film.pause();else film.play();};
  if(auto||matchMedia('(prefers-reduced-motion: reduce)').matches)film.play();else film.seek(0);
  const visibility=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting&&film.inspect().playing)film.pause();},{threshold:0});visibility.observe(host);
  const dispose=()=>{visibility.disconnect();film.dispose();};window.addEventListener('pagehide',dispose,{once:true});
  window.assemblyPreviewDebug={inspect:film.inspect,seek:film.seek};
  return{inspect:film.inspect,dispose};
 }catch{
  loading.hidden=true;button.disabled=false;host.dataset.state='fallback';button.textContent='Otwórz pokaz w konfiguratorze ↗';caption.textContent='DELUX 3 w 1 · MICRO-PLUS';
  button.onclick=()=>location.assign(configuratorUrl);film?.dispose();
  return null;
 }
}
