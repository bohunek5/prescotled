import {powerModes} from '../noir/offer-series-models.mjs';
import {stripAppearance} from '../noir/strip-appearance.mjs';

// The overview uses the same variant rows as the full film. Missing catalogue
// data remains an em dash; no efficacy, warranty or energy class is inferred.
const shown=value=>value===undefined||value===null||value===''?'—':String(value);
const number=value=>Number(String(value).replace(',','.'));
const bounded=(value,length)=>Math.max(0,Math.min(Math.max(0,length-1),Math.floor(Number(value)||0)));
export function colorSwatch(value){
  return {czerwona:'#ed6957',niebieska:'#729ce8','różowa':'#e790ba',zielona:'#8fc497','żółta':'#f3d563'}[value]
    ??(!Number.isFinite(number(value))?'#fff0d4':number(value)<=2700?'#ffd393':number(value)<3500?'#ffe0a4':number(value)<=4500?'#fff3d6':number(value)>6500?'#c0dbff':'#e0edff');
}

export function getProductDetails(product,colorIndex=0,levelIndex=0){
  const p=product,variants=p.colorVariants??[],ci=bounded(colorIndex,variants.length);
  const variant=variants[ci]??null,brightness=p.id==='3w1',li=brightness?bounded(levelIndex,powerModes.length):0;
  const mode=brightness?powerModes[li]:null,kelvin=variant?.kelvin??p.color;
  const power=shown(mode?.power??variant?.power??p.power);
  const output=shown(variant?.outputs?.[li]??(brightness?mode?.output:p.output));
  const efficacy=shown(variant?.efficacies?.[li]??p.efficacy);
  const energy=variant?.energyClass??p.energyClass;
  const ipOptions=p.ipOptions?.length?[...p.ipOptions]:[p.ip].filter(Boolean);
  const appearance=stripAppearance(p),wcob=appearance.opaqueFront;
  const cob=appearance.kind!=='smd';
  const ledCount=Math.max(1,Math.round(number(p.density)*number(p.cut)/1000));
  const kind=p.featureKind??'cri';
  const distinction={
    brightness:[mode?.nav??'LOW','3 poziomy jasności'],
    bread:['Do pieczywa','Złocisty odcień'],
    slim:[`Tylko ${p.width} mm`,'Wąska taśma'],
    cut:[`Co ${p.cut} mm`,'Precyzyjne cięcie'],
    flex:['Giętka PCB','Forma S-Shape'],
    digital:['Digital',`${p.control} · moduły`],
    cct:['CCT','Regulacja bieli'],
    channels:[p.control,'Sterowanie barwą'],
    cri:[`CRI ${p.quality}`,number(p.quality)>=90?'Wysokie oddawanie barw':'Oddawanie barw']
  }[kind]??[`CRI ${p.quality}`,'Oddawanie barw'];
  const fact=(key,label,value,unit='')=>({key,label,value:shown(value),unit});
  const energyFact=fact('energy','Klasa energetyczna',energy);
  if(/^[A-G]$/.test(energy??'')){
    energyFact.image=new URL(`../noir/media/energy/class-${energy.toLowerCase()}.png`,import.meta.url).href;
    energyFact.imageAlt=`Klasa energetyczna ${energy}, skala A–G`;
  }
  return {
    id:p.id,name:p.id.startsWith('onecut')?'One Cut':p.pcbColor?p.name:p.name.split(/\s*·\s*/)[0],range:p.range,sku:variant?.sku??p.sku,
    colorIndex:ci,levelIndex:li,variant,
    color:{
      value:p.control==='RGBW'?'RGBW':shown(kelvin),
      unit:/^\d+$/.test(String(kelvin))&&p.control!=='RGBW'?'K':p.unit==='K'?'':(p.unit??''),
      label:variant?.label??p.colorCopy,swatch:colorSwatch(kelvin),multicolor:String(p.control).startsWith('RGB'),
      variants:variants.map((v,index)=>({index,value:v.kelvin,
        label:/^\d+$/.test(String(v.kelvin))?`${p.control==='RGBW'?'RGB + ':''}${v.kelvin} K`:v.label,
        swatch:colorSwatch(v.kelvin),active:index===ci,sku:v.sku}))
    },
    facts:[
      fact('voltage','Zasilanie',p.voltage,'V DC'),
      fact('power','Moc',power,'W/m'),
      fact('output',brightness?`Strumień / ${mode.nav}`:(p.outputLabel??'Strumień światła'),output,p.outputUnit??'lm/m'),
      fact('efficacy','Skuteczność',efficacy,'lm/W'),
      fact('density','Gęstość diod',p.density,'LED/m'),
      fact('quality',p.qualityLabel??'Oddawanie barw',p.quality,p.qualityUnit??'Ra'),
      fact('width','Szerokość PCB',p.width,'mm'),
      fact('copper','Miedź PCB',p.copperOz,p.copperOz?'oz':''),energyFact
    ],
    features:[
      {key:'tech',value:wcob?'WCOB':cob?p.tech:`SMD ${p.tech}`,label:'Dioda'},
      {key:'section',value:cob?`Cięcie ${p.cut} mm`:`${ledCount} LED / sekcja`,label:cob?'Moduł cięcia':'Podział taśmy'},
      {key:'ip',value:ipOptions.join(' · '),label:ipOptions.length>1?'Dostępne warianty':'Stopień ochrony'},
      {key:'beam',value:`${p.beam}°`,label:'Kąt światła'},
      {key:'detail',value:distinction[0],label:distinction[1]}
    ],
    powerLevels:brightness?powerModes.map((m,index)=>({index,name:m.nav,power:m.power,
      output:shown(variant?.outputs?.[index]??m.output),efficacy:shown(variant?.efficacies?.[index]),active:index===li})):[],
    warranty:{years:p.warrantyYears,label:`${p.warrantyYears} ${p.warrantyYears===3?'lata':'lat'} gwarancji`,madeInPoland:!!p.madeInPoland},
    ipOptions
  };
}
