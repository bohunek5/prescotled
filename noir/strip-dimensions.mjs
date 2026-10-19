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
    // Place the dimension in the free space after the contact row, before the
    // first LED. Witness lines connect both real PCB edges to the raised line.
    const distance=section.start+Math.min(2.8,spec.section*.056);
    const edges=[-half,half].map(side=>project(at(distance,side,.16)));
    const ends=[-half,half].map(side=>project(at(distance,side,1.45)));
    const [a,b]=ends,length=Math.hypot(b.x-a.x,b.y-a.y),ux=(b.x-a.x)/length,uy=(b.y-a.y)/length;
    const arrowSize=Math.min(6,length*.2),wing=arrowSize*.5;
    const arrows=ends.map((end,index)=>{
      const direction=index===0?1:-1;
      return [{x:end.x+direction*ux*arrowSize-uy*wing,y:end.y+direction*uy*arrowSize+ux*wing},end,
        {x:end.x+direction*ux*arrowSize+uy*wing,y:end.y+direction*uy*arrowSize-ux*wing}];
    });
    const anchorLocal=at(distance,0,1.45);
    return {...measurement,distance,edges,ends,anchorLocal,anchor:project(anchorLocal),
      outline:'',dimension:polyline(ends),witness:edges.map((edge,index)=>polyline([edge,ends[index]])).join(' '),arrows:arrows.map(polyline).join(' ')};
  }
  const cuts=[section.start,section.end].map(distance=>[-half-.55,half+.55].map(side=>project(at(distance,side,.2))));
  // One bracket spans the exact cut boundaries. Its short arms grip the
  // upper edge; the lifted rail and central notch stay clear of all LEDs.
  const midSides=[-half,half].map(side=>at((section.start+section.end)/2,side,.2));
  const side=project(midSides[0]).y<project(midSides[1]).y?-1:1;
  const grips=[section.start,section.end].map(distance=>project(at(distance,side*(half+.2),.2)));
  const rail=Array.from({length:41},(_,i)=>{
    const t=i/40,notch=.7*Math.max(0,1-Math.abs(t-.5)/.075);
    return project(at(section.start+section.length*t,side*(half+1.35+notch),.2));
  });
  const anchorLocal=at(section.center,side*(half+2.05),.2);
  return {...measurement,edges:cuts.flat(),cuts,grips,bracket:true,anchorLocal,anchor:project(anchorLocal),
    outline:'',dimension:polyline([grips[0],...rail,grips[1]]),witness:'',arrows:''};
}
