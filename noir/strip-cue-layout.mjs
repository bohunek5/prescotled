import * as T from '../konfigurator/vendor/three/build/three.module.min.js';
import {frameStripSection} from './strip-section-camera.mjs';
import {samplePresentation,presentationStart} from './strip-presentation.mjs?v=detail-3';
import {placeVoltageLabel} from './voltage-placement.mjs?v=detail-3';
import {projectStripDimension} from './strip-dimensions.mjs?v=detail-4';

// Resolve a caption against one deterministic pose, before its first letter.
// The real ribbon may move beneath it; the caption never follows or hops
// between candidate positions while the user is trying to read it.
export function planStripCue(model,product,camera,cue,anchor,{width,height,labelWidth,scale,leftBound}){
  const index=Math.max(0,['3w1','slim','truecolor10'].indexOf(product.id));
  const shot=samplePresentation(presentationStart(index)+cue.referenceTime,3);
  const proxy={...model,group:new T.Group()},referenceCamera=camera.clone();
  proxy.group.userData=model.group.userData;
  frameStripSection(referenceCamera,proxy,shot,width/height);
  const dimension=cue.measurement?projectStripDimension(proxy,referenceCamera,{width,height},cue.measurement):null;
  const point=dimension?dimension.anchorLocal.clone():new T.Vector3().setFromMatrixPosition(anchor);
  if(!dimension)point.addScaledVector(new T.Vector3().setFromMatrixColumn(anchor,2),.16);
  point.applyMatrix4(proxy.group.matrixWorld).project(referenceCamera);
  const x=(point.x*.5+.5)*width,y=(-point.y*.5+.5)*height;
  const branchAxis=dimension?.kind==='width'?{
    x:dimension.ends[1].x-dimension.ends[0].x,y:dimension.ends[1].y-dimension.ends[0].y
  }:null;
  return {...placeVoltageLabel(proxy,referenceCamera,{width,height,x,y,labelWidth,twoLines:true,scale,leftBound,
    raise:dimension?18*scale:0,branchAxis}),locked:true,referenceTime:cue.referenceTime};
}
