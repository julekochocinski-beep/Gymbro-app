import {exerciseKey} from './catalog.mjs';
import {completedCount,dayKey,weekStart,weightsFor,numberedCompletedSets} from './training.mjs';

export const missionStart='2026-11-23';
const seasonAnchor=Date.parse('2026-11-16T00:00:00Z');
const seasonMs=28*86400000;
const zones=[['klatka'],['czworoboczny','srodek_plecow','oble','dolny_grzbiet','najszerszy'],['czworoglowe','posladki','dwuglowe','lydki']];

export const missionDefinitions=[
  ['three-days','weekly','Trzy wejścia','Zapisz trening w trzy różne dni tygodnia.',3,5],
  ['heatmap','weekly','Pełna heatmapa','Zrób po 3 serie celujące głównie w klatkę, plecy i nogi.',3,5],
  ['extra-rep','weekly','Powtórzenie więcej','Popraw liczbę powtórzeń przy tym samym ciężarze w porównaniu z poprzednią sesją tego ćwiczenia.',1,5],
  ['plan','weekly','Plan wykonany','Uruchom zapisany plan i ukończ wszystkie zaplanowane serie w jednej sesji.',1,5],
  ['variety','weekly','Encyklopedia ćwiczeń','Zrób minimum 2 serie w każdym z 6 różnych ćwiczeń.',6,5],
  ['records','seasonal','Pojedynek z wczorajszym sobą','Pobij swój rekord ciężaru w 3 różnych ćwiczeniach. Pierwszy wynik wyznacza punkt odniesienia.',3,15],
  ['regular','seasonal','Regularny GymBro','Przez 3 tygodnie sezonu zrób po minimum 2 treningi w różnych dniach tygodnia.',3,15],
  ['zones','seasonal','Wszechstronny wojownik','Zadaj Golemowi przynajmniej po jednym trafieniu w klatkę, plecy i nogi w tym sezonie.',3,15],
  ['crew','weekly','Trzech do kuźni','Zadaj trafienie w tygodniu, w którym co najmniej 3 różnych członków Twojego klanu trafi Golema.',3,5],
].map(([id,period,title,task,goal,coins])=>({id,period,title,task,goal,coins}));

function seasonOf(day){
  const ms=Date.parse(day+'T00:00:00Z');
  return new Date(seasonAnchor+Math.floor((ms-seasonAnchor)/seasonMs)*seasonMs).toISOString().slice(0,10);
}

export function finishedSavedPlan(draft){
  if(!Array.isArray(draft.planTargets)||!draft.planTargets.length) return false;
  return draft.planTargets.every(({label,setCount},index)=>{
    const item=draft.exercises.find(exercise=>exercise.savedPlanIndex===index);
    return item?.label===label&&numberedCompletedSets(item.sets).length>=setCount;
  });
}

export function personalMissions(sessions,custom,now=Date.now()){
  const weeks=new Map(),seasons=new Map(),lastByExercise=new Map(),best=new Map();
  const ordered=sessions.filter(session=>Number.isFinite(session.finished)&&session.finished<=now&&completedCount(session)>0)
    .sort((a,b)=>a.finished-b.finished);
  for(const session of ordered){
    const day=dayKey(session.finished),weekKey=weekStart(day),seasonKey=seasonOf(day);
    const track=day>=missionStart;
    const week=weeks.get(weekKey)??{days:new Set(),zones:[0,0,0],exercises:new Map(),rep:false,plan:false};
    const season=seasons.get(seasonKey)??new Set();
    if(track){
      weeks.set(weekKey,week);seasons.set(seasonKey,season);
      week.days.add(day);
      if(session.finishedSavedPlan) week.plan=true;
    }
    const lifts=new Map();
    for(const item of session.exercises){
      const sets=numberedCompletedSets(item.sets),key=exerciseKey(item.label);
      if(!sets.length) continue;
      if(track){
        week.exercises.set(key,(week.exercises.get(key)??0)+sets.length);
        const targets=weightsFor(item.label,custom)??{};
        zones.forEach((part,index)=>{if(part.some(muscle=>targets[muscle]>=.5)) week.zones[index]+=sets.length;});
      }
      const records=lifts.get(key)??new Map();
      for(const set of sets){
        const kg=Number(String(set.kg).replace(',','.')),reps=Number(set.reps);
        if(kg>0&&Number.isFinite(kg)&&Number.isInteger(reps)&&reps>0) records.set(kg,Math.max(reps,records.get(kg)??0));
      }
      lifts.set(key,records);
    }
    for(const [key,records] of lifts){
      const previous=lastByExercise.get(key);
      if(track&&[...records].some(([kg,reps])=>previous?.has(kg)&&reps>previous.get(kg))) week.rep=true;
      const heaviest=Math.max(0,...records.keys()),previousBest=best.get(key)??0;
      if(track&&previousBest>0&&heaviest>previousBest) season.add(key);
      best.set(key,Math.max(previousBest,heaviest));
      lastByExercise.set(key,records);
    }
  }
  const weekly=week=>week?{
    'three-days':week.days.size,heatmap:week.zones.filter(count=>count>=3).length,
    'extra-rep':Number(week.rep),plan:Number(week.plan),variety:[...week.exercises.values()].filter(count=>count>=2).length,
  }:{};
  const seasonTotals=new Map([...seasons].map(([key,records])=>[key,{records:records.size,regular:0}]));
  for(const [week,data] of weeks) if(data.days.size>=2) seasonTotals.get(seasonOf(week)).regular++;
  const today=dayKey(now),current={...weekly(weeks.get(weekStart(today))),...seasonTotals.get(seasonOf(today))};
  let earned=0;
  for(const scores of [...weeks.values()].map(weekly).concat([...seasonTotals.values()])){
    for(const mission of missionDefinitions) if(scores[mission.id]>=mission.goal) earned+=mission.coins;
  }
  return {current,earned};
}
