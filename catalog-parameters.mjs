/** Search only labelled catalogue facts; identifiers retain exact priority. */
const normal=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase();
const numeric='(?:\\d{1,3}(?:[ \\u00a0]\\d{3})+|\\d+)(?:[.,]\\d+)?';
const unitSource='lm\\s*\\/\\s*m|lm|w\\s*\\/\\s*m|w|mm(?![²2]|\\^2)|cm|m|k|v';
const valueOf=value=>Number(value.replace(/[\s\u00a0]/g,'').replace(',','.'));
const canonical=unit=>unit.toLowerCase().replace(/\s/g,'');
const keyOf=unit=>unit.startsWith('lm')?'flux':unit.startsWith('w')?'power':unit==='k'?'cct':unit==='v'?'voltage':'dimension';
const linear={mm:1,cm:10,m:1000},EPS=1e-8;
const channelPattern=/(^|[^a-z\d])(rgb\s*\+\s*cct|rgbcct|rgbw|rgb|cct|mono)(?=$|[^a-z])/gi;
const channelName=value=>value.replace(/\s|\+/g,'').toUpperCase();
function channelsIn(value){return [...new Set([...normal(value).matchAll(channelPattern)].map(m=>channelName(m[2])))];}
const qualifiers={szerokosc:['dimension','width'],szer:['dimension','width'],dlugosc:['dimension','length'],dl:['dimension','length'],wysokosc:['dimension','height'],wys:['dimension','height'],promien:['dimension','radius'],ciecie:['dimension','cut'],moc:['power',null],strumien:['flux',null],napiecie:['voltage',null],barwa:['cct',null]};
export function parseParameterQuery(text){
 const raw=String(text??'').trim(),parameters=[],channels=channelsIn(raw);let rest=normal(raw);
 const erase=(start,length)=>{rest=rest.slice(0,start)+' '.repeat(length)+rest.slice(start+length);};
 for(const m of [...rest.matchAll(channelPattern)])erase(m.index+m[1].length,m[2].length);
 function add(m,number,unit,circuit,start=m.index,length=m[0].length){const u=unit?canonical(unit):null,key=u?keyOf(u):'any';parameters.push({key,target:valueOf(number),unit:u,circuit:circuit?.toUpperCase()||null,strict:!['flux','power','any'].includes(key),source:raw.slice(start,start+length),bare:!u,dimension:null,start,end:start+length});erase(start,length);}
 const compactPrefix=new RegExp(`(^|[^a-z\\d_.-])(${unitSource})(${numeric})(?:\\s*(AC|DC))?(?![a-z\\d_.-])`,'gi');
 for(const m of [...rest.matchAll(compactPrefix)])add(m,m[3],m[2],m[4],m.index+m[1].length,m[0].length-m[1].length);
 const prefix=new RegExp(`(^|[^a-z\\d_.-])(${unitSource})\\s*[:=]?\\s*(${numeric})(?:\\s*(AC|DC))?(?![a-z\\d_.-])`,'gi');
 // Prefer an explicit leading unit, but don't steal a suffix from the number
 // immediately before it: both 'lm 1200 W 14' and '1200 lm 14 W' work.
 for(const m of [...rest.matchAll(prefix)]){
  const start=m.index+m[1].length;if(new RegExp(`${numeric}$`).test(rest.slice(0,start).trimEnd()))continue;
  add(m,m[3],m[2],m[4],start,m[0].length-m[1].length);
 }
 const suffix=new RegExp(`(${numeric})\\s*(${unitSource})(?:\\s*(AC|DC))?(?![a-z²])`,'gi');
 for(const m of [...rest.matchAll(suffix)])add(m,m[1],m[2],m[3]);
 for(const m of [...rest.matchAll(prefix)])add(m,m[3],m[2],m[4],m.index+m[1].length,m[0].length-m[1].length);
 const bare=new RegExp(`(^|[^a-z\\d_.-])(${numeric})(?![a-z\\d_.-])`,'gi');
 for(const m of [...rest.matchAll(bare)])add(m,m[2],null,null,m.index+m[1].length,m[2].length);
 // A detached unit can sit on either side of the remaining bare number.
 const distance=(p,start,end)=>p.end<=start?start-p.end:p.start>=end?p.start-end:0;
 for(const m of [...rest.matchAll(new RegExp(`\\b(${unitSource})(?:\\s*(AC|DC))?\\b`,'gi'))]){
  const p=parameters.filter(p=>p.bare).sort((a,b)=>distance(a,m.index,m.index+m[0].length)-distance(b,m.index,m.index+m[0].length))[0];if(!p)continue;
  p.unit=canonical(m[1]);p.key=keyOf(p.unit);p.circuit=m[2]?.toUpperCase()||null;p.strict=!['flux','power'].includes(p.key);p.bare=false;erase(m.index,m[0].length);
 }
 const labelPattern=new RegExp(`\\b(${Object.keys(qualifiers).join('|')})\\b`,'g');
 for(const m of [...rest.matchAll(labelPattern)]){
  const[key,dimension]=qualifiers[m[1]],end=m.index+m[0].length,unitRank=p=>dimension==='length'?(p.unit==='m'||p.unit==='cm'?0:1):dimension==='width'||dimension==='height'?(p.unit==='mm'?0:1):0,p=parameters.filter(p=>(p.key==='any'||p.key===key)&&!p.qualifier).sort((a,b)=>distance(a,m.index,end)-distance(b,m.index,end)||unitRank(a)-unitRank(b)||Number(b.start>=end)-Number(a.start>=end)||a.start-b.start)[0];
  if(!p)continue;p.key=key;p.dimension=dimension;p.qualifier=m[1];p.strict=!['flux','power'].includes(key);erase(m.index,m[0].length);
 }
 parameters.sort((a,b)=>a.start-b.start);
 const terms=rest.split(/[\s,;]+/).filter(Boolean);
 return{raw,terms,textQuery:rest.trim(),parameters,channels,hasParameters:parameters.length>0};
}
function fieldKey(label){
 const s=normal(label);
 if(/strumien/.test(s))return'flux';if(/\bmoc\b/.test(s))return'power';
 if(/barwa|temperatura barwowa/.test(s))return'cct';
 if(/napiecie|zasilanie|wejscie|wyjscie/.test(s)&&!/prad/.test(s))return'voltage';
 if(/szerok|wysok|dlugosc|wymiar|przekroj|modul ciecia|sekcja ciecia|promien/.test(s))return'dimension';
 return null;
}
function dimensionOf(label){const s=normal(label);return /szerok/.test(s)?'width':/dlugosc/.test(s)?'length':/wysok/.test(s)?'height':/ciecia/.test(s)?'cut':/promien/.test(s)?'radius':'dimension';}
function readField(label,value){
 const key=fieldKey(label),raw=String(value??'').trim();if(!key||!raw)return null;
 const unitPattern=new RegExp(`(${unitSource})(?=AC\\b|DC\\b|[^a-z²]|$)`,'gi');
 let units=[...raw.matchAll(unitPattern)].map(m=>canonical(m[1])).filter(u=>keyOf(u)===key);
 if(!units.length)units=[...String(label).matchAll(unitPattern)].map(m=>canonical(m[1])).filter(u=>keyOf(u)===key);
 if(!units.length)return null;const unit=units[0];
 if(key==='dimension'&&/[²]|mm\s*\^?2/.test(raw))return null;
 const values=[...raw.matchAll(new RegExp(numeric,'g'))].map(m=>valueOf(m[0]));if(!values.length)return null;
 const rangeMatch=raw.match(new RegExp(`(${numeric})\\s*(?:[–—−-]|\\bdo\\b)\\s*(${numeric})`,'i'));
 const range=rangeMatch?[valueOf(rangeMatch[1]),valueOf(rangeMatch[2])].sort((a,b)=>a-b):null;
 const circuit=(raw+' '+label).match(/(?:\b|\d\s*V\s*)(AC|DC)\b/i)?.[1]?.toUpperCase()||null;
 return{key,unit,label:String(label),raw,values,range,circuit,dimension:key==='dimension'?dimensionOf(label):null,modeGroup:null};
}
function correlate(fields){
 const powers=fields.filter(f=>f.key==='power'&&f.values.length>1&&!f.range),fluxes=fields.filter(f=>f.key==='flux'&&f.values.length>1&&!f.range);
 for(const power of powers)for(const flux of fluxes)if(power.values.length===flux.values.length){const group='mode-'+fields.indexOf(power)+'-'+fields.indexOf(flux);power.modeGroup=group;flux.modeGroup=group;}
 return fields;
}
export function createParameterRecord({sku='',ean='',text='',specs=[],category='',channels=[],variants=[],compatibleProfiles=[]}={}){
 const pairs=Array.isArray(specs)?specs:Object.entries(specs),fields=correlate(pairs.map(pair=>readField(pair[0],pair[1])).filter(Boolean));
 const statedChannels=pairs.filter(([label])=>/^(typ tasmy|funkcja|typ swiatla|rodzaj swiatla)$/i.test(normal(label))).flatMap(([,value])=>channelsIn(value));
 const explicit=Array.isArray(channels)?channelsIn(channels.join(' ')):channelsIn(channels);
 const fromText=channelsIn(text),known=statedChannels.length?statedChannels:explicit.length?explicit:fromText;
 const record={sku:String(sku??''),ean:String(ean||pairs.find(([label])=>normal(label)==='ean')?.[1]||''),text:normal(text),category,fields,channels:[...new Set(known)],compatibleProfiles:Array.isArray(compatibleProfiles)?compatibleProfiles.map(String):[],variants:[]};
 const fieldId=f=>f.key+':'+(f.dimension||normal(f.label));
 record.variants=variants.map((item,index)=>{
  const v=createParameterRecord({...item,category,variants:[]});
  const ids=new Set(v.fields.map(fieldId));
  v.fields=correlate([...record.fields.filter(f=>!ids.has(fieldId(f))).map(f=>({...f,modeGroup:null})),...v.fields]);
  v.text=normal([text,item.text,item.sku,item.ean].filter(Boolean).join(' '));if(!v.channels.length)v.channels=[...record.channels];v.variantIndex=index;return v;
 });
 return record;
}
function candidates(parameter,record){
 const choices=[];
 for(const field of record.fields){
  if(parameter.key!=='any'&&field.key!==parameter.key)continue;
  if(parameter.dimension&&field.dimension!==parameter.dimension)continue;
  let target=parameter.target;
  if(parameter.unit&&field.unit!==parameter.unit){
   if(field.key==='dimension'&&linear[field.unit]&&linear[parameter.unit])target=parameter.target*linear[parameter.unit]/linear[field.unit];
   else if(!((parameter.unit==='lm'&&field.unit==='lm/m')||(parameter.unit==='w'&&field.unit==='w/m')))continue;
  }
  if(parameter.circuit&&field.circuit!==parameter.circuit)continue;
  const result=(actual,percent,range,mode)=>({key:field.key,label:field.label,raw:field.raw,target:parameter.target,actual,unit:field.unit,percent,range,modeGroup:range?null:field.modeGroup,mode});
  if(field.range&&target>=field.range[0]-EPS&&target<=field.range[1]+EPS){choices.push(result(target,0,field.range,null));continue;}
  if(field.range)continue;
  const strict=!['flux','power'].includes(field.key);
  field.values.forEach((actual,mode)=>{
   const percent=target===0?(actual===0?0:Infinity):(actual-target)/Math.abs(target)*100;
   if(Math.abs(percent)>(strict?EPS:8+EPS))return;choices.push(result(actual,percent,null,mode));
  });
 }
 const rank={flux:0,power:1,dimension:2,cct:3,voltage:4};
 return choices.sort((a,b)=>Math.abs(a.percent)-Math.abs(b.percent)||rank[a.key]-rank[b.key]);
}
const none=()=>({kind:'none',matches:[],deviations:[],channels:[],score:Infinity});
function matchSingle(query,record){
 if(query.compatibleProfile&&!record.compatibleProfiles.includes(query.compatibleProfile))return none();
 const identifier=normal(query.raw),exactIdentifier=Boolean(identifier&&(identifier===normal(record.sku)||identifier===normal(record.ean)));
 if(exactIdentifier)return{kind:'exact',matches:[],deviations:[],channels:[],score:0,identifier:true};
 if(!query.terms.every(term=>record.text.includes(term)))return none();
 if(!(query.channels||[]).every(channel=>record.channels.includes(channel)))return none();
 if(!query.hasParameters)return{kind:'exact',matches:[],deviations:[],channels:query.channels||[],score:0};
 const options=query.parameters.map(p=>candidates(p,record));if(options.some(list=>!list.length))return none();
 let best=null,bestScore=Infinity;
 function choose(i,selected,total){
  if(total>=bestScore)return;
  if(i===options.length){best=selected;bestScore=total;return;}
  for(const match of options[i]){
   // Bare numbers can identify power/flux too; preserve a single 3w1 setting.
   if(match.modeGroup&&selected.some(other=>other.modeGroup===match.modeGroup&&other.key!==match.key&&other.mode!==match.mode))continue;
   choose(i+1,[...selected,match],total+Math.abs(match.percent));
  }
 }
 choose(0,[],0);if(!best)return none();
 const deviations=best.filter(m=>Math.abs(m.percent)>EPS);
 return{kind:deviations.length?'near':'exact',matches:best,deviations,channels:query.channels||[],score:bestScore};
}
export function matchParameterQuery(query,record){
 if(typeof query==='string')query=parseParameterQuery(query);
 if(!record.variants?.length)return matchSingle(query,record);
 const ownIdentifier=normal(query.raw)&&[record.sku,record.ean].some(v=>v&&normal(v)===normal(query.raw));
 const eligible=record.variants.filter(v=>!query.compatibleProfile||v.compatibleProfiles.includes(query.compatibleProfile));
 if(!eligible.length)return none();
 if(ownIdentifier)return{...matchSingle({...query,compatibleProfile:''},record),variantMatches:eligible.map(v=>({index:v.variantIndex,sku:v.sku,ean:v.ean,kind:'exact',matches:[],score:0}))};
 let variants=eligible.map(v=>({...matchSingle(query,v),index:v.variantIndex,sku:v.sku,ean:v.ean})).filter(v=>v.kind!=='none');
 if(variants.some(v=>v.identifier))variants=variants.filter(v=>v.identifier);
 if(!variants.length)return none();variants.sort((a,b)=>a.score-b.score);
 return{...variants[0],variantMatches:variants,variantSku:variants[0].sku};
}
