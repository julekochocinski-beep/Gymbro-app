import {layout} from './assets/layout.js';
import {muscleTargets} from './assets/muscle-targets.mjs';
import {boarGeometry} from './assets/dzik/layout.mjs';

const boarRoot='assets/dzik/';
const boarLayout={};
const boarTargets={};
for(const [view,{plotno,warstwy}] of Object.entries(boarGeometry)){
  boarLayout[view]={plotno,warstwy:{}};
  boarTargets[view]={};
  for(const [key,{srodki,path}] of Object.entries(warstwy)){
    boarLayout[view].warstwy[key]={
      plik:boarRoot+view+'_'+key+'.webp',
      nazwa:layout[view].warstwy[key].nazwa,
      srodki,
    };
    boarTargets[view][key]=path;
  }
}

export const models=[
  {id:'slon',name:'Słoń',root:'assets/',layout,targets:muscleTargets},
  {id:'dzik',name:'Dzik',root:boarRoot,layout:boarLayout,targets:boarTargets},
];
export const modelFor=id=>models.find(model=>model.id===id)??models[0];
