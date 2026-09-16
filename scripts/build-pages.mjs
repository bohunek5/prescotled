import fs from 'node:fs/promises';
import path from 'node:path';
import {powerSupplies,controllers} from '../data/components.js';
import {configuratorUrl} from '../config.js';
import {header,footer,head,breadcrumbs,esc,routes} from './site-layout.mjs';

export async function buildPages(root,home){
 const section=id=>{const match=home.match(new RegExp(`<section id="${id}"[\\s\\S]*?<\\/section>`));if(!match)throw new Error(`Missing section ${id}`);return match[0].replace(/<div class="section-more">[\s\S]*?<\/div>/g,'');};
 const related=`<div class="page-related section-shell"><p>Dobierz taśmę, profil i sposób montażu do swojego projektu.</p><a class="button" href="konfigurator/">Skomponuj zestaw w 3D <span aria-hidden="true">→</span></a></div>`;
 const title=(html,text)=>html.replace(/<h2([^>]*)>[\s\S]*?<\/h2>/,`<h1$1>${text}</h1>`);
 const localize=html=>{
  const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  return html.replace(/\b(href|src|poster)="([^"]*)"/g,(all,attr,value)=>{
   if(/^(?:https?:|mailto:|tel:|data:)/.test(value))return all;
   if(value.startsWith('#'))return `${attr}="${ids.has(value.slice(1))?value:'../'+value}"`;
   return `${attr}="../${value}"`;
  });
 };
 const cards=models=>`<div class="download-grid">${models.map(m=>`<a href="${m.sourceUrl}" target="_blank" rel="noopener"><span>${esc(m.name)}</span><small>PDF ↗</small></a>`).join('')}</div>`;
 const brands=[
  ['klus','KLUŚ','klus-distributor.webp','Profile, osłony i akcesoria.','Profile aluminiowe KLUŚ pozwalają włączyć linię światła w meble i architekturę. Wybierz sposób montażu, przekrój oraz osłonę dopasowaną do taśmy.','W konfiguratorze obejrzysz przekrój profilu, położenie taśmy, osłonę i montaż zestawu.','konfigurator/','Dobierz profil w 3D'],
  ['elba','ELBA Lighting','elba-logo.webp','Oświetlenie przestrzeni.','Oprawy ELBA obejmują oświetlenie drogowe, miejskie, parkowe i przemysłowe. Dobór zależy od miejsca montażu i wymagań projektu.','Prześlij nam zakres projektu i warunki montażu. Dział sprzedaży pomoże ustalić dostępne rozwiązania.','kontakt/','Zapytaj o oprawy ELBA'],
  ['scharfer','Scharfer','scharfer-logo.webp','Zasilanie dla instalacji LED.','Zasilacze Scharfer uzupełniają ofertę komponentów do instalacji z taśmami LED. Model dobiera się do napięcia, obciążenia oraz warunków zabudowy.','Podaj model taśmy, długość odcinków i miejsce montażu. Na tej podstawie możemy pomóc w doborze zasilania.','kontakt/','Zapytaj o zasilacze Scharfer'],
  ['miboxer','MiBoxer / Mi-Light','miboxer-logo.webp','Światło pod Twoją kontrolą.','Kontrolery i piloty MiBoxer / Mi-Light służą do sterowania oświetleniem oraz jego strefami. Wybór urządzenia zależy od rodzaju taśmy i potrzebnych funkcji.','Biel, regulacja temperatury barwowej czy RGBW — opisz sposób, w jaki chcesz korzystać ze światła. Pomożemy dobrać sterowanie.','kontakt/','Zapytaj o sterowanie MiBoxer']
 ];
 const definitions=[
  {id:'tasmy-led',name:'Taśmy LED',description:'Wszystkie 15 rodzin taśm LED PRESCOT. Porównaj serie DELUX, Premium i COB, sprawdź gwarancję oraz znajdź taśmę do swojego projektu.',body:title(section('tasmy'),'Taśmy LED.<br>Znajdź swoją serię.')},
  {id:'zasilacze',name:'Zasilacze PR-MAD',description:'Poznaj sześć zasilaczy PRESCOT PR-MAD od 36 do 300 W z autodetekcją 12 i 24 V. Obracaj model 3D i pobierz kartę wybranego modelu.',body:title(section('system'),'Zasilacze PR-MAD.<br>Moc dla Twojej taśmy.'),component:'power'},
  {id:'sterowniki',name:'Sterowniki LED',description:'Sterowniki PRESCOT MONO, CCT, RGB, RGBW i RGBCCT. Obejrzyj modele 3D, sprawdź pokaz regulacji światła i pobierz dokumentację.',body:title(section('system'),'Sterowanie LED.<br>Światło po Twojemu.'),component:'controller'},
  {id:'zastosowania',name:'Zastosowania',description:'Zobacz inspiracje oświetlenia blatów, schodów oraz mebli. Wybierz zastosowanie i otwórz dopasowany montaż w konfiguratorze 3D.',body:title(section('zastosowania'),'Światło w Twojej przestrzeni.')+section('pokaz')},
  {id:'produkcja',name:'Produkcja i laboratorium',description:'Zobacz produkcję taśm LED PRESCOT w Giżycku, poznaj pomiary w naszym laboratorium i porozmawiaj o produkcji pod własną marką.',body:title(section('produkcja'),'Od projektu<br>do gotowej taśmy LED.'),dialog:true},
  {id:'dystrybucja',name:'Marki w dystrybucji',description:'KLUŚ, ELBA, Scharfer i MiBoxer w ofercie PRESCOT. Poznaj profile, oprawy, zasilacze i sterowanie uzupełniające nasze taśmy LED.',body:title(section('dystrybucja'),'Komponenty,<br>które tworzą całość.')+brands.map(([id,name,image,h,p,p2,link,label])=>`<section class="brand-detail section-shell" id="${id}"><div><img src="assets/${image}" alt="${name}" width="320" height="100" loading="lazy"><h2>${h}</h2></div><div><p>${p}</p><p>${p2}</p><a class="text-link" href="${link}">${label} <span aria-hidden="true">→</span></a></div></section>`).join('')},
  {id:'do-pobrania',name:'Dokumenty do pobrania',description:'Karty taśm DELUX, katalog Premium oraz dokumentacja zasilaczy PR-MAD i sterowników PRESCOT. Znajdź instrukcje i warunki gwarancji.',body:title(section('dokumenty'),'Dokumentacja.<br>Wszystko pod ręką.')+`<section class="document-group section-shell" id="zasilacze"><h2>Karty zasilaczy PR-MAD</h2>${cards(powerSupplies)}</section><section class="document-group section-shell" id="sterowniki"><h2>Karty sterowników</h2>${cards(controllers)}<a class="text-link" href="assets/components/instrukcja-serii.pdf" target="_blank" rel="noopener">Instrukcja serii sterowników <span aria-hidden="true">PDF ↗</span></a></section><section class="document-group section-shell" id="gwarancja"><p class="eyebrow">GWARANCJA I REKLAMACJE</p><h2>Warunki dla konkretnego produktu.</h2><p>Rodziny taśm mają 7, 5 lub 3 lata gwarancji. Zasilacze PR-MAD: 3 lata. Sterowniki PR-…-12A: 2 lata. Szczegóły i warunki użytkowania sprawdzisz w dokumentacji swojego modelu.</p><a class="text-link" href="https://bohunek5.github.io/prescotpl/owg/" target="_blank" rel="noopener">Pełne warunki gwarancji · serwis PRESCOT <span aria-hidden="true">↗</span></a></section>`},
  {id:'kontakt',name:'Kontakt',description:'Skontaktuj się z działem sprzedaży PRESCOT w Giżycku. Zapytaj o taśmy LED, zasilacze, sterowanie lub produkcję pod własną marką.',body:title(section('kontakt'),'Porozmawiajmy<br>o Twoim świetle.')+`<section class="contact-help section-shell"><div><h2>Dobór do projektu</h2><p>Napisz, gdzie ma pojawić się światło. Podaj długość odcinków, oczekiwaną barwę i sposób montażu. Możesz dołączyć zdjęcie lub rysunek w wiadomości.</p><a class="text-link" href="mailto:komponenty@prescot.pl?subject=Dob%C3%B3r%20o%C5%9Bwietlenia%20LED">Napisz do działu sprzedaży <span aria-hidden="true">↗</span></a></div><div><h2>Serwis i reklamacje</h2><p>Do zgłoszenia dołącz model produktu, dokument zakupu oraz opis usterki. Zdjęcia oznaczeń i instalacji ułatwią jego weryfikację.</p><a class="text-link" href="mailto:reklamacje@prescot.pl">reklamacje@prescot.pl <span aria-hidden="true">↗</span></a></div></section>`}
 ];
 for(const page of definitions){
  let body=page.body;
  if(page.id==='dystrybucja')body=body.replaceAll('href="dystrybucja/#','href="#');
  if(page.component){
   body=body.replace(/<div class="system-tabs"[\s\S]*?<\/div>/,'');
   body=body.replace('Nasze zasilacze PR-MAD i sterowniki.<br>Obejrzyj modele z bliska i poznaj ich możliwości.',page.component==='power'?'Sześć modeli od 36 do 300 W.<br>Sprawdź wymiary, autodetekcję napięcia i kartę produktu.':'MONO, CCT, RGB, RGBW i RGBCCT.<br>Wybierz model i zobacz, jak zmienia się światło.');
  }
  const dialog=page.dialog?home.match(/<dialog id="video-dialog"[\s\S]*?<\/dialog>/)[0]:'';
  await fs.mkdir(path.join(root,page.id),{recursive:true});
  await fs.writeFile(path.join(root,page.id,'index.html'),`<!doctype html><html lang="pl"><head>${head(page.name,page.description,page.id+'/')}</head><body data-page="${page.id}"${page.component?` data-component="${page.component}"`:''}><a class="skip-link" href="#main">Przejdź do treści</a>${header('../',page.id)}<main id="main" class="page-main">${breadcrumbs(page.name)}${localize(body+related)}</main>${footer('../')}${localize(dialog)}</body></html>\n`);
 }
 const configBody=`<div class="configurator-toolbar"><div><h1>Twój zestaw w 3D.</h1><p>Dobierz taśmę, profil i osłonę. Sprawdź montaż i światło.</p></div><a class="text-link" href="../tasmy-led/">← Wróć do taśm LED</a></div><div class="configurator-stage"><div id="configurator-loading" class="configurator-loading" role="status"><span class="d-loader" aria-hidden="true"><i></i><i></i><i></i></span><span>Otwieramy Twoje studio światła…</span></div><iframe id="configurator-frame" title="Konfigurator zestawów LED PRESCOT — interaktywne studio 3D" allow="fullscreen" allowfullscreen></iframe></div><p class="configurator-help">Potrzebujesz całego ekranu? <a data-open-studio href="${configuratorUrl}" target="_blank" rel="noopener">Otwórz studio w osobnej karcie ↗</a></p><noscript><p><a href="${configuratorUrl}" target="_blank" rel="noopener">Otwórz konfigurator 3D w osobnej karcie</a></p></noscript>`;
 await fs.mkdir(path.join(root,'konfigurator'),{recursive:true});
 await fs.writeFile(path.join(root,'konfigurator/index.html'),`<!doctype html><html lang="pl"><head>${head('Konfigurator LED 3D','Skomponuj zestaw LED PRESCOT w interaktywnym studiu 3D. Dobierz taśmę, profil, osłonę i akcesoria, obejrzyj montaż oraz zapisz projekt.','konfigurator/')}</head><body data-page="konfigurator"><a class="skip-link" href="#main">Przejdź do treści</a>${header('../','konfigurator')}<main id="main" class="configurator-main">${configBody}</main>${footer('../')}</body></html>\n`);
 return routes.map(([id])=>id+'/');
}
