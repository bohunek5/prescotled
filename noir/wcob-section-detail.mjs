import * as T from '../konfigurator/vendor/three/build/three.module.min.js';
import {temperatureColor} from './strip-light-program.mjs';

const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
const supported=new Set(['wcob','wcobcct']);

// An explanatory section, traced from the original 8 × 5 mm WCOB card.
// SMD2016 and the package count are documented. Hidden routing, resistors,
// copper weight and physical layer thicknesses are deliberately not asserted.
export function createWcobSectionDetail(model,product){
  if(!supported.has(product.id))throw new Error('WCOB section detail requires WCOB MONO or CCT.');
  const spec=model.specification;
  const section=model.sectionFrame(Math.max(0,Math.floor(spec.sections/2)-1));
  const middle=section.frame,basis=new T.Matrix4().makeBasis(middle.x,middle.y,middle.z);
  basis.setPosition(middle.p);
  const inverse=basis.clone().invert(),resources=new Set(),replacements=[];
  const keep=value=>(resources.add(value),value);
  const group=new T.Group();group.name='WCOB / one cut section detail';group.visible=false;
  const segment=new T.Group();segment.name='Detached original 25 mm section';group.add(segment);
  const layers={cover:new T.Group(),emittersPCB:new T.Group(),backing:new T.Group()};
  for(const [name,layer] of Object.entries(layers)){layer.name=`WCOB layer / ${name}`;segment.add(layer);}
  const active={value:0},range={value:new T.Vector2(section.start,section.end)};
  const local=(d,x=0,z=0)=>{
    const f=model.frame(d);
    return f.p.clone().addScaledVector(f.x,x).addScaledVector(f.z,z).applyMatrix4(inverse);
  };
  const material=options=>keep(new T.MeshPhysicalMaterial(options));
  const milk=material({color:0xf4f3ec,roughness:.48,clearcoat:.16,side:T.DoubleSide});
  const pcbBack=material({color:0xeeeede,roughness:.6,side:T.DoubleSide});
  const ceramic=material({color:0xfffcf0,roughness:.38,clearcoat:.15});
  const emitter=material({color:0xf4d678,roughness:.5});
  const sourceMeshes=[...model.group.children].filter(mesh=>mesh.isMesh&&(
    ['White solder mask / front','Printed reverse / 0.28 mm PCB','PCB edge / left','PCB edge / right'].includes(mesh.name)||
    mesh.name==='WCOB opaque diffuser phosphor cover'));
  let progress=0,phase='rest',disposed=false,spread=0,detach=0;

  function sourceTransform(mesh){
    mesh.updateMatrix();const result=mesh.matrix.clone();
    if(mesh.isInstancedMesh){const instance=new T.Matrix4();mesh.getMatrixAt(0,instance);result.multiply(instance);}
    return result;
  }
  // Recover the physical arc distance by projection onto the strip's centre
  // curve. Its tangent is unit length; lateral and normal offsets cancel.
  function arcDistance(point){
    let d=T.MathUtils.clamp((.5-point.y/spec.height)*spec.length,0,spec.length);
    for(let i=0;i<7;i++){
      const f=model.frame(d),step=point.clone().sub(f.p).dot(f.y);
      d=T.MathUtils.clamp(d+step,0,spec.length);
      if(Math.abs(step)<1e-7)break;
    }
    return d;
  }
  function cutShader(shader){
    shader.uniforms.wcobSectionActive=active;shader.uniforms.wcobSectionRange=range;
    shader.vertexShader='attribute float wcobArcDistance; varying float vWcobArcDistance;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWcobArcDistance=wcobArcDistance;');
    shader.fragmentShader='uniform float wcobSectionActive; uniform vec2 wcobSectionRange; varying float vWcobArcDistance;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('void main() {',`void main() {
      if(wcobSectionActive>.5&&vWcobArcDistance>wcobSectionRange.x&&vWcobArcDistance<wcobSectionRange.y)discard;
    `);
  }
  function installCut(mesh){
    const original={geometry:mesh.geometry,material:mesh.material,depth:mesh.customDepthMaterial};
    const transform=sourceTransform(mesh),geometry=keep(original.geometry.clone());
    // The existing lighting controller owns these dynamic attributes.
    for(const name of ['stripLightColor','stripLightStrength']){
      const attribute=original.geometry.getAttribute(name);if(attribute)geometry.setAttribute(name,attribute);
    }
    const positions=geometry.getAttribute('position'),distances=new Float32Array(positions.count),point=new T.Vector3();
    for(let i=0;i<positions.count;i++)distances[i]=arcDistance(point.fromBufferAttribute(positions,i).applyMatrix4(transform));
    geometry.setAttribute('wcobArcDistance',new T.BufferAttribute(distances,1));
    const visibleMaterial=keep(original.material.clone()),previousCompile=original.material.onBeforeCompile;
    visibleMaterial.onBeforeCompile=(shader,renderer)=>{previousCompile.call(visibleMaterial,shader,renderer);cutShader(shader);};
    visibleMaterial.customProgramCacheKey=()=>original.material.customProgramCacheKey.call(original.material)+'-wcob-section-cut-v1';
    const depth=keep(new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,side:original.material.side}));
    depth.onBeforeCompile=cutShader;depth.customProgramCacheKey=()=>'wcob-section-depth-v1';
    mesh.geometry=geometry;mesh.material=visibleMaterial;mesh.customDepthMaterial=depth;
    replacements.push({mesh,original,visibleMaterial,transform});
    return {geometry,transform,original};
  }
  function interpolate(a,b,t){
    return {p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize(),uv:a.uv.clone().lerp(b.uv,t),d:a.d+(b.d-a.d)*t};
  }
  function clip(vertices,boundary,lower){
    const result=[];
    for(let i=0;i<vertices.length;i++){
      const a=vertices[i],b=vertices[(i+1)%vertices.length];
      const insideA=lower?a.d>=boundary:a.d<=boundary,insideB=lower?b.d>=boundary:b.d<=boundary;
      if(insideA)result.push(a);
      if(insideA!==insideB)result.push(interpolate(a,b,(boundary-a.d)/(b.d-a.d)));
    }
    return result;
  }
  // Preserve actual curved vertices and UVs, including the original 3M print.
  // Triangle clipping makes the two ends coincide with real cut boundaries.
  function slice(geometry,transform){
    const matrix=inverse.clone().multiply(transform),normalMatrix=new T.Matrix3().getNormalMatrix(matrix);
    const source=geometry.attributes,index=geometry.index;
    const position=[],normal=[],uv=[];
    const read=i=>({p:new T.Vector3().fromBufferAttribute(source.position,i).applyMatrix4(matrix),
      n:new T.Vector3().fromBufferAttribute(source.normal,i).applyNormalMatrix(normalMatrix),
      uv:source.uv?new T.Vector2().fromBufferAttribute(source.uv,i):new T.Vector2(),d:source.wcobArcDistance.getX(i)});
    for(let offset=0;offset<(index?.count??source.position.count);offset+=3){
      const ids=[0,1,2].map(i=>index?index.getX(offset+i):offset+i);
      const ds=ids.map(i=>source.wcobArcDistance.getX(i));
      if(Math.max(...ds)<section.start||Math.min(...ds)>section.end)continue;
      let vertices=clip(ids.map(read),section.start,true);vertices=clip(vertices,section.end,false);
      for(let i=1;i<vertices.length-1;i++)for(const vertex of [vertices[0],vertices[i],vertices[i+1]]){
        position.push(...vertex.p);normal.push(...vertex.n);uv.push(...vertex.uv);
      }
    }
    const result=keep(new T.BufferGeometry());
    result.setAttribute('position',new T.Float32BufferAttribute(position,3));
    result.setAttribute('normal',new T.Float32BufferAttribute(normal,3));
    result.setAttribute('uv',new T.Float32BufferAttribute(uv,2));result.computeBoundingBox();
    return result;
  }
  function mesh(name,geometry,mat,parent){
    const result=new T.Mesh(geometry,mat);result.name=name;result.castShadow=result.receiveShadow=true;parent.add(result);return result;
  }
  let backingMaterial;
  for(const source of sourceMeshes){
    const {geometry,transform,original}=installCut(source),cut=slice(geometry,transform);
    if(source.name==='WCOB opaque diffuser phosphor cover')mesh('Original curved milky outer surface',cut,milk,layers.cover);
    else if(source.name.startsWith('Printed reverse')){
      backingMaterial=keep(original.material.clone());backingMaterial.side=T.DoubleSide;
      mesh('Original 3M release liner / preserved UV',cut,backingMaterial,layers.backing);
      mesh('Underside of PCB',cut,pcbBack,layers.emittersPCB).position.z=.01;
    }else{
      const mat=keep(original.material.clone());mat.side=T.DoubleSide;
      mesh(source.name,cut,mat,layers.emittersPCB);
    }
  }

  // Interior silhouette follows the source drawing's open-bottom channel.
  // These proportions explain construction; they are not layer measurements.
  const half=spec.width/2,coverTop=5-spec.thickness,innerHalf=spec.width*.18125;
  const inner=[[-innerHalf,.08],[-innerHalf,1.65],[-innerHalf+.1,1.85],[-innerHalf+.3,1.95],
    [innerHalf-.3,1.95],[innerHalf-.1,1.85],[innerHalf,1.65],[innerHalf,.08]];
  const underside=[[-half,.08],...inner,[half,.08]];
  const vertices=[],indices=[],rows=80;
  for(let row=0;row<=rows;row++)for(const [x,z] of underside)vertices.push(...local(section.start+section.length*row/rows,x,z));
  for(let row=0;row<rows;row++)for(let col=0;col<underside.length-1;col++){
    const a=row*underside.length+col,b=a+underside.length;indices.push(a,b,a+1,a+1,b,b+1);
  }
  const inside=keep(new T.BufferGeometry());inside.setAttribute('position',new T.Float32BufferAttribute(vertices,3));inside.setIndex(indices);inside.computeVertexNormals();
  mesh('Milky cover / channel from original cross-section',inside,milk,layers.cover);
  const outline=[];
  for(let i=0;i<=32;i++){const a=i/32*Math.PI;outline.push(new T.Vector2(-Math.cos(a)*half,.08+Math.sin(a)*(coverTop-.08)));}
  inner.slice().reverse().forEach(([x,z])=>outline.push(new T.Vector2(x,z)));
  const faceTemplate=new T.ShapeGeometry(new T.Shape(outline));
  for(const d of [section.start,section.end]){
    const geometry=keep(faceTemplate.clone()),positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){const p=local(d,positions.getX(i),positions.getY(i));positions.setXYZ(i,...p);}
    geometry.computeVertexNormals();mesh('Cut face / original WCOB outline',geometry,milk,layers.cover);
  }
  faceTemplate.dispose();

  function packageGeometry(w,h,depth,radius){
    const shape=new T.Shape(),x=-w/2,y=-h/2,r=radius;
    shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);
    shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
    return keep(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:5,steps:1}));
  }
  const count=spec.ledsPerSection,bodyGeometry=packageGeometry(2,1.6,.23,.12),phosphorGeometry=packageGeometry(1.45,1.05,.06,.09);
  const bodies=keep(new T.InstancedMesh(bodyGeometry,ceramic,count)),emitters=keep(new T.InstancedMesh(phosphorGeometry,emitter,count));
  bodies.name='SMD2016 / documented count, illustrative placement';emitters.name='SMD2016 phosphor';
  for(let i=0;i<count;i++){
    const d=section.start+(i+.5)*section.length/count,f=model.frame(d);
    const transform=new T.Matrix4().makeBasis(f.x,f.y,f.z);
    for(const [instance,z] of [[bodies,.04],[emitters,.28]]){
      transform.setPosition(f.p.clone().addScaledVector(f.z,z));instance.setMatrixAt(i,inverse.clone().multiply(transform));
    }
  }
  for(const instance of [bodies,emitters]){instance.instanceMatrix.needsUpdate=true;instance.castShadow=instance.receiveShadow=true;layers.emittersPCB.add(instance);}
  const originals=sourceMeshes.map(mesh=>({name:mesh.name,triangles:mesh.geometry.index?.count/3||mesh.geometry.attributes.position.count/3}));
  const sourceProof={crossSection:'assets/tasmy-2026/karty/984266776ec188ef.pdf#page=2',
    cct:'assets/tasmy-2026/karty/6efc2297c3a940a1.pdf#page=2',
    photo:'Downloads/24WCOB320 4.jpg',package:'SMD2016',sectionMm:25,widthMm:8,totalHeightMm:5,
    illustrativeInterior:true,hiddenLayoutConfirmed:false,siliconeMaterial:'owner instruction'};
  const middleEmitter=section.start+(Math.floor(count/2)+.5)*section.length/count;
  const referenceAnchors={cover:local(section.center,0,coverTop),emitters:local(middleEmitter,0,.34),
    pcb:local(section.center,half*.8,0),backing:local(section.center,0,-spec.thickness)};
  const anchorLayer={cover:'cover',emitters:'emittersPCB',pcb:'emittersPCB',backing:'backing'};
  function anchor(name,world=false){
    const point=referenceAnchors[name];if(!point)return null;
    group.updateMatrixWorld(true);
    const result=point.clone().applyMatrix4(layers[anchorLayer[name]].matrixWorld);
    return world?result:result.applyMatrix4(group.matrixWorld.clone().invert());
  }
  function bounds(root=segment){
    group.updateMatrixWorld(true);const result=new T.Box3(),inverseGroup=group.matrixWorld.clone().invert();
    root.traverse(object=>{
      if(!object.isMesh||object.isInstancedMesh)return;
      object.geometry.computeBoundingBox();const box=object.geometry.boundingBox,matrix=inverseGroup.clone().multiply(object.matrixWorld);
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])result.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(matrix));
    });
    return {min:result.min.toArray(),max:result.max.toArray()};
  }
  function update(value,{lightLevel=0,kelvin=product.color}={}){
    if(disposed)return;
    progress=clamp(Number(value)||0);const visible=progress>0&&progress<1;
    active.value=visible?1:0;group.visible=visible;
    detach=smooth(progress/.15)*(1-smooth((progress-.85)/.15));
    const front=smooth((progress-.15)/.2)*(1-smooth((progress-.85)/.15));
    spread=smooth((progress-.35)/.15)*(1-smooth((progress-.65)/.2));
    phase=!visible?'rest':progress<.15?'detach':progress<.35?'front':progress<.65?'separate':progress<.85?'assemble':'return';
    segment.position.copy(middle.p).addScaledVector(middle.z,6*detach).addScaledVector(middle.x,4*detach);
    segment.quaternion.setFromRotationMatrix(basis).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),.32*front));
    layers.cover.position.set(8*spread,0,3*spread);
    layers.backing.position.set(-8*spread,0,-2*spread);layers.backing.rotation.x=Math.PI*spread;
    // The closed cover becomes a continuous light surface. Packages are
    // visible only while the explanatory layer separation exposes them.
    const strength=clamp(Number(lightLevel)||0),color=temperatureColor(kelvin);
    milk.emissive.copy(color);milk.emissiveIntensity=strength*1.3;
    emitter.emissive.copy(color);emitter.emissiveIntensity=strength*2.2;
    for(const {original,visibleMaterial} of replacements){
      visibleMaterial.color.copy(original.material.color);
      if(visibleMaterial.emissive){visibleMaterial.emissive.copy(original.material.emissive);visibleMaterial.emissiveIntensity=original.material.emissiveIntensity;}
    }
    group.updateMatrixWorld(true);
  }
  update(0);
  return {group,update,anchor,
    inspect:()=>({productId:product.id,progress,phase,active:group.visible,detach,spread,
      section:{index:section.index,start:section.start,end:section.end,length:section.length,leds:count},
      layerOffsets:Object.fromEntries(Object.entries(layers).map(([name,layer])=>[name,layer.position.toArray()])),
      anchorsLocal:Object.fromEntries(Object.keys(referenceAnchors).map(name=>[name,anchor(name).toArray()])),
      anchorsWorld:Object.fromEntries(Object.keys(referenceAnchors).map(name=>[name,anchor(name,true).toArray()])),
      boundsLocal:bounds(),layerBoundsLocal:Object.values(layers).map(layer=>bounds(layer)),sourceProof,originals,sourceCutActive:active.value===1,backingUVPreserved:true}),
    dispose(){
      if(disposed)return;disposed=true;active.value=0;
      for(const {mesh,original} of replacements){mesh.geometry=original.geometry;mesh.material=original.material;mesh.customDepthMaterial=original.depth;}
      group.removeFromParent();resources.forEach(resource=>resource.dispose());
    }};
}
