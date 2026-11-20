export const tattooAreas=[
  {id:'chest',name:'Klatka',slots:['chest']},
  {id:'shoulder',name:'Bark',slots:['left-shoulder','right-shoulder']},
  {id:'thigh',name:'Udo',slots:['left-thigh','right-thigh']},
];

export const tattooSlots={
  chest:'Klatka',
  'left-shoulder':'Lewy bark',
  'right-shoulder':'Prawy bark',
  'left-thigh':'Lewe udo',
  'right-thigh':'Prawe udo',
};

export const tattooInks=[['black','Czarny'],['white','Biały']];

export const tattooItems=[
  {id:'tribal',name:'Tribal',price:35,areas:['shoulder','thigh']},
  {id:'wings',name:'Skrzydła',price:55,areas:['chest']},
  {id:'crown',name:'GymBro z koroną',price:45,areas:['chest','thigh']},
  {id:'dragon',name:'Smok',price:60,areas:['shoulder','thigh']},
  {id:'geometry',name:'Geometria',price:30,areas:['chest','shoulder','thigh']},
  {id:'thunder',name:'Błyskawica',price:25,areas:['chest','shoulder','thigh']},
].map(item=>({...item,category:'tattoos'}));

export function tattooFits(item,slot,color){
  return tattooInks.some(([ink])=>ink===color)&&tattooAreas.some(area=>area.slots.includes(slot)&&item?.areas?.includes(area.id));
}

export function tattoosFrom(stored,owned){
  const result={};
  const used=new Set();
  for(const slot of Object.keys(tattooSlots)){
    const design=stored?.[slot];
    if(!design||used.has(design.id)||(owned&&!owned.includes(design.id))) continue;
    const item=tattooItems.find(entry=>entry.id===design.id);
    if(!tattooFits(item,slot,design.color)) continue;
    result[slot]={id:item.id,color:design.color};
    used.add(item.id);
  }
  return result;
}

export function placeTattoo(tattoos,id,slot,color){
  const result=Object.fromEntries(Object.entries(tattoos).filter(([,mark])=>mark.id!==id));
  result[slot]={id,color};
  return result;
}

// Front-facing artwork. Left and right refer to the character's sides.
export const tattooPlacements={
  slon:{
    chest:[58,35.6,11.3,7,-5],
    'left-shoulder':[69.9,31.2,8.7,8,-13],
    'right-shoulder':[22.7,31.2,8.7,8,13],
    'left-thigh':[57.8,69.5,10.3,10.8,-7],
    'right-thigh':[35.5,69.5,10.3,10.8,7],
  },
  dzik:{
    chest:[58.2,37,11.5,7,-5],
    'left-shoulder':[71.3,32.2,10,8.5,-12],
    'right-shoulder':[27.8,32.2,10,8.5,12],
    'left-thigh':[59.2,71.2,10,10.6,-7],
    'right-thigh':[39.8,71.2,10,10.6,7],
  },
};

export function tattooFrame(model,slot,id){
  const frame=tattooPlacements[model]?.[slot];
  if(!frame) return null;
  const [x,y,width,height,angle]=frame;
  const scale=id==='thunder'&&slot.endsWith('-shoulder') ? .74 : 1;
  return [x,y,width*scale,height*scale,angle];
}
