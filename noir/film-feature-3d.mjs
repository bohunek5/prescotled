import * as T from '../konfigurator/vendor/three/build/three.module.min.js';
import {stripAppearance,unlitEmitterColor} from './strip-appearance.mjs?v=detail-2';
import {sampleStripLight,temperatureColor} from './strip-light-program.mjs?v=detail-3';
import {describeStripFeature} from './strip-detail-cues.mjs?v=detail-9';

// Five real miniature models share the film clock. A card can also use its
// parent's renderer, so an overview with four cards still has one WebGL context.
export function createFeatureIcons({root=document,renderer:sharedRenderer=null}={}){
  const host=root.querySelector('.product-bottom'),slots=[...host.querySelectorAll('.feature-icon')];
  const renderer=sharedRenderer??new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  if(!sharedRenderer){
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;
    renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
    renderer.domElement.className='feature-canvas';renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
  }
  const previousViewport=new T.Vector4(),previousScissor=new T.Vector4();
  let views=[],resources=new Set(),revision=0,kind='',power=0,sunLevel=.25,theme='night';
  let palette=null,beamInfo=null,emitterInfo=null,sectionInfo=null,featureProduct=null,emitterMaterials=[],distinction=null,featureColor=null;
  let emphasis={amount:0,scale:1,cameraDistance:7,clipAdjusted:false};
  const emphasisPoint=new T.Vector3();
  const keep=v=>(resources.add(v),v);
  const mat=(color,options={})=>keep(new T.MeshPhysicalMaterial({color,roughness:.27,metalness:.12,clearcoat:.35,...options}));
  function rounded(w,h,d,r=.16){
    const s=new T.Shape(),x=-w/2,y=-h/2;r=Math.min(r,w/3,h/3);
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
    const b=Math.min(.035,w*.1,h*.1,d*.2);
    return keep(new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:3,curveSegments:8,steps:1}));
  }
  const mesh=(parent,g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;};
  function view(){
    const scene=new T.Scene(),actor=new T.Group();scene.add(actor);scene.add(new T.HemisphereLight(0xffffff,0x4b5c66,2.3));
    for(const [x,y,z,c,i] of [[-3,5,7,0xfff3dd,4],[4,1,4,0xc1dcff,2.5],[0,-3,3,0xffffff,1]]){const l=new T.DirectionalLight(c,i);l.position.set(x,y,z);scene.add(l);}
    const camera=new T.PerspectiveCamera(32,1,.1,50);camera.position.set(0,0,7);camera.lookAt(0,0,0);
    return {scene,actor,camera,moving:[]};
  }
  function led(parent,x=0,y=0,scale=1){
    const g=new T.Group();g.position.set(x,y,.16);g.scale.setScalar(scale);parent.add(g);
    const silver=mat(0xbfc7cc,{metalness:.85,roughness:.21}),white=mat(0xf9f6e9,{metalness:0,roughness:.32});
    mesh(g,rounded(2.1,2.5,.28),white);
    mesh(g,rounded(1.67,2.02,.035,.12),mat(0xb9a67a,{roughness:.6}),0,0,.29);
    const emitter=mesh(g,rounded(1.48,1.8,.08,.12),mat(0xf0c333,{metalness:0,roughness:.48}),0,0,.34);
    for(const side of [-1,1])mesh(g,rounded(.32,1.5,.2,.06),silver,side*1.12,0,-.025);
    mesh(g,rounded(.07,.34,.018,.02),mat(0x414b4b),.94,-.72,.32);
    return {group:g,emitter};
  }
  function smd2016(parent){
    // A separate 2.0 × 1.6 mm package: the white WCOB cover belongs to
    // the enclosure icon, not to the underlying SMD diode.
    const g=new T.Group();g.position.z=.12;g.scale.setScalar(1.27);parent.add(g);
    const ceramic=mat(0xf5f2e7,{metalness:0,roughness:.48,clearcoat:.12});
    const silver=mat(0xbfc8ca,{metalness:.84,roughness:.27});
    mesh(g,rounded(1.6,2,.30,.09),ceramic);
    mesh(g,rounded(1.28,1.66,.025,.07),mat(0xc5b682,{roughness:.65,metalness:0}),0,0,.31);
    mesh(g,rounded(1.12,1.50,.045,.055),mat(0xf0c333,{roughness:.6,metalness:0,clearcoat:.06,emissive:0x000000}),0,0,.34);
    for(const side of [-1,1])mesh(g,rounded(.16,1.30,.17,.03),silver,side*.83,0,-.025);
    mesh(g,rounded(.06,.24,.012,.012),mat(0x4a514b,{roughness:.55}),.71,-.61,.315);
  }
  function rgbwLed(parent){
    const g=new T.Group();g.position.z=.16;g.scale.setScalar(.5);parent.add(g);
    const ceramic=mat(0xf9f6e9,{metalness:0,roughness:.32}),silver=mat(0xbfc7cc,{metalness:.85,roughness:.21});
    mesh(g,rounded(5,5,.16,.12),ceramic);
    const rimShape=rounded(5,5,.43,.12).parameters.shapes;
    const hole=new T.Path(),s=2.175,r=.15;
    hole.moveTo(-s+r,-s);hole.lineTo(s-r,-s);hole.quadraticCurveTo(s,-s,s,-s+r);hole.lineTo(s,s-r);hole.quadraticCurveTo(s,s,s-r,s);hole.lineTo(-s+r,s);hole.quadraticCurveTo(-s,s,-s,s-r);hole.lineTo(-s,-s+r);hole.quadraticCurveTo(-s,-s,-s+r,-s);
    rimShape.holes.push(hole);
    mesh(g,keep(new T.ExtrudeGeometry(rimShape,{depth:.43,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:3,curveSegments:8,steps:1})),ceramic,0,0,.21);
    // Match the photographed RGBW package: one white-channel phosphor area
    // above a silver cavity containing the three smaller, bare RGB dies.
    mesh(g,rounded(4.1,1.18,.13,.09),mat(0xf0c333,{metalness:0,roughness:.48}),0,1.02,.35);
    mesh(g,rounded(4.1,2.16,.07,.15),mat(0xbfcacc,{metalness:.88,roughness:.25}),0,-.84,.29);
    const die=mat(0xcad4d7,{metalness:.45,roughness:.3,clearcoat:.2});
    for(const x of [-1.05,0,1.05])mesh(g,rounded(.55,.58,.12,.045),die,x,-.79,.38);
    for(const side of [-1,1])mesh(g,rounded(.34,3.35,.18,.06),silver,side*2.57,0,.025);
    mesh(g,rounded(.08,.45,.018,.02),mat(0x414b4b),2.35,0,.66);
  }
  function board(parent,cob=false,digital=false,segment=false,product=null){
    const w=segment?3.35:1.9,h=segment?1.45:3.2;
    mesh(parent,rounded(w,h,.13,.12),mat(0xeceee4,{roughness:.56,metalness:0}));
    mesh(parent,rounded(w,h,.035,.12),mat(0xbfb186,{metalness:.55}),0,0,-.05);
    const gold=mat(0xd99b52,{metalness:.7,roughness:.25});
    const appearance=product?stripAppearance(product):null;
    if(!appearance?.opaqueFront)for(const side of [-1,1])for(const offset of [-.32,.32])mesh(parent,rounded(.22,.38,.025,.08),gold,segment?side*(w/2-.23):offset,segment?offset:side*(h/2-.28),.15);
    if(cob){
      const color=product?unlitEmitterColor(product):0xefc434;
      const phosphor=mat(color,{metalness:0,roughness:appearance?.opaqueFront ? .38 : .55,clearcoat:appearance?.opaqueFront ? .25 : 0});
      emitterMaterials.push(phosphor);
      if(appearance?.kind==='wcob-dome')mesh(parent,keep(new T.CylinderGeometry(w/2,w/2,h,32,1,false,-Math.PI/2,Math.PI)),phosphor,0,0,.15);
      else if(appearance?.opaqueFront)mesh(parent,rounded(w-.04,h,.36,.18),phosphor,0,0,.15);
      else mesh(parent,rounded(.67,h-.25,.21,.28),phosphor,0,0,.15);
    }
    else if(digital){
      mesh(parent,rounded(1.05,1.35,.35,.12),mat(0x263330,{roughness:.4}),0,0,.15);
      for(const side of [-1,1])for(const y of [-.4,0,.4])mesh(parent,rounded(.3,.12,.07,.02),mat(0xbdcbd0,{metalness:.8}),side*.67,y,.2);
      mesh(parent,keep(new T.SphereGeometry(.07,12,8)),gold,-.3,.4,.53);
    }else for(const x of segment?[-.85,0,.85]:[0])led(parent,x,0,segment?.29:.65);
  }
  function cutSection(v,p){
    const strip=new T.Group();strip.position.x=-.45;strip.scale.setScalar(.8);v.actor.add(strip);
    const cob=stripAppearance(p).kind!=='smd';
    if(cob)board(strip,true,false,false,p);
    else{
      mesh(strip,rounded(1.9,3.2,.13,.12),mat(0xeceee4,{roughness:.56,metalness:0}));
      mesh(strip,rounded(1.9,3.2,.035,.12),mat(0xbfb186,{metalness:.55}),0,0,-.05);
      for(const y of [-.82,.82])led(strip,0,y,.4);
      const gold=mat(0xd99b52,{metalness:.7,roughness:.25});
      for(const x of [-.55,.55])for(const y of [-.13,.13])mesh(strip,rounded(.32,.22,.025,.045),gold,x,y,.15);
    }
    const steel=mat(0xb8c6ca,{metalness:.88,roughness:.24}),grip=mat(0x496c70,{metalness:.12,roughness:.34});
    const cutMark=keep(new T.MeshBasicMaterial({color:0xc58e48,toneMapped:false}));
    // The cut mark stays in one place; the scissors close on that mark.
    for(let i=0;i<5;i++)mesh(strip,rounded(.25,.035,.025,.01),cutMark,-.8+i*.4,0,.42);
    const scissors=new T.Group();scissors.position.set(.4,0,.56);scissors.rotation.z=-Math.PI/2;scissors.scale.setScalar(.8);v.actor.add(scissors);
    const shape=new T.Shape();shape.moveTo(-.075,.12);shape.lineTo(.085,.12);shape.lineTo(.03,-1.48);shape.quadraticCurveTo(-.08,-1.4,-.085,-1.18);shape.closePath();
    const blade=keep(new T.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,steps:1}));
    const handle=keep(new T.TorusGeometry(.28,.075,10,40)),arms=[];
    for(const side of [-1,1]){
      const arm=new T.Group();arm.position.z=side*.055;scissors.add(arm);mesh(arm,blade,steel);
      mesh(arm,rounded(.12,.58,.08,.045),steel,0,.3,.01);
      const ring=mesh(arm,handle,grip,0,.8,.03);ring.scale.set(1,1.18,1);arms.push({arm,side});
    }
    const pivot=mesh(scissors,keep(new T.CylinderGeometry(.11,.11,.21,24)),steel,0,0,.04);pivot.rotation.x=Math.PI/2;
    sectionInfo={kind:cob?'cob-cut':'smd-cut',cutMm:Number(p.cut),continuousStrip:true,scissors:true,stationaryCutLine:true};
    v.animate=(time,reduced)=>{const aperture=reduced?.26:.16+.2*(.5+.5*Math.cos(time*1.6));for(const {arm,side} of arms)arm.rotation.z=side*aperture;};
  }
  function wcobCutSection(v,p){
    const strip=new T.Group();strip.position.x=-.58;v.actor.add(strip);
    const width=1.08,length=2.95,cutY=-.15;
    const pcb=mat(0xe6e8dd,{roughness:.65,metalness:0,clearcoat:.05});
    const milk=mat(0xe4e6df,{roughness:.68,metalness:0,clearcoat:.06,emissive:0x000000});
    mesh(strip,rounded(width,length,.12,.05),pcb);
    mesh(strip,rounded(width,length,.025,.04),mat(0xc3b994,{roughness:.66,metalness:.15}),0,0,-.035);
    mesh(strip,keep(new T.CylinderGeometry(width/2,width/2,length,40,1,false,-Math.PI/2,Math.PI)),milk,0,0,.12);
    // The dashed cut line follows the curved surface. The complete scissors
    // sit in front of that surface, with their pivot outside the strip edge.
    const mark=keep(new T.MeshBasicMaterial({color:0x88948a,toneMapped:false}));
    for(let i=0;i<5;i++){
      const x=-.45+i*.225,z=.12+Math.sqrt(Math.max(0,(width/2)**2-x*x))+.025;
      const dash=mesh(strip,rounded(.14,.034,.014,.008),mark,x,cutY,z);
      dash.rotation.y=Math.asin(x/(width/2));
    }
    const scissors=new T.Group();scissors.position.set(.42,cutY,.91);scissors.rotation.z=-Math.PI/2;scissors.scale.setScalar(.85);v.actor.add(scissors);
    const steel=mat(0xaabcc2,{metalness:.88,roughness:.25}),grip=mat(0x3e6469,{metalness:.1,roughness:.38});
    const shape=new T.Shape();shape.moveTo(-.075,.10);shape.lineTo(.085,.10);shape.lineTo(.032,-1.38);shape.quadraticCurveTo(-.085,-1.30,-.085,-1.10);shape.closePath();
    const blade=keep(new T.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,steps:1}));
    const handle=keep(new T.TorusGeometry(.245,.072,10,40)),arms=[];
    for(const side of [-1,1]){
      const arm=new T.Group();arm.position.z=side*.045;scissors.add(arm);mesh(arm,blade,steel);
      const stem=new T.CatmullRomCurve3([new T.Vector3(0,.08,.02),new T.Vector3(side*.08,.32,.02),new T.Vector3(side*.20,.58,.02)]);
      mesh(arm,keep(new T.TubeGeometry(stem,12,.055,8,false)),steel);
      const ring=mesh(arm,handle,grip,side*.20,.82,.02);ring.scale.y=1.17;
      arms.push({arm,side});
    }
    const pivot=mesh(scissors,keep(new T.CylinderGeometry(.10,.10,.20,24)),steel,0,0,.04);pivot.rotation.x=Math.PI/2;
    sectionInfo={kind:'wcob-cut',cutMm:Number(p.cut),continuousStrip:true,scissors:true,scissorsInFront:true,coatingLit:false};
    v.animate=(time,reduced)=>{const aperture=reduced?.24:.16+.17*(.5+.5*Math.cos(time*1.6));for(const {arm,side} of arms)arm.rotation.z=-side*aperture;};
  }
  function drop(v,ip){
    const points=[[0,-1.15],[.38,-1.1],[.71,-.83],[.82,-.42],[.72,-.05],[.47,.42],[.21,.89],[.025,1.36],[0,1.4]].map(p=>new T.Vector2(...p));
    const curve=new T.SplineCurve(points);mesh(v.actor,keep(new T.LatheGeometry(curve.getPoints(48),48)),mat(0x53b7df,{metalness:.22,roughness:.12,clearcoat:1,transparent:true,opacity:.88}));
    const shine=mesh(v.actor,keep(new T.SphereGeometry(1,16,12)),mat(0xf5ffff,{roughness:.1,metalness:0}),-.3,-.15,.68);shine.scale.set(.075,.37,.035);shine.rotation.z=-.3;
    const ripple=mesh(v.actor,keep(new T.TorusGeometry(.89,.025,8,64)),mat(0x79cce9,{transparent:true,opacity:.55}),0,-1.37,0);ripple.rotation.x=Math.PI/2.7;v.moving.push({object:ripple,type:'ripple'});
    if(ip==='IP20'){const slash=mesh(v.actor,rounded(.12,2.55,.11,.05),mat(0xd76b55,{metalness:.3}),0,0,.9);slash.rotation.z=-.65;}
  }
  function beam(v,degrees){
    const angle=T.MathUtils.clamp(Number.parseFloat(degrees)||120,1,180);
    const sourceY=.86,radius=1.78,half=T.MathUtils.degToRad(angle)/2,start=-Math.PI/2-half;
    const rays=[start,start+half*2].map(a=>[Math.cos(a)*radius,sourceY+Math.sin(a)*radius,.02]);
    beamInfo={angle,type:'sector',spread:radius*2*Math.sin(half),source:[0,sourceY,.02],rays};
    mesh(v.actor,rounded(.85,.35,.35,.1),mat(0xd8e1e2,{metalness:.7}),0,1.15,0);
    // Light has its own visible colour; a lit PBR surface made the cone look
    // like dark fabric as it turned. Keep this illustration self-illuminated.
    const light=(color,options={})=>keep(new T.MeshBasicMaterial({color,toneMapped:false,...options}));
    mesh(v.actor,rounded(.55,.12,.28,.05),light(0xfff3c9),0,.93,.05);
    const beamMaterial=keep(new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,uniforms:{strength:{value:.8}},vertexShader:'varying vec2 beamUV; void main(){beamUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 beamUV; uniform float strength; void main(){float r=clamp(length((beamUV-.5)*2.),0.,1.);float fade=.2+.8*pow(1.-r,.65);gl_FragColor=vec4(1.,.84,.35,strength*fade);}'}));
    // Both boundary rays originate at the emitting point. At 180 degrees
    // the real sector is a half-disc, rather than a finite-width cone.
    const fan=mesh(v.actor,keep(new T.CircleGeometry(radius,64,start,half*2)),beamMaterial,0,sourceY,.02);v.moving.push({object:fan,type:'beam'});
    const boundary=[[0,sourceY,.025],...Array.from({length:65},(_,i)=>{const a=start+half*2*i/64;return [Math.cos(a)*radius,sourceY+Math.sin(a)*radius,.025];}),[0,sourceY,.025]];
    const outline=keep(new T.BufferGeometry().setFromPoints(boundary.map(p=>new T.Vector3(...p))));
    v.actor.add(new T.Line(outline,keep(new T.LineBasicMaterial({color:0xf4cd66,transparent:true,opacity:.6,toneMapped:false,depthWrite:false}))));
    const haloMaterial=keep(new T.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,uniforms:{strength:{value:.2}},vertexShader:'varying vec2 glowUV; void main(){glowUV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 glowUV; uniform float strength; void main(){float r=length((glowUV-.5)*2.); gl_FragColor=vec4(1.,.84,.36,pow(max(0.,1.-r),2.)*strength);}'}));
    const halo=mesh(v.actor,keep(new T.PlaneGeometry(radius*2+.25,3.5)),haloMaterial,0,.1,-1.8);v.moving.push({object:halo,type:'beamHalo'});
  }
  function sun(v){
    const sphere=mesh(v.actor,keep(new T.SphereGeometry(.7,32,24)),mat(0xffc64b,{emissive:0xffa31f,emissiveIntensity:.15,roughness:.3,metalness:.05}));
    v.moving.push({object:sphere,type:'sun'});
    const rays=new T.Group();v.actor.add(rays);
    for(let i=0;i<12;i++){
      const angle=i*Math.PI/6,o=mesh(rays,rounded(.13,.36,.12,.065),mat(0xf9c55b,{emissive:0xfab331,emissiveIntensity:.12}),Math.sin(angle)*1.12,Math.cos(angle)*1.12,0);
      o.rotation.z=-angle;v.moving.push({object:o,type:'sun'});
    }
    v.moving.push({object:rays,type:'rays'});
    const glowMaterial=keep(new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{strength:{value:.25}},vertexShader:'varying vec2 uvGlow; void main(){uvGlow=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 uvGlow; uniform float strength; void main(){float r=length(uvGlow-.5)*2.; float a=pow(max(0.,1.-r),2.)*strength;gl_FragColor=vec4(1.,.64,.16,a);}'}));
    const glow=mesh(v.actor,keep(new T.PlaneGeometry(4.3,4.3)),glowMaterial,0,0,-.3);v.moving.push({object:glow,type:'glow'});
  }
  function bread(v){
    const smooth=x=>{const t=T.MathUtils.clamp(x,0,1);return t*t*(3-2*t);};
    const crust=mat(0xffffff,{vertexColors:true,roughness:.56,metalness:0,clearcoat:.18,sheen:.2,sheenColor:0xffd59a,sheenRoughness:.7});
    const score=mat(0xb37737,{roughness:.82,metalness:0,clearcoat:0});
    const pore=mat(0xc49554,{roughness:1,metalness:0,clearcoat:0});
    const halves=[];
    for(const side of [-1,1]){
      const half=new T.Group();v.actor.add(half);halves.push({half,side});
      const geometry=keep(new T.SphereGeometry(1,48,32,side===1?Math.PI/2:-Math.PI/2,Math.PI)),positions=geometry.attributes.position,colors=[];
      for(let i=0;i<positions.count;i++){
        const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),grain=Math.sin(x*31+y*47+z*29)*Math.sin(y*37-x*19);
        const uneven=1+.009*grain+.013*Math.sin(x*7+y*5)*Math.sin(z*8);
        positions.setXYZ(i,x*1.16*uneven,y*1.04*uneven,z*.7*uneven);
        const warmth=.5+.21*Math.sin(x*8-y*11)+.07*grain;
        const color=new T.Color(0x87431e).lerp(new T.Color(0xc88939),T.MathUtils.clamp(warmth+.14*Math.max(0,z),0,1));colors.push(color.r,color.g,color.b);
      }
      geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();mesh(half,geometry,crust);
      const inside=keep(new T.CircleGeometry(1,48));inside.rotateY(Math.PI/2);inside.scale(1,1.035,.695);
      mesh(half,inside,mat(0xf3d89c,{roughness:.88,metalness:0,clearcoat:0,side:T.DoubleSide}),side*.002,0,0);
      const poreGeometry=keep(new T.SphereGeometry(1,8,6));
      for(let i=0;i<17;i++){
        const radius=Math.sqrt((i+.5)/17)*.86,angle=i*2.39996,y=Math.cos(angle)*radius,z=Math.sin(angle)*radius*.64;
        const hole=mesh(half,poreGeometry,pore,side*.008,y,z);hole.scale.set(.007,.018+(i%3)*.011,.024+(i%4)*.007);
      }
    }
    // Five gently curved scores give the roll its characteristic crown.
    for(let arm=0;arm<5;arm++){
      const points=[];
      for(let i=0;i<=22;i++){const r=.09+.8*i/22,a=arm*Math.PI*2/5+.35*r;points.push(new T.Vector3(Math.cos(a)*r*1.16,Math.sin(a)*r*1.04,.7*Math.sqrt(1-r*r)-.016));}
      const owner=halves[points[4].x<0?0:1].half;
      mesh(owner,keep(new T.TubeGeometry(new T.CatmullRomCurve3(points),28,.025,8,false)),score);
    }
    const seedGeometry=keep(new T.SphereGeometry(1,10,8)),seedMaterials=[0xe9cb8d,0xcfa363,0xf1d89f].map(color=>mat(color,{roughness:.48,metalness:0,clearcoat:.22}));
    for(let i=0;i<29;i++){
      const r=Math.sqrt((i+.4)/29)*.86,a=i*2.39996+.4,x=Math.cos(a)*r*1.16,y=Math.sin(a)*r*1.04,z=.7*Math.sqrt(1-r*r);
      const seed=mesh(halves[x<0?0:1].half,seedGeometry,seedMaterials[i%3],x,y,z+.025);
      seed.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(x/1.3456,y/1.0816,z/.49).normalize());seed.rotateZ(a+.6*Math.sin(i*3.1));seed.scale.set(.04,.092+(i%3)*.012,.024);
    }
    const crumbs=[];
    for(let i=0;i<6;i++){
      const material=mat(0xe6bf7e,{roughness:.86,metalness:0,clearcoat:0,transparent:true,opacity:0});
      const piece=mesh(v.actor,keep(new T.IcosahedronGeometry(.025+(i%3)*.012,0)),material);piece.visible=false;crumbs.push(piece);
    }
    distinction={kind:'bread',shape:'kaiser-roll',sunflowerSeeds:29,halves:2,crumbs:6,opening:0,visibleCrumbs:0};
    v.animate=(time,reduced)=>{
      const phase=((time%7)+7)%7/7,opening=reduced?0:smooth((phase-.12)/.18)*(1-smooth((phase-.67)/.22));
      for(const {half,side} of halves){half.position.x=side*opening*.14;half.rotation.y=side*opening*.3;half.rotation.z=-side*opening*.025;}
      crust.roughness=reduced?.56:.56+.025*Math.sin(time*.8);let visible=0;
      crumbs.forEach((piece,i)=>{const age=(phase-(.29+i*.025))/.31;piece.visible=!reduced&&age>=0&&age<1;if(!piece.visible)return;visible++;const side=i%2?1:-1;piece.position.set(side*(.04+.31*age),.24-1.7*age*age,.64+.12*age);piece.rotation.set(age*3+i,age*4-i,age*2);piece.material.opacity=smooth(age/.1)*(1-smooth((age-.7)/.3));});
      distinction.opening=opening;distinction.visibleCrumbs=visible;
    };
  }
  function slim(v,p){
    const width=.74,height=3.45;
    mesh(v.actor,rounded(width,height,.12,.045),mat(0xf1f0e4,{roughness:.52,metalness:0}));
    mesh(v.actor,rounded(width,height,.025,.04),mat(0xb5a678,{metalness:.55}),0,0,-.035);
    const gold=mat(0xd6a15b,{metalness:.72,roughness:.25}),black=mat(0x37413c,{roughness:.5});
    for(const side of [-1,1])for(const x of [-.19,.19])mesh(v.actor,rounded(.22,.29,.025,.035),gold,x,side*1.48,.13);
    if(p.tech.includes('COB'))mesh(v.actor,rounded(.43,2.54,.12,.045),mat(0xf2c330,{roughness:.55,metalness:0}),0,0,.13);
    else{
      for(const y of [-1.01,-.34,.34,1.01])led(v.actor,0,y,.23);
      for(const y of [-.675,.675])mesh(v.actor,rounded(.25,.10,.075,.015),black,0,y,.14);
    }
    distinction={kind:'slim',widthMm:Number(p.width),leds:p.tech.includes('COB')?null:4,strip:true};
  }
  function accent(v,p){
    const {emitter}=led(v.actor,0,0,.76);
    emitter.material.color.set(0xfff2cf);
    const haloMaterial=keep(new T.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,uniforms:{strength:{value:.12}},vertexShader:'varying vec2 p;void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 p;uniform float strength;void main(){float a=pow(max(0.,1.-length((p-.5)*2.)),2.)*strength;gl_FragColor=vec4(1.,.83,.52,a);}'}));
    mesh(v.actor,keep(new T.PlaneGeometry(3.5,3.5)),haloMaterial,0,0,-.12);
    distinction={kind:'accent',softLight:true,intensity:0};
    v.animate=(time,reduced)=>{
      const strength=reduced?.35:.35+.035*Math.sin(time*.9),sample=sampleStripLight(p,time,{variant:featureColor});
      emitter.material.emissive.copy(sample.color);emitter.material.emissiveIntensity=strength;
      haloMaterial.uniforms.strength.value=strength*.42;distinction.intensity=strength;
    };
  }
  function enclosure(v,p,opaque){
    const width=1.1,height=3.05;
    mesh(v.actor,rounded(width,height,.12,.09),mat(0xeaece1,{roughness:.55,metalness:0}));
    if(opaque){
      mesh(v.actor,keep(new T.CylinderGeometry(width/2,width/2,height,48,1,false,-Math.PI/2,Math.PI)),mat(0xe4e6df,{roughness:.68,metalness:0,clearcoat:.06,emissive:0x000000,emissiveIntensity:0}),0,0,.13);
    }else{
      // The IP67 card shows white U-shaped walls around a hollow cream arch,
      // with yellow COB inside. Keep the same small icon envelope.
      const scale=(width+.25)/10.5;
      const profile=(points,material,length=height+.15)=>{
        const shape=new T.Shape(points.map(([x,z])=>new T.Vector2(x*scale,z*scale+.14)));
        const geometry=keep(new T.ExtrudeGeometry(shape,{depth:length,bevelEnabled:false,steps:1}));
        geometry.translate(0,0,-length/2);geometry.rotateX(Math.PI/2);mesh(v.actor,geometry,material);
      };
      profile([[-5.05,-1.12],[-5.25,-.92],[-5.25,1.25],[-5.05,1.45],[-3.75,1.45],[-3.75,0],[-4,0],[-4,-.28],[4,-.28],[4,0],[3.75,0],[3.75,1.45],[5.05,1.45],[5.25,1.25],[5.25,-.92],[5.05,-1.12]],mat(0xf1f1ea,{roughness:.43,metalness:0,clearcoat:.16}));
      const arch=[[-3.75,0],[-3.75,1.45]];
      for(let i=1;i<=24;i++){const a=-Math.PI/2+i/24*Math.PI;arch.push([Math.sin(a)*3.75,1.45+Math.cos(a)*1.93]);}
      arch.push([3.75,0],[2.85,0],[2.85,1.03]);
      for(let i=1;i<=24;i++){const a=Math.PI/2-i/24*Math.PI;arch.push([Math.sin(a)*2.85,1.03+Math.cos(a)*1.51]);}
      arch.push([-2.85,0]);profile(arch,mat(0xffebad,{roughness:.46,metalness:0,clearcoat:.1}));
      const core=[[1.7,.025],[-1.7,.025]];
      for(let i=1;i<=20;i++){const a=Math.PI-i/20*Math.PI;core.push([Math.cos(a)*1.7,.025+Math.sin(a)*1.75]);}
      profile(core,mat(0xf2c32e,{roughness:.58,metalness:0,clearcoat:.03}),height);
    }
    distinction={kind:opaque?'coating':'sleeve',opaque,ip:p.ip,cover:true,...(opaque?{unlit:true,emissiveIntensity:0,glow:false}:{} )};
  }
  function precisionCut(v,p){
    const pcb=mat(0xeceee4,{roughness:.56,metalness:0}),gold=mat(0xd99b52,{metalness:.72}),steel=mat(0xc4d2d8,{metalness:.88,roughness:.2});
    const mark=keep(new T.MeshBasicMaterial({color:0xcb8745,toneMapped:false}));
    const section=new T.Group();v.actor.add(section);
    mesh(v.actor,rounded(1.62,.72,.12,.04),pcb,-.52,-.4,0);
    mesh(section,rounded(.96,.72,.12,.04),pcb,.84,-.4,0);
    const cob=stripAppearance(p).kind!=='smd',phosphor=mat(0xf3cf57,{metalness:0,roughness:.52});
    if(cob){
      mesh(v.actor,rounded(1.61,.31,.1,.04),phosphor,-.52,-.4,.14);
      mesh(section,rounded(.95,.31,.1,.04),phosphor,.84,-.4,.14);
    }else for(const [parent,x] of [[v.actor,-1.08],[v.actor,-.39],[section,.86]]){
      mesh(parent,rounded(.4,.37,.12,.07),phosphor,x,-.4,.14);
      for(const y of [-.64,-.16])mesh(parent,rounded(.22,.06,.025,.02),gold,x,y,.14);
    }
    // A readable ruler and dashed cut mark remain visible behind the scissors.
    mesh(v.actor,rounded(2.9,.055,.05,.015),steel,0,-1.04,.02);
    for(let i=0;i<11;i++)mesh(v.actor,rounded(.025,i%5===0?.24:.13,.035,.008),steel,(i-5)*.27,-.96,.03);
    for(const y of [-.78,-.55,-.32,-.09])mesh(v.actor,rounded(.035,.12,.025,.01),mark,.32,y,.17);
    const scissors=new T.Group();scissors.position.set(.32,.29,.48);scissors.scale.setScalar(.8);v.actor.add(scissors);
    const arms=[];
    const bladeShape=new T.Shape();bladeShape.moveTo(-.065,.1);bladeShape.lineTo(.08,.1);bladeShape.lineTo(.035,-1.12);bladeShape.quadraticCurveTo(-.07,-1.06,-.075,-.88);bladeShape.closePath();
    const blade=keep(new T.ExtrudeGeometry(bladeShape,{depth:.055,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,steps:1}));
    const gripGeometry=keep(new T.TorusGeometry(.23,.065,10,36));
    for(const side of [-1,1]){
      const arm=new T.Group();arm.position.z=side*.055;scissors.add(arm);
      mesh(arm,blade,steel);
      mesh(arm,rounded(.105,.53,.08,.04),steel,0,.29,.01);
      const grip=mesh(arm,gripGeometry,mat(0xb97b3f,{metalness:.25,roughness:.32}),0,.69,.03);grip.scale.set(1,1.27,1);
      arms.push({arm,side});
    }
    const pivot=mesh(scissors,keep(new T.CylinderGeometry(.1,.1,.2,24)),steel,0,0,.04);pivot.rotation.x=Math.PI/2;
    distinction={kind:'cut',cutInterval:Number(p.cut),animatedCut:true,closure:0,separation:0};
    v.animate=(time,reduced)=>{
      const phase=reduced?.65:(time%5)/5;
      const closure=reduced?.72:Math.pow(.5-.5*Math.cos(phase*Math.PI*2),1.5);
      for(const {arm,side} of arms)arm.rotation.z=side*(.06+.48*(1-closure));
      const separation=reduced?0:.14*Math.max(0,Math.sin((phase-.48)*Math.PI*2));
      section.position.x=separation;section.rotation.z=-separation*.17;
      distinction.closure=closure;distinction.separation=separation;
    };
  }
  function flexibleBoard(v){
    const g=keep(new T.BoxGeometry(.62,2.7,.14,1,36,1)),positions=g.attributes.position;
    const original=new Float32Array(positions.array),pcb=mat(0xeceee4,{roughness:.53,metalness:0});
    mesh(v.actor,g,pcb);
    const components=[];
    for(const y of [-1.08,-.54,0,.54,1.08]){
      const component=new T.Group();v.actor.add(component);led(component,0,0,.19);components.push({component,y});
    }
    distinction={kind:'flex',flexiblePCB:true,curvature:0};
    v.animate=(time,reduced)=>{
      const phase=reduced?0:time*.8,amplitude=.5+.12*Math.sin(phase);
      for(let i=0;i<positions.count;i++){
        const y=original[i*3+1];positions.setXYZ(i,original[i*3]+amplitude*Math.sin(y*2.35),y,original[i*3+2]+Math.sin(y*1.4+phase)*.08);
      }
      positions.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();
      for(const {component,y} of components){component.position.set(amplitude*Math.sin(y*2.35),y,Math.sin(y*1.4+phase)*.08);component.rotation.z=-Math.atan(amplitude*2.35*Math.cos(y*2.35));}
      distinction.curvature=amplitude;
    };
  }
  function lightControl(v,p,digital=false){
    const light=color=>keep(new T.MeshBasicMaterial({color,toneMapped:false}));
    if(digital){
      mesh(v.actor,rounded(3.15,1.45,.16,.12),mat(0xe7eae1,{roughness:.55,metalness:0}),0,-.03,0);
      const modules=[],gold=mat(0xdca65c,{metalness:.75});
      for(let i=0;i<5;i++){
        const x=(i-2)*.56,face=light(0xf5f5ef);
        mesh(v.actor,rounded(.46,.83,.16,.09),face,x,.12,.18);
        mesh(v.actor,rounded(.27,.17,.055,.025),mat(0x293432,{roughness:.5}),x,-.46,.18);
        for(const y of [-.64,.64])mesh(v.actor,rounded(.19,.06,.03,.02),gold,x,y,.18);
        modules.push(face);
      }
      distinction={kind:'digital',addressableModules:true,control:p.control,moduleColors:[],moduleLevels:[]};
      v.animate=(time,reduced)=>{
        const samples=modules.map((material,i)=>{
          const s=sampleStripLight(p,reduced?2.5:time,{variant:featureColor,module:i,moduleCount:modules.length});
          material.color.copy(s.color).multiplyScalar(.28+.72*s.intensity);return s;
        });
        distinction.moduleColors=modules.map(m=>`#${m.color.getHexString()}`);distinction.moduleLevels=samples.map(s=>s.intensity);
      };
      return;
    }
    if(p.control.startsWith('RGB')){
      const channels=p.control==='RGB'?['R','G','B']:p.control==='RGBW'?['R','G','B','W']:['R','G','B','WW','CW'];
      const colors=channels.map(channel=>new T.Color(({R:0xf35e59,G:0x5bd58c,B:0x568ff0,WW:0xffd298,CW:0xc8e3ff})[channel]??0xffebcc));
      const faces=[],segments=[];
      mesh(v.actor,rounded(1.45,1.45,.22,.16),mat(0xf5f2e9,{roughness:.37,metalness:0}),0,0,.1);
      for(let i=0;i<channels.length;i++){
        const angle=i/channels.length*Math.PI*2;
        const segment=light(colors[i]);mesh(v.actor,keep(new T.RingGeometry(1.02,1.17,32,1,angle+.045,Math.PI*2/channels.length-.09)),segment,0,0,.12);segments.push(segment);
        const face=light(colors[i]),x=channels.length===4?(i%2-.5)*.55:Math.cos(angle)*.4,y=channels.length===4?(.5-Math.floor(i/2))*.55:Math.sin(angle)*.4;
        mesh(v.actor,rounded(.43,.43,.09,.07),face,x,y,.34);faces.push(face);
      }
      distinction={kind:'channels',control:p.control,channels,colors:[]};
      v.animate=(time,reduced)=>{
        channels.forEach((channel,i)=>{
          if(channel==='W')colors[i].copy(temperatureColor(featureColor));
          const strength=reduced?1:.86+.14*Math.sin(time*.8+i*.4);
          faces[i].color.copy(colors[i]).multiplyScalar(strength);segments[i].color.copy(colors[i]);
        });
        distinction.colors=faces.map(m=>`#${m.color.getHexString()}`);
      };
      return;
    }
    const warm=light(0xffcf8e),cool=light(0xc0ddff),face=light(0xfff1dc);
    mesh(v.actor,keep(new T.RingGeometry(.93,1.09,64,1,0,Math.PI)),warm);
    mesh(v.actor,keep(new T.RingGeometry(.93,1.09,64,1,Math.PI,Math.PI)),cool);
    mesh(v.actor,rounded(1.22,1.45,.2,.16),mat(0xf5f2e9,{roughness:.37,metalness:0}),0,0,.12);
    mesh(v.actor,rounded(.88,1.1,.08,.13),face,0,0,.35);
    const indicator=mesh(v.actor,keep(new T.SphereGeometry(.14,16,12)),face,1.01,0,.09);
    distinction={kind:'cct',control:'CCT',whiteOnly:true,warmMix:0,color:''};
    v.animate=(time,reduced)=>{
      const s=sampleStripLight(p,reduced?9:time,{variant:featureColor});
      face.color.copy(s.color);const angle=(s.warmMix-.5)*Math.PI;
      indicator.position.set(Math.cos(angle)*1.01,Math.sin(angle)*1.01,.09);
      distinction.warmMix=s.warmMix;distinction.color=`#${face.color.getHexString()}`;
    };
  }
  function colorFan(v,enhanced=false){
    if(enhanced){
      const fan=new T.Group();v.actor.add(fan);
      const cards=[],count=15;
      const bodyGeometry=rounded(.49,2.2,.055,.08),faceGeometry=rounded(.42,1.83,.012,.06);
      const paper=mat(0xf4f0e7,{roughness:.48,metalness:0});
      for(let i=0;i<count;i++){
        const pivot=new T.Group();pivot.position.set(0,-.93,i*.026);fan.add(pivot);
        const vivid=new T.Color().setHSL(i/(count-1)*.84,.94,.52);
        const quiet=new T.Color().setHSL(i/(count-1)*.84,.2,.72);
        const ink=keep(new T.MeshBasicMaterial({color:quiet,toneMapped:false}));
        mesh(pivot,bodyGeometry,paper,0,.91,0);
        mesh(pivot,faceGeometry,ink,0,1.04,.062);
        mesh(pivot,rounded(.24,.025,.008,.008),mat(0x7d8788,{metalness:0}),0,.025,.062);
        cards.push({pivot,ink,vivid,quiet,index:i});
      }
      mesh(fan,keep(new T.SphereGeometry(.1,16,12)),mat(0xd5dde2,{metalness:.8}),0,-.93,.49);
      const halo=keep(new T.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,uniforms:{strength:{value:0}},vertexShader:'varying vec2 p;void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 p;uniform float strength;void main(){float a=pow(max(0.,1.-length((p-.5)*2.)),2.)*strength;vec3 c=.55+.45*cos(6.283*(p.x+vec3(0.,.33,.67)));gl_FragColor=vec4(c,a);}'}));
      mesh(fan,keep(new T.PlaneGeometry(4.1,3.4)),halo,0,.15,-.45);
      palette={enhanced:true,cards,fan,halo,visible:5,intensity:0};
      return;
    }
    const colors=[0xd75c52,0xe7a353,0xf2cd61,0x89ba76,0x56a6aa,0x5988c5,0x9b72b8];
    for(let i=0;i<colors.length;i++){
      const g=new T.Group();g.position.set(0,-.9,i*.065);g.rotation.z=(i-3)*.27;v.actor.add(g);
      mesh(g,rounded(.57,2.45,.075,.12),mat(colors[i],{roughness:.38,metalness:.05}),0,1,0);
      mesh(g,rounded(.41,.32,.01,.03),mat(0xf4efe3,{metalness:0}),0,.03,.09);
    }
    mesh(v.actor,keep(new T.SphereGeometry(.12,16,12)),mat(0xd1d7db,{metalness:.8}),0,-.86,.6);
  }
  function animatePalette(time,reducedMotion){
    if(!palette)return;
    const phase=((time%28)+28)%28%12;
    const smooth=x=>{const t=T.MathUtils.clamp(x,0,1);return t*t*(3-2*t);};
    const close=reducedMotion?0:smooth((phase-10.6)/1.1);
    const intensity=reducedMotion?1:smooth((phase-2.5)/1.45)*(1-close);
    let visible=0;
    palette.cards.forEach(({pivot,ink,vivid,quiet,index:i})=>{
      // Five initial samples become fifteen, fanning out in a quick stagger.
      const rank=Math.abs(i-7),extra=rank>2;
      const open=reducedMotion?1:smooth((phase-2.1-Math.max(0,rank-2)*.075)/.65)*(1-close);
      const reveal=extra?open:1;
      pivot.visible=reveal>.015;if(pivot.visible)visible++;
      const overshoot=open<1?Math.sin(open*Math.PI)*.055:0;
      pivot.rotation.z=(i-7)*(.075+(.17-.075)*open+overshoot);
      pivot.rotation.y=Math.sin(open*Math.PI)*.25*(i<7?-1:1);
      pivot.scale.setScalar(extra?.35+.65*reveal:1);
      pivot.position.y=-.93+.07*Math.sin(open*Math.PI);
      ink.color.copy(quiet).lerp(vivid,intensity);
    });
    palette.fan.scale.setScalar(.9+.08*intensity);
    palette.halo.uniforms.strength.value=intensity*(theme==='night'?.3:.1);
    palette.visible=visible;palette.intensity=intensity;
  }
  function setPower(index){
    power=index;if(kind!=='brightness')return;
    root.querySelector('[data-product="detail"]').textContent=['LOW','MEDIUM','HIGH'][index];
    root.querySelectorAll('.brightness-steps i').forEach((el,i)=>el.dataset.active=String(i===index));
  }
  function setColor(value){
    featureColor=value;
    if(!featureProduct||!emitterMaterials.length)return;
    const color=unlitEmitterColor(featureProduct,value);
    emitterMaterials.forEach(material=>material.color.setHex(color));
    emitterInfo.color=color;
  }
  function update(p){
    const feature=describeStripFeature(p);
    resources.forEach(r=>r.dispose());resources=new Set();palette=null;distinction=null;sectionInfo=null;emitterMaterials=[];featureProduct=p;featureColor=p.color;views=Array.from({length:5},view);revision++;kind=feature.kind;
    const appearance=stripAppearance(p),cob=appearance.kind!=='smd',wcob=appearance.kind==='wcob-dome';
    emitterInfo={kind:wcob?'smd':appearance.kind,color:wcob||!cob?0xf0c333:unlitEmitterColor(p),opaqueFront:wcob?false:appearance.opaqueFront,...(wcob?{package:'2016',packageMm:[2,1.6],unlit:true}:{})};
    if(wcob)smd2016(views[0].actor);else if(cob)board(views[0].actor,true,false,false,p);else if(p.digital)board(views[0].actor,false,true);else if(p.control==='RGBW')rgbwLed(views[0].actor);else led(views[0].actor);
    if(wcob)wcobCutSection(views[1],p);else cutSection(views[1],p);drop(views[2],p.ipOptions.length===1?p.ip:'variants');beam(views[3],p.beam);
    if(kind==='brightness')sun(views[4]);else if(kind==='accent')accent(views[4],p);else if(kind==='bread')bread(views[4]);else if(kind==='slim')slim(views[4],p);else if(kind==='cut')precisionCut(views[4],p);else if(kind==='flex')flexibleBoard(views[4]);else if(kind==='coating'||kind==='sleeve')enclosure(views[4],p,kind==='coating');else if(['digital','cct','channels'].includes(kind))lightControl(views[4],p,kind==='digital');else colorFan(views[4],kind==='cri'&&Number(p.quality)>=97);
    views[4].baseScale=views[4].actor.scale.clone();
    emphasis={amount:0,scale:1,cameraDistance:7,clipAdjusted:false};
    const detail=root.querySelector('[data-product="detail"]'),label=root.querySelector('[data-product="detail-label"]');
    detail.textContent=feature.title;
    label.textContent=feature.caption;
    root.querySelector('.brightness-steps').hidden=kind!=='brightness';
    const ip=root.querySelector('[data-product="ip"]');ip.replaceChildren();
    for(const value of p.ipOptions){const item=document.createElement('span');item.textContent=value;ip.append(item);}
    slots.forEach((slot,i)=>{slot.dataset.model=[wcob?'smd':cob?'cob':p.digital?'digital':'smd','scissors-cut','water','beam',kind][i];});
    slots[3].dataset.beamAngle=String(beamInfo.angle);
    slots[3].dataset.beamShape=beamInfo.type;
    root.querySelector('[data-feature="tech"] small').textContent=cob&&appearance.kind!=='wcob-dome'?'Dioda COB':'Dioda';
    root.querySelector('[data-product="section"]').textContent=`Cięcie co ${String(p.cut).replace('.',',')} mm`;
    root.querySelector('[data-feature="section"] small').textContent='Moduł cięcia';
    root.querySelector('[data-feature="ip"] small').textContent=p.ipOptions.length>1?'Dostępne warianty':'Stopień ochrony';
    setPower(0);
  }
  function render(time,still=false,reducedMotion=false,featureEmphasis=0){
    if(!views.length)return;
    const bounds=(sharedRenderer?renderer.domElement:host).getBoundingClientRect(),w=Math.round(bounds.width),h=Math.round(bounds.height);if(!w||!h)return;
    const previousExposure=renderer.toneMappingExposure,previousAutoClear=renderer.autoClear,previousScissorTest=renderer.getScissorTest();
    if(sharedRenderer){
      renderer.getViewport(previousViewport);renderer.getScissor(previousScissor);
      renderer.autoClear=false;renderer.toneMappingExposure=theme==='day'?.92:1.1;
    }else{
      const size=renderer.getSize(new T.Vector2());if(size.x!==w||size.y!==h)renderer.setSize(w,h,false);
      renderer.setScissorTest(false);renderer.clear();
    }
    renderer.setScissorTest(true);
    sunLevel=still?[.25,.5,1][power]:T.MathUtils.lerp(sunLevel,[.25,.5,1][power],.12);
    animatePalette(time,reducedMotion);
    const amount=T.MathUtils.clamp(Number.isFinite(featureEmphasis)?featureEmphasis:0,0,1);
    const emphasisScale=1+.22*T.MathUtils.smoothstep(amount,0,1);
    slots.forEach((slot,i)=>{
      const r=slot.getBoundingClientRect(),v=views[i],t=still?1:time;
      if(!r.width||!r.height||r.right<=bounds.left||r.left>=bounds.right||r.bottom<=bounds.top||r.top>=bounds.bottom)return;
      v.animate?.(time,reducedMotion);
      v.camera.aspect=r.width/r.height;v.camera.updateProjectionMatrix();
      v.actor.rotation.set(-.16+Math.sin(t*.7+i)*.07,Math.sin(t*.85+i*.8)*.38,-.08+Math.sin(t*.5+i)*.045);v.actor.position.y=Math.sin(t*1.3+i)*.11;
      for(const {object:o,type} of v.moving){if(type==='ripple'){o.scale.setScalar(.9+.16*Math.sin(t*2));o.material.opacity=.35+.2*Math.sin(t*2);}if(type==='beam')o.material.uniforms.strength.value=(theme==='night'?.85:.6)+.025*Math.sin(t*1.6);if(type==='beamHalo')o.material.uniforms.strength.value=theme==='night'?.3:.12;if(type==='sun')o.material.emissiveIntensity=sunLevel*1.6;if(type==='glow'){o.material.uniforms.strength.value=sunLevel*.8;o.scale.setScalar(.8+sunLevel*.4);}if(type==='rays'){o.rotation.z=t*.13;o.scale.setScalar(.84+sunLevel*.16);}}
      if(i===4){
        // Apply after every icon animation, preserving SLIM's authored scale
        // and the CRI fan's independent unfolding. No wall-clock state.
        v.actor.scale.copy(v.baseScale).multiplyScalar(emphasisScale);
        let cameraDistance=7,cameraOffsetY=0;
        if(amount>0){
          v.actor.updateMatrixWorld(true);
          const vertical=Math.tan(T.MathUtils.degToRad(v.camera.fov/2))*.985,horizontal=vertical*v.camera.aspect;
          const projectedHeights=[];let minY=Infinity,maxY=-Infinity,maxZ=-Infinity;
          v.actor.traverseVisible(object=>{
            // Soft halo planes deliberately extend beyond their visible glow;
            // only physical geometry determines the safe camera framing.
            if(!object.isMesh||object.material?.isShaderMaterial)return;
            if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();
            const box=object.geometry.boundingBox;
            for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
              emphasisPoint.set(x,y,z).applyMatrix4(object.matrixWorld);
              cameraDistance=Math.max(cameraDistance,emphasisPoint.z+Math.abs(emphasisPoint.x)/horizontal);
              minY=Math.min(minY,emphasisPoint.y);maxY=Math.max(maxY,emphasisPoint.y);maxZ=Math.max(maxZ,emphasisPoint.z);
              projectedHeights.push([emphasisPoint.y,emphasisPoint.z]);
            }
          });
          // SLIM includes a ruler below the board. Recenter only the necessary
          // amount before pulling back, keeping its emphasis visibly larger.
          cameraDistance=Math.max(cameraDistance,maxZ+(maxY-minY)/(2*vertical));
          let lower=-Infinity,upper=Infinity;
          for(const [y,z] of projectedHeights){const halfHeight=(cameraDistance-z)*vertical;lower=Math.max(lower,y-halfHeight);upper=Math.min(upper,y+halfHeight);}
          cameraOffsetY=T.MathUtils.clamp(0,lower,upper);
        }
        v.camera.position.set(0,cameraOffsetY,cameraDistance);v.camera.updateMatrixWorld();
        emphasis={amount,scale:emphasisScale,cameraDistance,cameraOffsetY,clipAdjusted:cameraDistance>7||cameraOffsetY!==0,actorScale:v.actor.scale.toArray(),iconRect:{x:r.left,y:r.top,width:r.width,height:r.height}};
      }
      renderer.setViewport(r.left-bounds.left,bounds.bottom-r.bottom,r.width,r.height);
      if(sharedRenderer){
        const left=Math.max(r.left,bounds.left),right=Math.min(r.right,bounds.right),top=Math.max(r.top,bounds.top),bottom=Math.min(r.bottom,bounds.bottom);
        renderer.setScissor(left-bounds.left,bounds.bottom-bottom,right-left,bottom-top);renderer.clearDepth();
      }else renderer.setScissor(r.left-bounds.left,bounds.bottom-r.bottom,r.width,r.height);
      renderer.render(v.scene,v.camera);
    });
    if(sharedRenderer){
      renderer.autoClear=previousAutoClear;renderer.toneMappingExposure=previousExposure;
      renderer.setViewport(previousViewport);renderer.setScissor(previousScissor);renderer.setScissorTest(previousScissorTest);
    }
  }
  function setRenderScale(scale=1){
    if(sharedRenderer)return;
    renderer.setPixelRatio(Math.min(devicePixelRatio,2)*T.MathUtils.clamp(Number.isFinite(scale)?scale:1,.15,1));
  }
  return {update,render,setPower,setColor,setRenderScale,setTheme(value){theme=value;if(!sharedRenderer)renderer.toneMappingExposure=value==='day'?.92:1.1;},inspect:()=>({views:views.length,revision,geometry:true,sharedRenderer:!!sharedRenderer,kind,power,sunLevel,emphasis,beamAngle:beamInfo?.angle,beamType:beamInfo?.type,beamSpread:beamInfo?.spread,beamSource:beamInfo?.source,beamRays:beamInfo?.rays,emitter:emitterInfo,sectionIcon:sectionInfo,cutInterval:distinction?.cutInterval??null,animatedCut:distinction?.animatedCut??false,distinction,palette:palette?{cards:palette.cards.length,visible:palette.visible,intensity:palette.intensity}:null}),dispose(){resources.forEach(r=>r.dispose());if(!sharedRenderer){renderer.dispose();renderer.domElement.remove();}}};
}
