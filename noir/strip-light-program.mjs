import * as T from '../konfigurator/vendor/three/build/three.module.min.js';

// Presentation colours illustrate channel behaviour. They are not measured
// spectra or catalogue claims about a product's adjustable Kelvin endpoints.
const clamp=T.MathUtils.clamp,turn=Math.PI*2;
const smooth=x=>{const v=clamp(x,0,1);return v*v*(3-2*v);};
const mix=(a,b,t)=>a.clone().lerp(b,t);
const warm=new T.Color(0xffbf80),neutral=new T.Color(0xfff2de),cool=new T.Color(0xc4dfff);
const rgbPrimaries=[new T.Color(0xff0000),new T.Color(0x00ff00),new T.Color(0x0000ff)];
const palette=[0xff245d,0xb437ff,0x397aff,0x16d7e8,0x24ed96,0xffbd41].map(c=>new T.Color(c));
const names={czerwona:0xff2915,niebieska:0x276aff,zielona:0x29ff62,'różowa':0xff64bc,'żółta':0xffd52c};
const temperatures=[[2200,0xffb66c],[2700,0xffc386],[3000,0xffd09b],[4000,0xffe6c8],[6500,0xd7e8ff],[10000,0xb7d4ff]];

export function temperatureColor(value){
  if(names[value])return new T.Color(names[value]);
  const kelvin=Number(value)||3000,hi=temperatures.findIndex(([k])=>k>=kelvin);
  if(hi<=0)return new T.Color(temperatures[hi===0?0:temperatures.length-1][1]);
  const [a,ca]=temperatures[hi-1],[b,cb]=temperatures[hi];
  return new T.Color(ca).lerp(new T.Color(cb),(kelvin-a)/(b-a));
}

function rainbow(position){
  const value=((position%1)+1)%1*palette.length,index=Math.floor(value);
  return mix(palette[index],palette[(index+1)%palette.length],smooth(value-index));
}
function whiteLabel(warmMix){return warmMix>.7?'Ciepła biel':warmMix<.3?'Chłodna biel':'Neutralna biel';}
function whiteBalance(warmMix){return warmMix>=.5?mix(neutral,warm,smooth((warmMix-.5)*2)):mix(neutral,cool,smooth((.5-warmMix)*2));}

export function sampleStripLight(product,time,{variant=product.color,previousVariant=variant,variantBlend=1,variantProgress=null,module=0,moduleCount=1}={}){
  const seconds=Math.max(0,Number(time)||0),digital=!!product.digital,control=product.control;
  const white=mix(temperatureColor(previousVariant),temperatureColor(variant),smooth(variantBlend));
  const position=module/Math.max(1,moduleCount),wave=.5+.5*Math.cos(turn*(position-seconds*.16));
  const intensity=digital?.15+.85*smooth(wave):1;
  let color=white,warmMix=null,channels=null,program='mono',phase='Światło jednobarwne';
  if(control==='CCT'){
    warmMix=.5+.5*Math.cos((seconds-7)*.55-(digital?position*turn:0));
    color=whiteBalance(warmMix);program=digital?'digital-cct':'analog-cct';
    phase=digital?'Płynące moduły · barwa bieli':whiteLabel(warmMix);
    channels={WW:{color:warm,intensity:warmMix},CW:{color:cool,intensity:1-warmMix}};
  }else if(control.startsWith('RGB')){
    color=rainbow((seconds-7)*.075-(digital?position*.85:0));
    const rgb=color.clone();let whiteAmount=0,whiteChannel=white;
    program=digital?'digital-rgbw':control==='RGB+CCT'?'analog-rgb-cct':control==='RGBW'?'analog-rgbw':'analog-rgb';
    phase=digital?'Płynące moduły · RGB + biel':'Płynne przejście RGB';
    if(control!=='RGB'){
      const whiteWave=.5+.5*Math.cos(turn*((seconds-7)/11-(digital?position:0)+(digital?.24:0)));
      const variantWhiteCue=!digital&&control==='RGBW'&&Number.isFinite(variantProgress);
      const variantCctCue=!digital&&control==='RGB+CCT'&&Number.isFinite(variantProgress);
      const progress=variantWhiteCue||variantCctCue?clamp(variantProgress,0,1):0;
      // A three-second catalogue variant leaves 1.5 seconds of unmixed white.
      // Matching white at both ends also avoids a colour jump between SKUs.
      const variantWhite=1-smooth(progress/.12)+smooth((progress-.22)/.28);
      whiteAmount=variantWhiteCue?variantWhite:variantCctCue?smooth((progress-.35)/.1):control==='RGB+CCT'?smooth((seconds-12)/1.4):digital?smooth((whiteWave-.91)/.08):smooth((whiteWave-.55)/.35);
      if(control==='RGB+CCT'){
        warmMix=1-smooth(variantCctCue?(progress-.48)/.4:(seconds-13)/4);whiteChannel=whiteBalance(warmMix);
      }
      color.lerp(whiteChannel,whiteAmount);
      if(!digital&&(variantWhiteCue||variantCctCue?whiteAmount===1:whiteAmount>.6))phase=control==='RGB+CCT'?whiteLabel(warmMix):'Osobny kanał bieli';
    }
    channels=Object.fromEntries(['R','G','B'].map((name,i)=>[name,{color:rgbPrimaries[i],intensity:rgb[['r','g','b'][i]]*(1-whiteAmount)}]));
    channels.W={color:whiteChannel,intensity:whiteAmount};
  }else if(digital){program='digital-mono';phase='Płynące moduły · biel';}
  return {program,phase,color,intensity,warmMix,channels,digital,module};
}
