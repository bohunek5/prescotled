import * as T from '../konfigurator/vendor/three/build/three.module.min.js';
import {evolutionModels as models,evolutionState,brandIntro} from './offer-series-models.mjs?v=20260926-light1';

// One physical PCB, with every contact, package and light particle sharing the
// same deformation. A travelling front changes product technology along it.
export function createEvolutionScene(host,{presentation=false}={}){
 presentation=presentation===true;
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0x080f11,0);
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,100),coil=new T.Group();scene.add(coil);
 const ambient=new T.HemisphereLight(0xc5dfd9,0x0e1c20,.85),key=new T.DirectionalLight(0xffedcb,1.85),rim=new T.DirectionalLight(0x81bace,1.6);
 key.position.set(-7,11,12);rim.position.set(7,2,-7);scene.add(ambient,key,rim);
 const TAU=Math.PI*2,turns=2.35,height=17.4,radius=2.65,sweep=turns*TAU;
 const resources=new Set(),packs=[],particleLayers=[];let seed=314159;
 const keep=v=>(resources.add(v),v),random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const uniforms={uEvoDigitalA:{value:0},uEvoDigitalB:{value:0},uEvoLevelA:{value:.28},uEvoLevelB:{value:.28},uEvoProfileA:{value:new T.Vector2(1,0)},uEvoProfileB:{value:new T.Vector2(1,0)},uEvoTwist:{value:0},uEvoFront:{value:-.12},uEvoTime:{value:0},uEvoIgnition:{value:1},uEvoChange:{value:0},uFilmRebuild:{value:0},uEvoA:{value:new T.Color(models[0].light)},uEvoB:{value:new T.Color(models[0].light)}};
 // When the number of turns changes, the centre radius changes inversely.
 // Height and helical centreline length remain fixed: this is unwinding, not
 // scaling the length or spacing of the real strip. Its cross section remains.
 const deformGLSL=`
 ${presentation?'#define EVO_PRESENTATION':''}
 uniform float uEvoTwist;uniform float uEvoFront;uniform float uEvoTime;uniform float uEvoIgnition;uniform float uEvoLevelA;uniform float uEvoLevelB;uniform float uEvoChange;
 uniform float uFilmRebuild;uniform float uEvoDigitalA;uniform float uEvoDigitalB;
 uniform vec3 uEvoA;uniform vec3 uEvoB;uniform vec2 uEvoProfileA;uniform vec2 uEvoProfileB;
 vec2 evoRotate(vec2 p,float a){float c=cos(a),s=sin(a);return vec2(c*p.x-s*p.y,s*p.x+c*p.y);}
 float evoIncoming(float u){return 1.-smoothstep(uEvoFront-.065,uEvoFront+.065,u);}
 float evoCoverage(float u,float role){float n=evoIncoming(u);return role>.5?n:role<-.5?1.-n:1.;}
 // A soft reflected highlight follows the existing technology boundary.
 // It is an illustrative transition, not an addressable LED operating mode.
 float evoChangeLight(float u){float d=(u-uEvoFront)/.055;return uEvoChange*exp(-d*d);}
 float evoRebuild(float u){float d=(u-uEvoFront)/.125;return uFilmRebuild*exp(-d*d);}
 vec2 evoProfile(float u){
  vec2 model=mix(uEvoProfileA,uEvoProfileB,evoIncoming(u));
  // The 6 mm EF018 PCB has LED islands linked by complementary S-shaped
  // necks. One 16.67 mm repeat per LED, three LEDs per 50 mm cut module.
  float phase=u*EVO_LENGTH/1.6666667-.5;
  float cutDistance=abs(mod(u*EVO_LENGTH-.1+2.5,5.)-2.5);
  float neck=smoothstep(.12,.3,cutDistance);
  float offset=.18*sin(phase*6.283185)*model.y*neck;
  float halfWidth=.5*model.x-(abs(offset)+.055*pow(sin(phase*3.141593),2.)*neck)*model.y;
  return vec2(halfWidth,offset);
 }
 vec3 evoDeform(vec3 p,float u,float structural){
  float a=u*14.765485-.8,r=2.65*(.92+.08*sin(u*3.141593));
  vec3 centre=vec3(r*cos(a),17.4*(.5-u),r*sin(a));
  vec3 normal=vec3(cos(a),0.,sin(a));
  vec3 tangent=normalize(vec3(-r*sin(a)*14.765485,-17.4,r*cos(a)*14.765485));
  vec3 across=normalize(cross(normal,tangent));vec3 offset=p-centre;vec2 profile=evoProfile(u);
  if(structural>.5)offset+=across*dot(offset,across)*(2.*profile.x-1.);
  offset+=across*profile.y;
  #ifdef EVO_PRESENTATION
  // Only the travelling assembly front lifts; the physical PCB stays whole.
  // Equal along-coordinates keep each package rigid rather than stretching it.
  if(structural<.5){float rebuild=evoRebuild(u);offset+=rebuild*(normal*(.38+.22*sin(u*193.))+across*(.32*sin(u*271.))+tangent*(.16*cos(u*137.)));}
  #endif
  float twist=uEvoTwist*(u-.5),radial=14.765485/(14.765485+uEvoTwist);
  p=centre+offset;p.xz=evoRotate(centre.xz,twist)*radial+evoRotate(offset.xz,twist);return p;
 }
 float evoPower(float u){return mix(.12,1.,smoothstep(u-.09,u+.09,uEvoIgnition))*mix(uEvoLevelA,uEvoLevelB,evoIncoming(u));}
 vec3 evoLight(float u){
  float n=evoIncoming(u),digital=mix(uEvoDigitalA,uEvoDigitalB,n);
  vec3 colour=mix(uEvoA,uEvoB,n);
  // Addressable families alone show a moving colour field.
  float phase=u*1.55-uEvoTime*.065;
  vec3 spectrum=.58+.42*cos(6.283185*(phase+vec3(.0,.33,.67)));
  return mix(colour,spectrum,digital*.85);
 }
 `;
 const project=T.ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;',`vEvoAlong=aEvoAlong;mvPosition.xyz=evoDeform(mvPosition.xyz,aEvoAlong,uEvoStructural);mvPosition = modelViewMatrix * mvPosition;`);
 const normalChunk=T.ShaderChunk.defaultnormal_vertex.replace('transformedNormal = normalMatrix * transformedNormal;',`
 vec4 evoNormalPoint=vec4(position,1.);
 #ifdef USE_INSTANCING
 evoNormalPoint=instanceMatrix*evoNormalPoint;
 #endif
 transformedNormal.xz=evoRotate(transformedNormal.xz,uEvoTwist*(aEvoAlong-.5));
 transformedNormal = normalMatrix * transformedNormal;`);
 function animateMaterial(material,{role={value:0},light=false,copper=false,structural=false,printed=false}={}){
  material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,uniforms,{uEvoRole:role,uEvoStructural:{value:structural?1:0}});
   shader.vertexShader=deformGLSL.replaceAll('EVO_LENGTH',length.toFixed(8))+'\nattribute float aEvoAlong;uniform float uEvoStructural;varying float vEvoAlong;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',project).replace('#include <defaultnormal_vertex>',normalChunk);
   shader.fragmentShader=deformGLSL.replaceAll('EVO_LENGTH',length.toFixed(8))+'\nuniform float uEvoRole;uniform float uEvoStructural;varying float vEvoAlong;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    diffuseColor.a*=evoCoverage(vEvoAlong,uEvoRole);if(diffuseColor.a<.004)discard;
    #ifdef EVO_PRESENTATION
    if(uEvoStructural<.5)diffuseColor.a*=1.-.63*evoRebuild(vEvoAlong);
    #endif
    float evoPulse=pow(.5+.5*cos((vEvoAlong-uEvoTime*.13)*6.283185),24.);
    ${light?'diffuseColor.rgb*=evoLight(vEvoAlong)*evoPower(vEvoAlong)*(.88+.12*evoPulse+.14*evoChangeLight(vEvoAlong));':''}
    ${copper?'diffuseColor.rgb*=1.+.35*evoPulse+.7*evoChangeLight(vEvoAlong);':''}
   `);
   if(printed)shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2D( map, vec2((vMapUv.x-.5)/mix(uEvoProfileA.x,uEvoProfileB.x,evoIncoming(vEvoAlong))+.5,vMapUv.y) )'));
   if(light&&material.isMeshStandardMaterial)shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
    totalEmissiveRadiance*=evoLight(vEvoAlong)*evoPower(vEvoAlong)*(.88+.12*evoPulse+.14*evoChangeLight(vEvoAlong));`);
  };
  material.customProgramCacheKey=()=>`evolution-branded-reflex-4-${light?1:0}-${copper?1:0}-${printed?1:0}${presentation?'-film-rebuild-1':''}`;
  return material;
 }
 const standard=(opts,animation)=>animateMaterial(keep(new T.MeshStandardMaterial({roughness:.55,metalness:0,transparent:true,depthWrite:false,...opts})),animation);
 const basic=(opts,animation)=>animateMaterial(keep(new T.MeshBasicMaterial({transparent:true,depthWrite:false,...opts})),animation);
 function frame(u){
  const a=u*sweep-.8,r=radius*(.92+.08*Math.sin(u*Math.PI));
  const p=new T.Vector3(r*Math.cos(a),height*(.5-u),r*Math.sin(a));
  const tangent=new T.Vector3(-r*Math.sin(a)*sweep,-height,r*Math.cos(a)*sweep).normalize(),normal=new T.Vector3(Math.cos(a),0,Math.sin(a)),across=new T.Vector3().crossVectors(normal,tangent).normalize();
  return{p,tangent,normal,across};
 }
 const frames=Array.from({length:641},(_,i)=>frame(i/640)),distances=[0];
 for(let i=1;i<frames.length;i++)distances.push(distances[i-1]+frames[i].p.distanceTo(frames[i-1].p));
 const length=distances.at(-1),lengthMm=length*10;
 function along(distance){let lo=0,hi=640;while(hi-lo>1){const mid=(lo+hi)>>1;if(distances[mid]<distance)lo=mid;else hi=mid;}return(lo+(distance-distances[lo])/(distances[hi]-distances[lo]))/640;}
 function point(f,x=0,y=0,z=0){return f.p.clone().addScaledVector(f.across,x).addScaledVector(f.tangent,y).addScaledVector(f.normal,z);}
 function ribbon(left,right,depth=0){
  const pos=[],uv=[],indices=[];
  for(let i=0;i<frames.length;i++){const f=frames[i];for(const x of[left,right])pos.push(...point(f,x,0,depth).toArray());uv.push(0,i/640,1,i/640);if(i<640){const n=i*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
  const geometry=keep(new T.BufferGeometry());geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setAttribute('aEvoAlong',new T.Float32BufferAttribute(frames.flatMap((_,i)=>[i/640,i/640]),1));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
 }
 const pcb=standard({color:0xdadfce,side:T.FrontSide,roughness:.7,opacity:.97,depthWrite:true},{structural:true});
 const board=new T.Mesh(ribbon(-.5,.5,-.018),pcb);board.renderOrder=0;coil.add(board);
 const back=standard({color:0x66706a,side:T.BackSide,roughness:.83,opacity:.98,depthWrite:true},{structural:true});const reverse=new T.Mesh(ribbon(-.5,.5,-.045),back);reverse.renderOrder=0;coil.add(reverse);
 // Actual PRESCOT artwork, printed on the PCB surfaces. No floating seals.
 // CE / RoHS reproduce markings visible on DELUX photographs and the source
 // SLIM / S-Shape product cards; they do not add a certification claim.
 const printMaterials=[],printTextures={day:[],night:[]};let brandPrinted=false;
 const brandCanvas=document.createElement('canvas');brandCanvas.width=2048;brandCanvas.height=294;const brandInk=brandCanvas.getContext('2d');brandInk.font='600 228px Arial';brandInk.textAlign='center';brandInk.textBaseline='middle';brandInk.fillStyle='#c0fff0';brandInk.shadowColor='#48e1c7';brandInk.shadowBlur=24;brandInk.fillText('YOUR BRAND',1024,151);const brandTexture=textureFrom(brandCanvas);
 function patchGeometry(spans,backside){
  const pos=[],uv=[],alongValues=[],indices=[];
  for(const {centre,span,left,right,depth} of spans){
   const base=pos.length/3,steps=40;
   for(let i=0;i<=steps;i++){
    const d=Math.max(0,Math.min(length,centre+(i/steps-.5)*span)),u=along(d),f=frame(u);
    for(const x of[left,right]){pos.push(...point(f,x,0,depth).toArray());alongValues.push(u);}
    uv.push(i/steps,backside?1:0,i/steps,backside?0:1);
    if(i<steps){const k=base+i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
   }
  }
  const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('aEvoAlong',new T.Float32BufferAttribute(alongValues,1));g.setIndex(indices);g.computeVertexNormals();return g;
 }
 function printLayer(spans,kind,backside){
  const material=basic({color:0xffffff,side:backside?T.BackSide:T.FrontSide,alphaTest:.05,opacity:0},{structural:true,printed:true});
  const mesh=new T.Mesh(patchGeometry(spans,backside),material);mesh.renderOrder=1;mesh.frustumCulled=false;coil.add(mesh);printMaterials.push({material,kind});
 }
 const brandBack=[],marksBack=[],brandFront=[],marksFront=[];
 for(let d=2.5;d<length-2;d+=7){
  brandBack.push({centre:d,span:2.7,left:-.194,right:.194,depth:-.052});
  marksBack.push({centre:d+2.05,span:1.2,left:-.2,right:.2,depth:-.053});
  brandFront.push({centre:d,span:.91,left:-.29,right:-.16,depth:.012});
  marksFront.push({centre:d+2.05,span:.6,left:.14,right:.34,depth:.012});
 }
 printLayer(brandBack,0,true);printLayer(marksBack,1,true);printLayer(brandFront,0,false);printLayer(marksFront,1,false);
 function textureFrom(canvas){const texture=keep(new T.CanvasTexture(canvas));texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return texture;}
 function imageTexture(url,width,height){return new Promise(resolve=>{const img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(img,0,0,width,height);resolve(textureFrom(canvas));};img.onerror=()=>resolve(null);img.src=url;});}
 const ready=Promise.all(['night','day'].map(async mode=>{
  printTextures[mode]=await Promise.all([
   imageTexture(new URL('../konfigurator/assets/'+(mode==='day'?'logo-navy.svg':'logo-white.svg'),import.meta.url).href,2048,294),
   imageTexture(new URL('./media/strip-print-marks-'+mode+'.svg',import.meta.url).href,768,256)
  ]);
 })).then(()=>{if(disposed)return;printMaterials.forEach(({material,kind})=>{material.map=printTextures[presentation?'day':theme][kind]||null;material.opacity=material.map?.95:0;material.needsUpdate=true;});});
 const matrix=new T.Matrix4(),basis=new T.Matrix4(),quaternion=new T.Quaternion(),unitScale=new T.Vector3(1,1,1);
 function instances(group,geometry,material,items){
  geometry.setAttribute('aEvoAlong',new T.InstancedBufferAttribute(new Float32Array(items.map(i=>i.u)),1));
  const mesh=new T.InstancedMesh(keep(geometry),material,items.length);mesh.instanceMatrix.setUsage(T.StaticDrawUsage);mesh.frustumCulled=false;mesh.renderOrder=2;
  items.forEach(({u,x=0,y=0,z=.024},i)=>{const f=frame(u);basis.makeBasis(f.across,f.tangent.clone().negate(),f.normal);quaternion.setFromRotationMatrix(basis);matrix.compose(point(f,x,y,z),quaternion,unitScale);mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;group.add(mesh);return mesh;
 }
 function createPack(family,density,cutOverride){
  const group=new T.Group();coil.add(group);const role={value:0};
  const gold=standard({color:0xcda158,metalness:.62,roughness:.4},{role,copper:true});
  const body=standard({color:0xf0eee0,roughness:.45},{role}),dark=standard({color:0x27312e,roughness:.66},{role});
  const emitter=basic({color:0xffffff,side:T.DoubleSide},{role,light:true});
  const rgb=family==='rgb'||family==='rgbw'||family==='digital',wcob=family==='wcob',digital=family==='cobdigital'||family==='digital',cob=family.startsWith('cob'),slim=family==='slim',sshape=family==='sshape',pitch=100/density,count=Math.floor(length/pitch),components=Array.from({length:count},(_,i)=>({u:sshape?(i+.5)*pitch/length:along((i+.5)*pitch)}));
  let lightMaterial=null;
  if(cob){
   lightMaterial=standard({color:0xf2e6c6,emissive:0xffffff,emissiveIntensity:1.6,side:T.DoubleSide,roughness:.62},{role,light:true});
   const line=new T.Mesh(ribbon(-.215,.215,.04),lightMaterial);line.renderOrder=2;group.add(line);
  }else{
   const w=rgb?.5:wcob?.2:.28,h=rgb?.5:wcob?.16:.35;
   instances(group,new T.BoxGeometry(w,h,rgb?.095:.062),body,components.map(c=>({...c,z:.04})));
   instances(group,new T.PlaneGeometry(rgb?.345:wcob?.14:.175,rgb?.345:wcob?.105:.228),emitter,components.map(c=>({...c,z:rgb?.093:.075}))).renderOrder=3;
   const pins=components.flatMap(c=>rgb?[-1,1].flatMap(side=>[-.165,0,.165].map(y=>({...c,x:side*.285,y,z:.034}))):[-1,1].map(side=>({...c,y:side*.205,z:.026})));
   instances(group,new T.BoxGeometry(rgb?.075:.22,rgb?.074:.067,.025),gold,pins);
   if(rgb){
    (family==='rgbw'?[[-.12,0xeab8ac],[-.04,0xc9e5c4],[.04,0xb6cfee],[.12,0xfff4dd]]:[[-.1,0xe13d29],[0,0x38b779],[.1,0x3474d8]]).forEach(([x,color])=>{const die=basic({color,side:T.DoubleSide,opacity:.9},{role});instances(group,new T.PlaneGeometry(.062,.12),die,components.map(c=>({...c,x,z:.099}))).renderOrder=4;});
   }else{
    const resistors=components.filter((_,i)=>family==='delux3'?[1,3,5].includes(i%8):i%(sshape?3:8)===(sshape?1:3)).map(c=>({...c,u:slim||sshape?c.u+(slim?.28:.38)/length:c.u,x:slim||sshape?0:.325,z:.04}));instances(group,new T.BoxGeometry(.085,.16,.048),dark,resistors);
   }
  }
  if(digital){const chips=[];for(let d=1;d<length;d+=(cutOverride??7.1))chips.push({u:along(d),x:.325,z:.08});instances(group,new T.BoxGeometry(.18,.30,.10),dark,chips);}
  const traces=family==='delux3'||rgb?[-.425,-.345,.345,.425]:slim?[-.165,.165]:sshape?[-.075,.075]:[-.39,.39];
  const paths=[];
  for(const x of traces){const material=family==='delux3'?standard({color:0xcda158,emissive:0xf4bd76,emissiveIntensity:0,metalness:.5,roughness:.4},{role,copper:true}):gold;const mesh=new T.Mesh(ribbon(x-.009,x+.009,.007),material);mesh.renderOrder=1;group.add(mesh);paths.push(material);}
  const padCount=family==='rgbw'?5:family==='delux3'||rgb?4:2,cut=cutOverride??(family==='delux3'||rgb?5:cob?4.5:slim||sshape?5:6.3),pads=[];
  for(let d=.1;d<length;d+=cut)for(let k=0;k<padCount;k++)pads.push({u:along(d),x:(k-(padCount-1)/2)*(padCount===5?.18:padCount===4?.23:slim?.21:sshape?.34:.68),z:.03});
  instances(group,new T.PlaneGeometry(slim?.15:padCount>=4?.13:.24,.22),gold,pads);
  if(family==='cobip67'){
   const sleeve=standard({color:0xd6e9ef,side:T.DoubleSide,roughness:.15,metalness:.08,opacity:.18},{role,structural:true});
   for(const [left,right,z] of [[-.59,.59,.15],[-.59,.59,-.10]]){const skin=new T.Mesh(ribbon(left,right,z),sleeve);skin.renderOrder=4;group.add(skin);}
   const shine=basic({color:0xdaeeff,side:T.DoubleSide,opacity:.6},{role,structural:true});
   for(const x of[-.58,.58]){const edge=new T.Mesh(ribbon(x-.016,x+.016,.12),shine);edge.renderOrder=5;group.add(edge);}
  }
  const pack={group,role,family,count,components,lightMaterial,paths};packs.push(pack);return pack;
 }
 createPack('delux3',160);createPack('smd',128);createPack('slim',160);createPack('sshape',60);createPack('rgb',60);createPack('cob',528);createPack('smd5',60,1.7);createPack('smd12',60,5);createPack('smd24',120,5);createPack('cob48',480,5);createPack('cobdigital',784,7.1);createPack('wcob',320,2.5);createPack('cobip67',320,5);createPack('digital',60,5);createPack('bread',70,5);createPack('rgbw',60,5);
 const shaderVertex=deformGLSL.replaceAll('EVO_LENGTH',length.toFixed(8))+`
 attribute float aSize;attribute float aAlong;attribute float aSeed;
 uniform float uStructural;uniform float uScale;uniform float uDpr;uniform float uOpacity;uniform float uRole;uniform float uGlow;uniform vec3 uColor;
 varying vec3 vColor;varying float vAlpha;
 void main(){
  vec3 p=evoDeform(position,aAlong,uStructural);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
  float flow=pow(.5+.5*cos((aAlong-uEvoTime*.13)*6.283185),24.);
  gl_PointSize=clamp(aSize*uScale*uDpr/-mv.z*(1.+flow*.65),.7,100.*uDpr);
  float depth=mix(.3,1.,smoothstep(-2.,2.,(modelMatrix*vec4(p,1.)).z));
  vColor=mix(uColor,evoLight(aAlong),uGlow);
  vAlpha=uOpacity*depth*evoCoverage(aAlong,uRole)*mix(.3+.7*flow,evoPower(aAlong)*(.82+.18*flow+.12*evoChangeLight(aAlong)),uGlow);
 }`;
 const shaderFragment=`varying vec3 vColor;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(vColor,(1.-smoothstep(.02,1.,d))*vAlpha);
 #include <colorspace_fragment>
 }`;
 function particles(items,color,opacity,{role={value:0},glow=false,structural=false}={}){
  const geometry=keep(new T.BufferGeometry());geometry.setAttribute('position',new T.Float32BufferAttribute(items.flatMap(i=>i.p.toArray()),3));geometry.setAttribute('aSize',new T.Float32BufferAttribute(items.map(i=>i.size),1));geometry.setAttribute('aAlong',new T.Float32BufferAttribute(items.map(i=>i.u),1));geometry.setAttribute('aSeed',new T.Float32BufferAttribute(items.map(()=>random()),1));
  const own={...uniforms,uStructural:{value:structural?1:0},uScale:{value:800},uDpr:{value:renderer.getPixelRatio()},uOpacity:{value:opacity},uRole:role,uGlow:{value:glow?1:0},uColor:{value:new T.Color(color)}};
  const mat=keep(new T.ShaderMaterial({uniforms:own,vertexShader:shaderVertex,fragmentShader:shaderFragment,transparent:true,depthWrite:false,blending:T.AdditiveBlending})),mesh=new T.Points(geometry,mat);mesh.frustumCulled=false;mesh.renderOrder=3;coil.add(mesh);const layer={mesh,mat,uniforms:own,opacity};particleLayers.push(layer);return layer;
 }
 const edges=[];
 for(let i=0;i<641;i++){const u=i/640,f=frames[i];for(const x of[-.503,.503])edges.push({u,p:point(f,x,0,.001),size:.036});}
 const lattice=particles(edges,0x9fc5b0,.5,{structural:true});
 for(const pack of packs){
  const samples=pack.family.startsWith('cob')?Array.from({length:600},(_,i)=>({u:i/599})):pack.components;
  pack.glow=particles(samples.map(({u})=>({u,p:point(frame(u),0,0,.1),size:pack.family.startsWith('cob')?.44:.72})),0xffffff,.62,{role:pack.role,glow:true});
  // Broad, low-opacity light hugs the physical strip, sharing its deformation.
  // Sampling is capped; its soft overlap does not depend on catalogue density.
  const haloSamples=pack.family.startsWith('cob')?Array.from({length:180},(_,i)=>({u:i/179})):pack.components.filter((_,i)=>i%Math.max(1,Math.ceil(pack.count/180))===0);
  pack.halo=particles(haloSamples.map(({u})=>({u,p:point(frame(u),0,0,.09),size:2.6})),0xffffff,.035,{role:pack.role,glow:true});
 }
 // Stylised charge traces stay beside the copper. They are not extra LEDs and
 // never turn analogue RGB into an individually addressable rainbow strip.
 const driftSeeds=Array.from({length:96},()=>({u:random(),x:random()>.5?.39:-.39,z:.029,speed:.065+random()*.035}));
 const drift=particles(driftSeeds.map(e=>({u:e.u,p:point(frame(e.u),e.x,0,e.z),size:.054+random()*.032})),0x9ce0c9,.8,{structural:true}),driftPosition=drift.mesh.geometry.attributes.position,driftAlong=drift.mesh.geometry.attributes.aAlong;
 // Film candidate only: seeded fragments originate on the actual PCB surface.
 // One static buffer / one draw call. Analogue RGB remains one shared colour.
 let rebuildLayer=null;
 if(presentation){
  const count=1200,positions=[],normals=[],across=[],tangents=[],alongValues=[],seeds=[],sizes=[];
  for(let i=0;i<count;i++){
   const u=(i+.5)/count,f=frame(u),x=(random()-.5)*.88;
   positions.push(...point(f,x,0,.048).toArray());normals.push(...f.normal.toArray());across.push(...f.across.toArray());tangents.push(...f.tangent.toArray());alongValues.push(u);seeds.push(random());sizes.push(.065+random()*.075);
  }
  const geometry=keep(new T.BufferGeometry());
  for(const[name,data,size]of[['position',positions,3],['aNormal',normals,3],['aAcross',across,3],['aTangent',tangents,3],['aAlong',alongValues,1],['aSeed',seeds,1],['aSize',sizes,1]])geometry.setAttribute(name,new T.Float32BufferAttribute(data,size));
  const own={...uniforms,uScale:{value:800},uDpr:{value:renderer.getPixelRatio()}};
  const vertexShader=deformGLSL.replaceAll('EVO_LENGTH',length.toFixed(8))+`
   attribute vec3 aNormal;attribute vec3 aAcross;attribute vec3 aTangent;
   attribute float aAlong;attribute float aSeed;attribute float aSize;
   uniform float uScale;uniform float uDpr;varying vec3 vFilmColor;varying float vFilmAlpha;varying float vFilmAngle;
   void main(){
    float rebuild=evoRebuild(aAlong),phase=aSeed*6.283185+uEvoTime*1.35;
    vec3 spread=aNormal*(.45+aSeed*.95)+aAcross*sin(phase)*(1.+aSeed*.35)+aTangent*cos(phase*1.7)*.46;
    vec3 p=evoDeform(position+spread*rebuild,aAlong,1.);
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    gl_PointSize=clamp(aSize*uScale*uDpr/-mv.z,1.,4.5*uDpr);
    vec3 ceramic=vec3(.91,.95,.89),copper=vec3(.83,.51,.20);
    vec3 fragment=mix(ceramic,copper,step(.63,aSeed));
    vFilmColor=mix(fragment,evoLight(aAlong),.42);
    vFilmAlpha=pow(rebuild,.65)*(.54+.42*aSeed);vFilmAngle=phase;
   }`;
  const fragmentShader=`varying vec3 vFilmColor;varying float vFilmAlpha;varying float vFilmAngle;
   void main(){vec2 p=gl_PointCoord-.5;float c=cos(vFilmAngle),s=sin(vFilmAngle);p=mat2(c,-s,s,c)*p;float edge=max(abs(p.x),abs(p.y));float alpha=(1.-smoothstep(.27,.49,edge))*vFilmAlpha;if(alpha<.012)discard;gl_FragColor=vec4(vFilmColor,alpha);
   #include <colorspace_fragment>
   }`;
  const material=keep(new T.ShaderMaterial({uniforms:own,vertexShader,fragmentShader,transparent:true,depthWrite:false,blending:T.NormalBlending}));
  const mesh=new T.Points(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=5;mesh.visible=false;coil.add(mesh);rebuildLayer={mesh,uniforms:own,count};
 }
 // Presentation illumination makes a CCT change visible at film size; catalogue
 // temperatures and all electrical/output specifications remain unchanged.
 function modelLight(m){
  if(m.custom||!presentation||m.unit!=='K')return new T.Color(m.light);
  const kelvin=Number(m.color);
  return new T.Color(kelvin<=3000?'#ffad50':kelvin<=4000?'#fff0cf':kelvin<=5700?'#c7e2ff':'#acd2ff');
 }
 const rgbwPalette=['#edb4b7','#c3b4ee','#a8cceb','#a8ded1'].map(c=>new T.Color(c));
 const colors=models.map(modelLight),rgbColor=new T.Color(),lightColor=new T.Color(),front=new T.Vector3(),filmWhite=new T.Color(0xf5f6ef);
 let theme='night',motion=true,disposed=false,rendered=0,lastIndex=0,lastProgress=0,lastRotation=0,lastTwist=0,lastBlend=0,width=0,heightPx=0,lastAura=-1;
 function setTheme(next){
  theme=next==='day'?'day':'night';const day=theme==='day';
  printMaterials.forEach(({material,kind})=>{if(printTextures[presentation?'day':theme][kind]){material.map=brandPrinted?kind===0?brandTexture:null:printTextures[presentation?'day':theme][kind];material.opacity=material.map?.95:0;material.needsUpdate=true;}});
  pcb.color.set(day?0xe7e9dc:0xdadfce);pcb.opacity=.99;back.color.set(day?0xc9ccbf:0x66706a);back.opacity=.98;
  ambient.intensity=day?1.8:.85;ambient.color.set(day?0xf6fff5:0xc5dfd9);ambient.groundColor.set(day?0xa4b0a4:0x0e1c20);
  key.intensity=day?1.8:1.85;key.color.set(day?0xf6fff9:0xffedcb);rim.intensity=day?.85:1.6;renderer.toneMappingExposure=day?1.02:1;
  if(presentation){
   pcb.color.set(0xefefe4);back.color.set(0xcbd1c8);
   ambient.intensity=day?2.05:1.75;ambient.color.set(0xf5f8f1);ambient.groundColor.set(0x8b9892);
   key.intensity=2.45;rim.intensity=2.3;renderer.toneMappingExposure=1.08;
   host.style.setProperty('--coil-aura-strength',day?'34%':'42%');
  }
  particleLayers.forEach(layer=>{layer.mat.blending=day?T.NormalBlending:T.AdditiveBlending;});
  lattice.uniforms.uColor.value.set(day?0x47695a:0x9fc5b0);drift.uniforms.uColor.value.set(day?0x487d67:0x9ce0c9);lastAura=-1;
 }
 function resize(){
  const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);if(w===width&&h===heightPx)return;width=w;heightPx=h;renderer.setSize(w,h,false);camera.aspect=w/h;
  const halfV=Math.max(9.85,4.1/camera.aspect),distance=halfV/Math.tan(35*Math.PI/360);camera.position.set(0,.8,distance);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  particleLayers.forEach(layer=>layer.uniforms.uScale.value=h/(2*Math.tan(35*Math.PI/360)));
  if(rebuildLayer)rebuildLayer.uniforms.uScale.value=h/(2*Math.tan(35*Math.PI/360));
 }
 function update(index,progress,pointerX=0,pointerY=0,seconds=0,sample=null){
  if(disposed)return;resize();if(index!==lastIndex||progress!==lastProgress)lastAura=-1;lastIndex=index;lastProgress=progress;
  const day=theme==='day',state=sample??evolutionState(progress),blend=state.blend;
  const resolveModel=m=>m.family==='custom'?brandIntro:m;
  const a=sample?.a??resolveModel(models[state.from]),b=sample?.b??resolveModel(models[state.to]);
  const custom=Boolean(sample||(blend>=.5?b.custom:a.custom));
  if(custom!==brandPrinted){brandPrinted=custom;printMaterials.forEach(({material,kind})=>{material.map=custom?kind===0?brandTexture:null:printTextures[presentation?'day':theme][kind];material.opacity=material.map?.95:0;material.needsUpdate=true;});}
  if(presentation){pcb.color.set(custom?0x293544:0xefefe4);back.color.set(custom?0x142031:0xcbd1c8);}
  uniforms.uEvoDigitalA.value=['cobdigital','digital'].includes(a.family)?1:0;uniforms.uEvoDigitalB.value=['cobdigital','digital'].includes(b.family)?1:0;
  const time=motion?seconds:0;
  coil.rotation.y=-.38+progress*TAU*1.32+time*.19+pointerX*.2;coil.rotation.z=-.035+pointerY*.022;
  lastRotation=coil.rotation.y;
  // A controlled breath opens the helix during each chapter; a slower idle
  // winding keeps the product alive even when the reader stops scrolling.
  lastTwist=-1.7*Math.sin(state.local*Math.PI)**2+(motion?Math.sin(time*.45)*1.05:0);
  uniforms.uEvoTwist.value=lastTwist;uniforms.uEvoFront.value=blend*1.26-.13;uniforms.uEvoTime.value=time;
  uniforms.uEvoIgnition.value=motion?Math.min(1,seconds/1.5):1;lastBlend=blend;
  // Zero at both ends, including its derivative: no flash on chapter changes.
  // Scroll drives the highlight; reduced motion disables it entirely.
  uniforms.uEvoChange.value=motion&&a.family!==b.family?Math.sin(Math.PI*blend)**2*(day?.7:1):0;
  uniforms.uFilmRebuild.value=0; // Keep the ribbon whole during soft material transitions.
  if(rebuildLayer)rebuildLayer.mesh.visible=uniforms.uFilmRebuild.value>.002;
  uniforms.uEvoProfileA.value.set(Number(a.width)/10,a.family==='sshape'?1:0);uniforms.uEvoProfileB.value.set(Number(b.width)/10,b.family==='sshape'?1:0);
  uniforms.uEvoA.value.copy(modelLight(a));uniforms.uEvoB.value.copy(modelLight(b));
  uniforms.uEvoLevelA.value=a.level??(a.family==='delux3'?Number(a.power)/11:1);uniforms.uEvoLevelB.value=b.level??(b.family==='delux3'?Number(b.power)/11:1);
  rgbColor.setHSL((.73+time*.052)%1,.87,day?.43:.6);
  if(a.family==='rgb')uniforms.uEvoA.value.copy(rgbColor);if(b.family==='rgb')uniforms.uEvoB.value.copy(rgbColor);
  // One shared colour across every analogue RGBW LED; the white channel keeps
  // the palette soft. This is deliberately not an addressable rainbow chase.
  const palettePhase=Math.min(3,Math.max(0,(sample?.elapsed??0)/2.65)),paletteIndex=Math.min(2,Math.floor(palettePhase)),paletteMix=palettePhase-paletteIndex;
  rgbColor.copy(rgbwPalette[paletteIndex]).lerp(rgbwPalette[paletteIndex+1],paletteMix*paletteMix*(3-2*paletteMix));
  if(a.family==='rgbw')uniforms.uEvoA.value.copy(rgbwPalette.at(-1));if(b.family==='rgbw')uniforms.uEvoB.value.copy(rgbColor);
  if(presentation){lightColor.copy(uniforms.uEvoA.value).lerp(uniforms.uEvoB.value,blend);key.color.copy(filmWhite).lerp(lightColor,.25);rim.color.copy(filmWhite).lerp(lightColor,.65);}
  packs.forEach(pack=>{
   const outgoing=a.family===pack.family,incoming=b.family===pack.family;
   pack.group.visible=(outgoing&&blend<.999)||(incoming&&blend>.001);pack.glow.mesh.visible=pack.group.visible;pack.halo.mesh.visible=pack.group.visible;
   pack.role.value=outgoing&&incoming?0:outgoing?-1:1;
   if(pack.lightMaterial)pack.lightMaterial.emissiveIntensity=presentation?(day?.85:2.15):day?.55:1.75;
   pack.glow.uniforms.uOpacity.value=presentation?(day?.2:.8):day?.12:pack.family.startsWith('cob')?.78:.88;
   pack.halo.uniforms.uOpacity.value=day?.014:pack.family.startsWith('cob')?.028:.09;
   if(pack.family==='delux3'){const mode=models[index].mode??0;pack.paths.forEach((material,i)=>{material.emissiveIntensity=(i===0||i===mode+1)?(day?.45:1.3):0;});}
  });
  lattice.mesh.visible=false;drift.mesh.visible=false;
  for(let i=0;i<driftSeeds.length;i++){
   const e=driftSeeds[i],u=(e.u+time*e.speed)%1,at=u*640,lo=Math.floor(at),hi=Math.min(640,lo+1),mix=at-lo,f=frames[lo],g=frames[hi];
   front.copy(f.p).lerp(g.p,mix).addScaledVector(f.across,e.x).addScaledVector(f.normal,e.z);driftPosition.setXYZ(i,front.x,front.y,front.z);driftAlong.setX(i,u);
  }
  driftPosition.needsUpdate=true;driftAlong.needsUpdate=true;
  if(lastAura<0||Math.abs(time-lastAura)>.09){lightColor.copy(uniforms.uEvoA.value).lerp(uniforms.uEvoB.value,blend);const energy=(presentation?1.15:.77+.15*Math.sin(time*.7))*(uniforms.uEvoLevelA.value+(uniforms.uEvoLevelB.value-uniforms.uEvoLevelA.value)*blend)*(1+.16*uniforms.uEvoChange.value);host.style.setProperty('--coil-light',lightColor.getStyle());host.style.setProperty('--coil-energy',String(energy));host.closest('.strip-evolution')?.style.setProperty('--evo-light',lightColor.getStyle());host.closest('.strip-evolution')?.style.setProperty('--evo-energy',String(energy));lastAura=time;}
  renderer.render(scene,camera);rendered++;
 }
 setTheme(document.documentElement.dataset.theme);resize();
 return{ready,update,resize,setTheme,setMotion(enabled){motion=Boolean(enabled);lastAura=-1;},inspect:()=>({frames:rendered,kind:'branded-slim-sshape-pcb-spiral',presentation,theme,motion,model:lastIndex,progress:lastProgress,rotation:lastRotation,twist:lastTwist,turns:turns+lastTwist/TAU,transition:lastBlend,transitionReflex:uniforms.uEvoChange.value,rebuild:uniforms.uFilmRebuild.value,rebuildParticles:rebuildLayer?.mesh.visible?rebuildLayer.count:0,presentationLight:lightColor.getStyle(),lightLevel:uniforms.uEvoLevelA.value+(uniforms.uEvoLevelB.value-uniforms.uEvoLevelA.value)*lastBlend,digital:Math.max(uniforms.uEvoDigitalA.value,uniforms.uEvoDigitalB.value),halo:packs.filter(p=>p.halo.mesh.visible).map(p=>p.family),pcbWidthMm:models[lastIndex]?.width,printedMarks:brandPrinted?['YOUR BRAND']:['PRESCOT LED','CE','RoHS'],printTexturesReady:printTextures.day.length===2&&printTextures.night.length===2,ignition:uniforms.uEvoIgnition.value,representedLengthMm:Math.round(lengthMm),components:packs.map(p=>({family:p.family,count:p.count,visible:p.group.visible,role:p.role.value})),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,renderedPoints:renderer.info.render.points,geometryCount:renderer.info.memory.geometries}),dispose(){disposed=true;resources.forEach(r=>r.dispose());renderer.dispose();renderer.domElement.remove();}};
}
