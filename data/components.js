// Specifications follow the individual PRESCOT product cards, copied alongside
// the product images. See docs/components-sources.md for source conflicts.
const componentAssets = 'assets/components/';
const oldSite = 'https://bohunek5.github.io/prescotpl/';

const supplyModels = [
  [36, 145, '5905475368073', 'Kompaktowy model do mebli, gablot i krótkich odcinków LED.'],
  [60, 145, '5905475368080', 'Do podświetlenia szafek, garderób i wnęk.'],
  [100, 176, '5905475368097', 'Do oświetlenia liniowego wnętrz i profili architektonicznych.'],
  [150, 199, '5905475368103', 'Do rozbudowanych stref światła i sufitów podwieszanych.'],
  [200, 218, '5905475368110', 'Do większych instalacji oświetlenia wnętrz.'],
  [300, 240, '5905475368127', 'Największa moc w rodzinie PR-MAD, do rozbudowanych instalacji LED.']
];

export const powerSupplies = supplyModels.map(([watts, length, ean, description]) => ({
  id: `pr-mad-${watts}`,
  name: `PR-MAD ${watts} W`,
  ref: `PR-MAD${watts}-1224`,
  brand: 'PRESCOT LED',
  type: 'power-supply',
  watts,
  power: watts,
  range: `${watts} W · 12 / 24 V DC`,
  voltage: '12 / 24 V DC',
  input: '180–265 V AC · 50 / 60 Hz',
  output: '12 lub 24 V DC',
  autoDetect: true,
  detection: 'Automatyczny dobór napięcia wyjściowego 12 lub 24 V DC',
  description,
  paragraphs: [
    'Auto-Identify rozpoznaje i dobiera napięcie wyjściowe 12 lub 24 V DC. Jeden model zasilacza obsługuje więc instalacje o jednym z tych napięć, zgodnie ze sposobem podłączenia opisanym w karcie.',
    'Aluminiowa, półzalewana obudowa ma 29 mm wysokości. Seria PR-MAD jest przeznaczona do wnętrz i ma stopień ochrony IP20. Przy doborze miejsca i mocy uwzględnij warunki wentylacji oraz zapas określony w karcie modelu.'
  ],
  features: ['Autodetekcja 12 / 24 V', 'Aluminiowa obudowa', 'Wysokość 29 mm', 'IP20 · do wnętrz'],
  dimensionsMm: [length, 50, 29],
  dimensions: [length, 50, 29],
  dimensionsLabel: `${length} × 50 × 29 mm`,
  enclosure: 'Aluminiowa, półzalewana (Semi-Potted)',
  ip: 'IP20',
  warrantyYears: 3,
  ean,
  image: `${componentAssets}pr-mad-${watts}w.webp`,
  sourceUrl: `${componentAssets}pr-mad-${watts}w.pdf`,
  sourcePath: `prescotpl/assets/showcase/pr-mad-${watts}w.pdf`,
  pageUrl: `${oldSite}zasilacze-led/`
}));

const controllerModels = [
  {
    mode: 'mono',
    label: 'MONO',
    channels: 1,
    ean: '5905475368011',
    headline: 'Jasność pod kontrolą.',
    description: 'Ściemnianie taśmy jednobarwnej. Pilot RF, odbiornik i uchwyt magnetyczny w zestawie.',
    application: 'Taśmy jednobarwne — białe lub o jednym stałym kolorze.',
    functions: ['Włączanie i wyłączanie', 'Regulacja jasności'],
    outputTerminals: ['V+', 'V−'],
    paragraphs: [
      'Zestaw MONO pozwala włączać, wyłączać i ściemniać taśmę jednobarwną. Jasność zmieniasz dotykowym suwakiem pilota. To prosty sposób na dopasowanie światła roboczego lub dekoracyjnego do chwili.',
      'Pilot komunikuje się z odbiornikiem przez RF 2,4 GHz. Uchwyt magnetyczny pozwala odłożyć go w stałym miejscu, a kompaktowy odbiornik zmieścić w zabudowie.'
    ]
  },
  {
    mode: 'cct',
    label: 'CCT',
    channels: 2,
    ean: '5905475368004',
    headline: 'Biel od ciepłej do chłodnej.',
    description: 'Jasność i temperatura bieli. Pilot RF, odbiornik i uchwyt magnetyczny w zestawie.',
    application: 'Taśmy CCT z oddzielnymi kanałami ciepłej i zimnej bieli.',
    functions: ['Regulacja jasności', 'Regulacja temperatury bieli'],
    outputTerminals: ['V+', 'CW', 'WW'],
    paragraphs: [
      'Dwa kanały CCT pozwalają mieszać ciepłą i zimną biel w odpowiedniej taśmie. Możesz dopasować zarówno jasność, jak i charakter białego światła. Zakres temperatury barwowej wynika z wybranej taśmy.',
      'Dłuższe przytrzymanie przycisku na pilocie zmienia funkcję suwaka pomiędzy jasnością i barwą bieli. W zestawie otrzymujesz odbiornik oraz pilot z uchwytem magnetycznym.'
    ]
  },
  {
    mode: 'rgb',
    label: 'RGB',
    channels: 3,
    ean: '5905475368028',
    headline: 'Kolor na jeden ruch.',
    description: 'Kolor i jasność taśmy RGB. Pilot RF, odbiornik i uchwyt magnetyczny w zestawie.',
    application: 'Taśmy RGB z trzema kanałami koloru.',
    functions: ['Wybór koloru RGB', 'Regulacja jasności'],
    outputTerminals: ['V+', 'R', 'G', 'B'],
    paragraphs: [
      'Sterownik RGB obsługuje trzy kanały: czerwony, zielony i niebieski. Ich mieszanie pozwala zmieniać kolor dekoracyjnej linii światła. Suwak pilota służy do wyboru barwy oraz regulacji jasności.',
      'Odbiornik współpracuje z taśmami RGB zasilanymi napięciem 12 lub 24 V DC. Komunikacja RF 2,4 GHz pozwala sterować światłem bez kierowania pilota w stronę odbiornika.'
    ]
  },
  {
    mode: 'rgbw',
    label: 'RGBW',
    channels: 4,
    ean: '5905475368042',
    headline: 'Kolor i osobna biel.',
    description: 'Kolor RGB z osobnym kanałem białym. Pilot RF, odbiornik i uchwyt magnetyczny w zestawie.',
    application: 'Taśmy RGBW z oddzielnym kanałem bieli.',
    functions: ['Wybór koloru RGB', 'Osobny kanał bieli', 'Regulacja jasności'],
    outputTerminals: ['V+', 'R', 'G', 'B', 'W'],
    paragraphs: [
      'Cztery kanały pozwalają sterować kolorem RGB oraz osobną białą diodą taśmy RGBW. Dzięki temu ta sama instalacja może służyć do kolorowego podświetlenia i codziennego światła białego.',
      'Barwa białego kanału zależy od wybranej taśmy. Zestaw obejmuje pilot RF 2,4 GHz, odbiornik i uchwyt magnetyczny. Pracuje z napięciem 12 lub 24 V DC.'
    ]
  },
  {
    mode: 'rgbcct',
    label: 'RGBCCT',
    channels: 5,
    ean: '5905475368035',
    headline: 'Kolor i pełna regulacja bieli.',
    description: 'Kolor RGB i regulowana temperatura bieli. Pilot RF, odbiornik i uchwyt magnetyczny w zestawie.',
    application: 'Taśmy RGB+CCT z kanałami RGB oraz ciepłą i zimną bielą.',
    functions: ['Wybór koloru RGB', 'Regulacja temperatury bieli', 'Regulacja jasności'],
    outputTerminals: ['V+', 'R', 'G', 'B', 'CW', 'WW'],
    paragraphs: [
      'Pięć kanałów łączy sterowanie kolorem RGB z mieszaniem ciepłej i zimnej bieli. Możesz dopasować kolor, temperaturę białego światła i jasność do różnych zastosowań tej samej instalacji.',
      'Sterownik jest przeznaczony do taśm RGB+CCT. Pilot zmienia funkcję suwaka pomiędzy jasnością, kolorem i barwą bieli. W zestawie znajdują się odbiornik oraz magnetyczny uchwyt pilota.'
    ]
  }
];

export const controllers = controllerModels.map(model => ({
  ...model,
  id: `pr-${model.mode}-12a`,
  name: `PR-${model.label}-12A`,
  ref: `PR-${model.label}-12A`,
  brand: 'PRESCOT LED',
  type: 'controller',
  voltage: '12 / 24 V DC',
  input: '12 lub 24 V DC',
  output: 'Takie samo napięcie jak na wejściu',
  autoDetect: false,
  detection: null,
  signal: 'RF 2,4 GHz',
  range: 'Do 30 m',
  rangeMetres: 30,
  maxCurrentA: 12,
  currentLabel: 'Maks. 12 A łącznie',
  maxLoadWatts: { 12: 144, 24: 288 },
  loadLabel: 'Łącznie maks. 144 W przy 12 V / 288 W przy 24 V',
  dimensionsMm: [74.5, 35.6, 16.5],
  dimensions: [74.5, 35.6, 16.5],
  dimensionsLabel: '74,5 × 35,6 × 16,5 mm',
  remoteDimensionsMm: [140.5, 37.5, 15.5],
  remoteDimensionsLabel: '140,5 × 37,5 × 15,5 mm',
  holderDimensionsMm: [85, 40.7, 6.5],
  remotePower: '2 × AAA · 3 V',
  ip: 'IP20',
  warrantyYears: 2,
  features: [...model.functions, 'RF 2,4 GHz · do 30 m', 'Pilot, odbiornik i uchwyt'],
  image: `${componentAssets}${model.mode}-main.webp`,
  receiverImage: `${componentAssets}${model.mode}-${model.mode === 'mono' ? 'detail' : 'receiver'}.webp`,
  remoteImage: `${componentAssets}${model.mode}-pilot.webp`,
  detailImage: `${componentAssets}${model.mode}-${model.mode === 'mono' ? 'receiver' : 'detail'}.webp`,
  videoUrl: `${componentAssets}${model.mode}-demo.mp4`,
  sourceUrl: `${componentAssets}pr-${model.mode}-12a.pdf`,
  sourcePath: `prescotpl/assets/controllers/pr-${model.mode}-12a.pdf`,
  manualUrl: `${componentAssets}instrukcja-serii.pdf`,
  pageUrl: `${oldSite}sterowniki-led/`
}));

export default { powerSupplies, controllers };
