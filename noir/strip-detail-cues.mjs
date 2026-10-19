// Pure film-clock annotations. Anchors are resolved against the actual model
// by the viewer; this module never creates meshes, timers, or DOM elements.
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
const numeric=value=>Number(String(value??'').replace(',','.'));
const printed=value=>String(value??'').replace('.',',');

export function sampleDetailCue(product,shot,powerMode=0){
  const local=Math.max(0,Number(shot?.local)||0);
  const introduction=product.id==='3w1'&&local<4;
  const index=introduction?-1:local<7?0:local<10?1:2;
  const start=introduction?2.1:product.id==='3w1'&&index===0?4:[2.5,7,10][index],elapsed=local-start;
  const voltage=`+${printed(product.voltage)} V DC`;
  const leds=Math.round(numeric(product.density)*numeric(product.cut)/1000);
  let label=voltage,subline='Zasilanie',anchor='contact',contactIndex=0,measurement=null;
  const section=()=>{label=`${leds} diod / sekcja`;subline=`${printed(product.density)} LED/m · cięcie co ${printed(product.cut)} mm`;anchor='section';measurement='section';};

  if(introduction){section();}
  else if(product.id==='3w1'){
    const mode=clamp(Math.floor(Number(powerMode)||0),0,2);
    const contacts=['−L','−M','−H'],names=['LOW','MEDIUM','HIGH'];
    const catalogPowers=product.catalogVariants?.[0]?.[2]?.split(' / ');
    const powers=catalogPowers?.length===3?catalogPowers:['3','6','11'];
    label=`${names[mode]} · ${powers[mode]} W/m`;
    subline=`${voltage} / ${contacts[mode]}`;
    contactIndex=mode+1;
  }else if(product.id==='slim'){
    if(index===1){label=`PCB ${printed(product.width)} mm`;subline='Szerokość taśmy';anchor='width';measurement='width';}
    if(index===2)section();
  }else if(product.id==='truecolor10'){
    if(index===1){label=`CRI ${printed(product.quality)}`;subline='Wysokie oddawanie barw';anchor='emitter';}
    if(index===2)section();
  }

  // Finish the text first, then draw the underline and its arrow. The first
  // two captions clear before the next one; the last fades from 13 to 13.5 s.
  const typing=smooth(elapsed/.4);
  const underline=smooth((elapsed-.42)/.3);
  const pointer=smooth((elapsed-.76)/.4);
  const endpoint=smooth((elapsed-1.16)/.16);
  // A measurement is one continuous gesture: leader to centre, then two
  // simultaneous outward branches. Width arrowheads appear at both edges last.
  const branches=measurement?smooth((elapsed-1.18)/.26):0;
  const tips=measurement?smooth((elapsed-1.44)/.12):0;
  const fadeIn=smooth(elapsed/.2);
  const fadeOut=introduction?1-smooth((local-3.75)/.25):index<2?1-smooth((local-([7,10][index]-.3))/.3):1-smooth((local-13)/.5);
  const end=introduction?4:index<2?[7,10][index]:13.5;
  return {index,label,subline,anchor,measurement,contactIndex,start,end,referenceTime:start+1.25,typing,underline,pointer,endpoint,branches,tips,draw:pointer,opacity:fadeIn*fadeOut};
}
