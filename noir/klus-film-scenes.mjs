// Scene indexes refer to the original images in media/klus-film/photos/manifest.json.
// Each caption was checked against the corresponding manufacturer's photograph.
const scenes = (name, rows) => rows.map(([label,title,description,position='50% 50%'],index)=>({
  key:`${name.toLowerCase()}-${index}`,label,index,title,description,position,
  alt:`${name} — ${description} Fotografia zastosowania KLUŚ.`
}));
export const extraApplications = {
  'pds-4-plus':scenes('PDS-4-PLUS',[
    ['Butik','Światło rysuje formę.','Gięta linia światła tworzy dekorację na ścianie.'],
    ['Ekspozycja','Świetlne okręgi nad ekspozycją.','Lekkie oprawy zawieszone nad ekspozycją ubrań.'],
    ['Detal','Linia prowadzona po łuku.','Światło podkreśla fakturę ściany.']
  ]),
  siler:scenes('SILER',[
    ['Regał','Światło w zabudowie.','Podświetlone półki eksponują przechowywane przedmioty.'],
    ['Łazienka','Świetlny kontur nad wnętrzem.','Linia przy suficie rozjaśnia kamienne powierzchnie.'],
    ['Strefa prysznica','Światło wyznacza przestrzeń.','Świetlna linia obramowuje przeszkloną strefę prysznica.']
  ]),
  '45-16':scenes('45-16',[
    ['Półki','Światło skierowane na detal.','Oświetlenie drewnianych półek w zabudowie.'],
    ['Łazienka','Dyskretne światło w narożniku.','Linia pod sufitem rozjaśnia niewielką łazienkę.'],
    ['Detal','Światło pod półką.','Profil narożny pod szafką oświetla powierzchnię poniżej.']
  ]),
  '45-plus':scenes('45-PLUS',[
    ['Forma','Linie budują przestrzenną formę.','Prostokątne oprawy łączą światło z geometrią.'],
    ['Połączenie','Detal lekkiej oprawy.','Narożnik i zawieszenie prostokątnej oprawy świetlnej.'],
    ['Ściana','Światło w przestrzennym obrysie.','Geometryczna oprawa zamocowana do ściany.']
  ]),
  piko:scenes('PIKO',[
    ['Lustro','Światło przy lustrze.','Wąskie linie światła otaczają lustro nad umywalką.'],
    ['Wnętrze','Światło ukryte w zabudowie.','Ciepła poświata podkreśla obrys wejścia do wnętrza.'],
    ['Sypialnia','Dyskretne światło nad wnętrzem.','Linia przy suficie uzupełnia oświetlenie sypialni.']
  ]),
  jaz:scenes('JAZ',[
    ['Zawieszenie','Lekka linia nad przestrzenią.','Zbliżenie liniowej oprawy na zawiesiu.'],
    ['Instalacja','Światło tworzy rytm.','Powtarzalne linie w instalacji świetlnej.'],
    ['Światło','Forma zbudowana ze światła.','Wysoka instalacja świetlna w przestrzeni zewnętrznej.']
  ]),
  'hr-max':scenes('HR-MAX',[
    ['Dojście','Światło prowadzi do budynku.','Linia w podłożu wyznacza krawędź zieleni.'],
    ['Oś widokowa','Linia prowadząca wzrok.','Oświetlenie podłoża podkreśla dojście do wejścia.'],
    ['Architektura','Światło wpisane w otoczenie.','Oświetlone dojście przed nowoczesnym budynkiem.']
  ]),
  'hr-opti':scenes('HR-OPTI',[
    ['Elewacja','Rytm światła na elewacji.','Pionowe linie światła podkreślają podziały fasady.'],
    ['Wejście','Światło przy wejściu.','Oświetlenie eksponuje wysokie przeszklenie budynku.'],
    ['Zieleń','Światło wydobywa fakturę.','Oświetlone rośliny w przestrzennej konstrukcji.']
  ]),
  'hr-slim':scenes('HR-SLIM',[
    ['Otoczenie','Światło od podłoża po ścianę.','Linie świetlne łączą schody z pionowymi powierzchniami.'],
    ['Schody','Światło podkreśla krawędź.','Oświetlone stopnie w nowoczesnym otoczeniu budynku.'],
    ['Studio','Świetlna geometria wnętrza.','Czerwone linie wyznaczają strefy w sali treningowej.']
  ]),
  'hr-slim-koz':scenes('HR-SLIM-KOZ',[
    ['Korytarz','Linia przenika przez wnętrze.','Świetlne linie łączą powierzchnie długiego korytarza.'],
    ['Strefa odpoczynku','Dyskretne światło w suficie.','Linia światła nad fotelami i zieloną ścianą.'],
    ['Przejście','Światło podkreśla kierunek.','Linie w suficie i ścianie prowadzą przez korytarz.']
  ]),
  'hr-slim-koz-bd':scenes('HR-SLIM-KOZ-BD',[
    ['Studio','Światło w łagodnym łuku.','Świetlna linia na ścianie sali treningowej.'],
    ['Przestrzeń','Światło łączy powierzchnie.','Płynna linia przechodzi ze ściany w podłogę.'],
    ['Detal','Linia wpisana w zabudowę.','Zbliżenie łuku światła obok zielonej ściany.']
  ]),
  kozus:scenes('KOZUS',[
    ['Wnętrze','Światło schowane w suficie.','Linie świetlne prowadzą przez wysokie wnętrze.'],
    ['Korytarz','Światło nadaje wnętrzu kierunek.','Długie linie w suficie rozjaśniają ciąg komunikacyjny.'],
    ['Zabudowa','Światło podkreśla geometrię.','Oświetlenie współtworzy formę podwieszonego sufitu.']
  ]),
  kozel:scenes('KOZEL',[
    ['Kuchnia','Świetlne linie nad wnętrzem.','Oświetlenie sufitowe nad kuchnią z wyspą.'],
    ['Atrium','Światło podąża za architekturą.','Linie światła podkreślają kolejne kondygnacje atrium.'],
    ['Kondygnacje','Świetlny kontur przestrzeni.','Oświetlenie biegnie wzdłuż galerii wewnętrznych.']
  ]),
  lipod:scenes('LIPOD',[
    ['Recepcja','Linie świetlne nad wnętrzem.','Geometryczny układ opraw nad recepcją i korytarzem.'],
    ['Lada','Światło wyznacza strefę obsługi.','Oprawa liniowa zawieszona nad ladą recepcyjną.'],
    ['Biuro','Światło rysuje granice przestrzeni.','Linie świetlne podkreślają podziały wnętrza biurowego.']
  ]),
  giza:scenes('GIZA',[
    ['Recepcja','Światło w okrągłej formie.','Świetlne okręgi nad strefą recepcji.'],
    ['Studio','Rytm światła nad przestrzenią.','Prostokątne oprawy prowadzą wzdłuż sali treningowej.'],
    ['Wnętrze','Światło w układzie liniowym.','Linie na suficie rozjaśniają jasną recepcję.']
  ]),
  'giza-ll':scenes('GIZA-LL',[
    ['Forma','Jedna linia. Przestrzenna forma.','Warstwowe linie światła otaczają formę w wysokim holu.'],
    ['Ekspozycja','Geometria nad ekspozycją.','Sześciokątne oprawy nad ekspozycją samochodu.'],
    ['Salon','Światło w powtarzalnym układzie.','Zespoły świetlnych sześciokątów w salonie samochodowym.']
  ]),
  'nisa-ni':scenes('NISA-NI',[
    ['Wnętrze','Światło ukryte we wnęce.','Ciepła poświata rozjaśnia narożnik ściany i sufitu.'],
    ['Zabudowa','Dyskretne źródło światła.','Detal profilu ukrytego przy krawędzi zabudowy.'],
    ['Detal','Światło odbite od powierzchni.','Profil we wnęce kieruje światło na sufit.']
  ]),
  por:scenes('POR',[
    ['Schody','Światło prowadzi po schodach.','Podświetlona poręcz przy betonowej ścianie.'],
    ['Klatka schodowa','Światło wzdłuż poręczy.','Linie światła towarzyszą biegom schodów.'],
    ['Otoczenie','Świetlna linia na zewnątrz.','Oświetlona poręcz przy schodach w plenerze.']
  ])
};
