// Deterministic camera choreography: full product, approach, macro drift,
// rebuild during the pullback, then hold the finished next model in rotation.
export const SHOT_SECONDS=18;
export const THREE_IN_ONE_SECONDS=24;
export const REBUILD_START=14.2,REBUILD_END=18;
export const presentationStart=index=>index===0?0:THREE_IN_ONE_SECONDS+(index-1)*SHOT_SECONDS;
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{const x=clamp(v);return x*x*x*(x*(x*6-15)+10);};
export function samplePresentation(seconds,modelCount=2){
  const elapsed=Math.max(0,seconds),cycle=THREE_IN_ONE_SECONDS+Math.max(0,modelCount-1)*SHOT_SECONDS;
  const cycleTime=elapsed%cycle,from=cycleTime<THREE_IN_ONE_SECONDS?0:1+Math.floor((cycleTime-THREE_IN_ONE_SECONDS)/SHOT_SECONDS);
  const t=cycleTime-presentationStart(from),threeInOne=from===0;
  const duration=threeInOne?THREE_IN_ONE_SECONDS:SHOT_SECONDS;
  const detailEnd=threeInOne?19:13,pullbackSeconds=5;
  const rebuildStart=detailEnd+1.2,rebuildEnd=detailEnd+pullbackSeconds,to=(from+1)%modelCount;
  const approach=smooth((t-1)/3);
  const depart=smooth((t-detailEnd)/pullbackSeconds),zoom=.97*approach*(1-depart);
  const rebuild=clamp((t-rebuildStart)/(rebuildEnd-rebuildStart));
  // Keep 3000 K throughout LOW / MEDIUM / HIGH so the power demonstration
  // changes brightness without also changing the selected catalogue colour.
  const incoming=rebuild>=.5,productTime=incoming?(to===0?6:0):threeInOne?6:Math.min(17.999,Math.max(0,(t-4)/9*18));
  const fadeOut=1-smooth((t-detailEnd)/1.2);
  const lightLevel=smooth((t-3.5)/1)*fadeOut;
  // Cue drawing still uses its original 6.2 / 6.7-second choreography. The
  // shortened chapters supply an offset clock to begin at 2.5 seconds.
  const cueTime=t+3.7;
  const contactLevel=smooth((cueTime-6.2)/.8)*fadeOut;
  // Global time keeps the gentle turn moving through macro and chapter changes.
  // Independent axes avoid a stationary hold at the end of a shot.
  const mediumStart=6,highStart=9;
  const powerMode=incoming?0:t<mediumStart?0:t<highStart?1:2;
  const powerBlend=powerMode===0?1:smooth((t-(powerMode===1?mediumStart:highStart))/.65);
  return {model:incoming?to:from,local:t,duration,detailEnd,cueTime,productTime,iconTime:incoming?0:t,zoom,lightLevel,contactLevel,powerMode,powerBlend,rotation:-.2+.42*Math.sin(elapsed*.105-.9),tilt:-.02+.035*Math.sin(elapsed*.17),
    targetY:zoom*(-5+10*smooth((t-4)/9)),rebuild:t>=rebuildStart&&t<rebuildEnd?{from,to,progress:rebuild}:null,
    phase:t<1?'full':t<4?'approach':t<detailEnd?'detail':t<rebuildStart?'power-down':t<rebuildEnd?'rebuild':'ready'};
}

export function sampleVariant(local,count){
  return Math.min(Math.max(0,count-1),Math.floor(Math.max(0,local)/18*Math.max(1,count)));
}
