import * as T from '../konfigurator/vendor/three/build/three.module.min.js';
import {unlitEmitterColor} from './strip-appearance.mjs';
import {sampleStripLight} from './strip-light-program.mjs';
import {placeVoltageLabel} from './voltage-placement.mjs?v=detail-3';
import {sampleDetailCue} from './strip-detail-cues.mjs?v=detail-4';
import {projectStripDimension} from './strip-dimensions.mjs?v=detail-4';
import {planStripCue} from './strip-cue-layout.mjs?v=detail-4';

const supplyAnchors=new WeakMap();
export function supplyAnchor(model,contactIndex=0,sectionIndex=null){
  if(sectionIndex!==null){
    const pads=model.group.children.find(m=>m.name.startsWith('Copper solder pads /'));
    // Use the FIRST contact row of the camera's selected cut section. It is
    // the upper row in the front macro view, not a pad beyond the opposite cut.
    const padIndex=sectionIndex*model.group.userData.contacts.length*2+contactIndex;
    if(!pads||padIndex>=pads.count)return null;
    const anchor=new T.Matrix4();pads.getMatrixAt(padIndex,anchor);
    return anchor;
  }
  if(supplyAnchors.has(model))return supplyAnchors.get(model)[contactIndex];
  const pads=model.group.children.find(m=>m.name.startsWith('Copper solder pads /'));
  const center=model.frame(model.specification.length/2).p;
  const matrix=new T.Matrix4(),point=new T.Vector3();let best=Infinity,bestIndex=0;
  if(pads)for(let i=0;i<pads.count;i+=model.group.userData.contacts.length){
    pads.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);
    const score=point.distanceToSquared(center);
    if(score<best){best=score;bestIndex=i;}
  }
  const anchors=pads?model.group.userData.contacts.map((_,i)=>{const m=new T.Matrix4();pads.getMatrixAt(bestIndex+i,m);return m;}):[];
  supplyAnchors.set(model,anchors);return anchors[contactIndex];
}

// Per-instance emission stays independent of instanceColor, which describes
// unpowered CCT phosphor/die tints and must not tint the emitted light twice.
function installEmissionAttributes(mesh,restore){
  const geometry=mesh.geometry,count=mesh.count;
  const color=new T.InstancedBufferAttribute(new Float32Array(count*3),3).setUsage(T.DynamicDrawUsage);
  const intensity=new T.InstancedBufferAttribute(new Float32Array(count),1).setUsage(T.DynamicDrawUsage);
  const oldColor=geometry.getAttribute('stripLightColor'),oldIntensity=geometry.getAttribute('stripLightStrength');
  geometry.setAttribute('stripLightColor',color);geometry.setAttribute('stripLightStrength',intensity);
  restore.push(()=>{
    if(oldColor)geometry.setAttribute('stripLightColor',oldColor);else geometry.deleteAttribute('stripLightColor');
    if(oldIntensity)geometry.setAttribute('stripLightStrength',oldIntensity);else geometry.deleteAttribute('stripLightStrength');
  });
  return {mesh,color,intensity};
}

export function installStripLighting(model,product){
  const isCob=model.group.userData.construction==='cob';
  const resources=[],restore=[],emitters=model.group.children.filter(m=>/phosphor/i.test(m.name));
  const materials=[...new Set(emitters.map(m=>m.material))];
  const resting=materials.map(m=>m.color.clone());
  const illumination={value:0};
  const emitterAttributes=emitters.map(mesh=>installEmissionAttributes(mesh,restore));
  for(const material of materials){
    const before=material.onBeforeCompile,cacheKey=material.customProgramCacheKey;
    material.onBeforeCompile=(shader,renderer)=>{
      before.call(material,shader,renderer);
      shader.uniforms.stripIllumination=illumination;
      shader.vertexShader='attribute vec3 stripLightColor; attribute float stripLightStrength; varying vec3 vStripLightColor; varying float vStripLightStrength;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvStripLightColor=stripLightColor; vStripLightStrength=stripLightStrength;');
      shader.fragmentShader='uniform float stripIllumination; varying vec3 vStripLightColor; varying float vStripLightStrength;\n'+shader.fragmentShader;
      const surface=product.digital?'diffuseColor.rgb=mix(diffuseColor.rgb,vStripLightColor*.45,min(.96,stripIllumination*mix(.87,.96,vStripLightStrength)));':'diffuseColor.rgb=mix(diffuseColor.rgb,vStripLightColor*.65,min(.92,stripIllumination*.9*vStripLightStrength));';
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+surface);
      shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=vStripLightColor*vStripLightStrength;');
    };
    material.customProgramCacheKey=()=>cacheKey.call(material)+`-strip-module-emission-v2-${product.digital?'digital':'analog'}`;
    material.needsUpdate=true;
    restore.push(()=>{material.onBeforeCompile=before;material.customProgramCacheKey=cacheKey;material.needsUpdate=true;});
  }
  let glow=model.group.getObjectByName('Soft light around each emitter');
  if(!glow){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
    const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);
    gradient.addColorStop(0,'rgba(255,255,255,.8)');gradient.addColorStop(.2,'rgba(255,255,255,.36)');gradient.addColorStop(.55,'rgba(255,255,255,.08)');gradient.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
    const map=new T.CanvasTexture(canvas),material=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
    const base=model.group.getObjectByName('LED ceramic base'),cob=!base;
    const count=cob?Math.ceil(model.specification.length/4):base.count;
    const geometry=new T.PlaneGeometry(cob?model.specification.width*.9:9,cob?12:8);
    glow=new T.InstancedMesh(geometry,material,count);glow.name='Soft light around each emitter';
    const emitterHeight=(model.group.userData.coverHeight??.5)+.3;
    const matrix=new T.Matrix4(),offset=new T.Matrix4().makeTranslation(0,0,.75);
    for(let i=0;i<count;i++){
      if(base){base.getMatrixAt(i,matrix);matrix.multiply(offset);}
      else{const f=model.frame((i+.5)*model.specification.length/count);matrix.makeBasis(f.x,f.y,f.z);matrix.setPosition(f.p.clone().addScaledVector(f.z,emitterHeight));}
      glow.setMatrixAt(i,matrix);
    }
    glow.instanceMatrix.needsUpdate=true;glow.computeBoundingSphere();model.group.add(glow);resources.push(map,geometry,material);
  }
  glow.castShadow=glow.receiveShadow=false;
  // Additive black contributes no light, allowing one colour/intensity per halo
  // without a material or draw call for every addressable module.
  const glowColor=new T.Color(),oldGlowColors=glow.instanceColor;
  glow.setColorAt(0,new T.Color(0xffffff));glow.instanceColor.setUsage(T.DynamicDrawUsage);
  glow.material.color.set(0xffffff);glow.material.needsUpdate=true;
  restore.push(()=>{glow.instanceColor=oldGlowColors;});
  let level=0,power=1,time=0,variant=product.color,previousVariant=variant,variantBlend=1;
  let samples=[],current=sampleStripLight(product,0,{variant});
  const moduleCount=Math.max(1,model.specification.sections),emissionGain=isCob?1.65:2.2;
  function refresh(){
    const strength=level*Math.pow(power,.82);illumination.value=strength;
    const parameters={variant,previousVariant,variantBlend,moduleCount};
    const global=sampleStripLight(product,time,parameters);
    const modules=product.digital?Array.from({length:moduleCount},(_,module)=>sampleStripLight(product,time,{...parameters,module})):[global];
    current=product.digital?modules[Math.floor(moduleCount/2)]:global;
    materials.forEach((material,i)=>{
      material.color.copy(resting[i]);material.emissive.set(0xffffff);material.emissiveIntensity=emissionGain*strength;
    });
    for(const {mesh,color,intensity} of emitterAttributes){
      for(let i=0;i<mesh.count;i++){
        const sample=modules[product.digital?Math.min(moduleCount-1,i):0];
        color.setXYZ(i,sample.color.r,sample.color.g,sample.color.b);intensity.setX(i,sample.intensity);
      }
      color.needsUpdate=intensity.needsUpdate=true;
    }
    for(let i=0;i<glow.count;i++){
      const index=product.digital?Math.min(moduleCount-1,Math.floor((i+.5)/glow.count*moduleCount)):0,sample=modules[index];
      glowColor.copy(sample.color).multiplyScalar(sample.intensity);glow.setColorAt(i,glowColor);
    }
    glow.instanceColor.needsUpdate=true;
    glow.visible=strength>.001;glow.material.opacity=(isCob?.15:.48)*strength;
    const inspected=product.digital?modules:[global,global,global];
    samples=inspected.map((sample,module)=>({module,color:`#${sample.color.getHexString()}`,intensity:sample.intensity*strength}));
    return {program:current.program,phase:current.phase,color:`#${current.color.getHexString()}`,warmMix:current.warmMix,digital:!!product.digital};
  }
  function temperature(value){
    variant=value;
    if(isCob)resting.forEach(color=>color.set(unlitEmitterColor(product,value)));
  }
  model.setLightLevel=value=>{level=T.MathUtils.clamp(value,0,1);refresh();};
  model.setLight=on=>model.setLightLevel(on?1:0);
  model.setPower=value=>{power=T.MathUtils.clamp(value,0,1);refresh();};
  model.setTemperature=value=>{temperature(value);previousVariant=value;variantBlend=1;refresh();};
  model.updateLightAnimation=(seconds,options={})=>{
    time=Math.max(0,Number(seconds)||0);
    if(options.lightLevel!==undefined)level=T.MathUtils.clamp(options.lightLevel,0,1);
    if(options.power!==undefined)power=T.MathUtils.clamp(options.power,0,1);
    if(options.variant!==undefined)temperature(options.variant);
    previousVariant=options.previousVariant??variant;variantBlend=T.MathUtils.clamp(options.variantBlend??1,0,1);
    return refresh();
  };
  const inspect=model.inspect;
  model.inspect=()=>({...inspect(),lightOn:level>0,lightLevel:level,lightPower:power,lightColor:`#${current.color.getHexString()}`,
    lightProgram:current.program,lightPhase:current.phase,lightWarmMix:current.warmMix,digital:!!product.digital,
    lightSamples:samples.map(sample=>({...sample})),emissionGain,unlitEmitterColors:resting.map(c=>`#${c.getHexString()}`)});
  refresh();return ()=>{
    // Release the added GPU attributes while they are still attached. The
    // owner's later geometry disposal remains safe and owns the CPU geometry.
    new Set(emitterAttributes.map(({mesh})=>mesh.geometry)).forEach(geometry=>geometry.dispose());
    glow.dispose();restore.reverse().forEach(fn=>fn());resources.forEach(r=>r.dispose());
  };
}

// A screen-space annotation anchored to an actual positive copper pad.
// Digital data terminals are never used as supply contacts.
export function createVoltageCue(host,{compact=false,nearPad=false,avoidElement=null,featureElement=null,sequence=false}={}){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.classList.add('voltage-cue');svg.setAttribute('aria-hidden','true');
  svg.innerHTML='<path class="voltage-leader voltage-underline" pathLength="1"/><path class="voltage-leader voltage-pointer" pathLength="1"/><circle class="voltage-ring"/><circle class="voltage-dot" r="3"/><text class="voltage-value"/><text class="voltage-mode"/><g class="strip-dimension"><path class="dimension-outline" pathLength="1"/><path class="dimension-line dimension-branch-start" pathLength="1"/><path class="dimension-line dimension-branch-end" pathLength="1"/><path class="dimension-witness dimension-witness-start" pathLength="1"/><path class="dimension-witness dimension-witness-end" pathLength="1"/><path class="dimension-arrows dimension-arrows-start"/><path class="dimension-arrows dimension-arrows-end"/></g>';
  host.append(svg);
  const [path,pointer,ring,dot,label,mode,dimensionGroup]=svg.children;
  const featurePath=document.createElementNS(ns,'path');
  featurePath.setAttribute('class','voltage-leader voltage-feature-source');featurePath.setAttribute('pathLength','1');svg.prepend(featurePath);
  const [dimensionOutline,...dimensionPaths]=dimensionGroup.children;
  const dimensionBranches=dimensionPaths.slice(0,2),dimensionWitnesses=dimensionPaths.slice(2,4),dimensionArrows=dimensionPaths.slice(4,6);
  const witnessHalves=dimensionWitnesses.map(first=>{const second=first.cloneNode();dimensionGroup.append(second);return [first,second];});
  const matrix=new T.Matrix4(),localMatrix=new T.Matrix4(),point=new T.Vector3(),normal=new T.Vector3(),toward=new T.Vector3();
  let activeVoltage=null,activeContact=null,drawProgress=0,placement=null,placementModel=null,activeAnnotation=null,measurement=null,placementKey='',activeAnchor=null,stages=null,featureLink=null;
  const plans=new WeakMap();
  const drawPath=(element,progress)=>{
    element.style.strokeDasharray='1';element.style.strokeDashoffset=String(1-progress);
    element.style.visibility=progress>0?'visible':'hidden';
  };
  function featureAnchor(model,kind){
    const section=model.sectionFrame(Math.max(0,Math.floor(model.specification.sections/2)-1));
    const frame=kind==='cut'?section.startFrame:section.frame;
    const result=new T.Matrix4().makeBasis(frame.x,frame.y,frame.z);
    result.setPosition(frame.p.clone().addScaledVector(frame.x,kind==='edge'?model.specification.width/2:0));
    if(kind==='emitter'){
      const leds=model.group.getObjectByName('LED ceramic base'),candidate=new T.Matrix4(),position=new T.Vector3();let closest=Infinity;
      if(leds)for(let i=0;i<leds.count;i++){
        leds.getMatrixAt(i,candidate);position.setFromMatrixPosition(candidate);
        const distance=position.distanceToSquared(frame.p);if(distance<closest){closest=distance;result.copy(candidate);}
      }
    }
    return result;
  }
  return {
    update(model,product,camera,shot,width,height,powerMode){
      const cue=sequence?sampleDetailCue(product,shot,powerMode):null;
      const opacity=cue?cue.opacity:(shot?.contactLevel??0);
      svg.style.opacity=String(opacity);activeVoltage=null;activeContact=null;measurement=null;
      activeAnchor=null;stages=null;featureLink=null;featurePath.style.visibility='hidden';
      dimensionGroup.style.display='none';
      if(opacity<=0||!model.group.visible){svg.style.opacity='0';drawProgress=0;placement=null;return;}
      const threeInOne=product.id==='3w1',contactIndex=cue?.contactIndex??(threeInOne?powerMode+1:0);
      model.group.updateMatrixWorld(true);camera.updateMatrixWorld(true);
      measurement=cue?.measurement?projectStripDimension(model,camera,{width,height},cue.measurement):null;
      const sectionIndex=Math.max(0,Math.floor(model.specification.sections/2)-1);
      const anchor=measurement?featureAnchor(model,'section'):cue&&cue.anchor!=='contact'?featureAnchor(model,cue.anchor):supplyAnchor(model,contactIndex,sequence?sectionIndex:null);
      if(!anchor){svg.style.opacity='0';return;}
      localMatrix.copy(anchor);
      if(measurement)localMatrix.setPosition(measurement.anchorLocal);
      matrix.multiplyMatrices(model.group.matrixWorld,localMatrix);point.setFromMatrixPosition(matrix);
      normal.setFromMatrixColumn(matrix,2).normalize();toward.copy(camera.position).sub(point).normalize();
      if(!measurement)point.addScaledVector(normal,.16);
      point.project(camera);
      if(normal.dot(toward)<.1||point.z>1||Math.abs(point.x)>.95||Math.abs(point.y)>.95){svg.style.opacity='0';return;}
      activeVoltage=product.voltage;
      activeContact=!cue||cue.anchor==='contact'?model.group.userData.contacts[contactIndex]:null;
      if(activeContact)activeAnchor={name:activeContact,contactIndex,sectionIndex:sequence?sectionIndex:null,
        padIndex:sequence?sectionIndex*model.group.userData.contacts.length*2+contactIndex:null,
        row:sequence?'section-start':'nearest',local:new T.Vector3().setFromMatrixPosition(localMatrix).toArray()};
      const x=measurement?.anchor.x??(point.x*.5+.5)*width,y=measurement?.anchor.y??(-point.y*.5+.5)*height;
      // Reserve clear space above the product instead of covering PCB legends.
      const cueScale=compact?Math.max(.4,Math.min(.65,width/500)):nearPad?Math.min(1,width/850):1;
      let tx=Math.min(36*cueScale,width*.07),ty=Math.min(100*cueScale,height*.14);
      svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
      for(const el of [ring,dot]){el.setAttribute('cx',x);el.setAttribute('cy',y);}
      ring.setAttribute('r',String(6.5*cueScale));
      dot.setAttribute('r',String(3*cueScale));
      const fullLabel=cue?.label??(threeInOne?['LOW · 3 W/m','MEDIUM · 6 W/m','HIGH · 11 W/m'][powerMode]:`+${product.voltage} V DC`);
      const cueTime=shot.cueTime??shot.local;
      const typing=cue?.typing??T.MathUtils.clamp((cueTime-6.2)/.5,0,1);
      drawProgress=cue?.draw??T.MathUtils.clamp((cueTime-6.7)/1.1,0,1);
      const underlineProgress=cue?.underline??drawProgress;
      const pointerProgress=cue?.pointer??drawProgress;
      const endpointProgress=cue?.endpoint??drawProgress*drawProgress;
      const branchProgress=measurement?(cue?.branches??pointerProgress):0;
      const tipProgress=measurement?(cue?.tips??endpointProgress):0;
      const witnessProgress=measurement?(cue?.witnesses??tipProgress):0;
      stages={typing,featureSource:cue?.featureSource??0,featureSourceOpacity:cue?.featureSourceOpacity??0,featureEmphasis:cue?.featureEmphasis??0,underline:underlineProgress,pointer:pointerProgress,endpoint:endpointProgress,branches:branchProgress,tips:tipProgress,witnesses:witnessProgress,highlight:branchProgress};
      label.textContent=fullLabel;mode.textContent=cue?.subline??(threeInOne?`+${product.voltage} V DC  /  ${activeContact}`:'');
      activeAnnotation={label:fullLabel,anchor:cue?.anchor??'contact',index:cue?.index??0};
      const emphasis=!!measurement;
      svg.classList.toggle('measuring',emphasis);
      if(compact||nearPad){label.style.fontSize=(nearPad?(emphasis?25:22):23)*cueScale+'px';mode.style.fontSize=(emphasis?12:11)*cueScale+'px';}
      label.style.fontWeight=emphasis?'600':'500';
      mode.style.letterSpacing=emphasis?'.035em':'.13em';
      const leaderWidth=compact||nearPad?Math.min(width-28,Math.max(label.getComputedTextLength(),mode.getComputedTextLength())+10):(threeInOne?210:140);
      if(nearPad){
        const leftBound=avoidElement?Math.max(14,avoidElement.getBoundingClientRect().right+24-host.getBoundingClientRect().left):14;
        const key=`${product.id}:${cue?.index??0}:${width}:${height}:${leaderWidth.toFixed(2)}:${leftBound.toFixed(2)}`;
        if(sequence){
          let modelPlans=plans.get(model);if(!modelPlans){modelPlans=new Map();plans.set(model,modelPlans);}
          if(!modelPlans.has(key))modelPlans.set(key,planStripCue(model,product,camera,cue,anchor,{width,height,labelWidth:leaderWidth,scale:cueScale,leftBound}));
          placement=modelPlans.get(key);
        }else placement=placeVoltageLabel(model,camera,{width,height,x,y,labelWidth:leaderWidth,twoLines:!!mode.textContent,scale:cueScale,leftBound,raise:emphasis?18*cueScale:0,choice:placementModel===model&&placementKey===key?placement?.choice:-1});
        placementModel=model;placementKey=key;tx=placement.x;ty=placement.y;
      }
      label.setAttribute('x',tx);label.setAttribute('y',ty);
      mode.setAttribute('x',tx);mode.setAttribute('y',ty+27*cueScale);
      // First the voltage/mode, then its underline, then the line to the copper.
      // The real pad remains the anchor as 3w1 moves from L to M to H.
      label.textContent=fullLabel.slice(0,Math.ceil(fullLabel.length*typing));
      mode.style.opacity=String(typing);
      const lineY=ty+9*cueScale,exitX=nearPad?placement.exitX:tx+leaderWidth;
      svg.classList.toggle('feature-linked',!!cue?.featureCue);
      if(cue?.featureCue&&featureElement){
        const iconRect=featureElement.getBoundingClientRect(),hostRect=host.getBoundingClientRect();
        // Desktop films keep the feature row to the left of the stage. Follow
        // its empty gutter, outside all parameter cells, to the caption start.
        // A stacked phone layout has no such gutter; keep its local cue only.
        if(iconRect.right<hostRect.left&&iconRect.width>0){
          const source={x:iconRect.left-hostRect.left+iconRect.width*.5,y:iconRect.top-hostRect.top+iconRect.height*.48};
          const end={x:tx,y:lineY},bendX=Math.min(tx-24,Math.max(14,source.x+60));
          const control1={x:bendX,y:source.y},control2={x:bendX,y:lineY};
          const d=`M ${source.x} ${source.y} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`;
          featurePath.setAttribute('d',d);drawPath(featurePath,cue.featureSource);featurePath.style.strokeOpacity=String(cue.featureSourceOpacity);
          featureLink={source,end,control1,control2,path:d,progress:cue.featureSource,opacity:cue.featureSourceOpacity,iconRect:{x:iconRect.x,y:iconRect.y,width:iconRect.width,height:iconRect.height}};
        }
      }
      path.setAttribute('d',`M ${tx} ${lineY} H ${tx+leaderWidth}`);
      pointer.setAttribute('d',`M ${exitX} ${lineY} L ${x} ${y}`);
      pointer.style.display='';
      drawPath(path,underlineProgress);drawPath(pointer,pointerProgress);
      ring.style.opacity=dot.style.opacity=String(endpointProgress);
      if(measurement){
        dimensionGroup.style.display='';
        dimensionOutline.setAttribute('d',measurement.outline);drawPath(dimensionOutline,branchProgress);
        for(let i=0;i<2;i++){
          dimensionBranches[i].setAttribute('d',measurement.branches[i]);drawPath(dimensionBranches[i],branchProgress);
          for(let half=0;half<2;half++){
            const element=witnessHalves[i][half];
            element.setAttribute('d',measurement.witnessHalfPaths?.[i]?.[half]??'');drawPath(element,witnessProgress);
          }
          dimensionArrows[i].setAttribute('d',measurement.arrowBranches[i]);dimensionArrows[i].style.opacity=String(tipProgress);
        }
        ring.style.opacity=dot.style.opacity='0';
      }
    },
    inspect:()=>({contactVoltage:activeVoltage,contact:activeContact,contactAnchor:activeAnchor,contactDrawProgress:drawProgress,contactPlacement:placement,annotation:activeAnnotation,cueStages:stages,featureLink,measurement:measurement?{...measurement,anchorLocal:measurement.anchorLocal.toArray()}:null}),
    dispose(){svg.remove();}
  };
}
