// Additional products belong only to option 2, not to the 56-product source film.
// Facts checked against the live manufacturer specifications on 2026-10-19.
const sourceWhite='https://www.prescot.com.pl/pl/p/Tasma-LED-Premium-white-PCB-Neutralna-biala-4000K-5V-60-LEDm-SMD2835-Rolka-5m-5-lat-gwarancji/7318';
const sourceBlack='https://www.prescot.com.pl/pl/p/Tasma-LED-Premium-black-5V-60ledm-SMD2835-3.4Wm-6000K-IP20-300lmm-8mm-CRI80-PL5Y-5m/7316';

const common={
 range:'PREMIUM',catalogFamily:'PREMIUM SMD',
 voltage:'5',power:'3,4',outputUnit:'lm/m',outputLabel:'Strumień światła',
 unit:'K',width:'8',density:'60',cut:'17',
 quality:'80',qualityUnit:'Ra',qualityLabel:'Oddawanie barw',
 control:'MONO',tech:'2835',ip:'IP20',beam:'120',
 copperOz:'2',energyClass:'G',digital:false,sleeve:false,
 warrantyYears:3,madeInPoland:false,featureKind:'cut',
 originEvidence:'Current official product specification explicitly states Polska produkcja: Nie.',
 warrantyEvidence:'Current official product specification: 36 months. This takes precedence over the stale 5-year product title and 24-month PDF.',
 sourceChecked:'2026-10-19'
};

export const additionalProducts=[
 {
  ...common,
  id:'smd5white',name:'SMD 5 V · białe PCB',sku:'W-E007-017-8-NW',
  color:'4000',colorCopy:'Neutralna biel',output:'290',efficacy:'68',
  pcbColor:'white',image:'/prescotled/noir/media/46945.webp',
  source:sourceWhite,assortmentSource:sourceWhite,
  ipOptions:['IP20'],
  colorVariants:[{kelvin:'4000',label:'Neutralna biel',sku:'W-E007-017-8-NW',power:'3,4',outputs:['290'],efficacies:['68'],energyClass:'G'}],
  catalogVariants:[['W-E007-017-8-NW','4000','3,4','290']],
  pcbColorEvidence:'Original product photograph noir/media/46945.webp shows white PCB.',
  efficacyEvidence:'Current official specification: 68 lm/W. Kept as published; not recalculated from nominal power and flux.',
  sourceConflicts:[
   'Legacy PDF assets/tasmy-2026/karty/3496b10a857c3f8f.pdf states 80 lm/W and 24 months; live specification states 68 lm/W and 36 months.',
   'The live title and local katalog/index.html still say 5 years; live specification states 36 months.',
   'The legacy white-PCB PDF contains copied black-PCB wording; the original photograph confirms white PCB.'
  ]
 },
 {
  ...common,
  id:'smd5black',name:'SMD 5 V · czarne PCB',sku:'B-E007-017-8-W',
  color:'6000',colorCopy:'Chłodna biel',output:'300',efficacy:'85',
  pcbColor:'black',image:'/prescotled/noir/media/46949.webp',
  source:sourceBlack,assortmentSource:sourceBlack,
  ipOptions:['IP20'],
  colorVariants:[{kelvin:'6000',label:'Chłodna biel',sku:'B-E007-017-8-W',power:'3,4',outputs:['300'],efficacies:['85'],energyClass:'G'}],
  catalogVariants:[['B-E007-017-8-W','6000','3,4','300']],
  pcbColorEvidence:'Original product photograph noir/media/46949.webp shows black PCB and identifies PREMIUM BLACK PCB.',
  efficacyEvidence:'Current official specification: 85 lm/W. Kept as published; not recalculated from nominal power and flux.',
  sourceConflicts:[
   'Legacy PDF assets/tasmy-2026/karty/bd8f2dca3c947a23.pdf states 24 months; live specification and description state 36 months.',
   'The live title retains PL5Y and local katalog/index.html says 5 years; live specification states 36 months.'
  ]
 }
];
