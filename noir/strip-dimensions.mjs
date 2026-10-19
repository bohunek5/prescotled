import * as T from '../konfigurator/vendor/three/build/three.module.min.js';

const pointText=point=>`${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
const polyline=points=>points.map((point,index)=>`${index?'L':'M'} ${pointText(point)}`).join(' ');

// Dimensions use the same millimetre frame and cut section as the camera.
// No apparent screen-space distance is used as a physical measurement.
export function projectStripDimension(model,camera,viewport,kind){
  const spec=model.specification;
  const section=model.sectionFrame(Math.max(0,Math.floor(spec.sections/2)-1));
  const half=spec.width/2;
  const at=(distance,side=0,lift=.25)=>{
    const frame=model.frame(distance);
    return frame.p.clone().addScaledVector(frame.x,side).addScaledVector(frame.z,lift);
  };
  const project=local=>{
    const world=local.clone().applyMatrix4(model.group.matrixWorld),ndc=world.clone().project(camera);
    return {x:(ndc.x*.5+.5)*viewport.width,y:(-.5*ndc.y+.5)*viewport.height,local:local.toArray(),world:world.toArray()};
  };
  const measurement={kind,sectionIndex:section.index,start:section.start,end:section.end,width:spec.width,
    leds:spec.ledsPerSection,density:Math.round(spec.ledsPerSection/spec.section*1000)};
  if(kind==='width'){
    // Measure directly between the real PCB edges in the clear interval
    // between the contacts and first LED. Both arrows grow from this midpoint.
    // CRI 97 starts its first LED at 3.125 mm; its clear mask interval is
    // after that package and before the resistor, not in the contact margin.
    const clearInterval=model.group.userData.productId==='truecolor10'?5.2:2.8;
    const distance=section.start+Math.min(clearInterval,spec.section*.12);
    const edges=[-half,half].map(side=>project(at(distance,side,.16)));
    const ends=edges;
    const [a,b]=ends,length=Math.hypot(b.x-a.x,b.y-a.y),ux=(b.x-a.x)/length,uy=(b.y-a.y)/length;
    const arrowSize=Math.min(6,length*.2),wing=arrowSize*.5;
    const arrows=ends.map((end,index)=>{
      const direction=index===0?1:-1;
      return [{x:end.x+direction*ux*arrowSize-uy*wing,y:end.y+direction*uy*arrowSize+ux*wing},end,
        {x:end.x+direction*ux*arrowSize+uy*wing,y:end.y+direction*uy*arrowSize-ux*wing}];
    });
    const anchorLocal=at(distance,0,.16),anchor=project(anchorLocal);
    const branches=ends.map(end=>polyline([anchor,end]));
    const arrowBranches=arrows.map(polyline);
    return {...measurement,distance,edges,ends,anchorLocal,anchor:project(anchorLocal),
      branches,witnessBranches:['',''],arrowBranches,
      outline:'',dimension:polyline(ends),witness:'',arrows:arrowBranches.join(' ')};
  }
  const cuts=[section.start,section.end].map(distance=>[-half-.55,half+.55].map(side=>project(at(distance,side,.2))));
  // One bracket spans the exact cut boundaries. Its short arms grip the
  // upper edge; the rail stays clear of all LEDs. The leader joins its centre
  // directly, without a decorative notch or a separate highlight shape.
  const midSides=[-half,half].map(side=>at((section.start+section.end)/2,side,.2));
  const side=project(midSides[0]).y<project(midSides[1]).y?-1:1;
  const grips=[section.start,section.end].map(distance=>project(at(distance,side*(half+.2),.2)));
  const rail=Array.from({length:41},(_,i)=>{
    const t=i/40;
    return project(at(section.start+section.length*t,side*(half+1.35),.2));
  });
  const anchorLocal=at(section.center,side*(half+1.35),.2);
  // The leader arrives at the centre first. Each half then grows from that
  // shared centre towards its own cut boundary, finishing with the short grip.
  const middle=(rail.length-1)/2;
  const branches=[polyline([...rail.slice(0,middle+1).reverse(),grips[0]]),polyline([...rail.slice(middle),grips[1]])];
  return {...measurement,edges:cuts.flat(),cuts,grips,bracket:true,anchorLocal,anchor:project(anchorLocal),
    branches,witnessBranches:['',''],arrowBranches:['',''],
    outline:'',dimension:polyline([grips[0],...rail,grips[1]]),witness:'',arrows:''};
}
