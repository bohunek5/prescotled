import * as T from '../konfigurator/vendor/three/build/three.module.min.js';

// Open natural ends of the same curved strip: no clipping, detachment or layer explosion.
export function createWcobSectionDetail(model,product){
  const spec=model.specification,resources=new Set(),keep=v=>(resources.add(v),v);
  const group=new T.Group();group.name='WCOB / continuous ribbon open ends';
  const originalCaps=model.group.getObjectByName('WCOB opaque end faces');
  const capsVisible=originalCaps.visible;originalCaps.visible=false;
  const milk=keep(new T.MeshPhysicalMaterial({color:0xf4f3ec,roughness:.52,side:T.DoubleSide}));
  const ceramic=keep(new T.MeshPhysicalMaterial({color:0xfffcf0,roughness:.38}));
  const phosphor=keep(new T.MeshPhysicalMaterial({color:0xf4d678,roughness:.5}));
  const half=spec.width/2,top=5-spec.thickness,innerHalf=spec.width*.18125;
  const inner=[[-innerHalf,.08],[-innerHalf,1.65],[-innerHalf+.1,1.85],[-innerHalf+.3,1.95],
    [innerHalf-.3,1.95],[innerHalf-.1,1.85],[innerHalf,1.65],[innerHalf,.08]];
  const local=(d,x=0,z=0)=>{const f=model.frame(d);return f.p.clone().addScaledVector(f.x,x).addScaledVector(f.z,z);};
  const add=(name,g,mat)=>{const m=new T.Mesh(keep(g),mat);m.name=name;m.castShadow=m.receiveShadow=true;group.add(m);return m;};
  const outline=[];
  for(let i=0;i<=32;i++){const a=i/32*Math.PI;outline.push(new T.Vector2(-Math.cos(a)*half,.08+Math.sin(a)*(top-.08)));}
  inner.slice().reverse().forEach(([x,z])=>outline.push(new T.Vector2(x,z)));
  const template=new T.ShapeGeometry(new T.Shape(outline));
  for(const d of [0,spec.length]){
    const geometry=template.clone(),positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){const p=local(d,positions.getX(i),positions.getY(i));positions.setXYZ(i,...p);}
    geometry.computeVertexNormals();add('Natural open end / milky silicone arch',geometry,milk);
  }
  template.dispose();
  // Interior proportions trace the source drawing, not undocumented routing.
  for(const start of [0,spec.length-spec.section]){
    const positions=[],indices=[],rows=48;
    for(let row=0;row<=rows;row++)for(const [x,z] of inner)positions.push(...local(start+spec.section*row/rows,x,z));
    for(let row=0;row<rows;row++)for(let col=0;col<inner.length-1;col++){
      const a=row*inner.length+col,b=a+inner.length;indices.push(a,b,a+1,a+1,b,b+1);
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    add('Continuous inner channel / natural end',geometry,milk);
  }
  const capacity=spec.ledsPerSection,packages=[],body=keep(new T.BoxGeometry(2,1.6,.23)),light=keep(new T.BoxGeometry(1.45,1.05,.06));
  let count=capacity;
  for(const [name,geometry,mat,z] of [['SMD 2016 bodies',body,ceramic,.155],['SMD 2016 phosphor',light,phosphor,.3]]){
    const mesh=keep(new T.InstancedMesh(geometry,mat,capacity*2));mesh.name=name;
    mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);packages.push({mesh,z});
  }
  function setCount(next){
    count=Math.max(1,Math.min(capacity,next));
    for(const {mesh,z} of packages){
      mesh.count=count*2;
      for(const [end,start] of [0,spec.length-spec.section].entries())for(let i=0;i<count;i++){
        const d=end===1&&i===count-1?spec.length-.8:start+(i+.5)*spec.section/count,f=model.frame(d),matrix=new T.Matrix4().makeBasis(f.x,f.y,f.z);
        matrix.setPosition(local(d,0,z));mesh.setMatrixAt(end*count+i,matrix);
      }
      mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
    }
  }
  setCount(count);
  const end=spec.length,anchors={cover:local(end-.03,0,top-.6),emitters:local(end-.30,0,.33),
    pcb:local(end-.03,half*.75,0),backing:local(end-.03,0,-spec.thickness)};
  let progress=0,disposed=false;
  const anchor=(name,world=false)=>{const p=anchors[name]?.clone();if(world&&p){group.updateMatrixWorld(true);p.applyMatrix4(group.matrixWorld);}return p;};
  return {group,anchor,update(value,{product:activeProduct=product}={}){
      progress=Math.max(0,Math.min(1,Number(value)||0));
      const next=Math.max(1,Math.round(Number(activeProduct.density)*spec.section/1000));
      if(next!==count)setCount(next);
    },
    inspect:()=>({productId:product.id,progress,phase:'continuous-open-end',active:progress>0,detach:0,spread:0,
      sourceCutActive:false,continuous:true,naturalEnd:end,backingUVPreserved:true,ledsPerSection:count,
      anchorsLocal:Object.fromEntries(Object.entries(anchors).map(([key,p])=>[key,p.toArray()])),
      sourceProof:{crossSection:'assets/tasmy-2026/karty/984266776ec188ef.pdf#page=2',widthMm:8,totalHeightMm:5,package:'SMD2016',illustrativeInterior:true}}),
    dispose(){if(disposed)return;disposed=true;originalCaps.visible=capsVisible;group.removeFromParent();resources.forEach(r=>r.dispose());}};
}
