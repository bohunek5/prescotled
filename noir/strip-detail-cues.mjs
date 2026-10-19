// Pure film-clock annotations. Anchors are resolved against the actual model
// by the viewer; this module never creates meshes, timers, or DOM elements.
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
const numeric=value=>Number(String(value??'').replace(',','.'));
const printed=value=>String(value??'').replace('.',',');

// One feature description drives both the miniature and its physical cue.
// Catalogue facts stay in the catalogue; these are presentation choices only.
export function describeStripFeature(product){
  const id=product.id??'',control=product.control??'MONO';
  const kind=id==='deluxlow'||id==='coblow'?'accent':id.startsWith('wcob')?'coating':id==='cobip67'?'sleeve':product.featureKind??'cri';
  const cri=numeric(product.quality),width=printed(product.width),cut=printed(product.cut);
  const definitions={
    brightness:{title:'LOW',caption:'3 poziomy jasności',label:'LOW',subline:'3 poziomy jasności',anchor:'contact',highlightFacts:['power','output','efficacy']},
    accent:{title:'Światło akcentowe',caption:'Delikatna jasność',label:'Delikatne światło akcentowe',subline:'Low Brightness',anchor:'emitter',highlightFacts:['power','output']},
    slim:{title:`Tylko ${width} mm`,caption:'Wąska taśma',label:`Tylko ${width} mm`,subline:id==='slim'?'Wąska taśma SLIM':'Wąska taśma LED',anchor:'width',measurement:'width',highlightFacts:['width']},
    cut:{title:`Co ${cut} mm`,caption:'Precyzyjne cięcie',label:`Cięcie co ${cut} mm`,subline:id.startsWith('onecut')?'One Cut · 1 dioda / sekcja':'Free Cut · precyzyjny podział',anchor:'cut',highlightFacts:[]},
    bread:{title:'Do pieczywa',caption:'Złocisty odcień',label:'Światło do pieczywa',subline:'Złocisty odcień',anchor:'emitter',highlightFacts:[]},
    flex:{title:'Giętka PCB',caption:'Forma S-Shape',label:'Giętka płytka PCB',subline:'S-Shape',anchor:'edge',highlightFacts:[]},
    digital:{title:'Digital',caption:`${control} · moduły`,label:'Sterowanie modułami',subline:control==='CCT'?'Digital · regulacja bieli':control==='MONO'?'Digital · biel':`Digital · ${control}`,anchor:'emitter',highlightFacts:[]},
    cct:{title:'CCT',caption:'Regulacja bieli',label:'Ciepła i chłodna biel',subline:'CCT · płynna regulacja',anchor:'emitter',highlightFacts:[]},
    channels:{title:control,caption:control==='RGBW'?'Kolor i osobna biel':'Sterowanie barwą',label:control==='RGBW'?'RGB i osobny kanał bieli':control==='RGB+CCT'?'RGB i regulowana biel':'Płynna zmiana kolorów RGB',subline:`${control} · wspólna zmiana barwy`,anchor:'emitter',highlightFacts:['quality']},
    coating:{title:'Mleczna powłoka',caption:'Jednolita linia światła',label:'Mleczna powłoka silikonowa',subline:`WCOB · ${product.ip}`,anchor:'coating',highlightFacts:[]},
    sleeve:{title:product.ip,caption:'Ochronna koszulka',label:`Osłona ${product.ip}`,subline:'Ochronna koszulka',anchor:'sleeve',highlightFacts:[]},
    cri:{title:`CRI ${printed(product.quality)}`,caption:cri>=90?'Wysokie oddawanie barw':'Oddawanie barw',label:`CRI ${printed(product.quality)}`,subline:cri>=90?'Wysokie oddawanie barw':'Oddawanie barw',anchor:'emitter',highlightFacts:['quality']}
  };
  return {kind,...(definitions[kind]??definitions.cri)};
}

export function sampleDetailCue(product,shot,powerMode=0){
  const local=Math.max(0,Number(shot?.local)||0);
  const three=product.id==='3w1',wcob=product.id.startsWith('wcob'),feature=describeStripFeature(product);
  const starts=three?[2.5,6,9,12,15.5]:wcob?[2.5,30,34]:[2.5,7,10];
  const index=Math.max(0,starts.findLastIndex(start=>local>=start));
  const start=starts[index],elapsed=local-start;
  const voltage=`+${printed(product.voltage)} V DC`;
  const rawLeds=numeric(product.density)*numeric(product.cut)/1000,leds=Math.round(rawLeds);
  const cutOnly=wcob||product.tech.includes('COB')||Math.abs(rawLeds-leds)>.15;
  const ledWord=leds===1?'dioda':leds%10>=2&&leds%10<=4&&(leds%100<12||leds%100>14)?'diody':'diod';
  let label=voltage,subline='Zasilanie',anchor='contact',contactIndex=0,measurement=null,highlightFacts=['voltage'];
  const section=()=>{label=cutOnly?`Cięcie co ${printed(product.cut)} mm`:`${leds} ${ledWord} / sekcja`;subline=cutOnly?`${printed(product.density)} LED/m`:`${printed(product.density)} LED/m · cięcie co ${printed(product.cut)} mm`;anchor='section';measurement='section';highlightFacts=['density'];};
  const width=()=>{label=`PCB ${printed(product.width)} mm`;subline='Szerokość taśmy';anchor='width';measurement='width';highlightFacts=['width'];};

  if(three&&index<3){
    const mode=clamp(Math.floor(Number(powerMode)||0),0,2);
    const contacts=['−L','−M','−H'],names=['LOW','MEDIUM','HIGH'];
    const catalogPowers=product.catalogVariants?.[0]?.[2]?.split(' / ');
    const powers=catalogPowers?.length===3?catalogPowers:['3','6','11'];
    label=`${names[mode]} · ${powers[mode]} W/m`;
    subline=`${voltage} / ${contacts[mode]}`;
    contactIndex=mode+1;
    highlightFacts=['voltage','power','output','efficacy'];
  }else if(index===starts.length-2){section();}
  else if(index===starts.length-1){width();}
  else{
    ({label,subline,anchor,highlightFacts}=feature);
    measurement=feature.measurement??null;
  }

  // Show the product benefit first, then section/density, then PCB width.
  // Each caption clears before the next one; the last fades at pullback.
  const featureCue=three?index<3:index===0;
  const typing=smooth(elapsed/.4);
  // The distinctive icon introduces the benefit. Its line reaches the
  // caption before the underline continues towards the physical detail.
  const featureSource=featureCue?smooth((elapsed-.42)/.46):0;
  const featureSourceOpacity=featureCue?1-smooth((elapsed-.9)/.3):0;
  const underline=smooth((elapsed-(featureCue?.9:.42))/.3);
  const pointer=smooth((elapsed-(featureCue?1.22:.76))/.4);
  const endpoint=smooth((elapsed-(featureCue?1.62:1.16))/.16);
  // A measurement is one continuous gesture: leader to centre, then two
  // simultaneous outward branches. Width arrowheads appear at both edges last.
  const branchDuration=.56,branchStart=featureCue?1.64:1.18;
  const branches=measurement?smooth((elapsed-branchStart)/branchDuration):0;
  const tips=measurement?smooth((elapsed-branchStart-branchDuration)/.08):0;
  const witnesses=measurement==='width'?smooth((elapsed-branchStart-branchDuration)/.26):0;
  const fadeIn=smooth(elapsed/.2);
  const next=wcob&&index===0?6:starts[index+1],detailEnd=wcob?38:three?19:13;
  const fadeOut=next?1-smooth((local-(next-.3))/.3):1-smooth((local-detailEnd)/.5);
  const end=next??detailEnd+.5;
  // A brief rise, hold and return marks each benefit without leaving the
  // icon enlarged throughout the explanation. Sun brightness stays separate.
  const featureEmphasis=featureCue?smooth(elapsed/.3)*(1-smooth((elapsed-.85)/.65))*fadeOut:0;
  const opacity=fadeIn*fadeOut,highlightLevel=opacity*typing;
  return {index,label,subline,anchor,measurement,contactIndex,start,end,referenceTime:start+1.25,typing,featureCue,featureSource,featureSourceOpacity,featureEmphasis,underline,pointer,endpoint,branches,tips,witnesses,draw:pointer,opacity,highlightFacts,highlightLevel};
}
