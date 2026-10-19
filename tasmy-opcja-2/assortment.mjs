// Editorial family groups for option 2. Product facts remain in the source catalogue.
// A4 is primary; the two additional DELUX models use their verified catalogue/card data.
// CRI97 3.2 W and 24D009 are omitted by request. The two 5 V options remain only here.
export const groups={
 delux:[
  {name:'3w1',detail:'Trzy poziomy jasności',ids:['3w1']},
  {name:'8 mm LOW',detail:'24D002 · 3,2 W/m',ids:['deluxlow']},
  {name:'8 mm MID',detail:'24D004 · 7 W/m',ids:['deluxmid']},
  {name:'SLIM 4 mm LOW',detail:'24DS002 · 3,5 W/m',ids:['slimlow']},
  {name:'SLIM 4 mm MID',detail:'24DS004 · wąska płytka PCB',ids:['slim']},
  {name:'CRI 97',detail:'10 W/m · wysokie oddawanie barw',ids:['truecolor10']}
 ],
 premium:[
  {name:'SMD 12 V',detail:'60 / 120 LED/m',ids:['smd12','smd12dense']},
  {name:'SMD 24 V',detail:'70–210 LED/m',ids:['smd2470','smd24','smd24140','smd24210']},
  {name:'SLIM 4 mm',detail:'60 / 120 LED/m',ids:['premiumslim4','premiumslim120']},
  {name:'RGBW',detail:'12 / 24 V',ids:['rgbw','rgbw24']}
 ],
 cob:[
  {name:'WCOB',detail:'Trzy biele i regulowana barwa · IP62',ids:['wcob']},
  {name:'COB Low Brightness',detail:'Subtelne światło · 384 LED/m',ids:['coblow']},
  {name:'COB Free Cut',detail:'12 / 24 V · cięcie co 2 mm',ids:['cobfreecut','cobfreecut24']},
  {name:'COB 12 V',detail:'320 / 480 / 528 LED/m',ids:['cob12','cob12480','cob12528']},
  {name:'COB 24 V',detail:'320 / 384 / 528 LED/m',ids:['cob24320','cob24384','cob']},
  {name:'COB 48 V',detail:'480 LED/m',ids:['cob48']},
  {name:'COB CCT',detail:'12 / 24 V · 608 LED/m · PCB 5 mm',ids:['cobcct5','cobcct245']},
  {name:'COB Color',detail:'Pojedyncze kolory',ids:['cobcolor']},
  {name:'COB RGB',detail:'12 V · 810 LED/m / 24 V · 840 LED/m',ids:['cobrgb810','cobrgb840']},
  {name:'COB RGBW',detail:'24EC784 · kolor i biel',ids:['cobrgbw']},
  {name:'COB RGB+CCT',detail:'Kolor i regulowana biel',ids:['cobrgbcct']},
  {name:'COB IP67',detail:'Koszulka silikonowa',ids:['cobip67']}
 ],
 special:[
  {name:'One Cut',detail:'Cięcie co 10 mm',ids:['onecut','onecutlow']},
  {name:'Bread',detail:'Światło do pieczywa',ids:['bread70','bread']},
  {name:'S-Shape',detail:'Giętka konstrukcja PCB',ids:['sshape']},
  {name:'SMD 5 V',detail:'Białe / czarne PCB',ids:[],years:3,poland:false,skus:['W-E007-017-8-NW','B-E007-017-8-W'],source:'Current product specification: prescot.com.pl products 7316 and 7318; 36 months'},
  {name:'COB Digital',detail:'MONO / CCT / RGBW',ids:['cobdigitalmono','cobdigitalcct','cobdigital']},
  {name:'COB SLIM 3 mm',detail:'Wąska płytka PCB',ids:['cobslim']}
 ]
};
