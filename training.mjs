import {exerciseKey,exerciseLabel,normalize,catalogWeights} from './catalog.mjs';
export {normalize};

export const plans = {
  Push: ['Wyciskanie leżąc', 'Wyciskanie hantli', 'Unoszenie bokiem', 'Prostowanie ramion'],
  Pull: ['Podciąganie', 'Wiosłowanie sztangą', 'Face pull', 'Uginanie ramion'],
  Legs: ['Przysiad', 'Martwy ciąg rumuński (RDL)', 'Uginanie nóg', 'Wspięcia na palce'],
};

export const muscles = {
  klatka:'Klatka piersiowa', barki:'Barki przednie i boczne', barki_tyl:'Barki tylne', triceps:'Triceps', brzuch:'Brzuch',
  skosy:'Skosy brzucha', biceps:'Biceps', przedramiona:'Przedramiona', czworoglowe:'Czworogłowe ud',
  czworoboczny:'Górny czworoboczny (kaptury)', srodek_plecow:'Środek pleców', oble:'Mięśnie obłe i podgrzebieniowe',
  dolny_grzbiet:'Dolny grzbiet', najszerszy:'Najszerszy grzbietu', posladki:'Pośladki',
  dwuglowe:'Dwugłowe ud', lydki:'Łydki',
};

export const standard = 12;
export const example = {klatka:.95, brzuch:.5, skosy:.35, barki:.7, barki_tyl:.55, biceps:.6, triceps:.5,
  czworoglowe:.85, najszerszy:.9, czworoboczny:.7, srodek_plecow:.8, oble:.6, posladki:.75, dwuglowe:.45, lydki:.3};
// Weights control display intensity. They are illustrative, not measured muscle activation.
const rules = [
  [/\bshrugs?\b|szrugs|\bshrugsy\b|wznosy barkow/, {czworoboczny:1}],
  [/face pull|przyciaganie do twarzy/, {barki_tyl:1,oble:.85,srodek_plecow:.45,czworoboczny:.25}],
  [/unoszenie w opadzie|peck[ -]?deck tyl|odwr[oó]cone rozpietki|odwrotne rozpietki|reverse (fly|pec)/, {barki_tyl:1,srodek_plecow:.45,oble:.35}],
  [/unoszenie bokiem|wznosy (ramion |hantli )?bokiem|lateral raise/, {barki:1,czworoboczny:.25}],
  [/unoszenie przodem|wznosy przodem|front raise/, {barki:1}],
  [/wyciskanie (hantli )?nad glowe|\bohp\b|arnold|overhead press|shoulder press|wyciskanie zolnierskie|wyciskanie na barki/, {barki:1,triceps:.6,czworoboczny:.2}],
  [/prostowanie ramion|francuz|wyciskanie francuskie|pushdown|skull crusher/, {triceps:1}],
  [/dipy|\bdips?\b|pompki na poreczach/, {triceps:1,klatka:.8,barki:.45}],
  [/rozpietki|krzyzowanie linek|chest fly|pec[ -]?deck/, {klatka:1,barki:.3}],
  [/wyciskanie lezac|wyciskanie sztangi|wyciskanie hantli|wyciskanie na maszynie|wyciskanie na suwnicy smitha|pompki|bench press|\blawa\b|\blawka\b/, {klatka:1,barki:.55,triceps:.55}],
  [/sciaganie (linki|drazka) prostymi rekami|straight.arm pulldown|pullover/, {najszerszy:1,oble:.45}],
  [/podciaganie podchwytem/, {najszerszy:1,biceps:.8,oble:.4,przedramiona:.25}],
  [/podciaganie|sciaganie drazka|sciaganie linki do klatki|lat pulldown|pull.up/, {najszerszy:1,biceps:.55,oble:.4,przedramiona:.25}],
  [/przyciaganie (szeroko|szerokim)|przyciaganie .*szerokim chwytem|high row/, {srodek_plecow:1,najszerszy:.8,barki_tyl:.7,biceps:.45,oble:.25}],
  [/przyciaganie|seated (cable |machine )?row|wioslowanie na maszynie|wioslowanie z podparciem/, {najszerszy:1,srodek_plecow:.8,barki_tyl:.4,biceps:.5,przedramiona:.2}],
  [/wioslowanie hantla jednoracz/, {najszerszy:1,srodek_plecow:.7,barki_tyl:.35,biceps:.4}],
  [/wioslowanie|\bwioslo\b|barbell row/, {srodek_plecow:1,najszerszy:1,barki_tyl:.55,biceps:.5,dolny_grzbiet:.35,przedramiona:.25}],
  [/martwy ciag rumunski|rumunski martwy ciag|\brdl\b|romanian deadlift|martwy ciag na prostych/, {dwuglowe:1,posladki:1,dolny_grzbiet:.55,przedramiona:.3,czworoboczny:.25}],
  [/martwy ciag|deadlift/, {posladki:1,dolny_grzbiet:1,czworoglowe:.65,dwuglowe:.6,czworoboczny:.4,przedramiona:.4}],
  [/^(suwnica|wypychanie nog.*suwnic)|leg press|hack squat/, {czworoglowe:1,posladki:.7}],
  [/wykrok|lunge|bulgar/, {czworoglowe:1,posladki:.85,dwuglowe:.2}],
  [/prostowanie grzbietu|back extension/, {dolny_grzbiet:1,posladki:.55,dwuglowe:.35}],
  [/przysiad na suwnicy smitha|przysiad z hantla/, {czworoglowe:1,posladki:.8,dolny_grzbiet:.2}],
  [/przysiad|\bsquats?\b/, {czworoglowe:1,posladki:.85,dolny_grzbiet:.35}],
  [/hip thrust|mostek/, {posladki:1,dwuglowe:.3}],
  [/uginanie nog|leg curl/, {dwuglowe:1}],
  [/prostowanie nog|leg extension/, {czworoglowe:1}],
  [/wspiecia na palce|calf raise/, {lydki:1}],
  [/uginanie nadgarstkow|wrist curl/, {przedramiona:1}],
  [/mlotki|mlotkowe|hammer curl/, {biceps:.75,przedramiona:1}],
  [/uginanie ramion|uginanie na modlitewniku|bicep curl/, {biceps:1,przedramiona:.25}],
  [/plank boczny|deska boczna|side plank|russian twist|sklony boczne/, {skosy:1,brzuch:.4}],
  [/brzuszki|spiecia brzucha|plank|\bdeska\b|unoszenie nog|leg raise/, {brzuch:1,skosy:.4}],
];

export const weightsFor = (name, custom={}) => {
  const key = exerciseKey(name);
  return (Object.hasOwn(custom,'own:'+key) ? custom['own:'+key] : undefined) ??
    catalogWeights.get(key) ??
    rules.find(([pattern])=>pattern.test(key))?.[1] ??
    (Object.hasOwn(custom,normalize(name)) ? custom[normalize(name)] : undefined);
};
export const completedCount = session => session.exercises.reduce((sum,e)=>sum+e.sets.filter(set=>set.done).length,0);
export const blankSet = () => ({kg:'', reps:'', done:false});
export const newId = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now()) + Math.random();
export const MAX_PLAN_SETS=50;
export const MAX_PLAN_REPS=9999;
function positiveInteger(value,max){
  const number=Number(value);
  return Number.isInteger(number)&&number>0&&number<=max?number:null;
}
export function exerciseConfig(item){
  const source=typeof item==='string'?{label:item}:item;
  const min=positiveInteger(source.repMin,MAX_PLAN_REPS);
  const max=positiveInteger(source.repMax,MAX_PLAN_REPS);
  return {
    label:source.label,
    restSeconds:source.restSeconds??0,
    setCount:positiveInteger(source.setCount,MAX_PLAN_SETS)??1,
    repMin:min??max,
    repMax:max??min,
  };
}

export const newDraft = (name, date=Date.now(), exercises=Object.hasOwn(plans,name)?plans[name]:[]) => ({
  id: newId(),
  started: date,
  name,
  exercises: exercises.map(item=>{
    const config=exerciseConfig(item);
    return {...config,sets:Array.from({length:config.setCount},blankSet)};
  }),
});

export const elapsedSeconds = (started,now=Date.now()) => Math.max(0,Math.floor((now-started)/1000));
export const remainingSeconds = (deadline,now=Date.now()) => Math.max(0,Math.ceil((deadline-now)/1000));
export const timeLabel = (seconds,hours=false) => {
  const fields=hours?[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60]:[Math.floor(seconds/60),seconds%60];
  return fields.map(n=>String(n).padStart(2,'0')).join(':');
};

export function statsFor(sessions, custom, threshold=standard) {
  const map = Object.create(null);
  const unknown = new Map();
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const count = exercise.sets.filter(set=>set.done).length;
      if (!count) continue;
      const weights = weightsFor(exercise.label,custom);
      if (!weights) {
        unknown.set(normalize(exercise.label),exercise.label);
        continue;
      }
      for (const [muscle,weight] of Object.entries(weights)) {
        const stat = map[muscle] ??= {sets:0, weighted:0, recent:0};
        stat.sets += count;
        stat.weighted += count*weight;
        stat.recent = Math.max(stat.recent,session.finished);
      }
    }
  }
  for (const stat of Object.values(map)) stat.intensity=Math.min(1,stat.weighted/threshold);
  return {map,unknown:[...unknown.values()]};
}

const keyFormat = new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'});
export const dayKey = timestamp => keyFormat.format(timestamp);
export function addDays(key, count) {
  const date = new Date(key+'T12:00:00Z');
  date.setUTCDate(date.getUTCDate()+count);
  return date.toISOString().slice(0,10);
}
export function weekStart(day) {
  const offset = (new Date(day+'T12:00:00Z').getUTCDay()+6)%7;
  return addDays(day,-offset);
}
export function weekKeys(now=Date.now()) {
  const monday=weekStart(dayKey(now));
  return Array.from({length:7},(_,i)=>addDays(monday,i));
}
export function recentSessions(sessions, now=Date.now()) {
  const today = dayKey(now);
  const start = addDays(today,-6);
  return sessions.filter(s=>{
    const day = dayKey(s.finished);
    return day >= start && day <= today;
  });
}

export function numberedCompletedSets(sets) {
  return sets.flatMap((set,index)=>{
    if(!set.done) return [];
    const number=Number.isSafeInteger(set.number)&&set.number>0?set.number:index+1;
    return [{...set,number}];
  });
}

export function exerciseHistory(sessions,label) {
  const key=exerciseKey(label);
  return sessions.flatMap(({name,finished,exercises})=>{
    const sets=exercises.filter(exercise=>exerciseKey(exercise.label)===key)
      .flatMap(exercise=>numberedCompletedSets(exercise.sets));
    return sets.length?[{name,finished,sets}]:[];
  }).sort((a,b)=>b.finished-a.finished);
}

export function previousBest(sessions, label) {
  const key = exerciseKey(label);
  let best = 0;
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (exerciseKey(exercise.label) !== key) continue;
      for (const set of exercise.sets) {
        const kg = Number(set.kg);
        if (set.done && Number.isFinite(kg)) best = Math.max(best,kg);
      }
    }
  }
  return best;
}

export function completedBest(sessions,{onlyReps}={}){
  const best=new Map();
  for(const session of sessions){
    for(const exercise of session.exercises){
      const key=exerciseKey(exercise.label);
      for(const set of exercise.sets){
        const kg=Number(set.kg),reps=Number(set.reps);
        if(!set.done||!Number.isFinite(kg)||kg<=0||!Number.isInteger(reps)||reps<=0||(onlyReps!==undefined&&reps!==onlyReps)) continue;
        const previous=best.get(key);
        if(!previous||kg>previous.kg||kg===previous.kg&&reps>previous.reps){
          best.set(key,{kg,reps,label:exerciseLabel(exercise.label)});
        }
      }
    }
  }
  return best;
}

export function beatenRecords(best,previous){
  return [...best].flatMap(([key,result])=>{
    const prior=previous.get(key);
    return prior&&result.kg>prior.kg?[{label:result.label,kg:result.kg,previous:prior.kg}]:[];
  });
}
