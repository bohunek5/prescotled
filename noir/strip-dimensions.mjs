import * as T from '../konfigurator/vendor/three/build/three.module.min.js';

const pointText=point=>`${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
const polyline=points=>points.map((point,index)=>`${index?'L':'M'} ${pointText(point)}`).join(' ');
const approvedWidthModels=new Set(['3w1','slim','truecolor10']);
const widthOffsets=new WeakMap();

function clearWidthOffset(model){
  const spec=model.specification;
  if(widthOffsets.has(spec))return widthOffsets.get(spec);
  // Use the actual package, solder, resistor and pad bounds, not LED pitch.
  // The whole transverse line must fit in exposed mask. Keep its existing
  // 2.4 mm longitudinal witness lines inside this same cut section as well.
  const witnessHalfLength=model.group.userData.productId==='sshape'?1.6:2.4;
  const margin=.25,minimum=witnessHalfLength+margin,maximum=spec.section-minimum;
  const inspected=model.inspect(),footprints=[...(inspected.componentLayout?.footprints??[])];
  const contour=model.group.userData.sShape?.sectionBounds;
  if(contour)for(const p of [...(inspected.printLayout?.marks??[]),...(inspected.printLayout?.legends??[]),...(inspected.printLayout?.facts??[])]){
    footprints.push({minX:p.x-spec.width/2,maxX:p.x+p.width-spec.width/2,start:p.y,end:p.y+p.height});
  }
  const fullWidth=offset=>!contour||contour.filter(p=>p.d>=offset-witnessHalfLength&&p.d<=offset+witnessHalfLength)
    .every(p=>p.minX<=-spec.width/2+.01&&p.maxX>=spec.width/2-.01);
  const occupied=footprints.filter(p=>p.maxX>-spec.width/2&&p.minX<spec.width/2)
    .map(p=>({start:Math.max(0,p.start),end:Math.min(spec.section,p.end)}))
    .filter(p=>p.end>p.start).sort((a,b)=>a.start-b.start);
  let previous=0,offset=null;
  for(const next of [...occupied,{start:spec.section,end:spec.section}]){
    const low=Math.max(minimum,previous+margin),high=Math.min(maximum,next.start-margin);
    if(low<=high){
      const middle=Math.max(low,Math.min(high,(previous+next.start)/2));
      if(fullWidth(middle)){offset=middle;break;}
      // S-Shape's width is measured on a complete 6 mm island. Its witness
      // lines may not bridge a notch where the real PCB becomes narrower.
      for(let candidate=low;candidate<=high;candidate+=.02)if(fullWidth(candidate)){offset=candidate;break;}
      if(offset!==null)break;
    }
    previous=Math.max(previous,next.end);
  }
  widthOffsets.set(spec,offset);
  return offset;
}

// Dimensions use the same millimetre frame and cut section as the camera.
// No apparent screen-space distance is used as a physical measurement.
export function projectStripDimension(model,camera,viewport,kind){
  const spec=model.specification;
  const section=model.sectionFrame(Math.max(0,Math.floor(spec.sections/2)-1));
  const data=model.group.userData,productId=data.productId;
  const density=Number.isFinite(data.catalogueDensity)&&data.catalogueDensity>0?data.catalogueDensity:Math.round(spec.ledsPerSection/spec.section*1000);
  const catalogueCut=Number.isFinite(data.catalogueCut)&&data.catalogueCut>0?data.catalogueCut:spec.section;
  const rawCount=density*catalogueCut/1000;
  const leds=Math.abs(rawCount-Math.round(rawCount))<1e-6?Math.round(rawCount):null;
  const freeCut=productId?.startsWith('cobfreecut');
  const cutMismatch=!freeCut&&Math.abs(catalogueCut-spec.section)>Math.max(.5,catalogueCut*.02);
  // Bread 70's source table states 70 LED/m and 50 mm, which is not an
  // integral package count. Do not call its 57.14 mm model segment 50 mm.
  if(kind==='section'&&cutMismatch&&data.construction!=='cob')return null;
  const span=kind==='section'&&freeCut?{...section,start:section.center-catalogueCut/2,end:section.center+catalogueCut/2,length:catalogueCut}:section;
  const measuredWidth=data.sleeveLayout?.outerWidth??spec.width,half=measuredWidth/2;
  const at=(distance,side=0,lift=.25)=>{
    const frame=model.frame(distance);
    return frame.p.clone().addScaledVector(frame.x,side).addScaledVector(frame.z,lift);
  };
  const project=local=>{
    const world=local.clone().applyMatrix4(model.group.matrixWorld),ndc=world.clone().project(camera);
    return {x:(ndc.x*.5+.5)*viewport.width,y:(-.5*ndc.y+.5)*viewport.height,local:local.toArray(),world:world.toArray()};
  };
  const measurement={kind,sectionIndex:section.index,start:span.start,end:span.end,length:span.length,width:measuredWidth,pcbWidth:spec.width,
    leds,density,catalogueCut,modelSectionLength:spec.section,modelLeds:spec.ledsPerSection,catalogueCutMismatch:cutMismatch};
  if(kind==='width'){
    // Measure directly between the real PCB edges over exposed solder mask.
    // Both arrows grow from this midpoint; accepted model offsets stay fixed.
    // CRI 97 starts its first LED at 3.125 mm; its clear mask interval is
    // after that package and before the resistor, not in the contact margin.
    const cob=data.construction==='cob';
    const clearInterval=approvedWidthModels.has(productId)?Math.min(productId==='truecolor10'?5.2:2.8,spec.section*.12):
      cob?spec.section/2:clearWidthOffset(model);
    if(clearInterval===null)return null;
    const distance=section.start+clearInterval;
    // The opaque WCOB enclosure is 8 mm wide and 5 mm high overall. Lift
    // its line in front of the whole diffuser, never through hidden SMDs.
    const lift=data.opaqueFront?Math.max(5,(data.coverHeight??0)+.16):cob?Math.max(.16,(data.coverHeight??0)+.16):.16;
    const edges=[-half,half].map(side=>project(at(distance,side,lift)));
    const ends=edges;
    const [a,b]=ends,length=Math.hypot(b.x-a.x,b.y-a.y),ux=(b.x-a.x)/length,uy=(b.y-a.y)/length;
    const arrowSize=Math.min(6,length*.2),wing=arrowSize*.5;
    const arrows=ends.map((end,index)=>{
      const direction=index===0?1:-1;
      return [{x:end.x+direction*ux*arrowSize-uy*wing,y:end.y+direction*uy*arrowSize+ux*wing},end,
        {x:end.x+direction*ux*arrowSize+uy*wing,y:end.y+direction*uy*arrowSize-ux*wing}];
    });
    const anchorLocal=at(distance,0,lift),anchor=project(anchorLocal);
    const branches=ends.map(end=>polyline([anchor,end]));
    const arrowBranches=arrows.map(polyline);
    // Longitudinal witness lines follow each real PCB edge, including its
    // curvature. Each grows in both directions from the width arrow's tip.
    const witnessHalfLength=productId==='sshape'?1.6:2.4;
    const witnessRails=[-half,half].map(side=>[-1,1].map(direction=>Array.from({length:9},(_,i)=>
      project(at(distance+direction*witnessHalfLength*i/8,side,lift)))));
    const witnessHalfPaths=witnessRails.map(halves=>halves.map(polyline));
    const witnessBranches=witnessHalfPaths.map(halves=>halves.join(' '));
    return {...measurement,distance,lift,edges,ends,anchorLocal,anchor:project(anchorLocal),
      branches,witnessBranches,witnessHalfPaths,witnessRails,witnessHalfLength,arrowBranches,
      outline:'',dimension:polyline(ends),witness:witnessBranches.join(' '),arrows:arrowBranches.join(' ')};
  }
  const cuts=[span.start,span.end].map(distance=>[-half-.55,half+.55].map(side=>project(at(distance,side,.2))));
  // One bracket spans the exact cut boundaries. Its short arms grip the
  // upper edge; the rail stays clear of all LEDs. The leader joins its centre
  // directly, without a decorative notch or a separate highlight shape.
  const midSides=[-half,half].map(side=>at(span.center,side,.2));
  const side=project(midSides[0]).y<project(midSides[1]).y?-1:1;
  const grips=[span.start,span.end].map(distance=>project(at(distance,side*(half+.2),.2)));
  const rail=Array.from({length:41},(_,i)=>{
    const t=i/40;
    return project(at(span.start+span.length*t,side*(half+1.35),.2));
  });
  const anchorLocal=at(span.center,side*(half+1.35),.2);
  // The leader arrives at the centre first. Each half then grows from that
  // shared centre towards its own cut boundary, finishing with the short grip.
  const middle=(rail.length-1)/2;
  const branches=[polyline([...rail.slice(0,middle+1).reverse(),grips[0]]),polyline([...rail.slice(middle),grips[1]])];
  return {...measurement,edges:cuts.flat(),cuts,grips,bracket:true,anchorLocal,anchor:project(anchorLocal),
    branches,witnessBranches:['',''],arrowBranches:['',''],
    outline:'',dimension:polyline([grips[0],...rail,grips[1]]),witness:'',arrows:''};
}
