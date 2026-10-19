import * as T from '../konfigurator/vendor/three/build/three.module.min.js';

const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const t=clamp(x);return t*t*t*(t*(t*6-15)+10);};
const key=name=>name.startsWith('Copper solder pads')?'contacts':name.startsWith('2835 ceramic base')?'LED ceramic base':name==='2835 raised ceramic rim'?'LED raised ceramic rim':name.startsWith('2835 phosphor')?'LED phosphor':name==='2835 tin terminals'?'LED tin terminals':name==='Curved solder meniscus'?'LED solder fillets':name;

// Match complete packages in order. Additional packages unfold from a nearby
// source position; removed packages fold into the nearest surviving position.
// Every real source/target instance appears exactly once at its endpoint.
function pairs(sourceCount,targetCount){
  const count=Math.max(sourceCount,targetCount),result=[];
  for(let i=0;i<count;i++){
    const source=Math.floor(i*sourceCount/count),target=Math.floor(i*targetCount/count);
    result.push({source,target,sourceVisible:i===0||source!==Math.floor((i-1)*sourceCount/count),targetVisible:i===0||target!==Math.floor((i-1)*targetCount/count)});
  }
  return result;
}

export function createStripRebuild(source,target){
  const group=new T.Group();group.name='Continuous PCB / mechanical reconstruction';
  const materials=[],geometries=[],structures=[],layers=[],printUniforms=[],scratch=new T.Matrix4();
  const position=new T.Vector3(),scale=new T.Vector3(),quaternion=new T.Quaternion(),normal=new T.Vector3(),spin=new T.Quaternion(),spinAxis=new T.Vector3(0,1,0);
  const sourceMeshes=new Map(source.group.children.map(m=>[key(m.name),m]));
  const targetMeshes=new Map(target.group.children.map(m=>[key(m.name),m]));
  const names=new Set([...sourceMeshes.keys(),...targetMeshes.keys()]);
  let progress=0,maxLift=0,updates=0;
  for(const name of names){
    const actualA=sourceMeshes.get(name),actualB=targetMeshes.get(name),a=actualA||actualB,b=actualB||actualA;
    const material=b.material.clone();materials.push(material);
    if(!a.isInstancedMesh){
      const geometry=a.geometry.clone();geometries.push(geometry);
      const m=new T.Mesh(geometry,material);m.name=a.name;m.position.copy(a.position);m.quaternion.copy(a.quaternion);m.castShadow=a.castShadow;m.receiveShadow=a.receiveShadow;group.add(m);
      structures.push({mesh:m,a,b,visibleA:!!actualA&&a.visible,visibleB:!!actualB&&b.visible,sourcePosition:a.geometry.attributes.position.array,targetPosition:b.geometry.attributes.position.array,sourceNormal:a.geometry.attributes.normal.array,targetNormal:b.geometry.attributes.normal.array});
      if(a.material.map&&b.material.map){
        material.map=a.material.map;
        const uniforms={rebuildAmount:{value:0},otherPrint:{value:b.material.map},otherRepeat:{value:b.material.map.repeat.y/a.material.map.repeat.y},sourceRepeat:{value:a.material.map.repeat.y}};
        printUniforms.push(uniforms);
        material.onBeforeCompile=shader=>{
          Object.assign(shader.uniforms,uniforms);
          shader.fragmentShader='uniform float rebuildAmount; uniform sampler2D otherPrint; uniform float otherRepeat; uniform float sourceRepeat;\n'+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('vec4 sampledDiffuseColor = texture2D( map, vMapUv );',`
            float alongPCB=1.-vMapUv.y/sourceRepeat;
            float localRebuild=clamp((rebuildAmount-.22*alongPCB)/.78,0.,1.);
            vec4 sampledDiffuseColor=mix(texture2D(map,vMapUv),texture2D(otherPrint,vec2(vMapUv.x,vMapUv.y*otherRepeat)),smoothstep(.35,.65,localRebuild));
          `));
        };
        material.customProgramCacheKey=()=>`pcb-rebuild-print-${source.specification.sections}-${target.specification.sections}`;
      }
      continue;
    }
    const resistor=a.name.startsWith('Resistor'),contacts=name==='contacts';
    const sourceUnits=a.count,targetUnits=b.count,parts=1;
    a.geometry.computeBoundingBox();b.geometry.computeBoundingBox();
    const sourceSize=a.geometry.boundingBox.getSize(new T.Vector3()),targetSize=b.geometry.boundingBox.getSize(new T.Vector3());
    const ratio=new T.Vector3(...['x','y','z'].map(axis=>targetSize[axis]>.00001?sourceSize[axis]/targetSize[axis]:1));
    const data=[];
    for(const pair of pairs(sourceUnits,targetUnits))for(let part=0;part<parts;part++){
      const p0=new T.Vector3(),q0=new T.Quaternion(),s0=new T.Vector3(),p1=new T.Vector3(),q1=new T.Quaternion(),s1=new T.Vector3();
      a.getMatrixAt(pair.source*parts+part,scratch);scratch.decompose(p0,q0,s0);s0.multiply(ratio);
      b.getMatrixAt(pair.target*parts+part,scratch);scratch.decompose(p1,q1,s1);
      const n0=new T.Vector3(0,0,1).applyQuaternion(q0),n1=new T.Vector3(0,0,1).applyQuaternion(q1);
      data.push({...pair,sourceVisible:!!actualA&&pair.sourceVisible,targetVisible:!!actualB&&pair.targetVisible,p0,p1,q0,q1,s0,s1,n0,n1,along:clamp(.5-(p0.y+p1.y)/2/source.specification.height)});
    }
    let lift=8;
    if(contacts)lift=4;
    else if(resistor)lift=6;
    else if(/rim|Cathode/.test(a.name))lift=12;
    else if(/phosphor|Soft light/.test(a.name))lift=16;
    else if(/reflector/.test(a.name))lift=10;
    else if(/terminal|solder|landing/i.test(a.name))lift=4.5;
    const m=new T.InstancedMesh(b.geometry,material,data.length);m.name=a.name;m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.frustumCulled=false;m.castShadow=a.castShadow;m.receiveShadow=a.receiveShadow;group.add(m);
    layers.push({mesh:m,data,lift,sourceMaterial:a.material,targetMaterial:b.material,visible:a.visible&&b.visible});
  }
  function update(value){
    progress=clamp(value);maxLift=0;updates++;
    printUniforms.forEach(u=>{u.rebuildAmount.value=progress;});
    const blend=ease(progress);
    for(const item of structures){
      const {mesh,a,b,sourcePosition:pa,targetPosition:pb,sourceNormal:na,targetNormal:nb}=item;
      mesh.visible=blend<.5?item.visibleA:item.visibleB;
      if(pa.length===pb.length){
        const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
        for(let i=0;i<pa.length;i++){p.array[i]=T.MathUtils.lerp(pa[i],pb[i],blend);n.array[i]=T.MathUtils.lerp(na[i],nb[i],blend);}
        p.needsUpdate=n.needsUpdate=true;mesh.geometry.computeBoundingSphere();
      }
      mesh.position.copy(a.position).lerp(b.position,blend);mesh.quaternion.copy(a.quaternion).slerp(b.quaternion,blend);
      mesh.material.color.copy(a.material.color).lerp(b.material.color,blend);
    }
    for(const layer of layers){
      const {mesh,data,lift,sourceMaterial:a,targetMaterial:b}=layer;
      mesh.material.color.copy(a.color).lerp(b.color,ease(progress));
      mesh.material.opacity=T.MathUtils.lerp(a.opacity,b.opacity,ease(progress));
      if(mesh.material.emissive){mesh.material.emissive.copy(a.emissive).lerp(b.emissive,ease(progress));mesh.material.emissiveIntensity=T.MathUtils.lerp(a.emissiveIntensity,b.emissiveIntensity,ease(progress));}
      // Honour the emitter on/off control while parts are in flight.
      if(mesh.material.isMeshBasicMaterial)mesh.visible=layer.visible;
      data.forEach((item,i)=>{
        const local=clamp((progress-.22*item.along)/.78),travel=ease((local-.12)/.76);
        const arc=Math.sin(Math.PI*local)**2,offset=arc*lift;maxLift=Math.max(maxLift,offset);
        position.copy(item.p0).lerp(item.p1,travel);
        normal.copy(item.n0).lerp(item.n1,travel).normalize();position.addScaledVector(normal,offset);
        quaternion.copy(item.q0).slerp(item.q1,travel);
        spin.setFromAxisAngle(spinAxis,arc*.18*(i%2?1:-1));quaternion.multiply(spin);
        const unfolding=item.sourceVisible?1:ease((local-.14)/.28),folding=item.targetVisible?1:1-ease((local-.58)/.28);
        scale.copy(item.s0).lerp(item.s1,travel).multiplyScalar(Math.max(.000001,unfolding*folding));
        scratch.compose(position,quaternion,scale);mesh.setMatrixAt(i,scratch);
      });mesh.instanceMatrix.needsUpdate=true;
    }
  }
  update(0);
  return {group,update,inspect:()=>({progress,maxLift,updates,from:source.group.userData.family,to:target.group.userData.family,instances:layers.reduce((n,l)=>n+l.data.length,0),continuousPCB:true}),dispose(){materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());group.removeFromParent();}};
}
