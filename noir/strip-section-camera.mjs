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
  const outerWidth=model.group.userData.sleeveLayout?.outerWidth??spec.width;
  const topHeight=model.group.userData.sleeveLayout?model.group.userData.coverHeight+.2:1.1;
  const points=[];
  // Include components, the PCB width and a short margin past each cut.
  for(let step=0;step<=24;step++){
    const frame=model.frame(start-.85+(spec.section+1.7)*step/24);
    for(const side of [-1,1])points.push(frame.p.clone().addScaledVector(frame.x,side*(outerWidth/2+.45)).addScaledVector(frame.z,topHeight).applyMatrix4(model.group.matrixWorld));
  }
  if(shot.detailBounds){
    const {min,max}=shot.detailBounds;
    for(const x of [min[0],max[0]])for(const y of [min[1],max[1]])for(const z of [min[2],max[2]])
      points.push(new T.Vector3(x,y,z).applyMatrix4(model.group.matrixWorld));
  }
  const tangent=Math.tan(T.MathUtils.degToRad(camera.fov/2));
  const radius=model.frame(spec.length/2).p;
  const horizontalExtent=Math.max(48,Math.hypot(radius.x,radius.z)+outerWidth/2+8);
  const fit=Math.max(136,horizontalExtent/ratio)/tangent;
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
  camera.up.set(0,1,0);
  camera.position.copy(target).add(new T.Vector3(0,10*(1-zoom),distance));camera.lookAt(target);camera.updateMatrixWorld(true);
  // Show the physical open end while the full ribbon remains connected.
  // The end retreats into the curved product, as in the supplied cross-section photo.
  const id=model.group.userData.productId,local=shot.local??0;
  const endReveal=id?.startsWith('wcob')?smooth((local-6)/2)*(1-smooth((local-23)/3)):
    id==='cobip67'?smooth((local-1)/3)*(1-smooth((local-6.7)/2)):0;
  if(endReveal>0){
    const f=model.frame(spec.length),matrix=model.group.matrixWorld;
    const p=f.p.clone().applyMatrix4(matrix),x=f.x.clone().transformDirection(matrix),y=f.y.clone().transformDirection(matrix),z=f.z.clone().transformDirection(matrix);
    const endCamera=camera.clone();
    endCamera.up.copy(z);
    endCamera.position.copy(p).addScaledVector(y,28).addScaledVector(x,6).addScaledVector(z,60);
    endCamera.lookAt(p.clone().addScaledVector(y,-8).addScaledVector(z,2));
    camera.position.lerp(endCamera.position,endReveal);camera.quaternion.slerp(endCamera.quaternion,endReveal);camera.updateMatrixWorld(true);
  }
  const ndc=points.map(point=>point.clone().project(camera));
  return {index,start,end,length:spec.section,width:spec.width,leds:spec.ledsPerSection,zoom,distance,macroDistance,endReveal,
    center:center.toArray(),bounds:{left:Math.min(...ndc.map(p=>p.x)),right:Math.max(...ndc.map(p=>p.x)),bottom:Math.min(...ndc.map(p=>p.y)),top:Math.max(...ndc.map(p=>p.y))},
    cuts:[start,end].map(d=>model.frame(d).p.applyMatrix4(model.group.matrixWorld).project(camera).toArray())};
}
