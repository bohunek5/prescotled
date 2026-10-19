import * as T from '../konfigurator/vendor/three/build/three.module.min.js';
import {createSmd2835Model} from './smd2835-model.mjs?v=detail-3';
import {createBackingTexture} from './strip-backing.mjs';
import {filmProducts} from './film-catalog.mjs';
import {applyPcbFinish} from './pcb-finish.mjs';
import {installStripLighting} from './strip-lighting.mjs?v=detail-3';
import {stripAppearance,unlitEmitterColor} from './strip-appearance.mjs';
import {createDeluxArtwork,sectionFrame} from './delux-pcb-artwork.mjs?v=detail-3';

// Reuse the supplied vector artwork; no text approximation of the brand or CE.
let marksPromise;
function loadMarks(){
  return marksPromise??=Promise.all(['strip-brand-mark','strip-ce-mark'].map(name=>new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;
    image.src=new URL(`./media/${name}.svg`,import.meta.url).href;
  })));
}
const number=value=>Number(String(value).replace(',','.'));

export function createCatalogStrip(product,{anisotropy=4,backingInk}={}){
  // Alternating inks are a presentation choice, not a verified SKU attribute.
  const appearance=stripAppearance(product);
  const ink=backingInk??appearance.backingInk??(filmProducts.findIndex(p=>p.id===product.id)%2===1?'green':'red');
  const model=createCatalogGeometry(product,{anisotropy});
  model.sectionFrame=index=>sectionFrame(model.specification,model.frame,index);
  const disposeFinish=applyPcbFinish(model,anisotropy);
  const disposeLighting=installStripLighting(model,product);
  let disposed=false,backing;
  const dispose=model.dispose;
  model.dispose=()=>{disposed=true;backing?.dispose();disposeLighting();disposeFinish();dispose();};
  model.ready=Promise.all([model.ready,createBackingTexture(model.specification,{anisotropy,ink,registrationMarks:appearance.opaqueFront}).then(map=>{
    if(disposed){map.dispose();return;}
    backing=map;
    const material=model.group.getObjectByName('Printed reverse / 0.28 mm PCB').material;
    material.map=map;material.color.set(0xffffff);material.roughness=.65;material.clearcoat=0;material.needsUpdate=true;
    Object.assign(model.group.userData,{backingInk:ink,backingArtwork:'3M official media gallery',backingAssignment:appearance.opaqueFront?'WCOB source photograph':'presentation',rearPrintMirrored:false});
  })]);
  return model;
}

function createCatalogGeometry(product,{anisotropy=4}={}){
  if(product.id==='3w1'||product.id==='smd'){
    const model=createSmd2835Model({family:product.id,anisotropy,product});
    model.group.userData.productId=product.id;
    model.group.userData.sleeve=false;
    model.group.userData.construction='smd';
    model.group.userData.packageSize=[3.5,2.8];
    return model;
  }
  const appearance=stripAppearance(product),opaque=appearance.opaqueFront,sealed=appearance.sealedFront;
  const cob=product.tech.includes('COB')||opaque,digital=product.digital,freeCut=product.id.startsWith('cobfreecut'),sshape=product.id==='sshape';
  const density=number(product.density),width=number(product.width),catalogCut=number(product.cut);
  const count=Math.max(1,Math.round(density*catalogCut/1000));
  // Whole packages and exact density take precedence over rounded cut labels.
  const section=cob?(freeCut?50:catalogCut):count*1000/density;
  const sections=Math.max(1,Math.round(500/section)),length=section*sections;
  const spec={width,thickness:.28,section,sections,ledsPerSection:count,length,turns:2.25,height:235};
  // Original WCOB MONO/CCT datasheets specify an 8 × 5 mm section, measured
  // from the flat reverse to the crown of its opaque silicone diffuser.
  const wcobTopHeight=5-spec.thickness;
  const sweep=spec.turns*Math.PI*2,radius=Math.sqrt(length*length-spec.height*spec.height)/sweep;
  const group=new T.Group();group.name=`${product.range} ${product.name}`;
  const resources=new Set(),keep=v=>(resources.add(v),v),material=o=>keep(new T.MeshPhysicalMaterial(o));
  let disposed=false,lightOn=false;
  function baseFrame(d){
    const u=d/length,a=(u-.5)*sweep+Math.PI/2;
    const p=new T.Vector3(radius*Math.cos(a),spec.height*(.5-u),radius*Math.sin(a));
    const y=new T.Vector3(-radius*sweep*Math.sin(a),-spec.height,radius*sweep*Math.cos(a)).normalize();
    const z=new T.Vector3(Math.cos(a),0,Math.sin(a)),x=new T.Vector3().crossVectors(y,z).normalize();
    return {p,x,y,z};
  }
  const pitch=1000/density;
  const frame=baseFrame;
  // S-Shape has a straight component axis and alternating edge cutouts. Trace
  // the original EF018-050-6-XX drawing (page 2), rather than wavering the LEDs.
  // Source drawing: x=16..854 is one 50 mm section, y=7..127 is the 6 mm PCB.
  const sShapeOutline=sshape?{
    source:'EF018-050-6-XX.pdf, page 2',
    upper:[[16,7],[118,7],[124,16],[173,16],[178,18],[184,24],[212,70],[216,73],[228,73],[231,70],[259,25],[266,18],[270,16],[317,16],[324,7],[424,7],[430,12],[447,55],[452,59],[462,59],[466,57],[488,25],[493,20],[501,16],[550,16],[562,24],[586,58],[599,59],[604,54],[622,7],[667,7],[675,16],[724,16],[729,18],[739,30],[764,71],[767,73],[779,73],[784,66],[807,7],[854,7]],
    lower:[[16,127],[119,127],[123,125],[126,121],[141,83],[144,77],[147,75],[160,76],[185,111],[196,118],[248,117],[259,108],[282,76],[294,75],[299,79],[318,127],[423,127],[428,118],[478,118],[484,115],[491,106],[514,68],[520,61],[534,62],[565,111],[570,116],[575,118],[625,118],[630,127],[671,127],[676,123],[679,117],[694,79],[699,75],[709,75],[715,80],[734,108],[745,117],[807,118],[822,127],[854,127]]
  }:null;
  function sShapeEdge(points){
    const slope=points.slice(1).map((p,i)=>(p[1]-points[i][1])/(p[0]-points[i][0]));
    // Monotone Hermite interpolation keeps each rounded notch within its
    // measured contour; it cannot overshoot into an LED island or pad.
    const tangent=points.map((_,i)=>{
      if(i===0)return slope[0];if(i===points.length-1)return slope.at(-1);
      const a=slope[i-1],b=slope[i];if(a*b<=0)return 0;
      const h0=points[i][0]-points[i-1][0],h1=points[i+1][0]-points[i][0];
      return 3*(h0+h1)/((2*h1+h0)/a+(h1+2*h0)/b);
    });
    return d=>{
      const px=16+((d%section)+section)%section/section*838;
      let i=0;while(i<points.length-2&&points[i+1][0]<px)i++;
      const [x,a]=points[i],[end,b]=points[i+1],h=end-x,t=(px-x)/h;
      const y=(2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*h*tangent[i]+(-2*t**3+3*t*t)*b+(t**3-t*t)*h*tangent[i+1];
      return (y-67)/120*width;
    };
  }
  const sShapeEdges=sshape?[sShapeEdge(sShapeOutline.upper),sShapeEdge(sShapeOutline.lower)]:null;
  const point=(f,x,z)=>f.p.clone().addScaledVector(f.x,x).addScaledVector(f.z,z);
  function surface(x1,x2,z1,z2,back=false){
    const position=[],uv=[],indices=[],segments=sshape?sections*320:1600;
    for(let i=0;i<=segments;i++){
      const d=i/segments*length,f=frame(d),left=sshape?sShapeEdges[0](d):-width/2,right=sshape?sShapeEdges[1](d):width/2;
      const a=left+(x1/width+.5)*(right-left),b=left+(x2/width+.5)*(right-left);
      position.push(...point(f,a,z1),...point(f,b,z2));
      // Preserve physical artwork coordinates across cutouts. Printing and
      // 3M backing must be cropped by the PCB, never squeezed into its necks.
      const v=1-i/segments;
      uv.push(sshape?.5+(back?a:-a)/width:back?0:1,v,sshape?.5+(back?b:-b)/width:back?1:0,v);
      if(i<segments){const a=i*2;indices.push(...(back?[a,a+2,a+1,a+1,a+2,a+3]:[a,a+1,a+2,a+1,a+3,a+2]));}
    }
    const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(position,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  function mesh(name,geometry,mat){const m=new T.Mesh(geometry,mat);m.name=name;m.castShadow=m.receiveShadow=true;group.add(m);return m;}
  function shape(w,h,r){
    const s=new T.Shape(),x=-w/2,y=-h/2;r=Math.min(r,w/3,h/3);
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
  }
  function rounded(w,h,depth,r=.12,hole){
    const s=shape(w-.04,h-.04,r);if(hole)s.holes.push(shape(...hole));
    const g=keep(new T.ExtrudeGeometry(s,{depth:depth-.04,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:2,curveSegments:4,steps:1}));g.translate(0,0,.02);return g;
  }
  const basis=new T.Matrix4(),matrix=new T.Matrix4(),q=new T.Quaternion(),one=new T.Vector3(1,1,1),axis=new T.Vector3(0,0,1);
  function instances(name,g,mat,items){
    const m=new T.InstancedMesh(g,mat,items.length);m.name=name;
    items.forEach(({d,x=0,z=0,angle=0,color},i)=>{
      const f=frame(d);basis.makeBasis(f.x,f.y,f.z);q.setFromRotationMatrix(basis);if(angle)q.multiply(new T.Quaternion().setFromAxisAngle(axis,angle));
      matrix.compose(point(f,x,z),q,one);m.setMatrixAt(i,matrix);if(color)m.setColorAt(i,new T.Color(color));
    });m.instanceMatrix.needsUpdate=true;m.castShadow=m.receiveShadow=true;
    m.userData.placements=items.map(({d,x=0,z=0,angle=0,section,between})=>({d,x,z,angle,section,between}));
    group.add(m);return m;
  }
  const blackPcb=product.pcbColor==='black';
  const mask=material({color:blackPcb?0x171c1c:0xf2f2e9,roughness:.48,clearcoat:.18});
  const reverse=material({color:0xecece3,roughness:.57});
  const edge=material({color:opaque?0xf0f0e9:0xbab89b,roughness:.6});
  const copper=material({color:0xdca36a,metalness:.84,roughness:.27,clearcoat:.2});
  const tin=material({color:0xc2cbcc,metalness:.92,roughness:.25});
  const ceramic=material({color:0xfffdf0,roughness:.33,clearcoat:.22});
  const phosphor=material({color:unlitEmitterColor(product),roughness:opaque?.48:cob?.72:.48,clearcoat:opaque?.22:cob?.025:.12});
  const dark=material({color:0x252b28,roughness:.6});
  const board=mesh('White solder mask / front',surface(-width/2,width/2,0,0),mask);
  mesh('Printed reverse / 0.28 mm PCB',surface(-width/2,width/2,-.28,-.28,true),reverse);
  mesh('PCB edge / left',surface(-width/2,-width/2,-.28,0),edge);
  mesh('PCB edge / right',surface(width/2,width/2,0,-.28),edge);
  mesh('Copper layer / left',surface(-width/2-.002,-width/2-.002,-.13,-.095),copper);
  mesh('Copper layer / right',surface(width/2+.002,width/2+.002,-.095,-.13),copper);
  if(opaque)for(const side of ['left','right'])group.getObjectByName(`Copper layer / ${side}`).visible=false;
  const cap=keep(new T.PlaneGeometry(width,.28));
  for(const [i,d] of [0,length].entries()){
    const f=frame(d),m=mesh(`PCB cut end ${i}`,cap,edge);m.position.copy(point(f,0,-.14));
    basis.makeBasis(f.x,f.z.clone().multiplyScalar(i?-1:1),f.y.clone().multiplyScalar(i?1:-1));m.quaternion.setFromRotationMatrix(basis);
  }
  const contacts=digital?[`+${product.voltage}V`,'DI','GND']:product.control==='CCT'?[`+${product.voltage}V`,'CW','WW']:product.control==='RGB+CCT'?[`+${product.voltage}V`,'R','G','B','CW','WW']:product.control==='RGBW'?[`+${product.voltage}V`,'R','G','B','W']:product.control==='RGB'?[`+${product.voltage}V`,'R','G','B']:[`+${product.voltage}V`,'−'];
  const edgePads=cob&&product.control==='MONO'&&!digital;
  const monoPads=product.control==='MONO'&&!digital;
  const padSpacing=sshape?2.85:edgePads?width-1.4:monoPads?(width<6?width*.5:width-1.95):(width-1)/contacts.length;
  const padWidth=sshape?1.9:edgePads?.85:monoPads?Math.min(1.35,width*.23):Math.min(2.2,padSpacing*.72),padLength=sshape?2.9:edgePads?Math.min(1.65,section*.1):Math.min(1.85,section*.12);
  const pads=[];
  for(let s=0;s<sections;s++)for(const d of [s*section+padLength*(sshape?.52:.6),(s+1)*section-padLength*(sshape?.52:.6)])for(let c=0;c<contacts.length;c++)pads.push({d,x:(c-(contacts.length-1)/2)*padSpacing,z:.025});
  if(!opaque&&!sealed)instances('Copper solder pads / catalogue contacts',rounded(padWidth,padLength,.075,sshape?.65:.18),copper,pads);

  const leds=[],resistors=[],refinedDelux=product.id==='slim'||product.id==='truecolor10';
  let coatingLayout=null,controllerLayout=[];
  let packageSize=null;
  if(!cob){
    const code=product.tech.match(/\d{4}/)?.[0]||'2835';
    packageSize=code==='5050'?[5,5]:code==='2216'?[2.2,1.6]:code==='2016'?[2,1.6]:[3.5,2.8];
    const [w,h]=packageSize,angle=width<5?Math.PI/2:0;
    for(let s=0;s<sections;s++){
      // Reserve the actual terminal + legend area before the first package.
      // Narrow boards and multichannel pads share the centre lane with LEDs.
      const axialSize=angle?w:h;
      const margin=refinedDelux?(product.id==='slim'?6:section/count/2):
        product.control!=='MONO'||width<6?padLength*1.5+1+.325+axialSize/2+.45:section/count/2;
      for(let i=0;i<count;i++)leds.push({d:s*section+(sshape?([100,388,649][i]-16)/838*section:count===1?section/2:margin+i*(section-2*margin)/(count-1)),angle,z:.07,section:s,index:i});
      const sectionLeds=leds.slice(-count);
      for(let i=1;i<count;i+=2)resistors.push({d:sshape?s*section+(338-16)/838*section:(sectionLeds[i-1].d+sectionLeds[i].d)/2,x:0,z:.065,section:s,between:[i-1,i]});
      if(count===1)resistors.push({d:s*section+section*.78,x:0,z:.065,section:s,between:[0,'next-section']});
    }
    const move=(l,dx,dy,z)=>({...l,x:(l.x||0)+dx*Math.cos(l.angle)-dy*Math.sin(l.angle),d:l.d+dx*Math.sin(l.angle)+dy*Math.cos(l.angle),z});
    instances('LED ceramic base',rounded(w,h,.16),ceramic,leds);
    instances('LED raised ceramic rim',rounded(w,h,.43,.12,[w-.65,h-.65,.15]),ceramic,leds.map(l=>({...l,z:.21})));
    const multicolor=product.control.startsWith('RGB'),dies=multicolor?(product.control==='RGB'?3:product.control==='RGBW'?4:5):1;
    const emitters=leds.flatMap(l=>Array.from({length:dies},(_,i)=>move(l,(i-(dies-1)/2)*(w-.9)/dies,0,.35)));
    if(product.control==='CCT')emitters.forEach((p,i)=>{p.color=i%2?0xfff6b0:0xf0b943;});
    instances('LED phosphor',rounded((w-.9)/dies*.9,h-.9,.13,.1),phosphor,emitters);
    const terminals=leds.flatMap(l=>[-1,1].map(side=>move(l,side*(w/2+.07),0,.025)));
    instances('LED tin terminals',rounded(.34,h*.67,.18,.06),tin,terminals);
    const fillet=keep(new T.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI/2));fillet.rotateX(Math.PI/2);fillet.scale(.22,h*.35,.14);
    instances('LED solder fillets',fillet,tin,terminals);
    instances('Cathode package mark',keep(new T.BoxGeometry(.08,.45,.018)),dark,leds.map(l=>move(l,w/2-.15,0,.66)));
  }else if(opaque){
    // The reference WCOB is a closed, milky raised front. No exposed packages,
    // contacts or printing on this side. The flat release liner is independent.
    const positions=[],indices=[],steps=1600,across=24,mid=frame(length/2);
    for(let row=0;row<=steps;row++)for(let col=0;col<=across;col++){
      const theta=col/across*Math.PI,x=-Math.cos(theta)*width/2,z=.08+Math.sin(theta)*(wcobTopHeight-.08);
      const p=point(frame(row/steps*length),x,z).sub(mid.p);
      positions.push(p.dot(mid.x),p.dot(mid.y),p.dot(mid.z));
      if(row<steps&&col<across){const a=row*(across+1)+col;indices.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);}
    }
    const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    instances('WCOB opaque diffuser phosphor cover',g,phosphor,[{d:length/2}]);
    const end=new T.Shape();end.moveTo(-width/2,.08);
    for(let i=0;i<=24;i++){const a=i/24*Math.PI;end.lineTo(-Math.cos(a)*width/2,.08+Math.sin(a)*(wcobTopHeight-.08));}end.closePath();
    const ends=keep(new T.ShapeGeometry(end,24));ends.rotateX(Math.PI/2);
    const endMaterial=material({color:0xf4f3ec,roughness:.52,side:T.DoubleSide});
    instances('WCOB opaque end faces',ends,endMaterial,[{d:0},{d:length}]);
  }else{
    // Each curved phosphor segment is real geometry following the same PCB frame.
    // It is a coating over the emitters, not a protective sleeve around the strip.
    const lanes=digital||sealed?1:product.control==='CCT'?2:product.control==='RGBW'||product.control==='RGB+CCT'?2:1;
    const totalBand=sealed?width*.76:width<4?width*.73:width*.52,laneWidth=totalBand/lanes-.10;
    const steps=64,across=12;
    const padLegendEnd=padLength*1.5+1+.325+.25;
    const gap=sealed||freeCut||edgePads?.10:Math.min(padLegendEnd,section*.28);
    // The IC sits between the solder row and the beginning of the coating.
    // A clear segment here prevents the chip and its pins cutting through it.
    const startGap=digital?6.6:gap,endGap=gap;
    coatingLayout={kind:'flat-phosphor-coating',lanes,laneWidth,totalBand,startGap,endGap,baseHeight:.045,edgeHeight:.23,topHeight:.32,closed:true};
    const f0=frame(section/2);
    function localPoint(d,x,z){const p=point(frame(d),x,z).sub(f0.p);return [p.dot(f0.x),p.dot(f0.y),p.dot(f0.z)];}
    for(let lane=0;lane<lanes;lane++){
      const positions=[],indices=[],offset=(lane-(lanes-1)/2)*totalBand/lanes;
      // Flat upper face with a small rounded shoulder; the closed perimeter
      // provides real side walls and cut faces rather than a hollow half tube.
      const profile=[[-laneWidth/2,.045]];
      for(let col=0;col<=across;col++){
        const t=col/across*2-1;profile.push([t*laneWidth/2,.23+.09*(1-Math.pow(t,8))]);
      }
      profile.push([laneWidth/2,.045]);
      const ring=profile.length;
      for(let row=0;row<=steps;row++)for(let col=0;col<ring;col++){
        const [x,z]=profile[col],d=startGap+(section-startGap-endGap)*row/steps;
        positions.push(...localPoint(d,x+offset,z));
        if(row<steps){const a=row*ring+col,b=row*ring+(col+1)%ring;indices.push(a,b,a+ring,b,b+ring,a+ring);}
      }
      for(let col=1;col<ring-1;col++){
        indices.push(0,col+1,col);
        const end=steps*ring;indices.push(end,end+col,end+col+1);
      }
      const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
      const segments=Array.from({length:sections},(_,s)=>({d:(s+.5)*section,z:0,color:lane&&!digital?0xffe595:0xffffff}));
      instances(`COB continuous phosphor ${lane}`,g,phosphor,segments);
    }
    if(sealed){
      // IP67 reference has a flatter band enclosed by a clear/milky jacket,
      // unlike the opaque half-round WCOB. Keep its edges visible in macro.
      const jacket=material({color:0xf3f4f0,transparent:true,opacity:.24,roughness:.22,clearcoat:1,metalness:0,depthWrite:false});
      mesh('IP67 sealed front jacket',surface(-width/2-.2,width/2+.2,.65,.65),jacket);
      mesh('IP67 jacket left edge',surface(-width/2-.2,-width/2-.2,-.4,.65),jacket);
      mesh('IP67 jacket right edge',surface(width/2+.2,width/2+.2,.65,-.4),jacket);
    }
    if(digital){
      const controllers=Array.from({length:sections},(_,s)=>({d:s*section+4.6,x:0,z:.06,section:s}));
      controllerLayout=controllers.filter(p=>p.section===0).map(p=>({...p,width:2.2,length:3,pinSpan:2.95}));
      instances('Digital controller IC',rounded(2.2,3,.6,.12),dark,controllers);
      instances('Digital controller pins',rounded(.45,.32,.2,.04),tin,controllers.flatMap(p=>[-1,1].flatMap(side=>[-.8,0,.8].map(dy=>({...p,x:p.x+side*1.25,d:p.d+dy,z:.025})))));
    }
  }
  if(resistors.length){
    instances('Resistor ceramic bodies',rounded(sshape?3.2:1.2,sshape?1.6:.6,sshape?.45:.32,.04),dark,resistors);
    instances('Resistor end caps',rounded(sshape?.5:.24,sshape?1.64:.64,sshape?.48:.35,.04),tin,resistors.flatMap(p=>(sshape?[-1.4,1.4]:[-.5,.5]).map(dx=>({...p,x:p.x+dx}))));
  }
  // The 10 mm One Cut pitch needs separate print lanes. Its old branding
  // position shared the same area as the +12V legend; the CE mark also grazed
  // the side-mounted resistor. Keep the original artwork inside clear rails.
  const compactOneCut=product.id==='onecut'||product.id==='onecutlow';
  let printLayout=compactOneCut?{
    kind:'one-cut-clearance',
    brand:{x:.62,y:section/2,length:4.2,height:4.2/8.45},
    ce:{x:width-.5,y:3.35,length:.825,height:.55},
    rohs:{x:width-.5,y:6.6,size:.48},
    legendY:[2.05,section-2.05],legendSize:.57,
    marks:[],legends:[]
  }:sshape?{
    kind:'s-shape-island-clearance',
    brand:{x:.65,y:5,length:2.8,height:2.8/8.45},
    ce:{x:width-.5,y:(649-16)/838*section,length:.9,height:.6},
    rohs:{x:width-.45,y:(388-16)/838*section,size:.43},
    legendY:[3.28],legendSize:.4,
    marks:[],legends:[]
  }:{kind:'catalogue-clearance',marks:[],legends:[],...(digital?{legendY:[2.45,section-padLength*1.5-1]}:{})};
  const ready=refinedDelux?createDeluxArtwork(product,spec,{anisotropy}).then(({texture,layout})=>{
    if(disposed){texture.dispose();return;}keep(texture);printLayout=layout;mask.map=texture;mask.color.set(0xffffff);mask.needsUpdate=true;
  }):loadMarks().then(([brand,ce])=>{
    if(disposed||opaque||sealed)return;
    const c=document.createElement('canvas');c.width=384;c.height=Math.min(2048,Math.max(512,Math.round(384*section/width)));
    const ctx=c.getContext('2d');ctx.scale(c.width/width,c.height/section);ctx.fillStyle=blackPcb?'#171c1c':'#f2f2e9';ctx.fillRect(0,0,width,section);
    ctx.fillStyle=blackPcb?'#e2e7df':'#344044';ctx.strokeStyle=blackPcb?'#69736b':'#aeb5a7';ctx.lineWidth=.035;
    for(const x of [.2,width-.2]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,section);ctx.stroke();}
    ctx.setLineDash([.22,.2]);for(const y of [.02,section-.02]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}ctx.setLineDash([]);
    const text=(value,x,y,size,rotate=false)=>{ctx.save();ctx.translate(x,sshape?section-y:y);if(rotate)ctx.rotate(sshape?-Math.PI/2:Math.PI/2);ctx.font=`600 ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,0,0);const advance=ctx.measureText(value).width;ctx.restore();return {x:x-(rotate?size:advance)/2,y:y-(rotate?advance:size)/2,width:rotate?size:advance,height:rotate?advance:size};};
    const legendSize=printLayout?.legendSize??Math.min(.65,padSpacing*.52);
    contacts.forEach((label,i)=>{const x=width/2+(i-(contacts.length-1)/2)*padSpacing;for(const [end,y] of (printLayout?.legendY??[padLength*1.5+1,section-padLength*1.5-1]).entries()){
      const value=sshape?(i?'−':'+'):digital&&label==='DI'&&end?'DO':label;
      const bounds=text(value,x,y,legendSize,edgePads);if(printLayout)printLayout.legends.push({name:value,...bounds});
    }});
    if(sshape){const bounds=text('12V DC',.55,(388-16)/838*section,.43,true);printLayout.legends.push({name:'12V DC',...bounds});}
    const margin=width<5?.45:.8,brandLength=Math.min(12,section*.28,margin*8.45),brandHeight=brandLength/8.45;
    const ceHeight=Math.min(.8,margin),ceLength=ceHeight*1.5;
    // On the 3 mm COB, the real exposed rail is narrower than the standard
    // CE artwork. Keep the complete, proportional mark on the solder mask.
    const ceRail=cob&&width<4&&coatingLayout?(width-coatingLayout.totalBand)/2+.05:null;
    const ceScale=ceRail?Math.min(1.18,(ceRail-.06)/ceHeight):1.18;
    const brandPlacement=printLayout?.brand??{x:margin*.8,y:section*.38,length:brandLength,height:brandHeight};
    const cePlacement=printLayout?.ce??{x:ceRail?width-.03-ceHeight*ceScale/2:width<5&&!cob?width-.3:width-margin*.8,y:section*.5,length:ceLength,height:ceHeight};
    for(const [name,artwork,placement] of [['brand',brand,brandPlacement],['ce',ce,cePlacement]]){
      const {x,y}=placement,scale=name==='ce'?ceScale:1;
      const length=placement.length*scale,height=placement.height*scale;
      ctx.save();ctx.translate(x,sshape?section-y:y);ctx.rotate(sshape?-Math.PI/2:Math.PI/2);ctx.drawImage(artwork,-length/2,-height/2,length,height);ctx.restore();
      if(printLayout)printLayout.marks.push({name,x:x-height/2,y:y-length/2,width:height,height:length});
    }
    const rohs=printLayout?.rohs??{x:width-margin*.8,y:section*.69,size:Math.min(.65,margin*.85)};
    const rohsBounds=text('RoHS',rohs.x,rohs.y,rohs.size,true);
    if(printLayout)printLayout.marks.push({name:'rohs',...rohsBounds});
    const printed=document.createElement('canvas');printed.width=c.width;printed.height=c.height;const pc=printed.getContext('2d');pc.translate(c.width,c.height);pc.rotate(Math.PI);pc.drawImage(c,0,0);
    const map=keep(new T.CanvasTexture(printed));map.colorSpace=T.SRGBColorSpace;map.anisotropy=anisotropy;map.wrapT=T.RepeatWrapping;map.repeat.y=sections;mask.map=map;mask.color.set(0xffffff);mask.needsUpdate=true;
  });
  const ledCount=cob?Math.round(density*length/1000):leds.length;
  function componentLayout(){
    const footprints=[];
    const selected=['LED ceramic base','LED tin terminals','Resistor ceramic bodies','Resistor end caps','Copper solder pads / catalogue contacts','Digital controller IC','Digital controller pins'];
    for(const name of selected){
      const m=group.getObjectByName(name);if(!m)continue;
      m.geometry.computeBoundingBox();const box=m.geometry.boundingBox;
      for(const p of m.userData.placements.filter(p=>p.d>=0&&p.d<section)){
        const cs=Math.cos(p.angle),sn=Math.sin(p.angle),xs=[],ds=[];
        for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y]){xs.push(p.x+x*cs-y*sn);ds.push(p.d+x*sn+y*cs);}
        footprints.push({name,d:p.d,x:p.x,minX:Math.min(...xs),maxX:Math.max(...xs),start:Math.min(...ds),end:Math.max(...ds)});
      }
    }
    const distance=(a,b)=>{
      const dx=Math.max(b.minX-a.maxX,a.minX-b.maxX),dy=Math.max(b.start-a.end,a.start-b.end);
      return dx<=0&&dy<=0?Math.max(dx,dy):Math.hypot(Math.max(0,dx),Math.max(0,dy));
    };
    const resistorParts=footprints.filter(p=>p.name.startsWith('Resistor'));
    const obstacles=footprints.filter(p=>p.name.startsWith('LED')||p.name.startsWith('Copper'));
    const printBounds=[...(printLayout?.marks??[]),...(printLayout?.legends??[])].map(p=>({name:p.name,minX:p.x-width/2,maxX:p.x+p.width-width/2,start:p.y,end:p.y+p.height}));
    const clearances=resistorParts.flatMap(r=>[...obstacles,...printBounds].map(o=>distance(r,o)));
    return {resistorLane:'center',leds:leds.filter(l=>l.section===0).map(l=>({d:l.d,x:l.x??0,angle:l.angle})),resistors:resistors.filter(r=>r.section===0).map(r=>({d:r.d,x:r.x,between:r.between})),pads:pads.filter(p=>p.d<section).map(p=>({d:p.d,x:p.x,width:padWidth,length:padLength})),controllers:controllerLayout,coating:coatingLayout,footprints,resistorClearanceMm:clearances.length?Math.min(...clearances):null};
  }
  group.userData={units:'mm',family:product.id,productId:product.id,specification:spec,ledCount,padCount:opaque||sealed?0:pads.length,contacts,rearPrintMirrored:false,sectionLedCounts:cob?[]:Array(sections).fill(count),sleeve:sealed,construction:cob?'cob':sshape?'s-shape':'smd',appearance:appearance.kind,opaqueFront:opaque,macroSide:appearance.macroSide,coverHeight:opaque?wcobTopHeight:sealed?.65:cob?.32:.5,concealedContacts:opaque||sealed,packageSize,printMarksPerSection:opaque||sealed?{brand:0,ce:0,rohs:0}:{brand:1,ce:1,rohs:1}};
  if(sshape)group.userData.sShape={...sShapeOutline,componentAxis:'straight',artworkUV:'physical-width',sectionBounds:Array.from({length:321},(_,i)=>{const d=i/320*section;return {d,minX:sShapeEdges[0](d),maxX:sShapeEdges[1](d)};})};
  return {group,frame,ready,specification:spec,setLight(on){lightOn=on;phosphor.emissive.set(0xffe6b2);phosphor.emissiveIntensity=on?2:0;},setPower(){},setTemperature(){},
    inspect:()=>({...group.userData,printLayout,componentLayout:componentLayout(),meshCount:group.children.length,radiusMm:radius,emissiveIntensity:phosphor.emissiveIntensity,lightOn}),
    dispose(){disposed=true;resources.forEach(r=>r.dispose());group.removeFromParent();}};
}
