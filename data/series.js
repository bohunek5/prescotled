// PRESCOT LED's own tape families. Distributed brands belong elsewhere.
// Editorial sources and deliberately omitted claims: docs/content-sources.md.
const previousSite = 'https://bohunek5.github.io/prescotpl/';
const warrantySource = `${previousSite}tasmy-led/`;

export const series = [
  {
    id: 'threeinone',
    name: 'DELUX 3 w 1',
    warrantyYears: 7,
    eyebrow: 'Nowość · trzy poziomy mocy',
    description: 'Jedna taśma. Trzy poziomy światła: LOW, MEDIUM i HIGH, wybierane sposobem podłączenia.',
    paragraphs: [
      'DELUX 3 w 1 pozwala dopasować tę samą taśmę do światła dekoracyjnego lub mocniejszego akcentu. Trzy poziomy mocy — 3, 6 i 11 W/m — wybierasz przez odpowiednie podłączenie. W prezentowanym wariancie ciepła biel ma 3000 K.',
      'Odcinek cięcia ma 50 mm, a podkład 10 mm szerokości. Cztery pola przyłączeniowe to +24V, −L, −M i −H. W konfiguratorze obejrzysz taśmę z czterema przewodami, dobierzesz profil oraz osłonę i sprawdzisz sposób złożenia zestawu.'
    ],
    features: ['24 V', '3 / 6 / 11 W/m', 'Cięcie co 50 mm', 'Cztery pola przyłączeniowe'],
    application: 'Zabudowy meblowe, akcenty architektoniczne, scenografia i reklama.',
    sourceUrl: `${previousSite}konfigurator/assets/sources/delux-3in1.pdf`,
    sourcePath: 'prescot-led-studio/assets/sources/delux-3in1.pdf',
    warrantySource: `${previousSite}konfigurator/assets/sources/delux-3in1.pdf#page=1`,
    configStrip: 'threeinone',
    configModelName: 'DELUX 3 w 1 · 24D160-11-3080-1010',
    image: 'assets/threeinone.webp'
  },
  {
    id: 'delux-pro',
    name: 'DELUX PRO',
    warrantyYears: 7,
    eyebrow: 'Efektywność świetlna',
    description: 'Światło do profesjonalnych projektów, w których liczy się jasność, pobór energii i codzienna praca instalacji.',
    paragraphs: [
      'DELUX PRO jest rozwiązaniem dla profesjonalnych projektów, w których liczy się efekt wizualny, efektywność energetyczna i przewidywalność kosztów eksploatacji. Seria obejmuje warianty do delikatnych podświetleń oraz mocniejszych linii oświetleniowych.',
      'Stosujemy podłoże PCB z miedzią 4 oz i diody dobierane do konkretnego modelu. Produkcja w Polsce pozwala nam kontrolować montaż oraz parametry gotowej taśmy. Właściwy wariant dobierzesz do wymaganej jasności i sposobu odprowadzania ciepła.'
    ],
    features: ['24 V', 'PCB 4 oz', 'Polska produkcja', 'Warianty Low i High Brightness'],
    application: 'Linie oświetleniowe, ekspozycje, witryny oraz podświetlenia dekoracyjne.',
    sourceUrl: `${previousSite}dpro/`,
    sourcePath: 'prescotpl/dpro/index.html',
    warrantySource,
    image: 'assets/delux-pro.webp'
  },
  {
    id: 'delux-low-brightness',
    name: 'DELUX Low Brightness',
    warrantyYears: 7,
    eyebrow: 'Dyskretne oświetlenie tła',
    description: 'Delikatne światło wydobywa fakturę materiałów, podkreśla kontury i tworzy miękkie przejścia na powierzchniach.',
    paragraphs: [
      'Seria DELUX Low Brightness powstała do oświetlenia dekoracyjnego i akcentującego. Obniżona jasność pozwala podkreślić formę architektury lub mebla i dopasować światło tła do pozostałych źródeł w pomieszczeniu.',
      'Taśma korzysta z podłoża PCB 4 oz, podobnie jak mocniejsze modele DELUX. Wybierzesz ją do nisz, cokołów, półek i obwiedni, gdy światło ma delikatnie zaznaczać linię zabudowy.'
    ],
    features: ['24 V', 'PCB 4 oz', '160 LED/m', 'Polska produkcja'],
    application: 'Cokoły, nisze, półki, światło orientacyjne i dekoracyjne.',
    sourceUrl: `${previousSite}dlow/`,
    sourcePath: 'prescotpl/dlow/index.html',
    warrantySource,
    configStrip: 'delux-lb4014',
    configModelName: 'DELUX Low Brightness 4014 · 3000 K',
    image: 'assets/delux-low-brightness.webp'
  },
  {
    id: 'delux-slim',
    name: 'DELUX Slim',
    warrantyYears: 7,
    eyebrow: 'Tylko 4 mm szerokości',
    description: 'Wąska taśma do smukłych profili oraz detali meblowych, w których przestrzeń montażowa jest ograniczona.',
    paragraphs: [
      'DELUX Slim 4 mm to taśma LED o bardzo wąskiej konstrukcji, stworzona do montażu w cienkich profilach aluminiowych oraz w miejscach o ograniczonej przestrzeni instalacyjnej. Pomaga zachować czyste linie mebli, witryn i regałów.',
      'Seria obejmuje wariant standardowy oraz Low Brightness. Pierwszy służy do doświetlania powierzchni użytkowych i ekspozycji, drugi do delikatnych podświetleń. Podłoże PCB 4 oz wspiera odprowadzanie ciepła do właściwie dobranego profilu.'
    ],
    features: ['Szerokość 4 mm', 'PCB 4 oz', 'Standard i Low Brightness', 'Polska produkcja'],
    application: 'Wąskie profile, smukłe zabudowy meblowe, witryny i regały.',
    sourceUrl: `${previousSite}dslim4/`,
    sourcePath: 'prescotpl/dslim4/index.html',
    warrantySource,
    configStrip: 'slim',
    configModelName: 'DELUX Slim 4 mm · 24 V · 3000 K',
    image: 'assets/delux-slim.webp'
  },
  {
    id: 'delux-standard',
    name: 'DELUX 160LED Standard',
    warrantyYears: 7,
    eyebrow: 'Światło na co dzień',
    description: 'Uniwersalna baza oświetlenia liniowego: do blatów, stanowisk pracy i codziennie używanych przestrzeni.',
    paragraphs: [
      'Model 160LED pełni w serii DELUX rolę uniwersalnego źródła światła zadaniowego. Sprawdza się jako oświetlenie blatów kuchennych, stanowisk pracy, ciągów komunikacyjnych, regałów handlowych czy sufitów liniowych.',
      'Gęste rozmieszczenie 160 diod na metr pomaga uzyskać równomierną linię pod odpowiednio dobraną osłoną. Zasilanie 24 V oraz podłoże PCB 4 oz to podstawa tej rodziny. Z kompatybilnym ściemniaczem możesz dopasować jasność instalacji do pory dnia.'
    ],
    features: ['24 V', '160 LED/m', 'PCB 4 oz', 'Polska produkcja'],
    application: 'Blaty kuchenne, stanowiska pracy, korytarze i sufity liniowe.',
    sourceUrl: `${previousSite}160s/`,
    sourcePath: 'prescotpl/160s/index.html',
    warrantySource,
    image: 'assets/delux-standard.webp'
  },
  {
    id: 'true-color',
    name: 'DELUX True Color',
    warrantyYears: 7,
    eyebrow: 'Wierność oddawania barw',
    description: 'CRI 97 dla miejsc, w których kolor materiału, produktu i wykończenia zasługuje na uważne pokazanie.',
    paragraphs: [
      'True Color powstała do projektów, w których jakość oddawania barw wpływa na odbiór detalu. Współczynnik CRI 97 pomaga pokazać kolory w ekspozycjach, wnętrzach i miejscach pracy z materiałami.',
      'W rodzinie są warianty o standardowej i obniżonej jasności, z układem 160 LED/m oraz podłożem PCB 4 oz. Możesz dopasować intensywność światła do głównej linii oświetleniowej albo delikatniejszej ekspozycji na półce.'
    ],
    features: ['CRI 97', '24 V', 'PCB 4 oz', 'Standard i Low Brightness'],
    application: 'Ekspozycje, wzorniki materiałów, witryny i wnętrza z kolorowymi detalami.',
    sourceUrl: `${previousSite}truecolor/`,
    sourcePath: 'prescotpl/truecolor/index.html',
    warrantySource,
    configStrip: 'delux',
    configModelName: 'DELUX CRI97 · 24D160-10-3097-810',
    image: 'assets/true-color.webp'
  },
  {
    id: 'delux-high-brightness',
    name: 'DELUX High Brightness',
    warrantyYears: 7,
    eyebrow: 'Mocniejsze światło robocze',
    description: 'Wysoki strumień świetlny do głównych linii światła, lad, witryn i większych powierzchni roboczych.',
    paragraphs: [
      'Seria High Brightness została zaprojektowana do zastosowań wymagających intensywnego oświetlenia powierzchni roboczych oraz ekspozycyjnych. To rozwiązanie do głównych linii światła, sufitów podwieszanych, lad sprzedażowych i przestrzeni komercyjnych.',
      'Taśmy korzystają z podłoża PCB 4 oz i wymagają montażu w odpowiednio dobranym profilu aluminiowym, który odprowadza ciepło. Gęsty układ diod wraz z osłoną pomaga uzyskać równomierny efekt świetlny.'
    ],
    features: ['24 V', '160 LED/m', 'PCB 4 oz', 'Montaż w profilu aluminiowym'],
    application: 'Światło główne, duże blaty, lady, witryny i ekspozycje handlowe.',
    sourceUrl: `${previousSite}dhigh/`,
    sourcePath: 'prescotpl/dhigh/index.html',
    warrantySource,
    image: 'assets/delux-high-brightness.webp'
  },
  {
    id: 'onecut',
    name: 'OneCut',
    warrantyYears: 5,
    eyebrow: 'Cięcie co 10 mm',
    description: 'Precyzyjnie dopasowany odcinek światła do krótkich profili, narożników i drobnych detali zabudowy.',
    paragraphs: [
      'W serii OneCut moc ustępuje miejsca precyzji w kreowaniu nastroju. Krótkie moduły cięcia pozwalają dopasować długość taśmy do detalu i ograniczyć nieoświetlony fragment na końcu profilu.',
      'Moduł ma 10 mm, a taśma pracuje przy napięciu 12 V DC. To rozwiązanie do podświetleń dekoracyjnych, w których liczy się długość odcinka oraz subtelny kontur światła. Dobór osłony i profilu pozwala dostosować końcowy efekt.'
    ],
    features: ['12 V', 'Cięcie co 10 mm', 'Oświetlenie dekoracyjne', 'Polska produkcja'],
    application: 'Krótkie profile, narożniki, detale meblowe i podświetlenia dekoracyjne.',
    sourceUrl: `${previousSite}onecut/`,
    sourcePath: 'prescotpl/onecut/index.html',
    warrantySource,
    image: 'assets/onecut.webp'
  },
  {
    id: 'bread',
    name: 'Bread',
    warrantyYears: 5,
    eyebrow: 'Światło dla pieczywa',
    description: 'Specjalne widmo podkreśla ciepłe, złote i brązowe tony wypieków w ladach i na regałach.',
    paragraphs: [
      'Seria Bread powstała do ekspozycji pieczywa i wyrobów cukierniczych. Zastosowany luminofor podkreśla złote, brązowe oraz pomarańczowe tony, pomagając pokazać strukturę i kolor wypieków.',
      'W rodzinie są warianty 70 i 160 LED/m. Pierwszy służy do półek oraz regałów wielopoziomowych, drugi do mocniej oświetlonych lad ekspozycyjnych. Taśmy pracują przy napięciu 24 V i korzystają z podłoża PCB 3 oz.'
    ],
    features: ['24 V', '70 lub 160 LED/m', 'PCB 3 oz', 'Widmo do ekspozycji pieczywa'],
    application: 'Piekarnie, cukiernie, regały piekarnicze i lady ekspozycyjne.',
    sourceUrl: `${previousSite}produkt/`,
    sourcePath: 'prescotpl/produkt/index.html',
    warrantySource,
    image: 'assets/bread.webp'
  },
  {
    id: 'premium-dense',
    name: 'Premium 70 / 120 / 140 / 210',
    warrantyYears: 5,
    eyebrow: 'Cztery gęstości diod',
    description: 'Wybierz układ diod do wymaganej jasności, głębokości profilu i charakteru linii światła.',
    paragraphs: [
      'Seria obejmuje warianty 70, 120, 140 i 210 LED na metr. Różne zagęszczenia pozwalają dopasować taśmę do oświetlenia dekoracyjnego, codziennego użytkowego lub mocniejszych linii świetlnych.',
      'Produkcja w Polsce umożliwia nam kontrolę procesu montażu oraz dobór diod. Końcowy efekt linii zależy od wybranej taśmy, głębokości profilu i osłony — szczególnie w płytkich zabudowach warto dobrać te elementy razem.'
    ],
    features: ['70 / 120 / 140 / 210 LED/m', 'Warianty 12 i 24 V', 'Polska produkcja'],
    application: 'Zabudowy meblowe, profile liniowe, wnętrza domowe i komercyjne.',
    sourceUrl: `${previousSite}p70140210/`,
    sourcePath: 'prescotpl/p70140210/index.html',
    warrantySource,
    image: 'assets/premium-dense.webp'
  },
  {
    id: 'premium-classic',
    name: 'Premium 60 / 120',
    warrantyYears: 5,
    eyebrow: 'Sprawdzona instalacja 12 V',
    description: 'Dwa warianty do projektów domowych i komercyjnych: od światła we wnęce po doświetlenie blatu.',
    paragraphs: [
      'Zaprojektowane i wyprodukowane w Polsce modele 60 i 120 LED/m służą do oświetlenia domowego i komercyjnego. Seria opiera się na zasilaniu 12 V oraz podłożu PCB z miedzią 3 oz.',
      'Wariant 60 LED/m wybierzesz do wnęk, sufitów podwieszanych i cokołów meblowych. Model 120 LED/m sprawdza się w oświetleniu roboczym, pod szafkami kuchennymi oraz w korytarzach. Profil i osłona pomagają dopasować rozproszenie światła.'
    ],
    features: ['12 V', '60 lub 120 LED/m', 'PCB 3 oz', 'Polska produkcja'],
    application: 'Wnęki, cokoły, szafki kuchenne i korytarze.',
    sourceUrl: `${previousSite}p60120/`,
    sourcePath: 'prescotpl/p60120/index.html',
    warrantySource,
    image: 'assets/premium-classic.webp'
  },
  {
    id: 'premium-s-shape',
    name: 'Premium S-Shape',
    warrantyYears: 5,
    eyebrow: 'Światło podąża za kształtem',
    description: 'Specjalny układ podkładu pozwala prowadzić taśmę na boki, po łukach i nieregularnych kształtach.',
    paragraphs: [
      'Taśma S-Shape została zaprojektowana z myślą o aplikacjach wymagających prowadzenia światła po łukach i niestandardowych kształtach. Specjalny układ ścieżek pozwala na wyginanie taśmy na boki.',
      'Seria obejmuje ciepłą, neutralną i zimną biel. Warianty pracują przy napięciu 12 V, wykorzystują diody SMD2835 i mają szerokość 6 mm. Konstrukcja sprawdza się w literach przestrzennych, kasetonach oraz dekoracjach świetlnych.'
    ],
    features: ['12 V', 'Szerokość 6 mm', 'Gięcie na boki', 'Ciepła, neutralna i zimna biel'],
    application: 'Litery przestrzenne, kasetony, łuki i nieregularne detale.',
    sourceUrl: `${previousSite}special/`,
    sourcePath: 'prescotpl/special/index.html',
    warrantySource,
    configStrip: 'sshape',
    configModelName: 'Premium S-Shape · 3000 K',
    image: 'assets/premium-s-shape.webp'
  },
  {
    id: 'premium-rgbw',
    name: 'Premium RGBW',
    warrantyYears: 5,
    eyebrow: 'Kolor i osobna biel',
    description: 'Kolorowa dekoracja i funkcjonalna biel w jednej instalacji, z niezależnym kanałem światła białego.',
    paragraphs: [
      'Premium RGBW łączy oświetlenie białe z możliwością budowania nastroju kolorem. Niezależny kanał biały pozwala wykorzystać tę samą linię światła w codziennym użytkowaniu i w wieczornej aranżacji.',
      'Rodzina obejmuje warianty z ciepłą lub neutralną bielą oraz zasilaniem 12 lub 24 V. Odpowiedni sterownik umożliwia wybór barwy i mieszanie jej z bielą. Podłoże PCB 3 oz wspiera odprowadzanie ciepła oraz zasilanie kanałów.'
    ],
    features: ['RGB + osobna biel', 'Warianty 12 i 24 V', 'PCB 3 oz', 'Ciepła lub neutralna biel'],
    application: 'Salony, strefy relaksu, wnęki RTV i dekoracje świetlne.',
    sourceUrl: `${previousSite}prgbw/`,
    sourcePath: 'prescotpl/prgbw/index.html',
    warrantySource,
    configStrip: 'premium-rgbw',
    configModelName: 'Premium RGBW + 3000 K · 24 V',
    image: 'assets/premium-rgbw.webp'
  },
  {
    id: 'cob',
    name: 'Premium COB',
    warrantyYears: 3,
    eyebrow: 'Jednolita linia światła',
    description: 'Mikrodiody pod wspólną warstwą luminoforu tworzą gładką linię do mebli, luster i zabudowy.',
    paragraphs: [
      'Technologia COB umieszcza liczne mikrodiody pod wspólną warstwą luminoforu. Dzięki temu taśma tworzy równomierną linię światła, co pomaga ograniczyć widoczne punkty w podświetleniach meblowych oraz na odbiciach.',
      'Oferta obejmuje biel, wersje Low Brightness, pojedyncze kolory i warianty wielokolorowe. Dobierz moc, barwę oraz stopień ochrony do miejsca montażu. W konfiguratorze pokazujemy konkretny wariant COB IP67, opisany odrębnie od pozostałych modeli rodziny.'
    ],
    features: ['Technologia COB', 'Warianty 12 i 24 V', 'Biel i kolory', 'Różne stopnie ochrony'],
    application: 'Podświetlenia mebli, luster, wnęk oraz dekoracyjne linie świetlne.',
    sourceUrl: `${previousSite}dslim4-copy/`,
    sourcePath: 'prescotpl/dslim4-copy/index.html',
    warrantySource,
    configStrip: 'cob-ip67',
    configModelName: 'Premium COB IP67 · 24 V · 3000 K',
    image: 'assets/cob.webp'
  },
  {
    id: 'cob-digital',
    name: 'Premium COB Digital',
    warrantyYears: 3,
    eyebrow: 'Światło w ruchu',
    description: 'Adresowalna linia COB do animacji, płynących efektów i sterowania kolejnymi odcinkami światła.',
    paragraphs: [
      'COB Digital łączy równomierną linię świetlną z układami sterującymi IC. Zamiast zmieniać całą taśmę jednocześnie, kompatybilny sterownik może tworzyć efekty w kolejnych adresowalnych sekcjach.',
      'Seria pracuje przy napięciu 24 V. Nadaje się do dekoracji, ekspozycji oraz instalacji z falami i animacjami światła. Sterownik i sposób zasilania dobiera się do konkretnego modelu taśmy oraz długości projektu.'
    ],
    features: ['24 V', 'Adresowalne sekcje', 'Układy IC', 'Dynamiczne efekty świetlne'],
    application: 'Animowane dekoracje, ekspozycje, scenografia i strefy rozrywki.',
    sourceUrl: `${previousSite}cobdigital/`,
    sourcePath: 'prescotpl/cobdigital/index.html',
    warrantySource,
    image: 'assets/cob-digital.webp'
  }
];

export default series;
