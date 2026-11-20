import {addDays,dayKey,normalize} from './training.mjs';

export function estimateOneRepMax(series){
  const match=series.trim().match(/^(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+)$/i);
  if(!match) return null;
  const weight=Number(match[1].replace(',','.'));
  const reps=Number(match[2]);
  if(!Number.isFinite(weight)||weight<=0||!Number.isSafeInteger(reps)||reps<1) return null;
  const estimate=reps===1?weight:weight*(1+reps/30);
  return Number.isFinite(estimate)?estimate:null;
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
