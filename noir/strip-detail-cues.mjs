// Pure film-clock annotations. Anchors are resolved against the actual model
// by the viewer; this module never creates meshes, timers, or DOM elements.
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
const numeric=value=>Number(String(value??'').replace(',','.'));
const printed=value=>String(value??'').replace('.',',');

export function sampleDetailCue(product,shot,powerMode=0){
  const local=Math.max(0,Number(shot?.local)||0);
  const three=product.id==='3w1',starts=three?[2.5,6,9,12,15.5]:[2.5,7,10];
  const index=Math.max(0,starts.findLastIndex(start=>local>=start));
  const start=starts[index],elapsed=local-start;
  const voltage=`+${printed(product.voltage)} V DC`;
  const leds=Math.round(numeric(product.density)*numeric(product.cut)/1000);
  let label=voltage,subline='Zasilanie',anchor='contact',contactIndex=0,measurement=null;
  const section=()=>{label=`${leds} diod / sekcja`;subline=`${printed(product.density)} LED/m · cięcie co ${printed(product.cut)} mm`;anchor='section';measurement='section';};
  const width=()=>{label=`PCB ${printed(product.width)} mm`;subline='Szerokość taśmy';anchor='width';measurement='width';};

  if(three&&index<3){
    const mode=clamp(Math.floor(Number(powerMode)||0),0,2);
    const contacts=['−L','−M','−H'],names=['LOW','MEDIUM','HIGH'];
    const catalogPowers=product.catalogVariants?.[0]?.[2]?.split(' / ');
    const powers=catalogPowers?.length===3?catalogPowers:['3','6','11'];
    label=`${names[mode]} · ${powers[mode]} W/m`;
    subline=`${voltage} / ${contacts[mode]}`;
    contactIndex=mode+1;
  }else if(index===starts.length-2){section();}
  else if(index===starts.length-1){width();}
  else if(product.id==='slim'){
    label=`Tylko ${printed(product.width)} mm`;subline='Wąska taśma SLIM';anchor='edge';
  }else if(product.id==='truecolor10'){
    label=`CRI ${printed(product.quality)}`;subline='Wysokie oddawanie barw';anchor='emitter';
  }

  // Show the product benefit first, then section/density, then PCB width.
  // Each caption clears before the next one; the last fades at pullback.
  const typing=smooth(elapsed/.4);
  const underline=smooth((elapsed-.42)/.3);
  const pointer=smooth((elapsed-.76)/.4);
  const endpoint=smooth((elapsed-1.16)/.16);
  // A measurement is one continuous gesture: leader to centre, then two
  // simultaneous outward branches. Width arrowheads appear at both edges last.
  const branchDuration=.56;
  const branches=measurement?smooth((elapsed-1.18)/branchDuration):0;
  const tips=measurement?smooth((elapsed-1.18-branchDuration)/.08):0;
  const fadeIn=smooth(elapsed/.2);
  const next=starts[index+1],detailEnd=three?19:13;
  const fadeOut=next?1-smooth((local-(next-.3))/.3):1-smooth((local-detailEnd)/.5);
  const end=next??detailEnd+.5;
  return {index,label,subline,anchor,measurement,contactIndex,start,end,referenceTime:start+1.25,typing,underline,pointer,endpoint,branches,tips,draw:pointer,opacity:fadeIn*fadeOut};
}
