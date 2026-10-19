const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t);};
const references=new WeakMap();

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
  let poses=references.get(detail);if(!poses){poses=new Map();references.set(detail,poses);}
  if(!poses.has(index)){
    const progress=detail.inspect().progress;
    detail.update((cue.start+1.25-6)/20);
    const state=detail.inspect();
    poses.set(index,{anchor:detail.anchor(cue.layer).toArray(),bounds:state.boundsLocal,layers:state.layerBoundsLocal});
    detail.update(progress);
  }
  const reference=poses.get(index);
  const opacity=smooth(elapsed/.2)*(1-smooth((local-(cue.end-.3))/.3));
  const pointer=smooth((elapsed-.76)/.4);
  return {...cue,index:100+index,anchor:cue.layer,anchorLocal:detail.anchor(cue.layer).toArray(),
    referenceAnchorLocal:reference.anchor,referenceBounds:reference.bounds,referenceLayers:reference.layers,
    referenceTime:cue.start+1.25,typing:smooth(elapsed/.4),underline:smooth((elapsed-.42)/.3),
    pointer,draw:pointer,endpoint:smooth((elapsed-1.16)/.16),opacity,
    featureCue:false,featureEmphasis:0,highlightFacts:[],highlightLevel:0};
}
