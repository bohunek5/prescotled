import * as T from '../konfigurator/vendor/three/build/three.module.min.js';

// Official 3M artwork, downloaded unchanged from the 3M media gallery.
// The mask preserves its proportions; only the requested liner ink varies.
let artwork;
function loadArtwork(){return artwork??=new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;
  image.src=new URL('./media/3m-original.jpg',import.meta.url).href;
});}
export async function createBackingTexture(spec,{anisotropy=4,ink='red',registrationMarks=false}={}){
  const image=await loadArtwork(),mark=document.createElement('canvas');
  mark.width=512;mark.height=Math.round(512*image.naturalHeight/image.naturalWidth);
  const mc=mark.getContext('2d',{willReadFrequently:true});mc.drawImage(image,0,0,mark.width,mark.height);
  const pixels=mc.getImageData(0,0,mark.width,mark.height),rgb=ink==='green'?[24,117,72]:[210,35,44];
  for(let i=0;i<pixels.data.length;i+=4){
    const alpha=Math.max(0,pixels.data[i]-pixels.data[i+1]);
    pixels.data[i]=rgb[0];pixels.data[i+1]=rgb[1];pixels.data[i+2]=rgb[2];pixels.data[i+3]=alpha;
  }
  mc.putImageData(pixels,0,0);
  const repeats=Math.max(1,Math.round(spec.length/(registrationMarks?spec.section:28))),period=spec.length/repeats;
  const c=document.createElement('canvas');c.width=256;c.height=Math.min(2048,Math.round(256*period/spec.width));
  const ctx=c.getContext('2d');ctx.scale(c.width/spec.width,c.height/period);
  ctx.fillStyle='#eeeee5';ctx.fillRect(0,0,spec.width,period);
  if(registrationMarks){
    ctx.fillStyle='#454844';ctx.fillRect(0,0,spec.width,.16);
    ctx.save();ctx.translate(spec.width*.24,period*.13);ctx.rotate(Math.PI/2);
    ctx.font='500 .6px Arial';ctx.textAlign='center';ctx.fillText('+24V',0,0);ctx.restore();
  }
  const w=Math.min(9,spec.width*1.05),h=w*image.naturalHeight/image.naturalWidth;
  ctx.translate(spec.width/2,period/2);ctx.rotate(Math.PI/2);
  ctx.drawImage(mark,-w/2,-h/2,w,h);
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapT=T.RepeatWrapping;
  map.repeat.y=repeats;map.anisotropy=anisotropy;
  return map;
}
