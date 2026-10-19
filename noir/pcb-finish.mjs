import * as T from '../konfigurator/vendor/three/build/three.module.min.js';

// Fine solder-mask texture in millimetres. This is a surface finish, not a
// fabricated electrical routing diagram. No large cloth weave on flexible PCB.
export function applyPcbFinish(model,anisotropy){
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),pixels=ctx.createImageData(256,256);
  let seed=2835160;
  for(let i=0;i<pixels.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=126+((seed>>>24)/255-.5)*24;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=n;pixels.data[i+3]=255;}
  ctx.putImageData(pixels,0,0);
  const grain=new T.CanvasTexture(c);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.anisotropy=anisotropy;grain.repeat.set(model.specification.width/1.6,model.specification.length/1.6);
  const front=model.group.getObjectByName('White solder mask / front').material;
  front.bumpMap=grain;front.bumpScale=.008;front.roughness=.54;front.clearcoat=.16;front.clearcoatRoughness=.45;front.needsUpdate=true;
  const copper=model.group.children.find(m=>m.name==='Copper solder pads / catalogue contacts')?.material;
  const brushed=grain.clone();brushed.repeat.set(2,12);brushed.needsUpdate=true;
  if(copper){copper.bumpMap=brushed;copper.bumpScale=.002;copper.roughness=.34;copper.needsUpdate=true;}
  model.group.userData.pcbFinish={mask:'fine satin solder mask',bumpMm:.008,copper:'brushed copper',brand:'navy/orange'};
  return ()=>{grain.dispose();brushed.dispose();};
}
