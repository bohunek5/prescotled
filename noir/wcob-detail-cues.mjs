const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};

// Use the same caption → underline → pointer rhythm for the real layers.
export function sampleWcobDetailCue(detail,local){
  const stages=[
    {start:9,end:13,label:'Mleczna powłoka silikonowa',subline:'Jednolita linia światła',layer:'cover'},
    {start:13,end:17,label:'Diody SMD 2016',subline:'Źródło światła pod powłoką',layer:'emitters'},
    {start:17,end:20,label:'Podkład samoprzylepny 3M',subline:'Warstwa montażowa',layer:'backing'},
    {start:20,end:23,label:'IP62',subline:'Zamknięta mleczna osłona',layer:'cover'}
  ];
  const index=stages.findIndex(s=>local>=s.start&&local<s.end);
  if(index<0)return {opacity:0};
  const cue=stages[index],elapsed=local-cue.start;
  const opacity=smooth(elapsed/.2)*(1-smooth((local-(cue.end-.3))/.3));
  const pointer=smooth((elapsed-.76)/.4);
  return {...cue,index:100+index,anchor:cue.layer,anchorLocal:detail.anchor(cue.layer).toArray(),
    referenceAnchorLocal:detail.anchor(cue.layer).toArray(),
    referenceTime:cue.start+1.25,typing:smooth(elapsed/.4),underline:smooth((elapsed-.42)/.3),
    pointer,draw:pointer,endpoint:smooth((elapsed-1.16)/.16),opacity,
    featureCue:false,featureEmphasis:0,highlightFacts:[],highlightLevel:0};
}
