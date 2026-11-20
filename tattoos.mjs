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
    chest:[46.4,37.5,31,10.5,0],
    'left-shoulder':[69.9,32.8,12.2,14.3,-16],
    'right-shoulder':[22.6,32.8,12.2,14.3,16],
    'left-thigh':[57.3,69.5,12.5,13.6,-8],
    'right-thigh':[35.2,69.5,12.5,13.6,8],
  },
  dzik:{
    chest:[49.3,37.2,29,10.6,0],
    'left-shoulder':[71.2,32.9,12,13.5,-13],
    'right-shoulder':[27.6,32.9,12,13.5,13],
    'left-thigh':[58.7,69.8,12,14,-8],
    'right-thigh':[40.6,69.8,12,14,8],
  },
};
