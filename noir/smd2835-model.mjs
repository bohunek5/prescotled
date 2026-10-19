import * as T from '../konfigurator/vendor/three/build/three.module.min.js';
import {createDeluxArtwork} from './delux-pcb-artwork.mjs';

// Millimetres. Visual reconstruction, with explicit dimensions rather than
// spacing LEDs by an approximate density along a changing helix.
export const SMD2835 = Object.freeze({width:10, thickness:.28, section:62.5, sections:8, ledsPerSection:8, length:500, turns:2.25, height:235});
export const DELUX3W1 = Object.freeze({...SMD2835,section:50,sections:10});

export function createSmd2835Model({anisotropy=4,family='smd',product=null}={}) {
  const delux=family==='3w1',spec=delux?DELUX3W1:SMD2835;
  const ledStart=delux?(1232-1018)/1232*50:6,ledPitch=delux?120/1232*50:50.5/7;
  const group=new T.Group();group.name=delux?'PRESCOT — DELUX 3w1':'PRESCOT — SMD 2835 / 8 LED';
  const resources=new Set(),keep=o=>(resources.add(o),o);
  const material=options=>keep(new T.MeshPhysicalMaterial(options));
  const sweep=SMD2835.turns*Math.PI*2;
  const radius=Math.sqrt(SMD2835.length**2-SMD2835.height**2)/sweep;
  function frame(distance){
    const u=distance/SMD2835.length,angle=(u-.5)*sweep+Math.PI/2;
    const p=new T.Vector3(radius*Math.cos(angle),SMD2835.height*(.5-u),radius*Math.sin(angle));
    const y=new T.Vector3(-radius*sweep*Math.sin(angle),-SMD2835.height,radius*sweep*Math.cos(angle)).normalize();
    const z=new T.Vector3(Math.cos(angle),0,Math.sin(angle));
    const x=new T.Vector3().crossVectors(y,z).normalize();
    return {p,x,y,z};
  }
  const point=(f,x,z)=>f.p.clone().addScaledVector(f.x,x).addScaledVector(f.z,z);
  function stripSurface(x1,x2,z1,z2,{back=false,segments=1600}={}){
    const pos=[],uv=[],indices=[];
    for(let i=0;i<=segments;i++){
      const f=frame(i/segments*SMD2835.length);
      pos.push(...point(f,x1,z1),...point(f,x2,z2));
      // Image rows increase with distance down the PCB (texture V decreases).
      // Match UV handedness to each outward normal: front reverses U, rear
      // keeps U. Both faces then show real lettering, never mirror text.
      uv.push(back?0:1,1-i/segments,back?1:0,1-i/segments);
      if(i<segments){const a=i*2;indices.push(...(back?[a,a+2,a+1,a+1,a+2,a+3]:[a,a+1,a+2,a+1,a+3,a+2]));}
    }
    const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  function mesh(name,geometry,mat){const m=new T.Mesh(geometry,mat);m.name=name;m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
  function roundedShape(w,h,r){
    const s=new T.Shape(),x=-w/2,y=-h/2;
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
    s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
    s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
  }
  function rounded(w,h,depth,r=.1,bevel=.035,hole=null){
    const s=roundedShape(w-2*bevel,h-2*bevel,r);
    if(hole)s.holes.push(roundedShape(hole[0],hole[1],hole[2]));
    const g=keep(new T.ExtrudeGeometry(s,{depth:depth-2*bevel,bevelEnabled:bevel>0,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:5}));
    g.translate(0,0,bevel);return g;
  }
  const basis=new T.Matrix4(),matrix=new T.Matrix4(),quat=new T.Quaternion(),one=new T.Vector3(1,1,1);
  function instances(name,geometry,mat,items){
    const m=new T.InstancedMesh(geometry,mat,items.length);m.name=name;
    items.forEach(({d,x=0,z=0,angle=0},i)=>{
      const f=frame(d);basis.makeBasis(f.x,f.y,f.z);quat.setFromRotationMatrix(basis);
      if(angle)quat.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),angle));
      matrix.compose(point(f,x,z),quat,one);m.setMatrixAt(i,matrix);
    });m.instanceMatrix.needsUpdate=true;m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
  }
  function canvasTexture(canvas){const t=keep(new T.CanvasTexture(canvas));t.colorSpace=T.SRGBColorSpace;t.anisotropy=anisotropy;return t;}
  function printTexture(back=false){
    const c=document.createElement('canvas');c.width=768;c.height=Math.min(4096,Math.round(768*spec.section/10));const ctx=c.getContext('2d');
    ctx.fillStyle=back?'#ecece3':'#f2f2e9';ctx.fillRect(0,0,c.width,c.height);
    ctx.scale(c.width/10,c.height/spec.section);
    // Subtle solder-mask traces; the conductive pads and components are meshes.
    ctx.strokeStyle='#d5d9c9';ctx.lineWidth=.045;
    for(const x of [.4,9.6]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,62.5);ctx.stroke();}
    function text(str,x,y,size,weight=500,rotate=false,color='#344044'){
      ctx.save();ctx.translate(x,y);if(rotate)ctx.rotate(Math.PI/2);ctx.fillStyle=color;ctx.font=`${weight} ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(str,0,0);ctx.restore();
    }
    if(back){
      text(delux?'DELUX 3w1  ·  24 V':'SMD 2835  ·  24 V',5,spec.section*.83,.8,500,true);
    }else{
      ctx.strokeStyle='#65716d';ctx.lineWidth=.045;ctx.setLineDash([.3,.23]);
      for(const y of [.02,spec.section-.02]){ctx.beginPath();ctx.moveTo(.25,y);ctx.lineTo(9.75,y);ctx.stroke();}ctx.setLineDash([]);
      text('+24V',2,3.5,.72,700);text('−',8,3.5,1,700);
      text('+24V',2,59,.72,700);text('−',8,59,1,700);
      text('SMD 2835',8.75,17,.72,600,true);text('Made in Poland',1.3,47,.68,500,true);
      text('CE  RoHS',8.75,44,.85,600,true);
      // Cathode bars sit next to the package, never painted over the emitter.
      ctx.fillStyle='#8b9487';for(let i=0;i<8;i++){const y=6+i*(50.5/7);ctx.fillRect(3.05,y-.75,.1,1.5);}
    }
    // Orient the component-side legends for the front macro shot. Rotate the
    // whole artwork, never individual letters or a mirrored canvas transform.
    let printed=c;
    if(!back){printed=document.createElement('canvas');printed.width=c.width;printed.height=c.height;const pc=printed.getContext('2d');pc.translate(c.width,c.height);pc.rotate(Math.PI);pc.drawImage(c,0,0);}
    const t=canvasTexture(printed);t.wrapT=T.RepeatWrapping;t.repeat.y=spec.sections;return t;
  }
  function microtexture(seed,strength){
    const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),data=ctx.createImageData(256,256);
    for(let i=0;i<data.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=128+((seed>>>24)/255-.5)*strength;data.data[i]=data.data[i+1]=data.data[i+2]=n;data.data[i+3]=255;}
    ctx.putImageData(data,0,0);const t=keep(new T.CanvasTexture(c));t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=anisotropy;return t;
  }
  const boardMat=material({map:printTexture(),color:0xffffff,roughness:.46,clearcoat:.22,clearcoatRoughness:.43});
  const backMat=material({map:printTexture(true),color:0xffffff,roughness:.55,clearcoat:.12});
  const edgeMat=material({color:0xbab89b,roughness:.6});
  const copper=material({color:0xdca36a,metalness:.84,roughness:.27,clearcoat:.24});
  const solder=material({color:0xc2cbcc,metalness:.92,roughness:.25});
  const ceramic=material({color:0xfffdf0,roughness:.27,clearcoat:.35,clearcoatRoughness:.23});
  const cavity=material({color:0xb6aa78,roughness:.58});
  const phosphor=material({color:0xf2bf24,roughness:.48,clearcoat:.12,emissive:0xffd69b,emissiveIntensity:0});
  const resistor=material({color:0x242a29,roughness:.63});
  const ceramicGrain=microtexture(2835,30);ceramic.bumpMap=ceramicGrain;ceramic.bumpScale=.006;
  const phosphorGrain=microtexture(7634,60);phosphor.bumpMap=phosphorGrain;phosphor.bumpScale=.009;
  const maskGrain=microtexture(1357,24);maskGrain.repeat.set(4,80);boardMat.bumpMap=maskGrain;boardMat.bumpScale=.005;backMat.bumpMap=maskGrain;backMat.bumpScale=.005;
  let disposed=false,printLayout=null;
  const ready=delux&&product?createDeluxArtwork(product,spec,{anisotropy}).then(({texture,layout})=>{
    if(disposed){texture.dispose();return;}keep(texture);printLayout=layout;boardMat.map=texture;boardMat.needsUpdate=true;
  }):new Promise((resolve,reject)=>{
    const img=new Image();img.onload=()=>{
      if(disposed){resolve();return;}
      const c=document.createElement('canvas');c.width=768;c.height=Math.min(4096,Math.round(76.8*spec.section));const ctx=c.getContext('2d');ctx.scale(c.width/10,c.height/spec.section);ctx.translate(10,spec.section);ctx.rotate(Math.PI);
      if(delux){ctx.translate(10,0);ctx.rotate(Math.PI/2);ctx.drawImage(img,0,0,50,10);}
      else ctx.drawImage(img,0,0,10,spec.section);
      const t=canvasTexture(c);t.wrapT=T.RepeatWrapping;t.repeat.y=spec.sections;boardMat.map=t;boardMat.needsUpdate=true;resolve();
    };img.onerror=()=>reject(new Error('Nie udało się wczytać oryginalnych nadruków taśmy.'));img.src=new URL(delux?'./media/delux-3w1-pcb-print.svg':'./media/smd2835-pcb-print.svg',import.meta.url).href;
  });
  mesh('White solder mask / front',stripSurface(-5,5,0,0),boardMat);
  mesh('Printed reverse / 0.28 mm PCB',stripSurface(-5,5,-.28,-.28,{back:true}),backMat);
  mesh('PCB edge / left',stripSurface(-5,-5,-.28,0),edgeMat);
  mesh('PCB edge / right',stripSurface(5,5,0,-.28),edgeMat);
  const edgeCopper=material({color:0xc59960,metalness:.65,roughness:.45});
  mesh('Copper layer / left',stripSurface(-5.002,-5.002,-.13,-.095),edgeCopper);
  mesh('Copper layer / right',stripSurface(5.002,5.002,-.095,-.13),edgeCopper);
  // The short exposed cross-sections close both ends of the flexible PCB.
  const cap=keep(new T.PlaneGeometry(10,.28));
  for(const d of [0,SMD2835.length]){
    const f=frame(d),m=mesh(`PCB cut end ${d===0?0:1}`,cap,edgeMat);m.position.copy(point(f,0,-.14));
    basis.makeBasis(f.x,f.z.clone().multiplyScalar(d===0?1:-1),f.y.clone().multiplyScalar(d===0?-1:1));m.quaternion.setFromRotationMatrix(basis);
  }
  const leds=[],resistors=[],pads=[];
  for(let section=0;section<spec.sections;section++){
    const start=section*spec.section;
    for(let i=0;i<8;i++)leds.push({d:start+ledStart+i*ledPitch,z:.07,section,index:i});
    if(delux){
      for(let i=0;i<8;i+=2)resistors.push({d:start+ledStart+(i+.5)*ledPitch,x:0,z:.08,angle:Math.PI/2,section,between:[i,i+1]});
      for(const end of [28/1232*50,1204/1232*50])for(const yc of [393,455,517,579])pads.push({d:start+end,x:5-(yc-360)/26,z:.025});
    }else{
      for(const gap of [1,3,5])resistors.push({d:start+6+(gap+.5)*ledPitch,z:.08});
      for(const end of [1.05,spec.section-1.05])for(const x of [-3,3])pads.push({d:start+end,x,z:.025});
    }
  }
  instances(delux?'Copper solder pads / +24V -L -M -H':'Copper solder pads / +24V and minus',rounded(delux?32/26:2.25,delux?56/1232*50:1.85,.075,.28,.02),copper,pads);
  instances('2835 ceramic base / 3.5 × 2.8 mm',rounded(3.5,2.8,.16,.17,.035),ceramic,leds);
  instances('2835 raised ceramic rim',rounded(3.5,2.8,.57,.17,.035,[2.68,1.98,.2]),ceramic,leds.map(l=>({...l,z:.21})));
  instances('2835 recessed reflector',rounded(2.67,1.97,.075,.18,.01),cavity,leds.map(l=>({...l,z:.36})));
  instances('2835 phosphor / recessed emitting surface',rounded(2.48,1.78,.11,.17,.025),phosphor,leds.map(l=>({...l,z:.43})));
  const terminals=leds.flatMap(l=>[-1,1].map(side=>({...l,x:side*1.78,z:.025})));
  instances('2835 tin terminals',rounded(.38,1.94,.19,.08,.035),solder,terminals);
  const fillet=keep(new T.SphereGeometry(1,16,10,0,Math.PI*2,0,Math.PI/2));fillet.rotateX(Math.PI/2);fillet.scale(.30,.89,.16);
  instances('Curved solder meniscus',fillet,solder,terminals.map(p=>({...p,x:p.x+Math.sign(p.x)*.18,z:.025})));
  // Exposed landing pads beneath the package and a moulded cathode witness.
  instances('Tin landing pads',rounded(.61,2.08,.035,.08,.01),solder,terminals.map(p=>({...p,z:.008})));
  instances('Cathode package mark',keep(new T.BoxGeometry(.085,.68,.018)),material({color:0x737c69,roughness:.6}),leds.map(p=>({...p,x:1.56,z:.785})));
  instances('Resistor ceramic bodies',rounded(1.6,.8,.40,.05,.025),resistor,resistors);
  instances('Resistor end caps',rounded(.3,.84,.43,.04,.025),solder,resistors.flatMap(r=>[-.68,.68].map(offset=>({...r,x:delux?0:offset,d:r.d+(delux?offset:0),z:.065}))));
  const rc=document.createElement('canvas');rc.width=256;rc.height=128;const ri=rc.getContext('2d');ri.fillStyle='#242a29';ri.fillRect(0,0,256,128);ri.fillStyle='#c7cec4';ri.font='58px monospace';ri.textAlign='center';ri.fillText('151',128,85);
  const resistorPrint=material({map:canvasTexture(rc),roughness:.65});
  instances('Resistor laser markings',keep(new T.PlaneGeometry(.95,.53)),resistorPrint,resistors.map(r=>({...r,z:.492})));
  const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;const gc=glowCanvas.getContext('2d');
  const gradient=gc.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,255,255,.85)');gradient.addColorStop(.18,'rgba(255,255,255,.48)');gradient.addColorStop(.42,'rgba(255,255,255,.12)');gradient.addColorStop(1,'rgba(255,255,255,0)');gc.fillStyle=gradient;gc.fillRect(0,0,128,128);
  const glowMat=keep(new T.MeshBasicMaterial({map:canvasTexture(glowCanvas),transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.30,toneMapped:false}));
  const glow=instances('Soft light around each emitter',keep(new T.PlaneGeometry(10,8)),glowMat,leds.map(l=>({...l,z:.81})));glow.castShadow=false;glow.receiveShadow=false;
  // A luminous white core and temperature-coloured spill, including LOW mode.
  // The recessed emitter stays below the ceramic lip; the rim remains visible.
  let lightOn=false,power=1;const refreshLight=()=>{const brightness=Math.sqrt(power);phosphor.emissiveIntensity=lightOn?11*brightness:0;phosphor.color.set(lightOn?0xfff9ed:0xf2bf24);glow.visible=lightOn&&power>0;glowMat.opacity=.85*brightness;};
  refreshLight();
  group.userData={units:'mm',family,specification:spec,ledCount:leds.length,padCount:pads.length,contacts:delux?['+24V','−L','−M','−H']:['+24V','−'],rearPrintMirrored:false,sectionLedCounts:Array.from({length:spec.sections},(_,i)=>leds.filter(l=>l.section===i).length)};
  return {group,frame,ready,specification:spec,
    setLight(on){lightOn=on;refreshLight();},
    setPower(level){power=T.MathUtils.clamp(level,0,1);refreshLight();},
    setTemperature(kelvin){const color=kelvin===3000?0xffd5a2:kelvin===4000?0xffe8c6:0xe5eeff;phosphor.emissive.set(color);glowMat.color.set(color);},
    inspect:()=>({...group.userData,printLayout,componentLayout:delux?{resistorLane:'center',leds:leds.filter(l=>l.section===0).map(l=>({d:l.d,x:l.x??0,angle:l.angle??0})),resistors:resistors.filter(r=>r.section===0).map(r=>({d:r.d,x:r.x,angle:r.angle,between:r.between})),pads:pads.filter(p=>p.d<spec.section).map(p=>({d:p.d,x:p.x,width:32/26,length:56/1232*50}))}:null,meshCount:group.children.length,radiusMm:radius,emissiveIntensity:phosphor.emissiveIntensity,printMarksPerSection:{brand:1,ce:1,rohs:1}}),
    dispose(){disposed=true;resources.forEach(r=>r.dispose());group.removeFromParent();}
  };
}
