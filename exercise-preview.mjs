export function previewFrames(layout, weights) {
  const entries=Object.entries(weights??{});
  if(!entries.length) return [];
  const max=Math.max(...entries.map(([,weight])=>weight));
  const primary=entries.filter(([,weight])=>weight===max).map(([key])=>key);
  const front=layout.przod.warstwy;
  const back=layout.tyl.warstwy;
  const needsFront=primary.some(key=>front[key]&&!back[key]);
  const needsBack=primary.some(key=>back[key]&&!front[key]);
  const defaultSide=needsBack&&!needsFront||primary.every(key=>key==='triceps')?'tyl':'przod';
  const views={przod:[],tyl:[]};
  for(const key of primary){
    const side=layout[defaultSide].warstwy[key]?defaultSide:defaultSide==='przod'?'tyl':'przod';
    if(layout[side].warstwy[key]) views[side].push(key);
  }
  return Object.entries(views).filter(([,keys])=>keys.length).map(([side,keys])=>{
    const {plotno:[width,height],warstwy}=layout[side];
    const scale=height/width;
    const centers=keys.flatMap(key=>warstwy[key].srodki);
    const xs=centers.map(([x])=>x),ys=centers.map(([,y])=>y*scale);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const crop=Math.min(1.12,Math.max(.38,maxX-minX+.31,maxY-minY+.35));
    return {
      side,keys,width:100/crop,height:100*scale/crop,
      left:50-50*(minX+maxX)/crop,top:50-50*(minY+maxY)/crop,
      files:keys.map(key=>warstwy[key].plik),
    };
  });
}
