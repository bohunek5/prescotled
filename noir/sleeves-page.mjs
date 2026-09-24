// Dimensions and PCB limits: original KS-PRO PDF product cards.
// Cross-sections: the configurator's manufacturer-drawing contours. In
// particular BASIC has a milky optical window and an opaque support region.
export const sleevePageModels = {
 basic8:{id:'basic8',name:'BASIC PRO 8',label:'Model 8',sku:'KS-PRO-B-8',width:11,height:5,pcbMax:8,pcbWidth:8,pcbLift:1.10,angle:120,pdf:'/prescotled/assets/catalog-sleeves/ks-pro-b-8.pdf',ean:'5905475363801'},
 basic10:{id:'basic10',name:'BASIC PRO 10',label:'Model 10',sku:'KS-PRO-B-10',width:13,height:5,pcbMax:10,pcbWidth:10,pcbLift:1.13,angle:120,pdf:'/prescotled/assets/catalog-sleeves/ks-pro-b-10.pdf',ean:'5905475363818'},
 standard:{id:'standard',name:'STANDARD PRO',label:'STANDARD',sku:'KS-PRO-S-14',width:14,height:14,pcbMax:10,pcbWidth:8,pcbLift:2.28,angle:120,pdf:'/prescotled/assets/catalog-sleeves/ks-pro-s-14.pdf',ean:'5905475363825'},
 side:{id:'side',name:'SLIM SIDE PRO',label:'SLIM SIDE',sku:'KS-PRO-SS-4',width:4,height:10,pcbMax:6,pcbWidth:4,pcbLift:4.6,vertical:true,angle:120,pdf:'/prescotled/assets/catalog-sleeves/ks-pro-ss-4.pdf',ean:'5905475363832'},
 top:{id:'top',name:'TOP PRO',label:'TOP',sku:'KS-PRO-TOP-15',width:15,height:13,pcbMax:10,pcbWidth:8,pcbLift:1.72,angle:270,pdf:'/prescotled/assets/catalog-sleeves/ks-pro-top-15.pdf',ean:'5905475363849'},
 oval:{id:'oval',name:'OVAL PRO',label:'OVAL',sku:'KS-PRO-OVAL-20',width:20,height:20,pcbMax:10,pcbWidth:8,pcbLift:3.74,angle:270,pdf:'/prescotled/assets/catalog-sleeves/ks-pro-oval-20.pdf',ean:'5905475363856'}
};
export const sleevePageFamilies = [
 {id:'basic',models:['basic8','basic10'],name:'BASIC PRO',title:'Dwa modele.<br>Jedna niska forma.',description:'Model 8 do taśmy o szerokości do 8 mm. Model 10 do taśmy do 10 mm. W obu przypadkach zewnętrzna wysokość wynosi tylko 5 mm.',photo:'/prescotled/wp-content/uploads/2026/02/BASIC-pro_1-z-czarnej-tacy.webp',facts:[['Model 8','11 × 5 mm'],['Model 10','13 × 5 mm'],['Kąt świecenia','120°'],['Promień gięcia','> 60 mm']]},
 {id:'standard',models:['standard'],name:'STANDARD PRO',title:'Wyraźny przekrój.<br>Równa linia.',description:'Kwadratowa forma 14 × 14 mm. Taśma pracuje w dolnym kanale, a mleczna część koszulki rozprasza jej światło.',photo:'/prescotled/wp-content/uploads/2026/02/standard-pro_1-1.webp',facts:[['Przekrój','14 × 14 mm'],['Szerokość PCB','do 10 mm'],['Kąt świecenia','120°'],['Promień gięcia','> 60 mm']]},
 {id:'side',models:['side'],name:'SLIM SIDE PRO',title:'Cztery milimetry.<br>Wiele miejsca na światło.',description:'Wąski przekrój 4 × 10 mm z taśmą ułożoną pionowo. Światło wychodzi przez wąskie okno, tworząc smukłą linię.',photo:'/prescotled/assets/catalog-products/6eaccce2439348da.webp',facts:[['Przekrój','4 × 10 mm'],['Szerokość PCB','do 6 mm'],['Kąt świecenia','120°'],['Promień gięcia','> 60 mm']]},
 {id:'top',models:['top'],name:'TOP PRO',title:'Światło<br>na szerokim łuku.',description:'Zaokrąglona kopuła nad taśmą LED. Przekrój 15 × 13 mm i kąt świecenia 270° pozwalają poprowadzić światło poza płaską powierzchnię.',photo:'/prescotled/assets/catalog-products/4a87d327a9fd0ce8.webp',facts:[['Przekrój','15 × 13 mm'],['Szerokość PCB','do 10 mm'],['Kąt świecenia','270°'],['Promień gięcia','> 60 mm']]},
 {id:'oval',models:['oval'],name:'OVAL PRO',title:'Obła forma.<br>Miękkie światło.',description:'Średnica 20 mm i obły przekrój z osobnym kanałem na taśmę. Mleczny silikon tworzy linię światła o zaokrąglonej powierzchni.',photo:'/prescotled/assets/catalog-products/cdf9ab78881cac9f.webp',facts:[['Średnica','Ø 20 mm'],['Szerokość PCB','do 10 mm'],['Kąt świecenia','270°'],['Promień gięcia','> 60 mm']]}
];

const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => {n=clamp(n);return n*n*(3-2*n);};
const staticPose = {insert:1,light:1,bend:1,progress:1,phase:'bend'};
const startPose = {insert:0,light:0,bend:0,progress:0,phase:'insert'};
export function initSleevesPage(root=document.querySelector('[data-sleeves-page]')) {
 if(!root||root.sleevesPage)return root?.sleevesPage;
 root.dataset.enhanced='true';
 const rows=[...root.querySelectorAll('[data-sleeve-family]')],reduced=matchMedia('(prefers-reduced-motion:reduce)'),coarse=matchMedia('(hover:none),(pointer:coarse)');
 const visible=new Set();let active=null,engine=null,pending=null,raf=0,last=0,next=0,elapsed=0,pageActive=true,requested=0,pose=startPose,dirty=false;
 function halt(){cancelAnimationFrame(raf);raf=0;last=next=0;}
 function paint(p){
  if(!active)return;pose=p;active.dataset.spPhase=p.phase;active.style.setProperty('--sp-progress',String(p.progress));active.style.setProperty('--sp-light',String(p.light));
  const text=p.phase==='insert'?['01 / WPROWADZENIE TAŚMY',active.dataset.sleeveFamily==='side'?'PCB ustawiona pionowo':'PCB w dolnym kanale']:p.phase==='light'?['02 / ŚWIATŁO W KOSZULCE','Mleczne okno rozprasza światło']:['03 / FORMA ŚWIATŁA','Promień gięcia > 60 mm'];
  const label=active.querySelector('[data-sp-step]'),note=active.querySelector('[data-sp-note]');if(label.textContent!==text[0])label.textContent=text[0];if(note.textContent!==text[1])note.textContent=text[1];
  engine?.update(p);dirty=false;
 }
 function tick(now){
  raf=0;if(!active||!visible.has(active)||document.hidden||!pageActive||!engine)return;
  if(next&&now<next-.5){raf=requestAnimationFrame(tick);return;}
  const dt=last?Math.min(100,now-last):1000/30;last=now;next=now+1000/30;
  if(reduced.matches){if(dirty)paint(staticPose);return;}
  elapsed+=dt/1000;const t=elapsed%15;
  const insert=t<11.5?ease((t-.55)/3.2):1-ease((t-11.5)/2.7);
  const light=ease((t-3.85)/1.25)*(1-ease((t-10.4)/1.0));
  const bend=ease((t-5.6)/2.4)*(1-ease((t-10.6)/.9));
  paint({insert,light,bend,progress:t/15,phase:t>=5.6&&t<11.5?'bend':t>=3.85&&t<11.5?'light':'insert'});
  raf=requestAnimationFrame(tick);
 }
 function schedule(){dirty=true;if(active&&visible.has(active)&&engine&&!raf&&!document.hidden&&pageActive)raf=requestAnimationFrame(tick);}
 async function prepare(){
  if(!pending)pending=Promise.all([import('../konfigurator/vendor/three/build/three.module.min.js'),import('../konfigurator/sleeve-sections.js')]).then(([T,{sleeveSections}])=>engine=createPageScene(T,sleeveSections));
  return pending;
 }
 async function activate(row,restart=false){
  if(active===row&&!restart)return;
  halt();requested++;const request=requested;
  if(active){active.classList.remove('is-active');delete active.dataset.spReady;}
  active=row;active.classList.add('is-active');elapsed=0;pose=reduced.matches?staticPose:startPose;dirty=true;
  try{
   const renderer=await prepare();if(request!==requested||active!==row)return;
   const family=sleevePageFamilies.find(f=>f.id===row.dataset.sleeveFamily);
   renderer.mount(row.querySelector('.sp-canvas'),family.models.map(id=>sleevePageModels[id]));row.dataset.spReady='true';paint(pose);schedule();
  }catch(_){if(active===row)row.dataset.spReady='fallback';}
 }
 function deactivate(){halt();requested++;if(active){active.classList.remove('is-active');delete active.dataset.spReady;}active=null;}
 function nearest(){
  if(!coarse.matches||document.hidden||!pageActive)return;
  const candidates=[...visible].map(row=>{const r=row.querySelector('.sp-family-media').getBoundingClientRect();return {row,distance:Math.abs((r.top+r.bottom)/2-innerHeight*.48)};}).sort((a,b)=>a.distance-b.distance);
  if(candidates[0])activate(candidates[0].row);else deactivate();
 }
 for(const row of rows){
  row.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')activate(row);});
  row.addEventListener('pointerleave',()=>{if(active===row&&!coarse.matches&&!row.contains(document.activeElement))deactivate();});
  row.addEventListener('focusin',()=>activate(row));
  row.addEventListener('focusout',()=>queueMicrotask(()=>{if(active===row&&!coarse.matches&&!row.contains(document.activeElement)&&!row.matches(':hover'))deactivate();}));
  row.querySelector('.sp-replay').addEventListener('click',()=>activate(row,true));
 }
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){const row=entry.target.closest('[data-sleeve-family]');if(entry.isIntersecting&&entry.intersectionRatio>.015)visible.add(row);else visible.delete(row);}
  if(active&&!visible.has(active))deactivate();if(coarse.matches)nearest();else schedule();
 },{rootMargin:'-8% 0px -12%',threshold:[0,.02,.2,.5,.75,1]});
 rows.forEach(row=>observer.observe(row.querySelector('.sp-family-media')));
 const resize=new ResizeObserver(schedule);rows.forEach(row=>resize.observe(row.querySelector('.sp-canvas')));
 function resume(){if(document.hidden||!pageActive){halt();return;}if(coarse.matches)nearest();else schedule();}
 reduced.addEventListener('change',()=>{halt();if(active){elapsed=0;paint(reduced.matches?staticPose:startPose);schedule();}});
 coarse.addEventListener('change',()=>{deactivate();nearest();});
 document.addEventListener('visibilitychange',resume);addEventListener('pagehide',()=>{pageActive=false;halt();});addEventListener('pageshow',()=>{pageActive=true;resume();});
 root.sleevesPage={inspect:()=>({family:active?.dataset.sleeveFamily||null,playing:!!raf&&!reduced.matches,elapsed,reduced:reduced.matches,phase:pose.phase,visible:[...visible].map(r=>r.dataset.sleeveFamily),...engine?.inspect()}),show:(id)=>{const row=rows.find(r=>r.dataset.sleeveFamily===id);if(row)return activate(row,true);}};
 return root.sleevesPage;
}

// One shared WebGL context is moved to the active family. Switching families
// disposes the old geometry. At rest the source photos and SVGs remain usable.
export function createPageScene(T,sections){
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0x101819,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-100,100,80,-80,1,1000);camera.position.set(-92,95,220);camera.lookAt(0,0,0);
 const hemisphere=new T.HemisphereLight(0xe8f4e8,0x142226,1.45);scene.add(hemisphere);const key=new T.DirectionalLight(0xffe9cf,2.7);key.position.set(-100,140,100);scene.add(key);const rim=new T.DirectionalLight(0xa5d5df,1.7);rim.position.set(80,50,-100);scene.add(rim);
 let host=null,products=[],resources=[],specs=[],width=0,height=0,frames=0,previousKey='',day=document.documentElement.dataset.theme==='day',lastPose=null;
 function lightEnvironment(){
  hemisphere.groundColor.set(day?0x9ba28e:0x142226);hemisphere.intensity=day?2.15:1.45;
  key.color.set(day?0xfff6e7:0xffe9cf);key.intensity=day?2.4:2.7;rim.intensity=day?.7:1.7;
  products.forEach(p=>{p.milk.color.set(day?0xd2d8ca:0xb7c5b8);p.base.color.set(day?0xa3b19b:0x788d81);});
 }
 addEventListener('prescot:themechange',()=>{day=document.documentElement.dataset.theme==='day';lightEnvironment();if(host&&lastPose){const r=host.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)update(lastPose);}});
 lightEnvironment();
 const track=x=>(resources.push(x),x);
 const material=opts=>track(new T.MeshStandardMaterial(opts));
 function makeShape(ring){const s=new T.Shape();ring.forEach(([x,y],i)=>s[i?'lineTo':'moveTo'](x,y));s.closePath();return s;}
 function paths(regions){return regions.map(r=>{const s=makeShape(r.outline);s.holes=r.holes.map(makeShape);return s;});}
 function makeProduct(spec,index,count){
  const group=new T.Group();group.position.y=count===2?(index===0?34:-34):0;group.rotation.z=-.06;scene.add(group);
  const bodies=[],components=[],pads=[],length=96,section=sections[spec.id],vertical=!!spec.vertical;
  function deformable(geo,board=false){track(geo);bodies.push({geo,board,points:geo.attributes.position.array.slice(),normals:geo.attributes.normal.array.slice()});return geo;}
  const milk=material({color:0xb7c5b8,roughness:.3,emissive:0xffc47d,emissiveIntensity:0}),base=material({color:0x788d81,roughness:.6});
  for(const[regions,mat]of[[section.optical,milk],[section.opaque,base]])if(regions.length){const g=new T.ExtrudeGeometry(paths(regions),{depth:length,steps:30,bevelEnabled:false});g.rotateY(Math.PI/2);g.translate(-length/2,-spec.height/2,0);group.add(new T.Mesh(deformable(g),mat));}
  const pcbMat=material({color:0xe7ecdf,roughness:.66}),gold=material({color:0xba8c42,roughness:.4,metalness:.55});
  const boardY=spec.pcbLift-spec.height/2,boardZ=vertical?.62:0;
  function putBoard(geo){if(vertical)geo.rotateX(-Math.PI/2);geo.translate(0,boardY,boardZ);return deformable(geo,true);}
  group.add(new T.Mesh(putBoard(new T.BoxGeometry(length,.35,spec.pcbWidth,30,1,1)),pcbMat));
  for(const z of [-1,1]){const g=new T.BoxGeometry(length-.5,.035,.12,30,1,1);g.translate(0,.192,z*(spec.pcbWidth/2-.6));group.add(new T.Mesh(putBoard(g),gold));}
  const ceramic=material({color:0xe4e8dd,roughness:.4}),phosphor=material({color:0xd3a554,roughness:.5,emissive:0xffc076,emissiveIntensity:0});
  const chip=track(new T.BoxGeometry(2.8,.65,Math.min(3.5,spec.pcbWidth-.4))),light=track(new T.BoxGeometry(2.16,.06,Math.min(2.6,spec.pcbWidth-.8))),padGeo=track(new T.BoxGeometry(2.2,.055,Math.max(.7,spec.pcbWidth/2-1.2)));
  for(let i=0;i<15;i++){const holder=new T.Group(),orient=new T.Group();if(vertical)orient.rotation.x=-Math.PI/2;const casing=new T.Mesh(chip,ceramic);casing.position.y=.5;const die=new T.Mesh(light,phosphor);die.position.y=.856;orient.add(casing,die);holder.add(orient);group.add(holder);components.push({holder,x:-43.75+i*6.25});}
  for(const x of [-46,46])for(const sign of [-1,1]){const mesh=new T.Mesh(padGeo,gold),orient=new T.Group();mesh.position.set(0,.203,sign*spec.pcbWidth/4);orient.add(mesh);if(vertical)orient.rotation.x=-Math.PI/2;const holder=new T.Group();holder.add(orient);group.add(holder);pads.push({holder,x});}
  const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;
  const ctx=glowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,200,123,.32)');gradient.addColorStop(.45,'rgba(255,195,110,.11)');gradient.addColorStop(1,'rgba(255,195,110,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const texture=track(new T.CanvasTexture(glowCanvas));texture.colorSpace=T.SRGBColorSpace;
  const halo=track(new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,opacity:0}));
  const glowGeo=new T.PlaneGeometry(length,Math.max(24,spec.height*2),30,1);glowGeo.translate(0,spec.height/2,0);const bloom=new T.Mesh(deformable(glowGeo),halo);bloom.renderOrder=2;group.add(bloom);
  return{group,spec,section,bodies,components:[...components,...pads],milk,base,phosphor,halo,boardY,boardZ,vertical};
 }
 function point(x,y,z,k,vertical){if(!k)return[x,y,z];const a=x*k,R=1/k;return vertical?[Math.sin(a)*(R-z),y,R*(1-Math.cos(a))+Math.cos(a)*z]:[Math.sin(a)*(R-y),R*(1-Math.cos(a))+Math.cos(a)*y,z];}
 function mount(nextHost,nextSpecs){
  host=nextHost;host.append(renderer.domElement);width=height=0;previousKey='';
  if(specs.map(s=>s.id).join()===nextSpecs.map(s=>s.id).join())return;
  products.forEach(p=>scene.remove(p.group));resources.forEach(r=>r.dispose());resources=[];specs=nextSpecs;products=specs.map((s,i)=>makeProduct(s,i,specs.length));lightEnvironment();
 }
 function update({insert,light,bend}){
  lastPose={insert,light,bend};
  if(!host)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
  const aspect=w/h;
  if(w!==width||h!==height){width=w;height=h;renderer.setSize(w,h,false);const worldH=Math.max(specs.length===2?139:85,176/aspect);camera.left=-worldH*aspect/2;camera.right=worldH*aspect/2;camera.top=worldH/2;camera.bottom=-worldH/2;}
  camera.zoom=1+insert*.12;camera.updateProjectionMatrix();
  const offset=-57*(1-insert),curvature=bend/110,key=insert.toFixed(4)+':'+bend.toFixed(4);
  for(const [productIndex,p] of products.entries()){
   p.group.scale.setScalar(products.length===2&&w<440?.88:1);
   if(products.length===2)p.group.position.y=(productIndex===0?.245:-.395)*(camera.top-camera.bottom)/camera.zoom;
   if(key!==previousKey){
    for(const{geo,board,points,normals}of p.bodies){const pos=geo.attributes.position,n=geo.attributes.normal;for(let i=0;i<pos.count;i++){const x=points[i*3]+(board?offset:0),a=x*curvature,c=Math.cos(a),s=Math.sin(a);pos.setXYZ(i,...point(x,points[i*3+1],points[i*3+2],curvature,p.vertical));if(p.vertical)n.setXYZ(i,normals[i*3]*c-normals[i*3+2]*s,normals[i*3+1],normals[i*3]*s+normals[i*3+2]*c);else n.setXYZ(i,normals[i*3]*c-normals[i*3+1]*s,normals[i*3]*s+normals[i*3+1]*c,normals[i*3+2]);}pos.needsUpdate=true;n.needsUpdate=true;geo.computeBoundingSphere();}
    for(const{holder,x}of p.components){holder.position.set(...point(x+offset,p.boardY,p.boardZ,curvature,p.vertical));holder.rotation.set(0,p.vertical?-(x+offset)*curvature:0,p.vertical?0:(x+offset)*curvature);}
   }
   p.group.position.x=22*(1-insert);p.milk.emissiveIntensity=light*(day?.65:1.45);p.phosphor.emissiveIntensity=light*(day?1:2);p.halo.opacity=light*(day?.2:.6);
  }
  previousKey=key;renderer.render(scene,camera);frames++;
 }
 return{mount,update,inspect:()=>({rendererReady:true,frames,contexts:1,models:specs.map(s=>({id:s.id,sku:s.sku,sectionSource:sections[s.id].source,width:s.width,height:s.height,pcbWidth:s.pcbWidth,pcbOrientation:s.vertical?'vertical':'horizontal'})),geometries:renderer.info.memory.geometries})};
}
if(typeof document!=='undefined')initSleevesPage();
