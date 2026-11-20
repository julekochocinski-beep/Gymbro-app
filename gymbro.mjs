import {addDays,beatenRecords,completedBest,completedCount,dayKey,weekStart} from './training.mjs';
import {modelFor} from './models.mjs';

export const XP_PER_DAY=50;
export const XP_PER_RECORD=10;
export const COINS_PER_LEVEL=10;
const levelTarget=level=>100+(level-1)*50;
const workoutXp=streak=>XP_PER_DAY+(streak>=2?5*Math.min(5,streak):0);

// Layer order follows the supplied clothing assets.
export const items=[
  {id:'bandana',name:'Czerwona bandana',slot:'Na ramię',price:30,back:true},
  {id:'lancuch',name:'Złoty łańcuch',slot:'Na szyję',price:50,back:true},
  {id:'okulary',name:'Fioletowe okulary',slot:'Na twarz',price:40,back:false},
];

export function wardrobeFrom(stored){
  const owned=items.filter(item=>stored?.owned?.includes(item.id)).map(item=>item.id);
  return {owned,worn:owned.filter(id=>stored?.worn?.includes(id)),skin:stored?.skin??'default',model:modelFor(stored?.model).id};
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

export function progression(sessions,wardrobe,legacy,now=Date.now()){
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
  const spent=items.filter(item=>wardrobe.owned.includes(item.id)).reduce((sum,item)=>sum+item.price,0);
  const earned=(legacy.level-1)*50+(level-legacy.level)*COINS_PER_LEVEL;
  return {xp,level,inLevel,target:levelTarget(level),coins:Math.max(0,earned-spent),streak:activeStreak,nextWorkoutXp};
}

export function buyItem(wardrobe,id,coins){
  const item=items.find(entry=>entry.id===id);
  if(!item||wardrobe.owned.includes(id)||coins<item.price) return false;
  wardrobe.owned.push(id);
  wardrobe.worn.push(id);
  return true;
}

export function toggleItem(wardrobe,id){
  if(!wardrobe.owned.includes(id)) return false;
  wardrobe.worn=wardrobe.worn.includes(id)?wardrobe.worn.filter(worn=>worn!==id):[...wardrobe.worn,id];
  return true;
}
