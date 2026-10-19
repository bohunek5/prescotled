import {filmProducts} from './film-catalog.mjs?v=detail-3';

const sources=new Map(filmProducts.map(product=>[product.id,product]));
const families=new WeakMap();
function cctVariant(product){
  return {sourceProductId:product.id,kelvin:'CCT',label:'Regulowana barwa',sku:product.sku,
    power:product.power,outputs:[product.output],efficacies:[product.efficacy],energyClass:product.energyClass};
}

// The source catalogue remains unchanged. WCOB shares one physical body while
// its fourth colour uses the complete, separately sourced WCOB CCT specification.
export function filmVariantFamily(product){
  if(families.has(product))return families.get(product);
  let colorVariants=product.colorVariants;
  if(product.id==='wcob'&&!colorVariants.some(variant=>variant.sourceProductId==='wcobcct')){
    colorVariants=[...colorVariants,cctVariant(sources.get('wcobcct'))];
  }else if(product.control==='CCT'){
    colorVariants=colorVariants.length?colorVariants.map(variant=>({...variant,label:'Regulowana barwa'})):[cctVariant(product)];
  }
  const family=colorVariants===product.colorVariants?product:{...product,colorVariants};
  families.set(product,family);families.set(family,family);return family;
}

// Accept the selected variant (or its family index). Keep the family array so
// consumers can use their existing colour index with getProductDetails().
export function resolveFilmVariant(family,variant){
  const selected=typeof variant==='number'?family.colorVariants[variant]:variant;
  const source=sources.get(selected?.sourceProductId)??family;
  return {...source,id:family.id,name:family.name,range:family.range,
    sourceProductId:selected?.sourceProductId??family.id,colorVariants:family.colorVariants,
    sku:selected?.sku??source.sku,power:selected?.power??source.power,
    output:selected?.outputs?.[0]??source.output,efficacy:selected?.efficacies?.[0]??source.efficacy,
    energyClass:selected?.energyClass??source.energyClass,
    color:selected?.kelvin??source.color,unit:selected?/^\d+$/.test(selected.kelvin)?'K':'':source.unit,
    colorCopy:selected?.label??source.colorCopy};
}
