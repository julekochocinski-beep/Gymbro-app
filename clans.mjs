import {t} from './locale.mjs';
import {exerciseKey,exerciseLabel} from './catalog.mjs';
import {unlockedSkin} from './skins.mjs';
import {beatenRecords,completedBest,completedCount,dayKey,weekKeys} from './training.mjs';

export const lifts=[
  {id:'bench',label:'Wyciskanie leżąc',display:'Wyciskanie na ławce'},
  {id:'squat',label:'Przysiad',display:'Przysiad ze sztangą'},
  {id:'deadlift',label:'Martwy ciąg',display:'Martwy ciąg'},
];
export const clanPrLabels=new Set(lifts.map(({label})=>exerciseLabel(label)));

export function liftResults(sessions){
  const best=completedBest(sessions,{onlyReps:1});
  return Object.fromEntries(lifts.map(({id,label})=>{
    const entry=best.get(exerciseKey(label));
    return [id,entry?{kg:entry.kg,reps:entry.reps}:null];
  }));
}

export function workoutRecord({id,name,started,finished,exercises}){
  return {
    id,name,started,finished,sets:completedCount({exercises}),
    exercises:exercises.flatMap(({label,sets})=>{
      const done=sets.filter(set=>set.done).map(set=>[Number(set.kg),Number(set.reps)]);
      return done.length?[{label,sets:done}]:[];
    }),
  };
}

export function clanProfile(sessions,wardrobe,progress,appearanceAt=0,previewSkin=null){
  const week=weekKeys();
  return {
    worn:wardrobe.worn,skin:unlockedSkin(wardrobe.skin,progress.level),appearanceAt,previewSkin,
    level:progress.level,week:week[0],
    workouts:sessions.filter(session=>week.includes(dayKey(session.finished))).length,
    best:liftResults(sessions),
    recent:[...sessions].sort((a,b)=>b.finished-a.finished).slice(0,5).map(workoutRecord),
  };
}

export function workoutActivities(session,history,before,after){
  const xp=after.xp-before.xp;
  const events=[{id:session.id+'-workout',body:{kind:'workout',label:session.name,xp}}];
  for(const record of beatenRecords(completedBest([session]),completedBest(history))){
    if(!clanPrLabels.has(record.label)) continue;
    events.push({id:session.id+'-pr-'+events.length,body:{kind:'pr',...record}});
  }
  if(after.level>before.level) events.push({id:session.id+'-level',body:{kind:'level',level:after.level}});
  return events;
}

async function socialRequest(path,payload){
  const response=await fetch(path,payload?{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),
  }:{cache:'no-store'});
  if(!response.headers.get('content-type')?.includes('application/json'))
    throw Error(t('Zaloguj się ponownie, żeby otworzyć Społeczność.'));
  const data=await response.json();
  if(!response.ok) throw Error(t(data.error)??t('Nie udało się połączyć ze społecznością.'));
  return data;
}

export const clanRequest=payload=>socialRequest('/api/clan',payload);
export const friendsRequest=payload=>socialRequest('/api/friends',payload);
export const profileRequest=payload=>socialRequest('/api/profile',payload);
