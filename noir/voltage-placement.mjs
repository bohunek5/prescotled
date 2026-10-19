import * as T from '../konfigurator/vendor/three/build/three.module.min.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));

// Choose nearby negative space using the projected PCB, including the other
// turns of the helix. Never reserve a distant corner for a small contact label.
export function placeVoltageLabel(model,camera,{width,height,x,y,labelWidth,twoLines,scale=1,choice=-1,leftBound=14,raise=0,branchAxis=null,extraObstacles=[]}){
  const obstacles=[...extraObstacles];
  const samples=Math.ceil(model.specification.length/5),half=model.specification.width/2+.6;
  let previous;
  for(let i=0;i<=samples;i++){
    const f=model.frame(i/samples*model.specification.length);
    const points=[-1,1].map(side=>{
      const p=f.p.clone().addScaledVector(f.x,half*side).addScaledVector(f.z,.8).applyMatrix4(model.group.matrixWorld).project(camera);
      return new T.Vector2((p.x*.5+.5)*width,(-p.y*.5+.5)*height);
    });
    if(previous){const p=[...previous,...points];obstacles.push({left:Math.min(...p.map(v=>v.x))-6,top:Math.min(...p.map(v=>v.y))-6,right:Math.max(...p.map(v=>v.x))+6,bottom:Math.max(...p.map(v=>v.y))+6});}
    previous=points;
  }
  // Width needs a visible junction: a nearly parallel leader would cover one
  // branch. These are additional positions for that measurement only.
  const offsets=[...(branchAxis?[[-2.2,-70],[-2.7,-105],[-3.2,-150],[-2,-30],[-2.8,-180]]:[]),[-1.35,-85],[-.65,-125],[.2,-135],[-1.35,-175],[-.65,-220],[.3,-225],[-1.6,-35],[.7,-280],[-.8,-280]];
  if(extraObstacles.length)for(const horizontal of [-1.35,-.65,.2])for(const vertical of [-360,-450,-540,90,180,270])offsets.push([horizontal,vertical]);
  const candidates=offsets.map(([horizontal,vertical],index)=>{
    const tx=clamp(x+horizontal*labelWidth,leftBound,width-labelWidth-14);
    const ty=clamp(y+vertical*scale-raise,32,height-(twoLines?40:20));
    const box={left:tx-6,right:tx+labelWidth+6,top:ty-29*scale,bottom:ty+(twoLines?32:13)*scale};
    const elbow={x:x<tx+labelWidth/2?tx:tx+labelWidth,y:ty+9*scale};
    const intrusion=obstacles.reduce((total,obstacle)=>total+overlap(box,obstacle),0);
    let crossings=0;
    for(let i=1;i<=7;i++){
      const t=i/10,px=elbow.x+(x-elbow.x)*t,py=elbow.y+(y-elbow.y)*t;
      if(obstacles.some(o=>px>=o.left&&px<=o.right&&py>=o.top&&py<=o.bottom))crossings++;
    }
    const diagonal=Math.hypot(x-elbow.x,y-elbow.y);
    const approachAngle=branchAxis?Math.acos(clamp(Math.abs((x-elbow.x)*branchAxis.x+(y-elbow.y)*branchAxis.y)/(diagonal*Math.hypot(branchAxis.x,branchAxis.y)),0,1))*180/Math.PI:null;
    const approachPenalty=approachAngle===null?0:Math.max(0,40-approachAngle)*40;
    return {x:tx,y:ty,exitX:elbow.x,choice:index,clearance:intrusion===0,overlap:intrusion,crossings,lineLength:labelWidth+diagonal,approachAngle,score:intrusion*20+crossings*180+diagonal+approachPenalty+(index===choice?-25:0)};
  });
  return candidates.sort((a,b)=>a.score-b.score)[0];
}
