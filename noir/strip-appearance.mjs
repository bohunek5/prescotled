// Owner's construction corrections and source photographs, 2026-10-19.
// Rest colours illustrate the unpowered coating; they are not measured spectra.
export function stripAppearance(product){
  const wcob=product.id.startsWith('wcob'),sealed=product.id==='cobip67';
  return {kind:wcob?'wcob-dome':sealed?'sealed-cob':product.digital?'digital-cob':product.tech.includes('COB')?'cob':'smd',
    opaqueFront:wcob,sealedFront:sealed,macroSide:wcob?'back':'front',backingInk:wcob?'red':null};
}
export function unlitEmitterColor(product,value=product.color){
  const {kind}=stripAppearance(product);
  if(kind==='wcob-dome')return 0xf4f3ec;
  if(kind==='sealed-cob')return 0xf1d9ba;
  if(kind==='digital-cob')return 0xf5f5ef;
  if(kind==='cob'&&product.control==='MONO')return ({czerwona:0xe8b6a0,niebieska:0xb8cbdc,zielona:0xc0d3a4,'różowa':0xe9c0d1,'żółta':0xe9ce64})[String(value).toLowerCase()]??0xf2bf24;
  return 0xf2bf24;
}
