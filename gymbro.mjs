import {addDays,beatenRecords,completedBest,completedCount,dayKey,weekStart} from './training.mjs';
import {modelFor} from './models.mjs';
import {placeTattoo,tattooFits,tattooItems,tattoosFrom} from './tattoos.mjs';

export const XP_PER_DAY=50;
export const XP_PER_RECORD=10;
export const COINS_PER_LEVEL=10;
const levelTarget=level=>100+(level-1)*50;
const workoutXp=streak=>XP_PER_DAY+(streak>=2?5*Math.min(5,streak):0);

export const backgrounds=[
  {id:'aura',name:'Aura'},
  {id:'grid',name:'Siatka'},
  {id:'orbits',name:'Orbity'},
  {id:'forge',name:'Kuźnia'},
].map(background=>({...background,price:10}));
export const backgroundId=id=>backgrounds.some(item=>item.id===id)?id:'default';

// Layer order follows the supplied clothing assets.
export const items=[
  {id:'tank-white',name:'Biały tank top',slot:'Na tułów',wearSlot:'torso',category:'clothes',price:45,back:true},
  {id:'tank-black',art:'tank-white',name:'Czarny tank top',slot:'Na tułów',wearSlot:'torso',category:'clothes',price:45,back:true},
  {id:'bandana',name:'Czerwona bandana',slot:'Na ramię',category:'accessories',price:30,back:true},
  {id:'lancuch',name:'Złoty łańcuch',slot:'Na szyję',category:'accessories',price:50,back:true},
  {id:'okulary',name:'Fioletowe okulary',slot:'Na twarz',category:'accessories',price:40,back:false},
  ...tattooItems,
];

export function wardrobeFrom(stored){
  const owned=items.filter(item=>stored?.owned?.includes(item.id)).map(item=>item.id);
  const ownedBackgrounds=backgrounds.filter(item=>stored?.ownedBackgrounds?.includes(item.id)).map(item=>item.id);
  const appearance=lookFrom(stored,owned,ownedBackgrounds);
  const styles=Array.isArray(stored?.styles)?stored.styles.slice(0,3).map(style=>style?lookFrom(style,owned,ownedBackgrounds):null):[];
  return {...appearance,owned,ownedBackgrounds,styles};
}

function lookFrom(stored,owned,ownedBackgrounds){
  const worn=[];
  for(const item of items) if(item.category!=='tattoos'&&owned.includes(item.id)&&stored?.worn?.includes(item.id)) equipItem(worn,item);
  return {worn,tattoos:tattoosFrom(stored?.tattoos,owned),skin:stored?.skin??'default',model:modelFor(stored?.model).id,
    background:ownedBackgrounds.includes(stored?.background)?stored.background:'default'};
}

function equipItem(worn,item){
  if(item.wearSlot){
    const current=worn.findIndex(id=>items.find(entry=>entry.id===id)?.wearSlot===item.wearSlot);
    if(current>=0) worn.splice(current,1);
  }
  worn.push(item.id);
}

function savedWorkouts(sessions){
  return sessions.filter(session=>Number.isFinite(session.finished)&&session.finished>0&&completedCount(session)>0);
}

export function legacyProgress(sessions){
  const history=savedWorkouts(sessions);
  const days=new Set(history.map(session=>dayKey(session.finished))).size;
  const xp=days*50;
  return {
    through:history.reduce((latest,session)=>Math.max(latest,session.finished),0),
    level:1+Math.floor(xp/100),
    inLevel:xp%100,
  };
}

export function progression(sessions,wardrobe,legacy,now=Date.now(),bonusCoins=0){
  const days=new Set(), bonusDays=new Set(), best=new Map();
  let lastWeek=null, streak=0, xp=0;
  for(const session of savedWorkouts(sessions).sort((a,b)=>a.finished-b.finished)){
    const day=dayKey(session.finished);
    const week=weekStart(day);
    if(week!==lastWeek){
      streak=lastWeek===addDays(week,-7)?streak+1:1;
      lastWeek=week;
    }
    const eligible=session.finished>legacy.through;
    if(eligible&&!days.has(day)) xp+=workoutXp(streak);
    days.add(day);
    const marks=completedBest([session]);
    if(eligible&&!bonusDays.has(day)&&beatenRecords(marks,best).length){
      xp+=XP_PER_RECORD;
      bonusDays.add(day);
    }
    for(const [key,result] of marks){
      if(result.kg>(best.get(key)?.kg??0)) best.set(key,result);
    }
  }
  let {level,inLevel}=legacy;
  inLevel+=xp;
  while(inLevel>=levelTarget(level)){
    inLevel-=levelTarget(level);
    level++;
  }
  const thisWeek=weekStart(dayKey(now));
  const activeStreak=lastWeek===thisWeek||lastWeek===addDays(thisWeek,-7)?streak:0;
  const nextWorkoutXp=workoutXp(lastWeek===thisWeek?streak:activeStreak+1);
  const spent=items.filter(item=>wardrobe.owned.includes(item.id)).reduce((sum,item)=>sum+item.price,0)+
    backgrounds.filter(item=>wardrobe.ownedBackgrounds?.includes(item.id)).reduce((sum,item)=>sum+item.price,0);
  const earned=(legacy.level-1)*50+(level-legacy.level)*COINS_PER_LEVEL+bonusCoins;
  return {xp,level,inLevel,target:levelTarget(level),coins:Math.max(0,earned-spent),streak:activeStreak,nextWorkoutXp};
}

export function buyItem(wardrobe,id,coins,slot,color){
  const item=items.find(entry=>entry.id===id);
  if(!item||wardrobe.owned.includes(id)||coins<item.price) return false;
  if(item.category==='tattoos'&&!tattooFits(item,slot,color)) return false;
  wardrobe.owned.push(id);
  if(item.category==='tattoos') wardrobe.tattoos=placeTattoo(wardrobe.tattoos??{},id,slot,color);
  else equipItem(wardrobe.worn,item);
  return true;
}

export function toggleItem(wardrobe,id){
  const item=items.find(entry=>entry.id===id);
  if(!item||item.category==='tattoos'||!wardrobe.owned.includes(id)) return false;
  if(wardrobe.worn.includes(id)) wardrobe.worn=wardrobe.worn.filter(worn=>worn!==id);
  else equipItem(wardrobe.worn,item);
  return true;
}

export function toggleTattoo(wardrobe,id,slot,color){
  const item=tattooItems.find(entry=>entry.id===id);
  if(!wardrobe.owned.includes(id)||!tattooFits(item,slot,color)) return false;
  const tattoos=wardrobe.tattoos??{};
  const current=tattoos[slot];
  if(current?.id===id&&current.color===color){
    delete tattoos[slot];
    wardrobe.tattoos=tattoos;
  }else wardrobe.tattoos=placeTattoo(tattoos,id,slot,color);
  return true;
}
