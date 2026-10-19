import * as T from '../konfigurator/vendor/three/build/three.module.min.js';
import {frameStripSection} from './strip-section-camera.mjs?v=detail-3';
import {samplePresentation,presentationStart} from './strip-presentation.mjs?v=detail-5';
import {placeVoltageLabel} from './voltage-placement.mjs?v=detail-4';
import {projectStripDimension} from './strip-dimensions.mjs?v=detail-6';
import {mainFilmProducts,mainFilmProductIds} from './strip-film-selection.mjs?v=detail-2';

// Resolve a caption against one deterministic pose, before its first letter.
// The real ribbon may move beneath it; the caption never follows or hops
// between candidate positions while the user is trying to read it.
export function planStripCue(model,product,camera,cue,anchor,{width,height,labelWidth,scale,leftBound}){
  const index=Math.max(0,mainFilmProductIds.indexOf(product.id));
  const shot=samplePresentation(presentationStart(index)+cue.referenceTime,mainFilmProducts.length);
  const proxy={...model,group:new T.Group()},referenceCamera=camera.clone();
  proxy.group.userData=model.group.userData;
  frameStripSection(referenceCamera,proxy,{...shot,detailBounds:cue.referenceBounds},width/height);
  const dimension=cue.measurement?projectStripDimension(proxy,referenceCamera,{width,height},cue.measurement):null;
  const point=cue.referenceAnchorLocal?new T.Vector3().fromArray(cue.referenceAnchorLocal):dimension?dimension.anchorLocal.clone():new T.Vector3().setFromMatrixPosition(anchor);
  if(!dimension&&!['copper','sleeve'].includes(cue.anchor))point.addScaledVector(new T.Vector3().setFromMatrixColumn(anchor,2),.16);
  point.applyMatrix4(proxy.group.matrixWorld).project(referenceCamera);
  const x=(point.x*.5+.5)*width,y=(-point.y*.5+.5)*height;
  if(cue.referenceBounds){
    // The detached layers occupy more space than the original ribbon. Keep
    // their caption above that full envelope, never printed over the cover.
    const obstacles=(cue.referenceLayers??[cue.referenceBounds]).map(({min,max})=>{
      const projected=[];
      for(const px of [min[0],max[0]])for(const py of [min[1],max[1]])for(const pz of [min[2],max[2]]){
        const p=new T.Vector3(px,py,pz).applyMatrix4(proxy.group.matrixWorld).project(referenceCamera);
        projected.push({x:(.5*p.x+.5)*width,y:(-.5*p.y+.5)*height});
      }
      return {left:Math.min(...projected.map(p=>p.x))-10,right:Math.max(...projected.map(p=>p.x))+10,
        top:Math.min(...projected.map(p=>p.y))-10,bottom:Math.max(...projected.map(p=>p.y))+10};
    });
    return {...placeVoltageLabel(proxy,referenceCamera,{width,height,x,y,labelWidth,twoLines:true,scale,leftBound,extraObstacles:obstacles}),locked:true,referenceTime:cue.referenceTime};
  }
  const branchAxis=dimension?.kind==='width'?{
    x:dimension.ends[1].x-dimension.ends[0].x,y:dimension.ends[1].y-dimension.ends[0].y
  }:null;
  return {...placeVoltageLabel(proxy,referenceCamera,{width,height,x,y,labelWidth,twoLines:true,scale,leftBound,
    raise:dimension?18*scale:0,branchAxis}),locked:true,referenceTime:cue.referenceTime};
}
