import * as THREE from 'three';

// Product dimensions come from the corresponding PRESCOT catalogue cards.
// Surface details are a presentation model, not manufacturing geometry.
const POWER_LENGTHS = {36:145,60:145,100:176,150:199,200:218,300:240};
const MODES = {
  mono:{channels:1,label:'MONO',outputs:['V+','V−'],colors:['#d4b275','#faf3de']},
  cct:{channels:2,label:'CCT',outputs:['V+','CW','WW'],colors:['#edb66e','#fff5e7','#b7d6ff']},
  rgb:{channels:3,label:'RGB',outputs:['V+','R','G','B'],colors:['#ef5760','#eadc6e','#70c286','#6ab3ed','#a775de']},
  rgbw:{channels:4,label:'RGBW',outputs:['V+','R','G','B','W'],colors:['#ef5760','#eadc6e','#70c286','#6ab3ed','#a775de']},
  rgbcct:{channels:5,label:'RGB+CCT',outputs:['V+','R','G','B','CW','WW'],colors:['#ef5760','#eadc6e','#70c286','#6ab3ed','#a775de']},
};

function validatedDimensions(values, fallback) {
  const source=Array.isArray(values)?values:fallback;
  if(!source||source.length!==3||source.some(n=>!Number.isFinite(Number(n))||Number(n)<=0))throw new Error('Brak potwierdzonych wymiarów modelu.');
  return source.map(Number);
}

function modelInfo(type, model) {
  const id=String(model.id||model.key||model.name||model.title||'');
  if(type==='power') {
    const watts=Number(model.watts||model.power||id.match(/(?:mad-?|w)(\d+)/i)?.[1]||0);
    return {...model,id,watts,name:model.name||model.title||`PR-MAD${watts}-1224`,dimensions:validatedDimensions(model.dimensionsMm||model.dimensions,POWER_LENGTHS[watts]?[POWER_LENGTHS[watts],50,29]:null)};
  }
  const mode=String(model.mode||id).toLowerCase().replace(/[^a-z]/g,'');
  const key=['rgbcct','rgbw','cct','rgb','mono'].find(k=>mode.includes(k))||'mono';
  return {...model,id,key,name:model.name||model.title||`PR-${key.toUpperCase()}-12A`,mode:MODES[key],dimensions:validatedDimensions(model.dimensionsMm||model.dimensions,[74.5,35.6,16.5]),remoteDimensions:validatedDimensions(model.remoteDimensionsMm,[140.5,37.5,15.5])};
}

function roundedRect(width,height,radius=1) {
  const s=new THREE.Shape(),x=-width/2,y=-height/2,r=Math.min(radius,width/2,height/2);
  s.moveTo(x+r,y);s.lineTo(x+width-r,y);s.quadraticCurveTo(x+width,y,x+width,y+r);
  s.lineTo(x+width,y+height-r);s.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
  s.lineTo(x+r,y+height);s.quadraticCurveTo(x,y+height,x,y+height-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}

function mesh(group,geometry,material,position=[0,0,0],name='') {
  const m=new THREE.Mesh(geometry,material);m.position.set(...position);m.castShadow=true;m.receiveShadow=true;m.name=name;group.add(m);return m;
}

function box(group,size,position,material,name='') {return mesh(group,new THREE.BoxGeometry(...size),material,position,name);}

function roundedBox(group,size,position,material,radius=1,name='',bevel=0) {
  const [w,h,d]=size;
  const g=new THREE.ExtrudeGeometry(roundedRect(w-bevel*2,d-bevel*2,radius),{depth:h-bevel*2,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:7});
  g.rotateX(-Math.PI/2);g.translate(0,-h/2+bevel,0);
  return mesh(group,g,material,position,name);
}

function texture(draw,width=1024,height=512) {
  const c=document.createElement('canvas');c.width=width;c.height=height;
  const ctx=c.getContext('2d');draw(ctx,width,height);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}

function topLabel(group,position,size,map,name='label') {
  const m=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const p=mesh(group,new THREE.PlaneGeometry(...size),m,position,name);p.rotation.x=-Math.PI/2;p.castShadow=false;return p;
}

function lettering(group,position,size,text,color='#c3c6c8',font=48) {
  const map=texture((c,w,h)=>{c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font=`500 ${font}px Arial,sans-serif`;c.fillText(text,w/2,h/2,w-20);},512,96);
  return topLabel(group,position,size,map,'terminal marking');
}

function screw(group,x,y,z,metal,r=1.65) {
  const head=mesh(group,new THREE.CylinderGeometry(r,r,.8,14),metal,[x,y,z],'terminal screw');
  const slit=box(group,[r*1.35,.12,.3],[x,y+.45,z],new THREE.MeshStandardMaterial({color:0x40474c,roughness:.55}),'screw slot');
  slit.rotation.y=.32;return head;
}

function terminalBank(group,{x,y,z=0,count,width=35,face=1,labels=[],material,metal}) {
  const pitch=width/count;
  const base=roundedBox(group,[9,8,width],[x,y,z],material,.65,'terminal block');
  for(let i=0;i<count;i++){
    const zz=z-width/2+pitch*(i+.5);
    const hole=mesh(group,new THREE.CylinderGeometry(Math.min(1.8,pitch*.28),Math.min(1.8,pitch*.28),.3,12),new THREE.MeshStandardMaterial({color:0x25323b,roughness:.8}),[x+face*4.55,y-1,zz],'wire entry');hole.rotation.z=Math.PI/2;
    screw(group,x,y+4.1,zz,metal,Math.min(1.45,pitch*.28));
    if(i<count-1)box(group,[9.1,1,.28],[x,y+3.7,zz+pitch/2],material,'terminal divider');
  }
  if(labels.length)lettering(group,[x-face*8,y+4.2,z],[9,width],labels.join('  '),'#6f767a',42).rotation.z=-Math.PI/2;
  return base;
}

function createPower(info) {
  const group=new THREE.Group(),[L,W,H]=info.dimensions;
  const aluminium=new THREE.MeshStandardMaterial({color:0x35393c,metalness:.76,roughness:.42});
  const lidMaterial=new THREE.MeshStandardMaterial({color:0x24282b,metalness:.58,roughness:.54});
  const shadowMaterial=new THREE.MeshStandardMaterial({color:0x191d20,roughness:.84,metalness:.1});
  const terminalMaterial=new THREE.MeshStandardMaterial({color:0xdbdddd,roughness:.72});
  const metal=new THREE.MeshStandardMaterial({color:0xbac1c4,metalness:.9,roughness:.32});
  box(group,[L-5,2,W-2],[0,1,0],aluminium,'aluminium base');
  box(group,[L-33,H-7,W-7],[0,(H-7)/2+2,0],shadowMaterial,'semi-potted enclosure');
  for(const side of [-1,1]) {
    roundedBox(group,[L,H,1.5],[0,H/2,side*(W/2-1.3)],aluminium,.7,'extruded aluminium wall');
    for(let level=0;level<8;level++)box(group,[L-2,.62,.75],[0,3+level*3.1,side*(W/2-.38)],aluminium,'side cooling rib');
    for(const x of [-L*.28,L*.28]){
      const bolt=mesh(group,new THREE.CylinderGeometry(1.75,1.75,.6,14),metal,[x,H*.51,side*(W/2-.3)],'side screw');bolt.rotation.x=Math.PI/2;
    }
  }
  // Real openings in the top plate show the dark interior beneath it.
  const lid=roundedRect(L-27,W-5,1);
  const minX=-L/2+64,maxX=L/2-18;
  for(let x=minX;x<maxX;x+=6.4)for(let z=-W/2+7;z<W/2-5;z+=5.6){
    const path=new THREE.Path();const a=x-1.1,b=z-1.8;
    path.moveTo(a,b);path.lineTo(a+2.2,b);path.lineTo(a+2.2,b+3.6);path.lineTo(a,b+3.6);path.closePath();lid.holes.push(path);
  }
  const lidGeometry=new THREE.ExtrudeGeometry(lid,{depth:1,bevelEnabled:false,curveSegments:3});lidGeometry.rotateX(-Math.PI/2);
  mesh(group,lidGeometry,lidMaterial,[0,H-2,0],'perforated top plate');
  const label=texture((c,w,h)=>{
    c.fillStyle='#cbd0d0';c.font='600 77px Arial,sans-serif';c.fillText('PRESCOT LED',30,97);
    c.fillStyle='#b6bcbf';c.font='500 51px Arial,sans-serif';c.fillText(info.name,30,180,w-50);
    c.font='38px Arial,sans-serif';c.fillText(`${info.watts} W · 12 / 24 V DC`,30,260);c.fillText('AUTO IDENTIFY',30,324);
    c.fillStyle='#838a8e';c.font='31px Arial,sans-serif';c.fillText('INPUT 180–265 V AC',30,398);c.fillText('PRESCOT · IP20',30,450);
  });
  topLabel(group,[-L/2+36,H-.88,0],[44,W-10],label,'PRESCOT model label');
  terminalBank(group,{x:-L/2+9,y:8,count:2,width:19,face:-1,labels:[],material:terminalMaterial,metal});
  terminalBank(group,{x:L/2-9,y:8,count:6,width:38,face:1,labels:[],material:terminalMaterial,metal});
  box(group,[5,5,5],[-L/2+10,7,-17],new THREE.MeshStandardMaterial({color:0xd75542,roughness:.7}),'input connector detail');
  lettering(group,[-L/2+21,H-1,0],[11,W-10],'L  N','#b9bec1',44).rotation.z=-Math.PI/2;
  lettering(group,[L/2-19,H-1,0],[10,W-9],'−  −  −  +  +  +','#c4c7c8',40).rotation.z=-Math.PI/2;
  group.userData={terminalCount:8,dimensions:info.dimensions,kind:'power'};return group;
}

function createController(info) {
  const group=new THREE.Group(),receiver=new THREE.Group(),remote=new THREE.Group();group.add(receiver,remote);
  const [L,W,H]=info.dimensions,[RL,RW,RH]=info.remoteDimensions;
  const white=new THREE.MeshStandardMaterial({color:0xe7e9e8,roughness:.53,metalness:.02});
  const whiteEdge=new THREE.MeshStandardMaterial({color:0xcdd1d0,roughness:.7});
  const black=new THREE.MeshStandardMaterial({color:0x222428,roughness:.38,metalness:.19});
  const inset=new THREE.MeshStandardMaterial({color:0x111518,roughness:.46,metalness:.1});
  const metal=new THREE.MeshStandardMaterial({color:0xbac1c4,metalness:.82,roughness:.35});
  roundedBox(receiver,[L-13,H,W],[0,H/2,0],white,2.6,'receiver case',.5);
  roundedBox(receiver,[L-5,1.6,W-2],[0,2,0],whiteEdge,1.5,'receiver mounting base');
  const inputs=2,outputs=info.mode.channels+1;
  terminalBank(receiver,{x:-L/2+5,y:H/2-1,count:inputs,width:W-8,face:-1,material:whiteEdge,metal});
  terminalBank(receiver,{x:L/2-5,y:H/2-1,count:outputs,width:W-7,face:1,material:whiteEdge,metal});
  for(const x of [-L/2+1,L/2-1]){
    const foot=roundedRect(6,W-9,1);const hole=new THREE.Path();hole.absellipse(0,0,1.35,2.7,0,Math.PI*2,true);foot.holes.push(hole);
    const g=new THREE.ExtrudeGeometry(foot,{depth:1.2,bevelEnabled:false});g.rotateX(-Math.PI/2);mesh(receiver,g,whiteEdge,[x,.7,0],'mounting slot');
  }
  const label=texture((c,w,h)=>{
    c.fillStyle='#737b7f';c.font='600 64px Arial,sans-serif';c.fillText('PRESCOT LED',35,88);
    c.font='500 47px Arial,sans-serif';c.fillText(info.name,35,155,w-65);
    c.font='39px Arial,sans-serif';c.fillText(`${info.mode.label} · RF 2.4 GHz`,35,230);c.fillText('12–24 V DC · 12 A',35,292);
    c.fillStyle='#98a0a3';c.font='32px Arial,sans-serif';c.fillText('INPUT  +  −',35,386);c.fillText('OUTPUT  '+info.mode.outputs.join('  '),35,437,w-60);
  });
  topLabel(receiver,[0,H+.05,0],[L-21,W-5],label,'receiver markings');
  receiver.position.set(RW*.55+12,0,19);receiver.rotation.y=-.11;
  roundedBox(remote,[RW,RH,RL],[0,RH/2,0],black,9,'remote handset',1.2);
  roundedBox(remote,[RW-1.5,.6,RL-2],[0,RH-.2,0],inset,8,'remote edge seam');
  roundedBox(remote,[RW-3.4,.7,RL-4],[0,RH+.12,0],black,7.5,'remote front panel');
  roundedBox(remote,[9,.8,RL*.49],[0,RH+.55,-RL*.18],inset,4,'touch slider recess');
  const slider=texture((c,w,h)=>{
    const grad=c.createLinearGradient(0,0,0,h);info.mode.colors.forEach((col,i)=>grad.addColorStop(i/(info.mode.colors.length-1),col));
    c.fillStyle=grad;c.beginPath();c.roundRect(w*.35,12,w*.3,h-24,16);c.fill();
  },96,512);
  topLabel(remote,[0,RH+1.02,-RL*.18],[4.3,RL*.4],slider,'touch color scale');
  const powerTexture=texture((c,w,h)=>{
    c.strokeStyle='#858d91';c.lineWidth=7;c.lineCap='round';c.beginPath();c.arc(w/2,h/2,34,-Math.PI*.31,Math.PI*1.31);c.stroke();c.beginPath();c.moveTo(w/2,h/2-48);c.lineTo(w/2,h/2-9);c.stroke();
  },128,128);
  topLabel(remote,[0,RH+.61,RL*.25],[10,10],powerTexture,'power button symbol');
  const dot=mesh(remote,new THREE.SphereGeometry(.8,10,6),new THREE.MeshStandardMaterial({color:0x9da8ae,emissive:0x557380,emissiveIntensity:.15,roughness:.32}),[0,RH+1.1,-RL*.405],'indicator');dot.scale.y=.25;
  lettering(remote,[0,RH+.62,RL*.414],[RW-11,6.5],'PRESCOT','#757d82',37);
  // The published remote is twice the receiver length; preserve that distinction.
  remote.position.set(-RW*.72-15,0,-5);remote.rotation.y=.12;
  group.userData={terminalCount:inputs+outputs,channels:info.mode.channels,dimensions:info.dimensions,remoteDimensions:info.remoteDimensions,kind:'controller'};return group;
}

function disposeObject(object) {
  const geometries=new Set(),materials=new Set(),maps=new Set();
  object.traverse(n=>{if(n.geometry)geometries.add(n.geometry);for(const m of (Array.isArray(n.material)?n.material:[n.material]).filter(Boolean)){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)maps.add(value);}});
  for(const x of geometries)x.dispose();for(const x of maps)x.dispose();for(const x of materials)x.dispose();
}

function studioEnvironment(renderer) {
  const stage=new THREE.Scene(),materials=[];
  stage.background=new THREE.Color(0xbcc2c9);
  for(const [position,size,intensity] of [[[0,350,0],[550,400],5],[[0,100,350],[600,220],3],[[-400,140,0],[450,240],3.5],[[350,0,-200],[350,250],1.5]]){
    const material=new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(intensity),side:THREE.DoubleSide});materials.push(material);
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(...size),material);plane.position.set(...position);plane.lookAt(0,0,0);stage.add(plane);
  }
  const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromScene(stage,.05,.1,1000);pmrem.dispose();disposeObject(stage);return target;
}

export async function createProductViewer(host,{type='power',model,onReady}={}) {
  if(!host||!model)throw new Error('Wybierz model do podglądu.');
  if(type!=='power'&&type!=='controller')throw new Error('Nieznany typ podglądu.');
  let info=modelInfo(type,model),disposed=false,ready=false,frame=0,renderCount=0,revision=0,object=null,visible=true,scale=1,fittingCorners=[];
  const ui=document.createElement('div');ui.className='product-viewer__stage';
  ui.innerHTML='<div class="product-viewer__canvas"></div><p class="product-viewer__note">Model poglądowy · wymiary według karty produktu</p>';
  host.append(ui);
  const mount=ui.querySelector('.product-viewer__canvas');
  let renderer;
  try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});} catch(error){ui.remove();throw error;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));renderer.setClearColor(0xffffff,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const canvas=renderer.domElement;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`Obrotowy model ${info.name}. Obrót strzałkami, Home przywraca widok.`);canvas.tabIndex=0;mount.append(canvas);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,5000);scene.add(new THREE.HemisphereLight(0xf8fbff,0xb2a493,1.8));
  const key=new THREE.DirectionalLight(0xfff8ef,3);key.position.set(-180,360,260);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.8;key.shadow.bias=-.0003;scene.add(key);
  const fill=new THREE.DirectionalLight(0xdbe8ff,1.2);fill.position.set(250,100,-190);scene.add(fill);
  const environment=studioEnvironment(renderer);scene.environment=environment.texture;scene.environmentIntensity=.68;
  const floor=mesh(scene,new THREE.PlaneGeometry(1400,1400),new THREE.ShadowMaterial({color:0x5b656d,opacity:.16}),[0,-.7,0]);floor.rotation.x=-Math.PI/2;floor.castShadow=false;
  const orbit={azimuth:type==='power'?.45:.15,elevation:type==='power'?.64:.92,distance:550},initial={...orbit};
  const target=new THREE.Vector3(0,9,0);
  function positionCamera(){
    const a=orbit.azimuth,e=orbit.elevation;
    const outward=new THREE.Vector3(Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e));
    const right=new THREE.Vector3(Math.cos(a),0,-Math.sin(a)),up=new THREE.Vector3().crossVectors(outward,right);
    const vertical=Math.tan(THREE.MathUtils.degToRad(camera.fov)*.5),horizontal=vertical*camera.aspect;
    let distance=1;
    for(const point of fittingCorners){const offset=point.clone().sub(target),depth=offset.dot(outward);distance=Math.max(distance,depth+Math.abs(offset.dot(right))/horizontal,depth+Math.abs(offset.dot(up))/vertical);}
    // Frame the actual rectangular product, keeping it readable on wide cards.
    orbit.distance=distance*1.23;const radius=orbit.distance/scale;
    camera.position.copy(target).addScaledVector(outward,radius);camera.lookAt(target);
  }
  function draw(){frame=0;if(disposed||!visible)return;positionCamera();renderer.render(scene,camera);renderCount++;}
  function requestDraw(){if(!frame&&!disposed)frame=requestAnimationFrame(draw);}
  function fit(){
    const rect=mount.getBoundingClientRect(),w=Math.max(rect.width,1),h=Math.max(rect.height,1);renderer.setSize(w,h,false);camera.aspect=w/h;
    if(object){const b=new THREE.Box3().setFromObject(object);fittingCorners=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])fittingCorners.push(new THREE.Vector3(x,y,z));target.y=(b.min.y+b.max.y)*.5;}
    camera.updateProjectionMatrix();requestDraw();
  }
  function resetView(){orbit.azimuth=initial.azimuth;orbit.elevation=initial.elevation;scale=1;requestDraw();}
  async function setModel(next){
    if(disposed)return;
    const nextType=next.type==='controller'||next.channels?'controller':next.type==='power-supply'||next.watts||next.power?'power':type;
    const nextInfo=modelInfo(nextType,next),ticket=++revision;
    ready=false;ui.dataset.loading='true';
    await new Promise(resolve=>requestAnimationFrame(resolve));if(disposed||ticket!==revision)return;
    const fresh=nextType==='power'?createPower(nextInfo):createController(nextInfo);
    if(type!==nextType){
      type=nextType;initial.azimuth=type==='power'?.45:.15;initial.elevation=type==='power'?.64:.92;
      orbit.azimuth=initial.azimuth;orbit.elevation=initial.elevation;scale=1;
    }
    if(object){scene.remove(object);disposeObject(object);}object=fresh;info=nextInfo;
    const bounds=new THREE.Box3().setFromObject(object),center=bounds.getCenter(new THREE.Vector3());object.position.x-=center.x;object.position.z-=center.z;scene.add(object);
    const extent=Math.max(...info.dimensions,...(info.remoteDimensions||[]))*1.15;Object.assign(key.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,near:1,far:1200});key.shadow.camera.updateProjectionMatrix();
    canvas.setAttribute('aria-label',`Obrotowy model ${info.name}. Obrót strzałkami, Home przywraca widok.`);ui.dataset.model=info.id;fit();
    try{if(renderer.compileAsync)await renderer.compileAsync(scene,camera);}catch{/* Rendering remains available if parallel shader compilation is unsupported. */}
    if(disposed||ticket!==revision)return;
    ready=true;delete ui.dataset.loading;requestDraw();onReady?.({type,model:info});
  }
  let pointer=null;
  function down(e){if(e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,touch:e.pointerType==='touch',drag:false};if(!pointer.touch){canvas.setPointerCapture(e.pointerId);ui.dataset.dragging='true';}}
  function move(e){
    if(!pointer||e.pointerId!==pointer.id)return;
    if(pointer.touch&&!pointer.drag){const dx=e.clientX-pointer.startX,dy=e.clientY-pointer.startY;if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){pointer=null;return;}if(Math.abs(dx)<8||Math.abs(dx)<Math.abs(dy)*1.2)return;pointer.drag=true;canvas.setPointerCapture(e.pointerId);ui.dataset.dragging='true';}
    const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer.x=e.clientX;pointer.y=e.clientY;orbit.azimuth-=dx*.009;
    if(!pointer.touch)orbit.elevation=THREE.MathUtils.clamp(orbit.elevation+dy*.007,.2,1.43);
    if(e.cancelable)e.preventDefault();requestDraw();
  }
  function up(e){if(pointer?.id===e.pointerId){if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);pointer=null;delete ui.dataset.dragging;}}
  function keyboard(e){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','+','-'].includes(e.key)){e.preventDefault();if(e.key==='Home')resetView();else if(e.key==='ArrowLeft')orbit.azimuth-=.16;else if(e.key==='ArrowRight')orbit.azimuth+=.16;else if(e.key==='ArrowUp')orbit.elevation=Math.min(1.43,orbit.elevation+.12);else if(e.key==='ArrowDown')orbit.elevation=Math.max(.2,orbit.elevation-.12);else scale=THREE.MathUtils.clamp(scale+(e.key==='+'?.1:-.1),.75,1.6);requestDraw();}}
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move,{passive:false});canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('keydown',keyboard);
  const resize=new ResizeObserver(fit);resize.observe(mount);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestDraw();},{rootMargin:'100px'});observer.observe(ui);
  const visibility=()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else requestDraw();};document.addEventListener('visibilitychange',visibility);
  function inspect(){let meshes=0;object?.traverse(n=>{if(n.isMesh)meshes++;});return {type,id:info.id,dimensionsMm:info.dimensions,remoteDimensionsMm:info.remoteDimensions||null,channels:object?.userData.channels||null,terminals:object?.userData.terminalCount||0,meshes,frames:renderCount,ready,disposed,revision,orbit:{...orbit},visible};}
  function dispose(){if(disposed)return;disposed=true;revision++;if(frame)cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('keydown',keyboard);disposeObject(scene);environment.dispose();renderer.dispose();renderer.forceContextLoss();ui.remove();}
  try{await setModel(model);}catch(error){dispose();throw error;}
  return {setModel,dispose,inspect,resetView};
}
