export const finishes={
  silver:{name:'Srebrny anodowany',short:'Srebrny',color:'#b9c2c7',metalness:.95,roughness:.31},
  black:{name:'Czarny anodowany',short:'Czarny',color:'#202427',metalness:.82,roughness:.35},
  white:{name:'Biały lakierowany',short:'Biały',color:'#f1efe8',metalness:.06,roughness:.39},
  raw:{name:'Srebrny nieanodowany',short:'Surowe aluminium',color:'#a7afb4',metalness:1,roughness:.47}
};
export const microProducts=[
  {id:'micro-plus',name:'MICRO-PLUS',ref:'A02966',width:15.6,height:6,channel:11.2,ip:'20 / 67',mount:'Nawierzchniowy',headline:'Mała wysokość. Wiele możliwości.',detail:'Do mebli, wnęk i oświetlenia dekoracyjnego.',finishes:['silver','black','white','raw'],codes:['A02966A','A02966A07','A02966L9010OD','A02966NA'],slug:'profil-micro-plus-2215'},
  {id:'micro-nk',name:'MICRO-NK',ref:'A01587',width:22.2,height:6,channel:11.2,ip:'20 / 67',mount:'Wpuszczany',headline:'Światło wpisane w powierzchnię.',detail:'Kołnierz maskuje krawędź wpustu.',finishes:['silver','black','white'],codes:['A01587A','A01587A07','A01587L10OD'],slug:'profil-micro-nk-2214'},
  {id:'micro-h',name:'MICRO-H',ref:'A00599',width:16,height:8.7,channel:11.2,ip:'20 / 67',mount:'Nawierzchniowy',headline:'Gładkie ścianki. Ukryte mocowanie.',detail:'Montaż na powierzchni lub w podwieszeniu.',finishes:['silver'],codes:['A00599A'],slug:'profil-micro-h-2211'},
  {id:'micro-hg',name:'MICRO-HG',ref:'A01419',width:16,height:15,channel:11.2,ip:'20',mount:'Nawierzchniowy',headline:'Światło schowane głębiej.',detail:'Zagłębiona osłona ogranicza efekt olśnienia.',finishes:['silver','black'],codes:['A01419A','A01419A07'],slug:'profil-micro-hg-2212'},
  {id:'micro-30deg-koz',name:'MICRO-30DEG-KOZ',ref:'A00021',width:57.5,height:11.2,channel:11.2,ip:'20 / 67',mount:'Do zabudowy G-K',headline:'Kierunek światła: 30°.',detail:'Do wpuszczenia i pokrycia gładzią.',finishes:['raw'],codes:['A00021N'],slug:'profil-micro-30deg-koz-85347'}
];
export const chapterDuration=p=>20+p.finishes.length*7;
export const chapterStart=index=>microProducts.slice(0,index).reduce((sum,p)=>sum+chapterDuration(p),0);
export const filmDuration=microProducts.reduce((sum,p)=>sum+chapterDuration(p),0);
export const smooth=value=>{const x=Math.max(0,Math.min(1,value));return x*x*x*(x*(x*6-15)+10);};
export function sampleMicro(seconds){
  let t=((seconds%filmDuration)+filmDuration)%filmDuration,index=0;
  while(t>=chapterDuration(microProducts[index])){t-=chapterDuration(microProducts[index++]);}
  const p=microProducts[index],detailEnd=8+p.finishes.length*7,duration=chapterDuration(p);
  const finishIndex=Math.max(0,Math.min(p.finishes.length-1,Math.floor((t-8)/7)));
  const finishBlend=finishIndex===0?1:smooth((t-(8+finishIndex*7))/1.6);
  const zoom=smooth((t-4)/4)*(1-smooth((t-detailEnd)/5));
  const rebuild=smooth((t-(duration-6))/6),incoming=rebuild>=.5;
  return {index:incoming?(index+1)%microProducts.length:index,from:index,local:t,zoom,
    finishIndex:incoming?0:finishIndex,finishBlend:incoming?1:finishBlend,
    collapse:Math.sin(rebuild*Math.PI)**2,phase:t<4?'full':t<8?'approach':t<detailEnd?'detail':t<duration-6?'pullback':'rebuild',
    rotation:.17*Math.sin(seconds*.12),progress:t/duration};
}
