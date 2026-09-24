import {parseParameterQuery,createParameterRecord,matchParameterQuery} from '../catalog-parameters.mjs';

const catalog=document.querySelector('[data-catalog]');
if(catalog){
 const search=catalog.querySelector('[data-search-input]'),category=catalog.querySelector('select'),container=catalog.querySelector('.catalog-rows');
 const rows=[...container.querySelectorAll('.catalog-row')],positions=new Map(rows.map((row,i)=>[row,i]));
 const records=new Map(rows.map(row=>{
  const specs=[...row.querySelectorAll('.specs dt')].map(dt=>[dt.textContent.trim(),dt.nextElementSibling.textContent.trim()]);
  return [row,createParameterRecord({sku:row.dataset.sku||'',ean:specs.find(([key])=>key==='EAN')?.[1]||'',text:row.dataset.search,specs})];
 }));
 const copyStatus=document.createElement('span');copyStatus.className='sr-only';copyStatus.setAttribute('role','status');copyStatus.setAttribute('aria-live','polite');copyStatus.setAttribute('aria-atomic','true');catalog.append(copyStatus);
 const copyTimers=new WeakMap();
 rows.forEach(row=>row.querySelectorAll('.specs dt').forEach(dt=>{
  if(dt.textContent.trim()!=='EAN')return;
  const value=dt.nextElementSibling,ean=value?.textContent.trim();
  if(!ean||!/^\d{8,14}$/.test(ean)||value.querySelector('[data-copy-ean]'))return;
  value.classList.add('catalog-ean-value');
  const button=document.createElement('button');button.type='button';button.className='catalog-ean-copy';button.dataset.copyEan=ean;button.title='Kopiuj EAN';button.setAttribute('aria-label','Kopiuj EAN '+ean);
  button.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M4 13H3V3h10v1"/></svg><span class="catalog-ean-feedback" aria-hidden="true"></span>';
  value.append(button);
 }));
 async function copyEan(ean){
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(ean);return true;}}catch{}
  const active=document.activeElement,selection=getSelection(),ranges=selection?[...Array(selection.rangeCount)].map((_,i)=>selection.getRangeAt(i).cloneRange()):[];
  const field=document.createElement('textarea');field.value=ean;field.readOnly=true;field.tabIndex=-1;field.className='sr-only';field.style.position='fixed';field.style.top='0';document.body.append(field);
  let copied=false;
  try{field.focus({preventScroll:true});field.select();field.setSelectionRange(0,ean.length);copied=document.execCommand('copy');}catch{}
  finally{field.remove();active?.focus({preventScroll:true});if(selection){selection.removeAllRanges();ranges.forEach(range=>selection.addRange(range));}}
  return copied;
 }
 container.addEventListener('click',async event=>{
  const button=event.target.closest('[data-copy-ean]');if(!button||!container.contains(button))return;
  event.preventDefault();event.stopPropagation();if(button.dataset.copyBusy==='true')return;
  button.dataset.copyBusy='true';clearTimeout(copyTimers.get(button));copyStatus.textContent='';
  const copied=await copyEan(button.dataset.copyEan);delete button.dataset.copyBusy;
  button.dataset.copyState=copied?'copied':'failed';button.querySelector('.catalog-ean-feedback').textContent=copied?'Skopiowano':'Zaznacz numer';
  copyStatus.textContent=copied?'Skopiowano EAN '+button.dataset.copyEan+'.':'Nie udało się skopiować EAN. Zaznacz numer i skopiuj go ręcznie.';
  copyTimers.set(button,setTimeout(()=>{delete button.dataset.copyState;},1800));
 });
 const labels=new Map(rows.map(row=>{const badge=document.createElement('span');badge.className='catalog-match-label';badge.hidden=true;row.querySelector('.catalog-desc').append(badge);return[row,badge]}));
 const exactHeading=document.createElement('h2'),nearHeading=document.createElement('h2');
 exactHeading.className=nearHeading.className='catalog-results-heading';exactHeading.textContent='Dokładne dopasowania';nearHeading.textContent='Zbliżone parametry · ±8%';exactHeading.hidden=nearHeading.hidden=true;
 const empty=catalog.querySelector('[data-empty]');
 const custom=document.createElement('div');custom.className='catalog-custom';custom.hidden=true;
 const customTitle=document.createElement('h2');customTitle.textContent='Możemy ją dla Ciebie wyprodukować.';
 const customCopy=document.createElement('p');customCopy.textContent='Opowiedz nam o taśmie, której potrzebujesz. Sprawdzimy możliwości wykonania.';
 const customLink=document.createElement('a');customLink.className='text-link';customLink.textContent='Zapytaj o własną taśmę ↗';custom.append(customTitle,customCopy,customLink);empty.after(custom);
 const number=new Intl.NumberFormat('pl-PL',{maximumFractionDigits:1});
 const units={v:'V',k:'K',w:'W','w/m':'W/m',lm:'lm','lm/m':'lm/m',mm:'mm'};
 const params=new URLSearchParams(location.search);search.value=params.get('q')||params.get('family')||'';
 if([...category.options].some(option=>option.value===params.get('category')))category.value=params.get('category');
 function filter(save=false){
  const query=parseParameterQuery(search.value),exact=[],near=[],hidden=[];
  for(const row of rows){
   const match=category.value&&category.value!==row.dataset.category?{kind:'none'}:matchParameterQuery(query,records.get(row));
   row.hidden=match.kind==='none';row.dataset.parameterMatch=query.hasParameters?match.kind:'';
   const badge=labels.get(row);badge.hidden=!query.hasParameters||row.hidden;
   if(!badge.hidden){
    const differences=(match.deviations||[]).filter(d=>Math.abs(d.percent||0)>.0001).map(d=>`${number.format(d.actual)} ${units[d.unit]||d.unit} (${d.percent>0?'+':''}${number.format(d.percent)}%)`);
    badge.textContent=match.kind==='exact'?'Dokładne dopasowanie':'Zbliżony parametr'+(differences.length?': '+differences.join(' · '):' · ±8%');
   }
   if(row.hidden)hidden.push(row);else if(match.kind==='near')near.push({row,score:(match.deviations||[]).reduce((sum,d)=>sum+Math.abs(d.percent||0),0)});else exact.push(row);
  }
  near.sort((a,b)=>a.score-b.score||positions.get(a.row)-positions.get(b.row));
  exactHeading.hidden=!query.hasParameters||!exact.length;nearHeading.hidden=!near.length;
  container.replaceChildren(exactHeading,...exact,nearHeading,...near.map(item=>item.row),...hidden);
  const count=exact.length+near.length;
  catalog.querySelector('.catalog-count').textContent=query.hasParameters?`${exact.length} dokładnych · ${near.length} zbliżonych · ${rows.length} pozycji w katalogu`:`${count} z ${rows.length} pozycji`;
  empty.hidden=count>0;
  const stripContext=!query.terms.length||rows.some(row=>row.dataset.category==='Taśmy LED'&&query.terms.every(term=>records.get(row).text.includes(term)));
  custom.hidden=count>0||(!query.hasParameters&&category.value!=='Taśmy LED')||(category.value&&category.value!=='Taśmy LED')||(!category.value&&!stripContext);
  customLink.href='https://zeglarstwomazury.pl/kontakt/?temat='+encodeURIComponent('Taśma LED na zamówienie: '+search.value.trim());
  if(save){const url=new URL(location.href);url.search='';url.hash='';if(search.value.trim())url.searchParams.set('q',search.value.trim());if(category.value)url.searchParams.set('category',category.value);history.replaceState(null,'',url);}
  catalog.catalogSearch={inspect:()=>({query,exact:exact.length,near:near.length,total:rows.length,custom:!custom.hidden})};
 }
 search.addEventListener('input',()=>filter(true));category.addEventListener('change',()=>filter(true));
 catalog.querySelector('[data-reset]').addEventListener('click',()=>{search.value='';category.value='';filter(true);search.focus();});
 filter();
 if(location.hash){let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{}const row=id&&document.getElementById(id);if(row?.classList.contains('catalog-row')){search.value='';category.value='';filter();row.open=true;requestAnimationFrame(()=>row.scrollIntoView());}}
}
