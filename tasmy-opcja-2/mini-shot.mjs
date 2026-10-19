import * as T from '../konfigurator/vendor/three/build/three.module.min.js';
import {supplyAnchor} from '../noir/strip-lighting.mjs';

// The full film's approach and pullback, sampled from each card's own clock.
// A longer catalogue sequence extends the detail hold, not the camera move.
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const x=clamp(value);return x*x*x*(x*(x*6-15)+10);};
const shortestAngle=(from,to)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));

export function sampleMiniShot(time,duration,{product,turn=0,rebuilding=false}={}){
  const length=Math.max(product?.id==='3w1'?44:24,Number(duration)||0);
  const local=Math.max(0,Math.min(length,Number(time)||0)),detailEnd=length-6;
  const approach=smooth((local-3)/6),departure=smooth((local-detailEnd)/6);
  const zoom=rebuilding?0:.97*approach*(1-departure);
  const fadeOut=1-smooth((local-detailEnd)/1.2);
  const powerMode=product?.id==='3w1'?Math.min(2,Math.floor((local%12)/4)):0;
  return {
    local,duration:length,detailEnd,rebuilding,
    phase:rebuilding?'rebuild':local<3?'full':local<9?'approach':local<detailEnd?'detail':local<length?'pullback':'ready',
    zoom,
    lightLevel:rebuilding?0:(product?.digital?1:smooth((local-7)/2.5))*fadeOut,
    contactLevel:rebuilding?0:smooth((local-6.2)/.8)*fadeOut,
    rotation:-.35+(Number(turn)||0),
    tilt:-.02+.035*Math.sin(local*.17),roll:-.045,
    targetY:zoom*(-3+6*smooth((local-9)/Math.max(1,detailEnd-9))),
    powerMode,powerBlend:powerMode===0?1:smooth((local%4)/.9)
  };
}

const point=new T.Vector3(),previousPoint=new T.Vector3(),normal=new T.Vector3(),worldPoint=new T.Vector3();
const worldNormal=new T.Vector3(),toward=new T.Vector3(),projected=new T.Vector3();

/** Frame the actual supply terminal (or WCOB backing), not the model origin.
 *  Mutates camera and model.group rotation. Returns serializable inspection data.
 *  Call before copying the rotation to an active rebuild group.
 */
export function frameMiniCamera(camera,model,shot,aspect){
  const ratio=Math.max(.05,Number(aspect)||1),zoom=clamp(shot.zoom??0);
  const specification=model.specification,backing=model.group.userData.macroSide==='back';
  const threeInOne=model.group.userData.contacts?.length===4&&model.group.userData.productId==='3w1';
  const contactIndex=threeInOne?(shot.powerMode??0)+1:0;
  const anchor=backing?null:(supplyAnchor(model,contactIndex)??supplyAnchor(model));
  if(backing){
    const frame=model.frame(specification.length/2);
    normal.copy(frame.z).negate();point.copy(frame.p).addScaledVector(frame.z,-.3);
  }else if(anchor){
    point.setFromMatrixPosition(anchor);normal.setFromMatrixColumn(anchor,2).normalize();
    if(threeInOne&&(shot.powerMode??0)>0){
      const previous=supplyAnchor(model,shot.powerMode);
      if(previous){previousPoint.setFromMatrixPosition(previous);point.copy(previousPoint.lerp(point,clamp(shot.powerBlend??1)));}
    }
    point.addScaledVector(normal,.16);
  }else{
    const frame=model.frame(specification.length/2);point.copy(frame.p);normal.copy(frame.z);
  }

  // The full strip keeps turning. During macro, smoothly face the selected
  // surface towards the lens and retain a small drift instead of revealing its
  // reverse halfway through a contact/light demonstration.
  const fullRotation=Number(shot.rotation)||0;
  const faceRotation=-Math.atan2(normal.x,normal.z)+.12*Math.sin((shot.local??0)*.72);
  const alignment=smooth((zoom-.1)/.67);
  const rotation=fullRotation+shortestAngle(fullRotation,faceRotation)*alignment;
  model.group.rotation.set(shot.tilt??0,rotation,shot.roll??-.045);
  model.group.updateMatrixWorld(true);
  worldPoint.copy(point).applyMatrix4(model.group.matrixWorld);
  worldNormal.copy(normal).transformDirection(model.group.matrixWorld);

  camera.aspect=ratio;
  const tangent=Math.tan(T.MathUtils.degToRad(camera.fov/2));
  const fit=Math.max(136,48/ratio)/tangent;
  // Keep the entire PCB width and nearby emitters in a narrow card's macro.
  // At ordinary desktop ratios this uses the original film's 76 mm distance.
  const macroWidth=Math.max(18,Number(specification.width)*2.4);
  const macroDistance=Math.max(76,macroWidth/(2*tangent*ratio));
  const distance=T.MathUtils.lerp(fit,macroDistance,zoom);
  const focusX=worldPoint.x*zoom,focusY=worldPoint.y*zoom+(shot.targetY??0),focusZ=worldPoint.z*zoom;
  camera.far=Math.max(2000,fit*3);camera.updateProjectionMatrix();camera.clearViewOffset();
  camera.position.set(focusX,focusY+10*(1-zoom),focusZ+distance);
  camera.lookAt(focusX,focusY,focusZ);camera.updateMatrixWorld(true);
  projected.copy(worldPoint).project(camera);
  toward.copy(camera.position).sub(worldPoint).normalize();
  return {
    distance,fit,macroDistance,zoom,focus:[focusX,focusY,focusZ],backing,rotation,
    anchorNdc:projected.toArray(),anchorFacing:worldNormal.dot(toward),contactIndex
  };
}
