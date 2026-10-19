// Cue-clock input only: no animation loop, wall clock, or numeric-content edits.
export function createFactHighlight(root){
  const table=root?.matches?.('.product-facts')?root:root?.querySelector?.('.product-facts');
  const intro=table?.closest('.intro');
  const cells=[...(table?.children??[])].flatMap(cell=>{
    const value=cell.querySelector('dd [data-product]');
    if(!value)return [];
    const key=value.dataset.product;
    cell.dataset.factKey=key;
    cell.dataset.factActive='false';
    cell.style.setProperty('--fact-emphasis','0');
    return [{cell,key}];
  });
  let activeKeys=[],level=0;
  function update(keys=[],amount=0){
    const numeric=Number(amount);
    level=intro?.dataset.rebuilding==='true'?0:Math.max(0,Math.min(1,Number.isFinite(numeric)?numeric:0));
    const requested=new Set(Array.isArray(keys)?keys:[]);
    activeKeys=[];
    for(const {cell,key} of cells){
      const active=level>0&&requested.has(key),value=active?String(level):'0';
      if(active)activeKeys.push(key);
      if(cell.dataset.factActive!==String(active))cell.dataset.factActive=String(active);
      if(cell.style.getPropertyValue('--fact-emphasis')!==value)cell.style.setProperty('--fact-emphasis',value);
    }
    if(!activeKeys.length)level=0;
  }
  return {
    update,
    inspect:()=>({activeKeys:[...activeKeys],level}),
    dispose(){
      for(const {cell} of cells){delete cell.dataset.factKey;delete cell.dataset.factActive;cell.style.removeProperty('--fact-emphasis');}
      activeKeys=[];level=0;
    }
  };
}
