import {filmProducts} from './film-catalog.mjs?v=detail-2';

// Verified catalogue selection. Keep the three reviewed constructions first.
// This single-film sequence is independent of the four-family TV overview.
export const mainFilmProductIds=Object.freeze([
  '3w1','slim','truecolor10','deluxlow',
  'smd12','smd12dense','smd2470','smd24','smd24140','smd24210',
  'premiumslim4','premiumslim120','rgbw','rgbw24',
  'onecut','onecutlow','bread70','bread','sshape',
  'cob12','cob12528','cob12basic','cob12480','cob24320','cob24384','cob',
  'wcob','cobcct','cobcct24','cobcct5','cobcct245','cobcct624','wcobcct',
  'cobrgb','cobrgb810','cobrgb24','cobrgb840','cobrgbw','cobip67','cobrgbcct',
  'cobslim','cob48','coblow','cobcolor','cobfreecut','cobfreecut24',
  'cobdigitalmono','cobdigitalcct','cobdigital'
]);
export const mainFilmProducts=Object.freeze(mainFilmProductIds.map(id=>{
  const product=filmProducts.find(product=>product.id===id);
  if(!product)throw new Error(`Brak modelu w katalogu: ${id}`);
  return product;
}));
