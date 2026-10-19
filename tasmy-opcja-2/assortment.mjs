// Editorial family groups for option 2. Product facts remain in the source catalogue.
// DELUX and PREMIUM follow Kinga's A4 catalogue; CRI97 3.2 W is omitted by request.
export const groups={
 delux:[
  {name:'3w1',detail:'Trzy poziomy jasności',ids:['3w1']},
  {name:'CRI 97',detail:'10 W/m · wysokie oddawanie barw',ids:['truecolor10']},
  {name:'Low Brightness',detail:'Subtelne światło',ids:['deluxlow']},
  {name:'SLIM 4 mm',detail:'Wąska płytka PCB',ids:['slim']}
 ],
 premium:[
  {name:'SMD 12 V',detail:'60 / 120 LED/m',ids:['smd12','smd12dense']},
  {name:'SMD 24 V',detail:'70–210 LED/m',ids:['smd2470','smd24','smd24140','smd24210']},
  {name:'SLIM 4 mm',detail:'60 / 120 LED/m',ids:['premiumslim4','premiumslim120']},
  {name:'RGBW',detail:'12 / 24 V',ids:['rgbw','rgbw24']}
 ],
 cob:[
  {name:'COB 12 / 24 V',detail:'Światło białe',ids:['cob12','cob12528','cob12basic','cob12480','cob24320','cob24384','cob']},
  {name:'WCOB',detail:'Mleczna powierzchnia · IP62',ids:['wcob']},
  {name:'COB CCT',detail:'Regulowana barwa bieli',ids:['cobcct','cobcct24','cobcct5','cobcct245','cobcct624']},
  {name:'WCOB CCT',detail:'Regulowana biel · IP62',ids:['wcobcct']},
  {name:'COB RGB / RGBW',detail:'Kolor i biel',ids:['cobrgb','cobrgb810','cobrgb24','cobrgb840','cobrgbw']},
  {name:'COB IP67',detail:'Wariant szczelny',ids:['cobip67']},
  {name:'COB RGB+CCT',detail:'Kolor i regulowana biel',ids:['cobrgbcct']},
  {name:'COB SLIM 3 mm',detail:'Wąska płytka PCB',ids:['cobslim']},
  {name:'COB 48 V',detail:'Zasilanie 48 V',ids:['cob48']},
  {name:'Low / Color',detail:'Mała moc / pojedyncze kolory',ids:['coblow','cobcolor']}
 ],
 special:[
  {name:'One Cut',detail:'Cięcie co 10 mm',ids:['onecut','onecutlow']},
  {name:'Bread',detail:'Światło do pieczywa',ids:['bread70','bread']},
  {name:'S-Shape',detail:'Giętka konstrukcja PCB',ids:['sshape']},
  {name:'SMD 5 V',detail:'Białe / czarne PCB',ids:[],years:3,poland:false,skus:['W-E007-017-8-NW','B-E007-017-8-W'],source:'Current product specification: prescot.com.pl products 7316 and 7318; 36 months'},
  {name:'COB Free Cut',detail:'Cięcie co 2 mm',ids:['cobfreecut','cobfreecut24']},
  {name:'COB Digital',detail:'MONO / CCT / RGBW',ids:['cobdigitalmono','cobdigitalcct','cobdigital']}
 ]
};
