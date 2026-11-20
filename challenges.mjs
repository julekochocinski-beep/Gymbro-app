import {completedCount,dayKey,muscles,weekStart,weightsFor} from './training.mjs';
import {supabase} from './supabase.mjs';

export const MISSION_COINS=5;
export const SEASON_COINS=20;
export const GOLEM_COINS=15;
export const GOLEM_GOAL=3;
export const golemZones={chest:'Klatka piersiowa',back:'Plecy',legs:'Nogi'};

export function weeklyMissions(sessions,firstWeek,now=Date.now()){
  const currentWeek=weekStart(dayKey(now));
  const trainingDays=new Map();
  for(const session of sessions){
    if(!Number.isFinite(session.finished)||session.finished>now||!completedCount(session)) continue;
    const day=dayKey(session.finished);
    const week=weekStart(day);
    if(week<firstWeek) continue;
    if(!trainingDays.has(week)) trainingDays.set(week,new Set());
    trainingDays.get(week).add(day);
  }
  const count=Math.min(trainingDays.get(currentWeek)?.size??0,2);
  const earned=[...trainingDays.values()].filter(days=>days.size>=2).length*MISSION_COINS;
  return {count,earned};
}

export function golemWorkout(session,custom,clan,owner){
  const trained=new Set(), primary=new Set();
  for(const exercise of session.exercises){
    if(!exercise.sets.some(set=>set.done)) continue;
    for(const [muscle,weight] of Object.entries(weightsFor(exercise.label,custom)??{})){
      if(!Object.hasOwn(muscles,muscle)||weight<=0) continue;
      trained.add(muscle);
      if(weight>=.5) primary.add(muscle);
    }
  }
  return {owner,clan,id:session.id,finished:session.finished,muscles:[...trained],primary:[...primary]};
}

export async function sendGolemWorkout(workout){
  const {error}=await supabase.rpc('gymbro_golem_submit',{
    p_clan_id:workout.clan,p_workout_id:workout.id,p_finished:new Date(workout.finished).toISOString(),
    p_muscles:workout.muscles,p_primary:workout.primary,
  });
  if(error) throw error;
}

export async function golemSnapshot(){
  const {data,error}=await supabase.rpc('gymbro_golem_snapshot');
  if(error) throw error;
  return data;
}

export async function memberArtifacts(memberId){
  const {data,error}=await supabase.rpc('gymbro_member_artifacts',{p_member_id:memberId});
  if(error) throw error;
  return data;
}
