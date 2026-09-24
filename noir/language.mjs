// Use the site's existing provider and consent store; no external code before consent.
const languages=[['pl','Polski'],['en','English'],['de','Deutsch'],['cs','Čeština'],['da','Dansk'],['et','Eesti'],['fi','Suomi'],['fr','Français'],['it','Italiano'],['lt','Lietuvių'],['es','Español'],['sv','Svenska'],['ar','العربية'],['zh-CN','中文']];
const dialog=document.querySelector('#language-menu');
const status=dialog.querySelector('.language-status');
const normalize=code=>/^zh(?:-|$)/i.test(code)?'zh-CN':languages.find(([c])=>c===String(code).toLowerCase().split('-')[0])?.[0];
const current=()=>normalize(document.cookie.match(/(?:^|;\s*)googtrans=\/pl\/([^;]+)/)?.[1])||'pl';
const loadScript=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.append(s);});
let privacyPromise,providerPromise,returnFocus;
async function privacy(){
  if(window.PrescotPrivacy)return;
  privacyPromise ||= (async()=>{const css=document.createElement('link');css.rel='stylesheet';css.href='/prescotled/privacy.css';document.head.append(css);await loadScript('/prescotled/privacy.js');})();
  await privacyPromise;
}
async function provider(){
  await privacy();
  providerPromise ||= (async()=>{
    window.gtranslateSettings ||= {};
    window.gtranslateSettings.noir={default_language:'pl',languages:languages.map(([code])=>code),url_structure:'none',flag_style:'3d',wrapper_selector:'#noir-translator',switcher_horizontal_position:'inline',flags_location:'/prescotled/wp-content/plugins/gtranslate/flags/'};
    const s=document.createElement('script');s.dataset.gtWidgetId='noir';s.src='/prescotled/wp-content/plugins/gtranslate/js/float.js';
    await new Promise((resolve,reject)=>{s.onload=resolve;s.onerror=reject;document.head.append(s);});
  })();
  await providerPromise;
}
function sync(){
  const code=current();const label=languages.find(([c])=>c===code)?.[1]||'Polski';
  for(const button of document.querySelectorAll('.language-toggle')){
    button.setAttribute('aria-label',`Wybierz język. Aktywny: ${label}`);button.dataset.language=code;
    button.querySelector('img').src=`/prescotled/wp-content/plugins/gtranslate/flags/32/${code}.png`;button.querySelector('img').alt=label;
  }
  for(const button of dialog.querySelectorAll('[data-language]'))button.setAttribute('aria-pressed',String(button.dataset.language===code));
}
async function select(code){
  try{
    localStorage.setItem('prescot_language_v1',code);
    if(code===current()){dialog.close();return;}
    await provider();dialog.close();
    const run=()=>{
      window.doGTranslate(`pl|${code}`);
      // Cookies reflect the actual provider selection, not a pretend translated state.
      let attempts=0;const check=()=>{sync();if(current()!==code&&++attempts<30)setTimeout(check,450);};setTimeout(check,500);
    };
    if(code==='pl'||window.PrescotPrivacy.has('translation'))run();else window.PrescotPrivacy.request('translation',run);
  }catch{status.textContent='Nie udało się uruchomić tłumacza. Spróbuj ponownie.';if(!dialog.open)dialog.showModal();}
}
for(const [code,label] of languages){
  const b=document.createElement('button');b.dataset.language=code;b.lang=code;
  const im=document.createElement('img');im.src=`/prescotled/wp-content/plugins/gtranslate/flags/32/${code}.png`;im.alt='';im.width=24;im.height=24;
  const span=document.createElement('span');span.textContent=label;b.append(im,span);b.addEventListener('click',()=>select(code));dialog.querySelector('.language-options').append(b);
}
for(const button of document.querySelectorAll('.language-toggle'))button.addEventListener('click',()=>{returnFocus=button;sync();dialog.showModal();});
dialog.querySelector('[data-language-close]').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>returnFocus?.focus());
dialog.querySelector('[data-privacy-settings]').addEventListener('click',async()=>{await privacy();dialog.close();window.PrescotPrivacy.open();});
document.querySelector('[data-noir-privacy]').addEventListener('click',async()=>{await privacy();window.PrescotPrivacy.open();});
addEventListener('prescot-privacy-change',sync);
try{
  const saved=JSON.parse(localStorage.getItem('prescot_privacy_v1'));
  if(saved?.preferences?.translation&&saved.expiresAt>Date.now()){
    await privacy();
    if(window.PrescotPrivacy.has('translation')){
      const preferred=normalize(localStorage.getItem('prescot_language_v1'))||normalize(document.cookie.match(/googtrans=\/pl\/([^;]+)/)?.[1])||(navigator.languages||[navigator.language]).map(normalize).find(Boolean)||'pl';
      if(preferred!==current())await select(preferred);else if(preferred!=='pl')await provider();
    }
  }
}catch{}
sync();
