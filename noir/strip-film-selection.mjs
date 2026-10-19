import {filmProducts} from './film-catalog.mjs?v=detail-3';
import {filmVariantFamily} from './strip-product-variants.mjs?v=1';

// Verified catalogue order: DELUX, PREMIUM, COB, then specialist constructions.
// The single film omits the two 5 V products retained in the four-family overview.
export const mainFilmProductIds=Object.freeze([
  '3w1','deluxlow','deluxmid','slimlow','slim','truecolor10',
  'smd12','smd12dense','smd2470','smd24','smd24140','smd24210',
  'premiumslim4','premiumslim120','rgbw','rgbw24',
  'wcob','coblow','cobfreecut','cobfreecut24',
  'cob12','cob12480','cob12528','cob24320','cob24384','cob','cob48',
  'cobcct5','cobcct245','cobcolor','cobrgb810','cobrgb840',
  'cobrgbw','cobrgbcct','cobip67',
  'onecut','onecutlow','bread70','bread','sshape',
  'cobdigitalmono','cobdigitalcct','cobdigital','cobslim'
]);
export const mainFilmProducts=Object.freeze(mainFilmProductIds.map(id=>{
  const product=filmProducts.find(product=>product.id===id);
  if(!product)throw new Error(`Brak modelu w katalogu: ${id}`);
  return filmVariantFamily(product);
}));
