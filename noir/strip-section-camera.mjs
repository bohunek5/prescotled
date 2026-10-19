import * as T from '../konfigurator/vendor/three/build/three.module.min.js';

const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const x=clamp(value);return x*x*(3-2*x);};
const shortestAngle=(from,to)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));

// A cut section, including both terminal rows, owns the close-up framing.
// All measurements come from the model's millimetre geometry.
export function frameStripSection(camera,model,shot,aspect){
  const spec=model.specification,ratio=Math.max(.2,aspect),zoom=clamp((shot.zoom??0)/.97);
  const section=model.sectionFrame(Math.max(0,Math.floor(spec.sections/2)-1));
  const {index,start,end,frame:middle}=section;
  const fullRotation=shot.rotation??0;
  const faceRotation=-Math.atan2(middle.z.x,middle.z.z)+.065*Math.sin((shot.local??0)*.54);
  const alignment=smooth((zoom-.06)/.78);
  model.group.rotation.set(shot.tilt??0,fullRotation+shortestAngle(fullRotation,faceRotation)*alignment,-.045);
  model.group.updateMatrixWorld(true);
  const center=middle.p.clone().applyMatrix4(model.group.matrixWorld);
  const points=[];
  // Include components, the PCB width and a short margin past each cut.
  for(let step=0;step<=24;step++){
    const frame=model.frame(start-.85+(spec.section+1.7)*step/24);
    for(const side of [-1,1])points.push(frame.p.clone().addScaledVector(frame.x,side*(spec.width/2+.45)).addScaledVector(frame.z,1.1).applyMatrix4(model.group.matrixWorld));
  }
  const tangent=Math.tan(T.MathUtils.degToRad(camera.fov/2));
  const fit=Math.max(136,48/ratio)/tangent;
  let macroDistance=40;
  for(const point of points){
    const dx=point.x-center.x,dy=point.y-center.y,dz=point.z-center.z;
    macroDistance=Math.max(macroDistance,Math.abs(dx)/(tangent*ratio*.85)+dz,dy/(tangent*.94)+dz,-dy/(tangent*.62)+dz);
  }
  const distance=T.MathUtils.lerp(fit,macroDistance,zoom);
  const target=center.clone().multiplyScalar(zoom);
  // Leave room above the section for the supply/LOW/MEDIUM/HIGH annotation.
  target.y+=distance*tangent*.16*zoom;
  camera.aspect=ratio;camera.far=Math.max(2000,fit*3);camera.clearViewOffset();camera.updateProjectionMatrix();
  camera.position.copy(target).add(new T.Vector3(0,10*(1-zoom),distance));camera.lookAt(target);camera.updateMatrixWorld(true);
  const ndc=points.map(point=>point.clone().project(camera));
  return {index,start,end,length:spec.section,width:spec.width,leds:spec.ledsPerSection,zoom,distance,macroDistance,
    center:center.toArray(),bounds:{left:Math.min(...ndc.map(p=>p.x)),right:Math.max(...ndc.map(p=>p.x)),bottom:Math.min(...ndc.map(p=>p.y)),top:Math.max(...ndc.map(p=>p.y))},
    cuts:[start,end].map(d=>model.frame(d).p.applyMatrix4(model.group.matrixWorld).project(camera).toArray())};
}
