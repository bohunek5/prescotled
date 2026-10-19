import * as T from '../konfigurator/vendor/three/build/three.module.min.js';

// Newly added DELUX / PREMIUM chapters plus their Bread and One Cut variants.
// The three approved chapters and the other catalogue constructions keep their artwork.
const supported=new Set(['deluxlow','smd12','smd12dense','smd2470','smd24','smd24140','smd24210','premiumslim4','premiumslim120','rgbw','rgbw24','bread70','bread','onecut','onecutlow']);
export const supportsCatalogFilmArtwork=product=>supported.has(product.id);

export function createCatalogFilmArtwork(product,spec,{brand,ce,contacts,padSpacing,padLength,footprints,anisotropy=4}){
  const w=spec.width,h=spec.section,narrow=w<5,oneCut=product.id==='onecut'||product.id==='onecutlow';
  const canvas=document.createElement('canvas');canvas.width=narrow?512:768;canvas.height=Math.min(4096,Math.max(2048,Math.ceil(canvas.width*h/w)));
  const ctx=canvas.getContext('2d');ctx.scale(canvas.width/w,canvas.height/h);
  ctx.fillStyle='#f2f2e9';ctx.fillRect(0,0,w,h);
  const layout={kind:'catalog-film-section-clearance',coordinateSpace:'physical-section-mm',marks:[],legends:[],facts:[],data:{density:product.density,width:product.width,copperOz:product.copperOz}};
  const bounds=(x,d,length,height,rotate)=>({x:x-(rotate?height:length)/2,y:d-(rotate?length:height)/2,width:rotate?height:length,height:rotate?length:height});
  const artwork=(name,image,x,d,length,height,rotate=true)=>{
    if(name==='ce'){length*=1.18;height*=1.18;}
    ctx.save();ctx.translate(x,h-d);if(rotate)ctx.rotate(Math.PI/2);ctx.drawImage(image,-length/2,-height/2,length,height);ctx.restore();
    layout.marks.push({name,...bounds(x,d,length,height,rotate)});
  };
  const text=(name,value,x,d,size,{rotate=false,fact=false}={})=>{
    ctx.save();ctx.translate(x,h-d);if(rotate)ctx.rotate(Math.PI/2);
    ctx.fillStyle='#24332f';ctx.font=`600 ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,0,0);
    const advance=ctx.measureText(value).width;ctx.restore();
    const item={name,value,...bounds(x,d,advance,size,rotate)};
    (fact?layout.facts:name==='rohs'?layout.marks:layout.legends).push(item);
  };
  ctx.strokeStyle='#d1d5c9';ctx.lineWidth=.025;
  for(const x of [.12,w-.12]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  ctx.strokeStyle='#8f998c';ctx.lineWidth=.04;ctx.setLineDash([.22,.18]);
  for(const y of [.035,h-.035]){ctx.beginPath();ctx.moveTo(.12,y);ctx.lineTo(w-.12,y);ctx.stroke();}ctx.setLineDash([]);
  for(let i=0;i<contacts.length;i++){
    const x=w/2+(i-(contacts.length-1)/2)*padSpacing;
    for(const d of oneCut?[2.45,h-2.45]:narrow?[2.8,h-2.8]:[padLength*1.5+1,h-padLength*1.5-1])text(contacts[i],contacts[i],x,d,oneCut?.45:narrow?.4:Math.min(.65,padSpacing*.52));
  }
  const copper=product.copperOz==null||product.copperOz===''?'':` · ${product.copperOz} oz`;
  if(oneCut){
    // One LED per 10 mm cut: data use the two inner rails; the original
    // coloured logo and compliance marks remain outside those rails.
    artwork('brand',brand,.62,h/2,4.2,4.2/8.45);
    artwork('ce',ce,w-.55,3.35,.825,.55);
    text('rohs','RoHS',w-.55,6.6,.48,{rotate:true});
    text('density',`${product.density} LED/m`,2.5,h/2,.4,{rotate:true,fact:true});
    text('pcb-data',`PCB ${product.width} mm${copper}`,w-2.5,h/2,.4,{rotate:true,fact:true});
  }else if(narrow){
    // The 4 mm versions have no usable side rail. Their three packages leave
    // a terminal-to-first-LED gap and an empty gap between the final two LEDs.
    const leds=footprints.filter(p=>p.name==='LED ceramic base').sort((a,b)=>a.d-b.d);
    const gap=(leds.at(-2).d+leds.at(-1).d)/2;
    artwork('brand',brand,w/2,3.8,3.2,3.2/8.45,false);
    artwork('ce',ce,.9,gap,.72,.48,false);
    text('rohs','RoHS',2.65,gap,.42);
    text('density',`${product.density} LED/m`,w/2,gap-.7,.42,{fact:true});
    text('pcb-data',`PCB ${product.width} mm${copper}`,w/2,gap+.7,.36,{fact:true});
  }else{
    // Keep the original marks in one rail and the verified catalogue facts in
    // the other. This also fits the shortest 25 mm section without touching pads.
    const left=w===8?.85:1,right=w-left,brandLength=Math.min(10,h*.25);
    artwork('brand',brand,left,h*.3,brandLength,brandLength/8.45);
    artwork('ce',ce,left,h*.6,1.32,.88);
    text('rohs','RoHS',left,h*.75,.65,{rotate:true});
    text('pcb-data',`${product.density} LED/m · PCB ${product.width} mm${copper}`,right,h/2,.64,{rotate:true,fact:true});
  }
  const boxes=[...layout.marks,...layout.legends,...layout.facts].map(p=>({...p,minX:p.x-w/2,maxX:p.x+p.width-w/2,start:p.y,end:p.y+p.height}));
  const distance=(a,b)=>{
    const dx=Math.max(b.minX-a.maxX,a.minX-b.maxX),dy=Math.max(b.start-a.end,a.start-b.end);
    return dx<=0&&dy<=0?Math.max(dx,dy):Math.hypot(Math.max(0,dx),Math.max(0,dy));
  };
  // Bounds come from actual package / pad meshes, not an assumed LED pitch.
  layout.clearances=boxes.map((p,i)=>({name:p.name,board:Math.min(p.minX+w/2,w/2-p.maxX,p.start,h-p.end),components:Math.min(...footprints.map(b=>distance(p,b))),otherPrint:Math.min(...boxes.filter((_,j)=>i!==j).map(b=>distance(p,b)))}));
  const printed=document.createElement('canvas');printed.width=canvas.width;printed.height=canvas.height;
  const pc=printed.getContext('2d');pc.translate(canvas.width,canvas.height);pc.rotate(Math.PI);pc.drawImage(canvas,0,0);
  const texture=new T.CanvasTexture(printed);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=anisotropy;texture.wrapT=T.RepeatWrapping;texture.repeat.y=spec.sections;
  return {texture,layout};
}
