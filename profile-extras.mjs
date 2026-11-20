import {exerciseConfig} from './training.mjs';

export function instagramHandle(value) {
  let name = String(value ?? '').trim();
  if (!name) return '';

  if (/^(https:\/\/|(?:www\.)?instagram\.com\/)/i.test(name)) {
    try {
      const url = new URL(/^https:\/\//i.test(name) ? name : 'https://' + name);
      if (!['instagram.com', 'www.instagram.com'].includes(url.host) || url.username || url.password) return null;
      const match = url.pathname.match(/^\/([^/]+)\/?$/);
      if (!match) return null;
      name = match[1];
    } catch {
      return null;
    }
  } else {
    name = name.replace(/^@/, '');
  }

  name = name.toLowerCase();
  return /^[a-z0-9_](?:[a-z0-9_.]{0,28}[a-z0-9_])?$/.test(name) && !name.includes('..') ? name : null;
}

export function sharedPlansFrom(value){
  if(!Array.isArray(value)) return [];
  return value.slice(0,30).flatMap(plan=>{
    if(typeof plan?.id!=='string'||typeof plan.name!=='string'||!plan.name.trim()||!Array.isArray(plan.exercises)) return [];
    const exercises=plan.exercises.slice(0,100).flatMap(exercise=>{
      if(typeof exercise?.label!=='string'||!exercise.label.trim()) return [];
      const configured=exerciseConfig({...exercise,label:exercise.label.trim().slice(0,85)});
      const rest=Number(configured.restSeconds);
      configured.restSeconds=Number.isInteger(rest)&&rest>=0&&rest<=3599?rest:0;
      if(configured.repMin>configured.repMax) configured.repMax=configured.repMin;
      return [configured];
    });
    return exercises.length?[{id:plan.id.slice(0,128),name:plan.name.trim().slice(0,60),exercises}]:[];
  });
}

export function publicProfile(data,account){
  const extras=data.profileExtras?.owner===account?data.profileExtras:null;
  const ids=new Set(Array.isArray(extras?.planIds)?extras.planIds:[]);
  return {instagram:instagramHandle(extras?.instagram)??'',plans:sharedPlansFrom(data.savedPlans.filter(plan=>ids.has(plan.id)))};
}
