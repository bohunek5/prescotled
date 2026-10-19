import * as T from '../konfigurator/vendor/three/build/three.module.min.js';

// Millimetres on the component side, measured from the section's first cut.
// The original vector marks are placed in verified gaps between components.
let marksPromise;
function marks(){
  return marksPromise??=Promise.all(['strip-brand-mark','strip-ce-mark'].map(name=>new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;
    image.src=new URL(`./media/${name}.svg`,import.meta.url).href;
  })));
}

export function sectionFrame(spec,frame,index=0){
  const selected=T.MathUtils.clamp(Math.floor(Number(index)||0),0,spec.sections-1);
  const start=selected*spec.section,end=start+spec.section,center=(start+end)/2;
  const startFrame=frame(start),endFrame=frame(end),middle=frame(center);
  const corners=[startFrame,endFrame].flatMap(f=>[-1,1].map(side=>f.p.clone().addScaledVector(f.x,side*spec.width/2)));
  return {index:selected,start,end,center,width:spec.width,length:spec.section,frame:middle,startFrame,endFrame,corners};
}

export async function createDeluxArtwork(product,spec,{anisotropy=4}={}){
  const [brand,ce]=await marks(),w=spec.width,h=spec.section,slim=product.id==='slim',three=product.id==='3w1';
  const canvas=document.createElement('canvas');canvas.width=slim?512:768;canvas.height=4096;
  const ctx=canvas.getContext('2d');ctx.scale(canvas.width/w,canvas.height/h);
  ctx.fillStyle='#f2f2e9';ctx.fillRect(0,0,w,h);
  const layout={kind:'delux-section-clearance',cutMargin:.25,marks:[],legends:[],facts:[],data:{density:product.density,width:product.width,copperOz:product.copperOz}};
  // The front UVs and the final 180° print orientation reverse the section's
  // longitudinal coordinate. Expose bounds in physical d, not canvas rows.
  const bounds=(x,y,length,height,rotate)=>({x:x-(rotate?height:length)/2,y:h-y-(rotate?length:height)/2,width:rotate?height:length,height:rotate?length:height});
  const artwork=(name,image,x,y,length,height,rotate=true)=>{
    if(name==='ce'){length*=1.18;height*=1.18;}
    ctx.save();ctx.translate(x,y);if(rotate)ctx.rotate(Math.PI/2);ctx.drawImage(image,-length/2,-height/2,length,height);ctx.restore();
    layout.marks.push({name,...bounds(x,y,length,height,rotate)});
  };
  const text=(name,value,x,y,size,{rotate=false,fact=false,weight=600}={})=>{
    ctx.save();ctx.translate(x,y);if(rotate)ctx.rotate(Math.PI/2);ctx.fillStyle='#24332f';ctx.font=`${weight} ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,0,0);
    const advance=ctx.measureText(value).width;ctx.restore();
    const item={name,value,...bounds(x,y,advance,size,rotate)};
    (fact?layout.facts:name==='rohs'?layout.marks:layout.legends).push(item);
  };
  ctx.strokeStyle='#d1d5c9';ctx.lineWidth=.025;
  for(const x of [.12,w-.12]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  ctx.strokeStyle='#8f998c';ctx.lineWidth=.04;ctx.setLineDash([.22,.18]);
  for(const y of [.035,h-.035]){ctx.beginPath();ctx.moveTo(.12,y);ctx.lineTo(w-.12,y);ctx.stroke();}ctx.setLineDash([]);
  if(three){
    const contacts=['+24V','−L','−M','−H'];
    contacts.forEach((value,i)=>{
      const x=10-([393,455,517,579][i]-360)/26;
      for(const y of [3.7,h-3.7])text(value,value,x,y,.64,{weight:600});
    });
    artwork('brand',brand,1.03,22.5,10.15,10.15/8.45);
    artwork('ce',ce,8.95,16.25,1.32,.88);
    text('rohs','RoHS',8.95,20.4,.67,{rotate:true,weight:600});
    text('pcb-data',`${product.density} LED/m · PCB ${product.width} mm · ${product.copperOz} oz`,1.04,36.4,.67,{rotate:true,fact:true});
    text('power-contacts','L: low · M: medium · H: high',8.95,32,.69,{rotate:true,fact:true});
  }else if(slim){
    const margin=6,pitch=(h-2*margin)/7;
    const emptyGap=index=>margin+(index+.5)*pitch;
    for(const [value,x] of [[`+${product.voltage}V`,1],['−',3]])for(const y of [2.8,h-2.8])text(value,value,x,y,.4,{weight:600});
    // SLIM's 4 mm PCB has no broad side rail: the brand and certification
    // occupy unused LED gaps, not the narrow edges or the cut contacts.
    artwork('brand',brand,w/2,emptyGap(1),3.28,3.28/8.45,false);
    artwork('ce',ce,.95,emptyGap(3),.72,.48,false);
    text('rohs','RoHS',2.65,emptyGap(3),.42,{weight:600});
    // Keep the narrow rails empty: two readable lines fit in the final free
    // gap, with a margin to both adjacent LED packages and their solder.
    text('density',`${product.density} LED/m`,w/2,emptyGap(5)-.29,.43,{fact:true});
    text('pcb-data',`PCB ${product.width} mm · ${product.copperOz} oz`,w/2,emptyGap(5)+.29,.38,{fact:true});
  }else{
    const padSpacing=w-1.95;
    for(const [value,x] of [[`+${product.voltage}V`,w/2-padSpacing/2],['−',w/2+padSpacing/2]])for(const y of [3.8,h-3.8])text(value,value,x,y,.61,{weight:600});
    artwork('brand',brand,.95,18,8.2,8.2/8.45);
    artwork('ce',ce,w-.9,18,1.32,.88);
    text('rohs','RoHS',w-.9,23.5,.7,{rotate:true,weight:600});
    text('pcb-data',`${product.density} LED/m · PCB ${product.width} mm · ${product.copperOz} oz`,.95,35,.64,{rotate:true,fact:true});
    text('quality',`CRI ${product.quality}`,w-.9,31,.72,{rotate:true,fact:true});
  }
  // The same 180° rotation as the mesh's original front artwork preserves
  // outward-facing letters; no negative scale or mirrored logo is used.
  const printed=document.createElement('canvas');printed.width=canvas.width;printed.height=canvas.height;
  const pc=printed.getContext('2d');pc.translate(canvas.width,canvas.height);pc.rotate(Math.PI);pc.drawImage(canvas,0,0);
  const texture=new T.CanvasTexture(printed);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=anisotropy;texture.wrapT=T.RepeatWrapping;texture.repeat.y=spec.sections;
  return {texture,layout};
}
