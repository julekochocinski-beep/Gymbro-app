import {addDays,beatenRecords,completedBest,completedCount,dayKey,exerciseConfig,normalize,numberedCompletedSets,statsFor,weekStart,weightsFor} from './training.mjs';

export function estimateOneRepMax(weight,reps){
  if(!Number.isFinite(weight)||weight<=0||!Number.isSafeInteger(reps)||reps<1) return null;
  const estimate=reps===1?weight:weight*(1+reps/30);
  return Number.isFinite(estimate)?estimate:null;
}

function recordedWeight(kg){
  const text=String(kg??'').trim();
  const weight=Number(text.replace(',','.'));
  return text&&Number.isFinite(weight)&&weight>=0?weight:null;
}

export function exerciseWeightTrend(history){
  return history.flatMap(session=>{
    const weights=session.sets.map(set=>recordedWeight(set.kg)).filter(weight=>weight!==null);
    return weights.length?[{...session,weight:Math.max(...weights)}]:[];
  }).slice(0,8).reverse();
}

export function progressionAdvice(exercise,previousSets){
  const {setCount,repMax}=exerciseConfig(exercise);
  if(!repMax) return null;
  const byNumber=new Map(previousSets.map(set=>[set.number,set]));
  let weight;
  let increase=true;
  for(let number=1;number<=setCount;number++){
    const set=byNumber.get(number);
    const kg=recordedWeight(set?.kg),reps=Number(set?.reps);
    if(kg===null||kg<=0||!Number.isInteger(reps)||reps<1||(weight!==undefined&&kg!==weight)) return null;
    weight=kg;
    if(reps<repMax) increase=false;
  }
  return {kind:increase?'increase':'repeat',weight};
}

export function latestMuscleWorkout(sessions,custom,muscle){
  const ordered=sessions.filter(session=>Number.isFinite(session.finished)&&session.finished>0)
    .sort((a,b)=>b.finished-a.finished);
  for(const session of ordered){
    const exercises=session.exercises.flatMap(exercise=>{
      if(!(weightsFor(exercise.label,custom)?.[muscle]>0)) return [];
      const sets=numberedCompletedSets(exercise.sets);
      return sets.length?[{label:exercise.label,sets}]:[];
    });
    if(exercises.length) return {...session,exercises};
  }
  return null;
}

export function weeklyProgress(sessions,custom,now=Date.now()){
  const today=dayKey(now),monday=weekStart(today);
  const current=[],earlier=[];
  for(const session of sessions){
    if(!Number.isFinite(session.finished)||session.finished<=0||session.finished>now||!completedCount(session)) continue;
    (dayKey(session.finished)>=monday?current:earlier).push(session);
  }
  const trained=Object.entries(statsFor(current,custom).map).sort(([,a],[,b])=>b.weighted-a.weighted)
    .slice(0,3).map(([key])=>key);
  const [highlight]=beatenRecords(completedBest(current),completedBest(earlier))
    .sort((a,b)=>(b.kg-b.previous)-(a.kg-a.previous));
  return {count:current.length,trained,highlight};
}

export function moveMonth(month,offset){
  const date=new Date(month+'-01T12:00:00Z');
  date.setUTCMonth(date.getUTCMonth()+offset);
  return date.toISOString().slice(0,7);
}

export function monthGrid(month,sessions){
  const first=month+'-01';
  const next=moveMonth(month,1)+'-01';
  const length=Number(addDays(next,-1).slice(-2));
  const offset=(new Date(first+'T12:00:00Z').getUTCDay()+6)%7;
  const counts=new Map();
  for(const session of sessions){
    const day=dayKey(session.finished);
    if(day.startsWith(month)) counts.set(day,(counts.get(day)??0)+1);
  }
  const cells=Array.from({length:Math.ceil((offset+length)/7)*7},(_,index)=>{
    const day=index-offset+1;
    if(day<1||day>length) return null;
    const key=month+'-'+String(day).padStart(2,'0');
    return {day,key,count:counts.get(key)??0};
  });
  return {cells,trainingDays:counts.size};
}

export function filterSessions(sessions,{query='',order='newest',day=null}={}){
  const needle=normalize(query);
  return sessions.filter(session=>(!day||dayKey(session.finished)===day)&&normalize(session.name).includes(needle))
    .sort((a,b)=>order==='oldest'?a.finished-b.finished:b.finished-a.finished);
}
