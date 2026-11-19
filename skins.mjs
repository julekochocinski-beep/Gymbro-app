export const skins=[
  {id:'default',level:1,name:'Klasyczna',rank:'',en:'Classic',enRank:''},
  {id:'bronze',level:5,name:'Brązowa',rank:'Nowicjusz',en:'Bronze',enRank:'Novice'},
  {id:'silver',level:10,name:'Srebrna',rank:'Średniozaawansowany',en:'Silver',enRank:'Intermediate'},
  {id:'gold',level:20,name:'Złota',rank:'Zaawansowany',en:'Gold',enRank:'Advanced'},
  {id:'diamond',level:50,name:'Diamentowa',rank:'PRO',en:'Diamond',enRank:'PRO'},
];

const byId=new Map(skins.map(skin=>[skin.id,skin]));
export const rankFor=level=>skins.findLast(skin=>level>=skin.level)??skins[0];
export function unlockedSkin(id,level){
  const skin=byId.get(id);
  return skin&&skin.level<=level?skin.id:'default';
}
