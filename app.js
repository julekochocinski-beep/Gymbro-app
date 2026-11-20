import { supabase } from './supabase.mjs';
import {t,setLanguage,uiLocale} from './locale.mjs';
import {lifts,liftResults,clanProfile,workoutRecord,workoutActivities,clanRequest,friendsRequest,profileRequest} from './clans.mjs';
import {models,modelFor} from './models.mjs';
import {items,wardrobeFrom,legacyProgress,progression,buyItem,toggleItem,toggleTattoo,XP_PER_DAY,XP_PER_RECORD,COINS_PER_LEVEL} from './gymbro.mjs';
import {placeTattoo,tattooAreas,tattooFits,tattooInks,tattooPlacements,tattooSlots} from './tattoos.mjs';
import {plans,muscles,standard,example,normalize,weightsFor,completedCount,newDraft,blankSet,newId,previousBest,exerciseHistory,numberedCompletedSets,exerciseConfig,MAX_PLAN_SETS,MAX_PLAN_REPS,elapsedSeconds,remainingSeconds,timeLabel,statsFor,dayKey,weekKeys,recentSessions} from './training.mjs';

import {catalog,categories,exerciseKey,localizedExerciseLabel as exerciseLabel,exerciseTechnique,matchesExercise} from './catalog.mjs';
import {filterSessions,monthGrid,moveMonth} from './progress.mjs';
import {previewFrames} from './exercise-preview.mjs';
import {armRestSound,playRestSignal} from './rest-signal.mjs';
import {createRestPush} from './rest-push.mjs';
import {skins,rankFor,unlockedSkin} from './skins.mjs';
import {preparePhoto,saveProfilePhoto,readWorkoutPhoto,saveWorkoutPhoto,photoDataUrl,getWorkoutPhotoShare,setWorkoutPhotoShare,fetchSharedWorkoutPhoto,sharedWorkoutPhotoUrl} from './photos.mjs';

const icons={
  camera:'<path d="M4 6h4l2-3h4l2 3h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/>',
  person:'<circle cx="12" cy="8" r="3.5"/><path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M10 2h4l.8 2.5 2 .9 2.4-1.1L22 7.5l-1.6 2.1v2.8l1.6 2.1-2.8 3.2-2.4-1.1-2 .9L14 22h-4l-.8-2.5-2-.9-2.4 1.1L2 16.5l1.6-2.1v-2.8L2 9.5l2.8-3.2 2.4 1.1 2-.9Z" transform="translate(1 1) scale(.91)"/>',
  clan:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v3m1-15a3 3 0 0 1 0 6m2 2a5 5 0 0 1 3 4v3"/>',
  shirt:'<path d="M8 4 3 7l-2 5 4 2 2-3v9h10v-9l2 3 4-2-2-5-5-3a4 4 0 0 1-8 0Z"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="m12 7 3.5 5-3.5 5-3.5-5Z"/>',
  bag:'<path d="M4 8h16l1.5 12h-19L4 8Zm4 2V6a4 4 0 0 1 8 0v4"/>',
  bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  dumbbell:'<path d="m6.5 17.5 11-11M4 14l6 6M14 4l6 6M2 17l5 5M17 2l5 5"/>',
  flame:'<path d="M12 22a7 7 0 0 0 7-7c0-4-3-7-4-8-.3 2-1.5 3-2.5 3.5C12.5 6 10 3 9 2c.5 5-4 7-4 13a7 7 0 0 0 7 7z"/><path d="M9 18a3 3 0 0 0 6 0c0-2-1.5-3.5-3-5-.5 2-3 3-3 5z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m-13 5h.01m4 0h.01m4 0h.01"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  x:'<path d="m6 6 12 12M18 6 6 18"/>',
  stopwatch:'<circle cx="12" cy="14" r="8"/><path d="M9 2h6m-3 4V2m0 8v4l3 2m3-9 2-2"/>',
  edit:'<path d="M12 20h9M15.5 4.5l4 4M4 20l4.5-1 12-12a1.4 1.4 0 0 0 0-2l-1-1a1.4 1.4 0 0 0-2 0l-12 12z"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  play:'<path d="M7 4v16l13-8z"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
};

function icon(name){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
}
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app=document.querySelector('#app');
const restDock=document.querySelector('#rest-dock');
const dialog=document.querySelector('#dialog');
const storage='gymbro-workouts-v1';
const skinTestLevel=50;
const nav = {dom:['home','Dom'],trening:['dumbbell','Trening'],klan:['clan','Społeczność'],mapa:['flame','Mapa'],historia:['calendar','Progress']};
let storageOK=true;
let previous;
try { previous=JSON.parse(localStorage.getItem(storage)); } catch { storageOK=false; }
const storedSessions=Array.isArray(previous?.sessions)?previous.sessions:[];
let data={
  sessions:storedSessions,
  savedPlans:(previous?.savedPlans??[]).map(({labels,exercises,...plan})=>({...plan,exercises:(exercises??labels??[]).map(exerciseConfig)})),
  draft:previous?.draft??null,
  custom:previous?.custom??{},
  ownExercises:previous?.ownExercises??[],
  threshold:previous?.threshold??standard,
  wardrobe:wardrobeFrom(previous?.wardrobe),
  skinPreview:typeof previous?.skinPreview==='string'?unlockedSkin(previous.skinPreview,skinTestLevel):null,
  appearanceAt:Number.isSafeInteger(previous?.appearanceAt)?previous.appearanceAt:0,
  language:previous?.language==='en'?'en':'pl',
  measurements:previous?.measurements??{},
  xpBaseline:previous?.xpBaseline??legacyProgress(storedSessions),
  clanLink:previous?.clanLink??null,
  friendsId:previous?.friendsId??null,
  clanOutbox:previous?.clanOutbox??[],
};
let side=preferredSide(data.sessions[0]), mode='ostatni', selectedSession=null;
let toastTimeout, recordTimeout;
let planEdit=null, picker=null;
let clanState=null, clanError='', clanBusy=false, syncAgain=false, lastProfile='', clanMode='create';
let pendingChat=null, clanVersion=0;
let socialTab='klan', friendsState=null, friendsError='', friendsRead=null, friendsWriting=false, friendsAgain=false, lastFriendsProfile='';
let nickname='', nicknameRead=null, nicknameWriting=false;
let profilePhoto=null, photoWriting=false, draftPhotoPreview=null;
let progressCacheKey, progressCache;

let avatarSide='przod', wardrobeTab=data.wardrobe.owned.length?'garderoba':'sklep', tryOn=null;
let wardrobeFilter='all', tattooArea='chest', tattooSlot='chest', tattooColor='black';
const wardrobeFilters=[['all','Wszystko'],['clothes','Ubrania'],['accessories','Akcesoria'],['tattoos','Tatuaże']];
const progressState={month:dayKey(Date.now()).slice(0,7),day:null,query:'',order:'newest'};
const weekdays=['Pon','Wt','Śr','Czw','Pt','Sob','Nd'];
let clanTime,formatKg,monthFormatter,fullDayFormatter,formatter;
function updateLocale(){
  setLanguage(data.language);
  const lang=uiLocale();
  document.documentElement.lang=data.language;
  document.title=t('GymBro — Dziennik treningowy');
  document.querySelector('.brand').setAttribute('aria-label',t('GymBro — Dom'));
  document.querySelector('.nav').setAttribute('aria-label',t('Nawigacja'));
  restDock.setAttribute('aria-label',t('Timer przerwy'));
  clanTime=new Intl.DateTimeFormat(lang,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Warsaw'});
  formatKg=new Intl.DateTimeFormat(lang,{maximumFractionDigits:8});
  monthFormatter=new Intl.DateTimeFormat(lang,{month:'long',year:'numeric',timeZone:'UTC'});
  fullDayFormatter=new Intl.DateTimeFormat(lang,{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  formatter=new Intl.DateTimeFormat(lang,{day:'numeric',month:'long',timeZone:'Europe/Warsaw'});
}
function toast(message){
  const el=document.querySelector('#toast');
  clearTimeout(toastTimeout);
  el.textContent=message;
  el.classList.add('visible');
  toastTimeout=setTimeout(()=>el.classList.remove('visible'),3500);
}
let currentUser=null, cloudSyncTimer=null;
const restPush=createRestPush(supabase,updateRestPushSettings,message=>{if(!document.hidden) toast(t(message));});
const restPushSignature=rest=>rest?JSON.stringify([rest.id,rest.deadline,data.language]):'';
let savedRestPushSignature=restPushSignature(data.draft?.rest);
function syncCloud(){
  if(!currentUser) return;
  clearTimeout(cloudSyncTimer);
  cloudSyncTimer=setTimeout(async()=>{
    const p=currentProgress();
    await supabase.from('profiles').update({
      level:p.level,
      xp:p.xp,
      coins:p.coins,
      equipped_skin:data.wardrobe.skin,
      worn:data.wardrobe.worn,
      app_data:data,
      updated_at:new Date().toISOString(),
    }).eq('id',currentUser.id);
  },800);
}
function save(){
  try {
    localStorage.setItem(storage,JSON.stringify(data));
    storageOK=true;
    syncCloud();
  } catch {
    storageOK=false;
    toast(t('Pamięć przeglądarki jest niedostępna. Dane zostaną w tej karcie do jej zamknięcia.'));
  }
  const rest=data.draft?.rest;
  const signature=restPushSignature(rest);
  if(signature!==savedRestPushSignature){
    savedRestPushSignature=signature;
    restPush.update(currentUser?.id,rest,data.language);
  }
}
function action(label,act,classes='ghost',glyph=''){
  return '<button type="button" class="btn '+classes+'" data-act="'+act+'">'+(glyph?icon(glyph):'')+label+'</button>';
}
function link(label,target,classes='link',glyph=''){
  return '<a class="'+classes+'" href="#'+target+'">'+label+(glyph?icon(glyph):'')+'</a>';
}
function heading(title,desc,extra=''){
  return '<div class="page-head"><div><h1 class="dimensional-title">'+title+'</h1>'+(desc?'<p class="sub">'+desc+'</p>':'')+'</div>'+extra+'</div>';
}
const route=()=>Object.hasOwn(views,location.hash.slice(1))?location.hash.slice(1):'dom';

function preferredSide(session){
  if(!session) return 'przod';
  const {layout}=activeModel();
  const {map}=statsFor([session],data.custom,data.threshold);
  const total=side=>Object.keys(layout[side].warstwy).reduce((sum,key)=>sum+(map[key]?.weighted??0),0);
  return total('tyl')>total('przod')?'tyl':'przod';
}
function selectSession(session){
  selectedSession=session?.id??null;
  mode='ostatni';
  side=preferredSide(session);
}
function mapData(){
  const latest=data.sessions.find(s=>s.id===selectedSession)??data.sessions[0];
  const range=mode==='ostatni'?(latest?[latest]:[]):recentSessions(data.sessions);
  return {...statsFor(range,data.custom,data.threshold),latest,demo:data.sessions.length===0};
}
function intensity(context,key){
  return context.demo ? example[key]??0 : context.map[key]?.intensity??0;
}
function segment(label,value,items,act){
  return '<div class="segmented" role="group" aria-label="'+label+'">'+items.map(([id,name])=>
    '<button type="button" aria-pressed="'+(id===value)+'" data-act="'+act+'" data-key="'+id+'">'+name+'</button>').join('')+'</div>';
}
function modelMotionStyle(){
  const elapsed=performance.now();
  return '--breath-delay:-'+(elapsed%4200).toFixed(0)+'ms;--aura-delay:-'+(elapsed%5600).toFixed(0)+'ms';
}
function stage(context){
  const {layout,targets:hitAreas,root,id}=activeModel();
  const shape=layout[side];
  const [w,h]=shape.plotno;
  const part=side==='przod'?t('Przód'):t('Tył');
  const layers=Object.entries(shape.warstwy).map(([key,layer])=>{
    const value=intensity(context,key);
    const opacity=.25+.75*value;
    return '<img class="glow" data-glow="'+key+'" style="--opacity:'+opacity+'" '+(!value?'hidden':'')+' src="'+layer.plik+'" alt="" draggable="false">'+
      (value?'<img class="muscle-sparks" src="'+root+'sparks/'+layer.plik.slice(root.length)+'" style="--spark:'+opacity*.8+'" alt="" draggable="false">':'');
  }).join('');
  const targets='<svg class="muscle-targets" viewBox="0 0 '+w+' '+h+'" aria-label="'+t('Wybierz partię na postaci')+'">'+
    Object.entries(shape.warstwy).map(([key,layer])=>
      '<g role="button" tabindex="0" data-act="muscle" data-key="'+key+'" aria-label="'+esc(t(layer.nazwa))+'">'+
      '<path fill-rule="evenodd" d="'+hitAreas[side][key]+'"></path></g>').join('')+'</svg>';
  return '<div class="map-stage"><span class="stage-tag">'+(context.demo?t('Dane przykładowe'):(context.latest?'GymBro':t('Brak treningów')))+'</span>'+
    '<div class="figure" data-model="'+id+'" style="aspect-ratio:'+w+'/'+h+'"><img src="'+root+side+'_baza.webp" alt="GymBro — '+part+'" draggable="false"><img src="'+root+side+'_kontury.webp" alt="" draggable="false">'+layers+targets+'</div>'+
    '<span class="stage-axis">'+part+'</span></div>';
}
function mapCard(context){
  const source = context.demo?t('Podgląd na przykładowym treningu'):mode==='ostatni'?
    (context.latest?esc(context.latest.name)+' · '+formatter.format(context.latest.finished):t('Brak zapisanych treningów')):
    t('Treningi z ostatnich 7 dni');
  return '<section class="card hero"><div class="card-head"><div><h2>'+t('Mapa mięśni')+'</h2><p class="meta">'+source+'</p></div>'+
    segment(t('Widok postaci'),side,[['przod',t('Przód')],['tyl',t('Tył')]],'side')+'</div>'+stage(context)+
    '<div class="map-foot"><span>'+t('Słabo')+' <i class="scale"></i> '+t('mocno')+'</span><span>'+t('Dotknij partii')+'</span></div></section>';
}
function weekCard(){
  const today=dayKey(Date.now());
  const sessionDays=new Set(data.sessions.map(s=>dayKey(s.finished)));
  const keys=weekKeys();
  const count=keys.filter(d=>sessionDays.has(d)).length;
  return '<section class="card card-pad"><div class="card-head"><h3>'+t('Ten tydzień')+'</h3>'+icon('calendar')+'</div>'+
    '<div class="week">'+keys.map((key,i)=>{
      const done=sessionDays.has(key);
      return '<div class="week-day"><span>'+t(weekdays[i])+'</span><span class="day-tile '+(key===today?'today ':'')+(done?'done':'')+'" '+(key===today?'aria-current="date"':'')+' aria-label="'+key+(done?' '+t('— trening ukończony'):'')+'">'+(done?icon('check'):Number(key.slice(-2)))+'</span></div>';
    }).join('')+'</div><div class="week-meta"><span>'+t('Dni treningowe')+'</span><strong>'+count+' / 7</strong></div></section>';
}
function trainingCard(){
  const draft=data.draft;
  return '<section class="card card-pad training-card"><span class="symbol" aria-hidden="true">'+icon('dumbbell')+'</span>'+
    '<p class="eyebrow">'+(draft?t('Trening w toku'):t('Dziennik treningowy'))+'</p><h2>'+(draft?esc(draft.name):t('Czas na trening')+(nickname?', '+esc(nickname):''))+'</h2>'+
    '<p class="sub">'+(draft?completedCount(draft)+' '+t('ukończonych serii'):t('Wybierz Push, Pull, Legs lub własny trening.'))+'</p>'+
    link(draft?t('Wznów trening'):t('Rozpocznij trening'),'trening','btn primary full','arrow')+'</section>';
}
function sessionRows(sessions){
  if(!sessions.length) return '<p class="empty">'+t('Zapisane treningi pojawią się tutaj po zakończeniu pierwszej sesji.')+'</p>';
  return sessions.map(s=>'<button class="session-row" type="button" data-act="details" data-key="'+esc(s.id)+'">'+
    '<span class="row-icon">'+icon('dumbbell')+'</span><span class="row-main"><span class="name">'+esc(s.name)+'</span>'+
    '<span class="desc">'+formatter.format(s.finished)+' '+t('· Serii:')+' '+completedCount(s)+' · '+timeLabel(elapsedSeconds(s.started,s.finished),true)+'</span></span><span class="chevron">'+icon('chevron')+'</span></button>').join('');
}
function currentProgress(){
  const now=Date.now();
  const key=data.sessions.length+'|'+data.wardrobe.owned.length+'|'+dayKey(now);
  if(key!==progressCacheKey){
    progressCache=progression(data.sessions,data.wardrobe,data.xpBaseline,now);
    progressCacheKey=key;
  }
  return progressCache;
}
function coinBalance(coins){
  return '<span class="coin-pill" aria-label="'+t('Monety:')+' '+coins+'">'+icon('coin')+'<b>'+coins+'</b></span>';
}
function xpBar(player){
  return '<div class="xp-info"><div><strong>'+t('Poziom')+' '+player.level+'</strong><span>'+player.inLevel+' / '+player.target+' XP</span></div>'+
    '<div class="xp-meter" role="progressbar" aria-label="'+t('Do następnego poziomu')+'" aria-valuenow="'+player.inLevel+'" aria-valuemax="'+player.target+'">'+
    '<span style="width:'+100*player.inLevel/player.target+'%"></span></div></div>';
}
function portrait(photo,fallback=icon('person'),classes=''){
  const image=typeof photo==='string'&&/^[0-9a-f-]{36}$/.test(photo)?
    '<img class="portrait-image" src="/api/avatar/'+photo+'" alt="" decoding="async">':'';
  return '<span class="portrait '+classes+'" aria-hidden="true">'+fallback+image+'</span>';
}
function accountTools(){
  const level=skinLevel();
  const rank=rankFor(level);
  return '<a class="account-nick ranked" href="#ustawienia" data-rank="'+rank.id+'">'+
    '<strong>'+esc(nickname||t('Ustaw nick'))+'</strong><span>'+(rankTitle(rank)||levelText(level))+(data.skinPreview!==null?' · '+t('Test'):'')+'</span></a>'+
    (profilePhoto?'<a class="account-photo" href="#ustawienia" aria-label="'+t('Zdjęcie profilowe')+'">'+portrait(profilePhoto)+'</a>':'')+
    '<a class="settings-link'+(route()==='ustawienia'?' active':'')+'" href="#ustawienia" aria-label="'+t('Ustawienia')+'" '+
    (route()==='ustawienia'?'aria-current="page"':'')+'>'+icon('settings')+'</a>';
}
const rankTitle=skin=>data.language==='en'?skin.enRank:skin.rank;
const skinName=skin=>data.language==='en'?skin.en:skin.name;
const levelText=level=>t('Poziom')+' '+level;
const skinLevel=()=>data.skinPreview===null?currentProgress().level:skinTestLevel;
const activeSkin=()=>data.skinPreview??unlockedSkin(data.wardrobe.skin,currentProgress().level);
function activeModel(){return modelFor(data.wardrobe.model);}
function skinTestBadge(){
  return data.skinPreview===null?'':'<p class="skin-test-badge">'+t('Tryb testowy')+' · '+levelText(skinTestLevel)+'</p>';
}
function streakInfo(player){
  return '<p class="streak-info">'+icon('flame')+'<strong>'+formatUnit(player.streak,'week')+' '+t('z rzędu')+'</strong>'+
    '<span>'+t('Mnożnik treningu: ×')+(player.nextWorkoutXp/XP_PER_DAY).toLocaleString(uiLocale())+'</span></p>';
}
const formatUnit=(amount,unit)=>new Intl.NumberFormat(uiLocale(),{style:'unit',unit,unitDisplay:'long'}).format(amount);
function tenureDuration(months){
  const years=Math.floor(months/12);
  const remainder=months%12;
  return [years?formatUnit(years,'year'):'',remainder||!years?formatUnit(remainder,'month'):''].filter(Boolean).join(', ');
}
function tenureText(months){
  if(!months) return t('Staż krótszy niż miesiąc');
  return tenureDuration(months)+' '+t('stażu');
}
function tattooLayers(model,tattoos,preview){
  const positions=tattooPlacements[model.id];
  if(!positions) return '';
  const marks=preview?.slot?placeTattoo(tattoos,preview.id,preview.slot,preview.color):tattoos;
  return Object.entries(marks).map(([slot,mark])=>{
    const [x,y,width,height,angle]=positions[slot];
    return '<span class="buddy-tattoo tattoo-ink" data-ink="'+mark.color+'" data-placement="'+slot+'" aria-hidden="true" '+
      'style="--tattoo-art:url(assets/tattoos/'+mark.id+'.webp);left:'+x+'%;top:'+y+'%;width:'+width+'%;height:'+height+'%;--tattoo-angle:'+angle+'deg"></span>';
  }).join('');
}
function buddyModel(view,preview=null,shine=null,{worn=data.wardrobe.worn,tattoos=data.wardrobe.tattoos,skin=activeSkin(),model=activeModel()}={}){
  const [width,height]=model.layout[view].plotno;
  const description=t(model.name)+' · '+t(view==='przod'?'Przód':'Tył');
  const trial=items.find(item=>item.id===preview?.id);
  const visible=items.filter(item=>item.category!=='tattoos'&&(view==='przod'||item.back)&&
    (trial===item||worn.includes(item.id)&&(!trial?.wearSlot||item.wearSlot!==trial.wearSlot)));
  const asset=model.root+'ubrania/'+view+'-';
  const glint=visible.some(item=>item.id===shine)?
    '<span class="outfit-glint" aria-hidden="true" style="--outfit-mask:url('+asset+shine+'.webp)"></span>':'';
  const base=asset+'baza.webp';
  const finish=skin==='default'?'':'<span class="buddy-finish" style="--buddy-art:url('+base+')" aria-hidden="true"></span>';
  return '<div class="buddy-figure" data-model="'+model.id+'" data-skin="'+esc(skin)+'" style="aspect-ratio:'+width+'/'+height+'"><img class="buddy-base" src="'+base+'" alt="'+description+'" draggable="false">'+finish+
    (view==='przod'?tattooLayers(model,tattoos??{},preview):'')+
    visible.map(item=>'<img src="'+asset+item.id+'.webp" data-worn="'+item.id+'" alt="'+t(item.name)+'" draggable="false">').join('')+glint+'</div>';
}
function homeBuddy(){
  const player=currentProgress();
  return '<section class="card card-pad buddy-card"><div class="card-head"><h2>'+t('Twój GymBro')+'</h2>'+coinBalance(player.coins)+'</div>'+
    '<a href="#gymbro" class="buddy-stage home-buddy" style="'+modelMotionStyle()+'" aria-label="'+t('Otwórz garderobę GymBro')+'">'+buddyModel('przod')+
    '<span class="buddy-link">'+icon('shirt')+' '+t('Personalizuj')+' '+icon('arrow')+'</span></a>'+
    skinTestBadge()+xpBar(player)+streakInfo(player)+'</section>';
}
function wardrobeItem(item,coins){
  const {owned,worn}=data.wardrobe;
  const fits=owned.includes(item.id);
  const wearing=worn.includes(item.id);
  const trying=tryOn?.id===item.id;
  const attr=' type="button" data-key="'+item.id+'"';
  return '<article class="outfit-row"><div class="outfit-thumb"><img src="'+activeModel().root+'ubrania/produkt-'+item.id+'.webp" alt=""></div>'+
    '<div class="outfit-description"><h3>'+t(item.name)+'</h3><span class="meta">'+t(item.slot)+(wearing?' '+t('· Założone'):fits?' '+t('· Kupione'):'')+'</span>'+
    '<div class="outfit-actions">'+(fits?'<button class="btn ghost" data-act="outfit-toggle"'+attr+' aria-label="'+(wearing?t('Zdejmij')+' ':t('Załóż')+' ')+t(item.name)+'">'+(wearing?t('Zdejmij'):t('Załóż'))+'</button>':
      '<button class="btn ghost" data-act="outfit-try"'+attr+' aria-pressed="'+trying+'" aria-label="'+t('Przymierz:')+' '+t(item.name)+'">'+(trying?t('Zakończ podgląd'):t('Przymierz'))+'</button>'+
      '<button class="btn primary" data-act="outfit-buy"'+attr+(coins<item.price?' disabled':'')+' aria-label="'+t('Kup:')+' '+t(item.name)+' '+t('za')+' '+item.price+' '+t('monet')+'">'+t('Kup')+' '+icon('coin')+' '+item.price+'</button>')+
    '</div></div></article>';
}
function tattooRow(item,coins){
  const owned=data.wardrobe.owned.includes(item.id);
  const tattoos=data.wardrobe.tattoos;
  const current=Object.keys(tattoos).find(slot=>tattoos[slot].id===item.id);
  const filtering=wardrobeFilter==='tattoos';
  const slot=filtering?tattooSlot:current??tattooAreas.find(area=>item.areas.includes(area.id)).slots[0];
  const color=filtering?tattooColor:tattoos[current]?.color??tattooColor;
  const active=current===slot&&tattoos[slot]?.color===color;
  const trying=tryOn?.id===item.id&&tryOn.slot===slot&&tryOn.color===color;
  const attributes=' type="button" data-key="'+item.id+'" data-slot="'+slot+'" data-color="'+color+'"';
  const equipLabel=active?'Zdejmij':current===slot?'Zmień kolor':current?'Przenieś':'Załóż';
  const button=(act,label,style='ghost',extra='')=>'<button class="btn '+style+'" data-act="'+act+'"'+attributes+extra+'>'+label+'</button>';
  return '<article class="outfit-row"><div class="outfit-thumb">'+
    '<span class="tattoo-thumb tattoo-ink" data-ink="'+color+'" aria-hidden="true" style="--tattoo-art:url(assets/tattoos/'+item.id+'.webp)"></span></div>'+
    '<div class="outfit-description"><h3>'+t(item.name)+'</h3><span class="meta">'+
    (current?t(tattooSlots[current]):t('Tatuaż'))+'</span><div class="outfit-actions">'+
    button('tattoo-try',t(trying?'Zakończ podgląd':'Przymierz'),'ghost',' aria-pressed="'+trying+'"')+
    (owned?button('tattoo-equip',t(equipLabel)):button('outfit-buy',t('Kup')+' '+icon('coin')+' '+item.price,'primary',coins<item.price?' disabled':''))+'</div></div></article>';
}
function tattooControls(){
  const area=tattooAreas.find(entry=>entry.id===tattooArea);
  return '<div class="tattoo-controls">'+segment(t('Miejsce tatuażu'),tattooArea,tattooAreas.map(({id,name})=>[id,t(name)]),'tattoo-area')+
    (area.slots.length>1?segment(t('Strona ciała'),tattooSlot,area.slots.map(slot=>[slot,t(tattooSlots[slot])]),'tattoo-slot'):'')+
    segment(t('Kolor tatuażu'),tattooColor,tattooInks.map(([id,name])=>[id,t(name)]),'tattoo-color')+'</div>';
}
function updateTattooPreview(){
  if(!tryOn?.slot) return;
  const item=items.find(entry=>entry.id===tryOn.id);
  tryOn=tattooFits(item,tattooSlot,tattooColor)?{id:tryOn.id,slot:tattooSlot,color:tattooColor}:null;
}
function skinRows(){
  const active=activeSkin();
  const level=skinLevel();
  const testing=data.skinPreview!==null;
  return '<div class="skin-test-controls"><p class="meta">'+t(testing?
    'Skórka testowa pojawia się też w profilu. XP i monety są naliczane według Twojego poziomu.':
    'Skórki odblokowują się wraz z poziomem.')+'</p>'+
    action(t(testing?'Zakończ test skórek':'Testuj skórki na poziomie 50'),'toggle-skin-preview','ghost')+'</div><div class="skin-list">'+skins.map(skin=>{
    const locked=skin.level>level;
    const selected=active===skin.id;
    const label=skinName(skin);
    const detail=skin.rank?' · '+rankTitle(skin):'';
    return '<button type="button" class="skin-row ranked" data-rank="'+skin.id+'" data-act="select-skin" data-key="'+skin.id+
      '" aria-pressed="'+selected+'" '+(locked?'disabled':'')+'><span class="skin-swatch" aria-hidden="true"></span>'+
      '<span><strong>'+label+'</strong><small>'+levelText(skin.level)+detail+'</small></span>'+
      '<span class="skin-state">'+(selected?icon('check')+' '+t('Aktywna'):locked?t('Zablokowana'):t('Wybierz'))+'</span></button>';
  }).join('')+'</div>';
}
function characterRows(){
  const selectedModel=activeModel().id;
  return models.map(model=>{
    const selected=model.id===selectedModel;
    return '<button type="button" class="outfit-row character-row" data-act="select-model" data-key="'+model.id+'" aria-pressed="'+selected+'">'+
      '<span class="outfit-thumb"><img src="'+model.root+'ubrania/przod-baza.webp" alt="" loading="lazy"></span>'+
      '<strong>'+t(model.name)+'</strong><span class="skin-state">'+(selected?icon('check')+' '+t('Aktywna'):t('Wybierz'))+'</span></button>';
  }).join('');
}
function wardrobeContent(coins){
  if(wardrobeTab==='postacie') return characterRows();
  if(wardrobeTab==='skorki') return skinRows();
  const shown=items.filter(item=>(wardrobeTab==='sklep'||data.wardrobe.owned.includes(item.id))&&
    (wardrobeFilter==='all'||item.category===wardrobeFilter)&&
    (wardrobeFilter!=='tattoos'||item.areas.includes(tattooArea)));
  const filters='<div class="wardrobe-filters">'+segment(t('Kategoria'),wardrobeFilter,wardrobeFilters.map(([id,name])=>[id,t(name)]),'wardrobe-filter')+'</div>';
  const rows=shown.length?shown.map(item=>item.category==='tattoos'?tattooRow(item,coins):wardrobeItem(item,coins)).join(''):
    '<p class="meta">'+t('Brak przedmiotów w tej kategorii.')+'</p>'+
    (wardrobeTab==='garderoba'?action(t('Przejdź do sklepu'),'open-shop','ghost full','bag'):'');
  return filters+(wardrobeFilter==='tattoos'?tattooControls():'')+rows;
}
function showGymBro(shine){
  const player=currentProgress();
  const preview=items.find(item=>item.id===tryOn?.id);
  return heading(t('Twój')+' <em>GymBro</em>',t('Personalizuj postać i odblokowuj ubranka za monety.'))+
    '<div class="stack"><section class="card card-pad buddy-card"><div class="card-head">'+
    segment(t('Widok GymBro'),avatarSide,[['przod',t('Przód')],['tyl',t('Tył')]],'avatar-side')+coinBalance(player.coins)+'</div>'+
    '<div class="buddy-stage" style="'+modelMotionStyle()+'">'+buddyModel(avatarSide,tryOn,shine)+
    (preview?'<span class="buddy-preview-tag">'+t('Przymiarka ·')+' '+t(preview.name)+'</span>':'')+'</div>'+skinTestBadge()+xpBar(player)+streakInfo(player)+
    '<p class="meta xp-note">'+XP_PER_DAY+' '+t('XP za pierwszy zapisany trening dnia, z mnożnikiem do ×1,5 za tygodnie z rzędu. Pierwszy nowy rekord dnia daje dodatkowe')+' '+XP_PER_RECORD+' '+t('XP. Za każdy awans dostajesz')+' '+COINS_PER_LEVEL+' '+t('monet')+'.</p></section>'+
    '<section class="card card-pad wardrobe-card"><h2>'+t('Personalizacja')+'</h2>'+
    '<div class="wardrobe-tabs">'+segment(t('Personalizacja'),wardrobeTab,[['garderoba',t('Garderoba')],['sklep',t('Sklep')],
      ['skorki',t('Skórki')],['postacie',t('Postacie')]],'wardrobe-tab')+'</div>'+wardrobeContent(player.coins)+
    '</section></div>';
}
const measurementFields=[
  ['weight','Waga','kg',1,700],['waist','Talia','cm',1,400],['chest','Klatka piersiowa','cm',1,400],
  ['hips','Biodra','cm',1,400],['arm','Ramię','cm',1,200],['thigh','Udo','cm',1,300],
];
const nicknameAction=()=>nickname?t('Zmień nick'):t('Ustaw nick');
function updateSettingsNickname(){
  const label=app.querySelector('#settings-nickname-label');
  if(!label) return;
  label.textContent=nickname;
  label.hidden=!nickname;
  app.querySelector('#settings-nickname-action').textContent=nicknameAction();
}
const profilePhotoAction=()=>t(profilePhoto?'Zmień zdjęcie profilowe':'Dodaj zdjęcie profilowe');
function updateSettingsPhoto(){
  const container=app.querySelector('#settings-photo-preview');
  if(!container) return;
  container.innerHTML=portrait(profilePhoto);
  app.querySelector('#settings-photo-action').textContent=profilePhotoAction();
}
function restPushSettings(){
  const {needsInstall,supported,ready,busy,error,subscribed,permission}=restPush.status(currentUser?.id);
  if(needsInstall) return '<p class="meta">'+t('Otwórz GymBro z ikony na ekranie początkowym, żeby włączyć powiadomienia.')+'</p>';
  if(!supported) return '<p class="meta">'+t('Ta przeglądarka nie obsługuje powiadomień GymBro.')+'</p>';
  if(!currentUser) return '<p class="meta">'+t('Zaloguj się, żeby włączyć powiadomienia na tym urządzeniu.')+'</p>';
  const status=error||(
    permission==='denied'?t('Zezwól GymBro na powiadomienia w ustawieniach systemu.'):
    subscribed?t('Powiadomienia włączone na tym urządzeniu.'):
    ready?t('Powiadomienia wyłączone na tym urządzeniu.'):t('Przygotowywanie powiadomień…')
  );
  return '<p class="meta" role="status">'+esc(t(status))+'</p>'+
    '<button class="btn ghost" type="button" data-act="'+(subscribed?'disable-rest-push':'enable-rest-push')+'"'+
    (busy||!subscribed&&(!ready||permission==='denied')?' disabled':'')+'>'+
    t(subscribed?'Wyłącz powiadomienia':'Włącz powiadomienia')+'</button>';
}
function updateRestPushSettings(){
  const controls=app.querySelector('#rest-push-settings');
  if(controls) controls.innerHTML=restPushSettings();
}
function showSettings(){
  const values=data.measurements;
  return heading(t('Ustawienia'),'')+'<div class="stack">'+
    '<section class="card card-pad stack"><h2>Konto w chmurze (Supabase)</h2>'+
    (currentUser?'<p class="meta">Zalogowano jako: <strong>'+esc(currentUser.email)+'</strong></p>'+action('Wyloguj się','auth-logout','ghost'):
    '<form id="auth-form" class="stack"><label class="field">E-mail<input type="email" name="email" required placeholder="twoj@email.pl"></label>'+
    '<label class="field">Hasło (min. 6 znaków)<input type="password" name="password" minlength="6" required placeholder="••••••"></label>'+
    '<div class="controls"><button type="submit" value="login" class="btn primary">Zaloguj się</button>'+
    '<button type="submit" value="register" class="btn ghost">Załóż konto</button></div></form>')+'</section>'+
    '<section class="card card-pad stack"><h2>'+t('Powiadomienia o przerwie')+'</h2>'+
    '<p class="meta">'+t('GymBro może dać znać o końcu przerwy także przy zablokowanym ekranie.')+'</p>'+
    '<div class="stack" id="rest-push-settings">'+restPushSettings()+'</div></section>'+
    '<section class="card card-pad stack settings-photo"><div class="settings-photo-header"><div id="settings-photo-preview">'+portrait(profilePhoto)+'</div>'+
    '<div><h2>'+t('Zdjęcie profilowe')+'</h2><p class="meta">'+t('Widoczne dla członków Twojego klanu i zaakceptowanych znajomych.')+'</p></div></div>'+
    action('<span id="settings-photo-action">'+profilePhotoAction()+'</span>','profile-photo','ghost','camera')+'</section>'+
    '<section class="card card-pad stack settings-nickname"><h2>'+t('Twój nick')+'</h2>'+
    '<p id="settings-nickname-label" '+(nickname?'':'hidden')+'>'+esc(nickname)+'</p>'+
    action('<span id="settings-nickname-action">'+nicknameAction()+'</span>','edit-nickname','ghost','edit')+'</section>'+
    '<section class="card card-pad stack"><h2>'+t('Język')+'</h2><label class="field">'+t('Język aplikacji')+'<select id="app-language">'+
    '<option value="pl" '+(data.language==='pl'?'selected':'')+'>Polski</option><option value="en" '+(data.language==='en'?'selected':'')+'>English</option></select></label></section>'+
    '<section class="card card-pad stack"><h2>'+t('Waga i wymiary')+'</h2>'+
    '<p class="meta">'+t('Pomiary zapisują się w tej przeglądarce. Wypełnij dowolne pola.')+'</p>'+
    '<form id="measurements-form" class="stack"><div class="measurement-grid">'+
    measurementFields.map(([id,label,unit,min,max])=>'<label class="field">'+t(label)+' ('+unit+')<input name="'+id+
      '" type="number" inputmode="decimal" min="'+min+'" max="'+max+'" step="any" value="'+esc(values[id]??'')+'"></label>').join('')+
    '</div><button type="submit" class="btn primary">'+t('Zapisz pomiary')+'</button></form></section></div>';
}
function showHome(){
  const date='<span class="date">'+icon('calendar')+new Intl.DateTimeFormat(uiLocale(),{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/Warsaw'}).format(Date.now())+'</span>';
  return heading(t('Twój')+' <em>'+t('trening.')+'</em>',t('Zapisuj treningi i zdobywaj poziomy ze swoim GymBro.'),date)+
    '<div class="stack">'+trainingCard()+homeBuddy()+weekCard()+
    '<section class="card card-list"><div class="card-head"><h3>'+t('Ostatni trening')+'</h3>'+link('Progress','historia','link','arrow')+'</div>'+
    sessionRows(data.sessions.slice(0,1))+'</section></div>';
}
function showMap(){
  const context=mapData();
  const {layout}=activeModel();
  const chips=Object.entries(layout[side].warstwy)
    .sort(([a],[b])=>intensity(context,b)-intensity(context,a))
    .map(([key,m])=>'<button type="button" class="muscle" data-act="muscle" data-key="'+key+'"><b>'+esc(t(m.nazwa))+'</b><span><i style="width:'+100*intensity(context,key)+'%"></i></span></button>').join('');
  const unknown=context.unknown.map(name=>'<button type="button" class="session-row" data-act="assign" data-key="'+esc(name)+'"><span class="row-main"><span class="name">'+esc(name)+'</span></span>'+icon('plus')+'</button>').join('');
  return heading(t('Heatmapa')+' <em>GymBro</em>',t('Sprawdź pracę mięśni na wybranym treningu lub z ostatnich 7 dni.'))+
    '<div class="stack"><section class="card card-pad">'+
    '<div class="card-head"><h3>'+t('Zakres')+'</h3></div><div class="controls">'+segment(t('Zakres danych'),mode,[['ostatni',t('Trening')],['tydzien',t('7 dni')]],'range')+'</div>'+
    (data.sessions.length&&mode==='ostatni'?'<label class="field" style="margin-top:12px">'+t('Wybierz trening')+'<select id="session-select">'+data.sessions.map(s=>
      '<option value="'+esc(s.id)+'" '+(s.id===context.latest?.id?'selected':'')+'>'+formatter.format(s.finished)+' · '+esc(s.name)+'</option>').join('')+'</select></label>':'')+
    '</section>'+mapCard(context)+'<section class="card card-pad"><h3>'+t('Partie mięśni')+'</h3><div class="muscle-list">'+chips+'</div></section>'+
    (unknown?'<section class="card card-list"><h3>'+t('Nieprzypisane ćwiczenia')+'</h3><p class="meta">'+t('Wybierz pracujące mięśnie, żeby uwzględnić ćwiczenie na mapie.')+'</p>'+unknown+'</section>':'')+
    '<section class="card card-pad"><label class="field">'+t('Liczba ważonych serii do pełnego podświetlenia')+'<input id="threshold" type="number" min="1" max="100" step="1" value="'+data.threshold+'"></label></section></div>';
}
function dateForKey(key){
  return new Date(key+'T12:00:00Z');
}
function progressCalendar(){
  const {month,day:selected}=progressState;
  const today=dayKey(Date.now());
  const {cells,trainingDays}=monthGrid(month,data.sessions);
  const label=monthFormatter.format(dateForKey(month+'-01'));
  return '<section class="card progress-calendar" aria-labelledby="calendar-month">'+
    '<div class="calendar-header"><div class="calendar-title"><span class="calendar-icon">'+icon('calendar')+'</span>'+
    '<div><h2 id="calendar-month">'+label+'</h2><p class="meta">'+t('Dni treningowe:')+' '+trainingDays+'</p></div></div>'+
    '<div class="calendar-controls"><button type="button" class="icon-btn month-prev" data-act="calendar-prev" aria-label="'+t('Poprzedni miesiąc')+'">'+icon('chevron')+'</button>'+
    '<button type="button" class="icon-btn" data-act="calendar-next" aria-label="'+t('Następny miesiąc')+'">'+icon('chevron')+'</button></div></div>'+
    '<div class="calendar-grid">'+weekdays.map(name=>'<span class="calendar-weekday">'+t(name)+'</span>').join('')+
    cells.map(cell=>{
      if(!cell) return '<span aria-hidden="true"></span>';
      const {key,count,day}=cell;
      const description=fullDayFormatter.format(dateForKey(key))+(count?t(', treningi:')+' '+count:'');
      return '<button type="button" data-act="calendar-day" data-key="'+key+'" class="calendar-day '+(count?'has-training':'')+'" aria-pressed="'+(key===selected)+'" '+
        (key===today?'aria-current="date" ':'')+'aria-label="'+description+'"><span>'+day+'</span><i aria-hidden="true"></i></button>';
    }).join('')+'</div>'+
    '<div class="calendar-footer"><span><i aria-hidden="true"></i> '+t('Dzień z treningiem')+'</span>'+action(t('Dziś'),'calendar-today','ghost')+'</div></section>';
}
function progressResults(){
  const sessions=filterSessions(data.sessions,progressState);
  if(sessions.length) return sessionRows(sessions);
  const message=progressState.query.trim()?t('Brak treningów pasujących do wyszukiwania.'):
    progressState.day?t('Tego dnia nie ma zapisanego treningu.'):t('Zapisane treningi pojawią się tutaj po zakończeniu pierwszej sesji.');
  return '<p class="empty">'+message+'</p>';
}
function showProgress(){
  return heading('Progress',t('Zobacz dni treningowe i wróć do zapisanych sesji.'))+
    '<div class="stack">'+liftCards(liftResults(data.sessions))+progressCalendar()+
    '<section class="card card-pad progress-history"><h2>'+(progressState.day?fullDayFormatter.format(dateForKey(progressState.day)):t('Ostatnie treningi'))+'</h2>'+
    (progressState.day?action(t('Pokaż wszystkie dni'),'calendar-clear','ghost'):'')+
    '<div class="progress-filters"><label class="field">'+t('Nazwa treningu')+'<input id="progress-query" type="search" placeholder="'+t('np. Push A')+'" value="'+esc(progressState.query)+'"></label>'+
    '<label class="field">'+t('Sortowanie')+'<select id="progress-order"><option value="newest" '+(progressState.order==='newest'?'selected':'')+'>'+t('Od najnowszych')+'</option><option value="oldest" '+
    (progressState.order==='oldest'?'selected':'')+'>'+t('Od najstarszych')+'</option></select></label></div>'+
    '<div id="progress-results" aria-live="polite">'+progressResults()+'</div></section></div>';
}
function setResult({kg,reps}){
  return formatKg.format(Number(String(kg).replace(',','.')))+' kg × '+esc(reps)+' '+t('powt.');
}
function openExerciseHistory(label){
  const history=exerciseHistory(data.sessions,label);
  const content=history.length?history.map(({name,finished,sets})=>{
    const day=dayKey(finished);
    return '<article class="card card-pad logged-sets"><time class="meta" datetime="'+day+'">'+fullDayFormatter.format(dateForKey(day))+'</time>'+
      '<h3>'+esc(name)+'</h3><ol>'+sets.map(set=>'<li><span>'+t('Seria')+' '+set.number+'</span><strong>'+setResult(set)+'</strong></li>').join('')+
      '</ol></article>';
  }).join(''):'<p class="empty">'+t('To ćwiczenie nie ma jeszcze zapisanych serii.')+'</p>';
  openModal(esc(exerciseLabel(label)),'<p class="meta">'+t('Historia ćwiczenia')+'</p><div class="stack">'+content+'</div>');
  dialog.scrollTop=0;
}
function setRow(set,i,j,previous){
  const ref=' data-ex="'+i+'" data-set="'+j+'"';
  const number=j+1;
  return '<div class="set-row '+(set.done?'checked':'')+'"><div class="set-card-head"><strong>'+t('Seria')+' '+number+'</strong><div class="set-card-actions">'+
    '<button type="button" class="icon-btn" data-act="check"'+ref+' aria-pressed="'+set.done+'" aria-label="'+(set.done?t('Cofnij ukończenie'):t('Ukończ serię'))+' '+(j+1)+'">'+icon('check')+'</button>'+
    '<button type="button" class="icon-btn del" data-act="remove-set"'+ref+' aria-label="'+t('Usuń serię')+' '+number+'">'+icon('x')+'</button></div></div>'+
    (previous?'<p class="meta previous-set">'+t('Poprzednio')+' <strong>'+setResult(previous)+'</strong></p>':'')+
    '<div class="set-card-fields"><label class="field">'+t('Ciężar (kg)')+
    '<input type="text" inputmode="decimal" maxlength="8" placeholder="0" data-field="kg"'+ref+' value="'+esc(set.kg)+'" aria-label="'+t('Ciężar w kg, seria')+' '+number+'"></label>'+
    '<label class="field">'+t('Powtórzenia')+'<input type="text" inputmode="numeric" maxlength="4" placeholder="10" data-field="reps"'+ref+
    ' value="'+esc(set.reps)+'" aria-label="'+t('Powtórzenia, seria')+' '+number+'"></label></div></div>';
}
function techniqueButton(label){
  return '<button class="technique-button" type="button" data-act="technique" data-key="'+esc(label)+'" aria-label="'+t('Technika:')+' '+esc(exerciseLabel(label))+'">?</button>';
}
function technique(label){
  const key=exerciseKey(label);
  const item=[...catalog,...data.ownExercises].find(entry=>exerciseKey(entry.label)===key);
  const weights=weightsFor(label,data.custom);
  const targets=Object.entries(weights??{}).sort(([,a],[,b])=>b-a).map(([muscle])=>t(muscles[muscle])).join(', ');
  openModal(esc(exerciseLabel(label)),'<div class="catalog-technique"><h3>'+t('Technika')+'</h3><p>'+esc(exerciseTechnique(item)||t('Brak opisu techniki dla tego własnego ćwiczenia.'))+'</p>'+
    (targets?'<p class="meta">'+t('Partie na heatmapie ·')+' '+esc(targets)+'</p>':'')+'</div>'+action(t('Gotowe'),'close','ghost full'));
}
function repTarget(exercise){
  if(!exercise.repMin) return '';
  const reps=exercise.repMin===exercise.repMax?exercise.repMin:exercise.repMin+'–'+exercise.repMax;
  return '<p class="rep-target">'+t('Cel:')+' '+esc(reps)+' '+t('powt. na serię')+'</p>';
}
function exerciseCard(exercise,i){
  const label=esc(exerciseLabel(exercise.label));
  const previous=exerciseHistory(data.sessions,exercise.label)[0]?.sets??[];
  const previousByNumber=new Map(previous.map(set=>[set.number,set]));
  return '<section class="card exercise"><div class="card-head"><div><div class="exercise-title"><h3>'+
    '<button type="button" class="exercise-history-trigger" data-act="exercise-history" data-ex="'+i+'" aria-haspopup="dialog" aria-label="'+label+' · '+t('Historia ćwiczenia')+'">'+
    label+icon('calendar')+'</button></h3>'+techniqueButton(exercise.label)+'</div>'+
    '<p class="meta">'+(weightsFor(exercise.label,data.custom)?t('Serii:')+' '+exercise.sets.filter(s=>s.done).length:t('Bez przypisanej partii mięśni'))+'</p></div>'+
    '<button type="button" class="btn ghost" data-act="remove-exercise" data-ex="'+i+'" aria-label="'+t('Usuń ćwiczenie')+' '+esc(exerciseLabel(exercise.label))+'">'+icon('x')+'</button></div>'+restSetting(exercise,i,'workout')+repTarget(exercise)+
    '<div class="set-list">'+exercise.sets.map((s,j)=>setRow(s,i,j,previousByNumber.get(j+1))).join('')+'</div>'+
    '<button type="button" class="btn ghost add-set" data-act="add-set" data-ex="'+i+'">'+icon('plus')+' '+t('Dodaj serię')+'</button></section>';
}
function planRows(){
  if(!data.savedPlans.length) return '<p class="meta">'+t('Zapisz własną listę ćwiczeń, żeby uruchamiać ją na kolejnych treningach.')+'</p>';
  return data.savedPlans.map(plan=>'<div class="plan-row"><button type="button" data-act="start-plan" data-key="'+esc(plan.id)+'" class="session-row" aria-label="'+t('Rozpocznij plan')+' '+esc(plan.name)+'">'+
    '<span class="row-icon">'+icon('play')+'</span><span class="row-main"><span class="name">'+esc(plan.name)+'</span><span class="desc">'+t('Ćwiczenia:')+' '+plan.exercises.length+'</span></span>'+icon('chevron')+'</button>'+
    '<button type="button" class="btn ghost" data-act="edit-plan" data-key="'+esc(plan.id)+'" aria-label="'+t('Edytuj plan')+' '+esc(plan.name)+'">'+icon('edit')+'</button></div>').join('');
}
function planExercise(item,i){
  const label=exerciseLabel(item.label);
  return '<div class="plan-exercise"><div class="plan-exercise-head"><div class="exercise-title"><span>'+esc(label)+'</span>'+techniqueButton(item.label)+'</div>'+
    '<button type="button" class="btn ghost" data-act="plan-remove-exercise" data-ex="'+i+'" aria-label="'+t('Usuń')+' '+esc(label)+'">'+icon('x')+'</button></div>'+
    '<div class="plan-exercise-inputs"><label class="field">'+t('Serie')+'<input type="number" inputmode="numeric" min="1" max="'+MAX_PLAN_SETS+'" required data-plan-field="setCount" data-ex="'+i+'" value="'+esc(item.setCount)+'" aria-label="Serie: '+esc(label)+'"></label>'+
    '<fieldset class="rep-range"><legend>'+t('Powtórzenia na serię')+'</legend><div>'+
    '<input type="number" inputmode="numeric" min="1" max="'+MAX_PLAN_REPS+'" data-plan-field="repMin" data-ex="'+i+'" value="'+esc(item.repMin??'')+'" aria-label="'+t('Powtórzenia od:')+' '+esc(label)+'" placeholder="Od">'+
    '<span aria-hidden="true">–</span><input type="number" inputmode="numeric" min="1" max="'+MAX_PLAN_REPS+'" data-plan-field="repMax" data-ex="'+i+'" value="'+esc(item.repMax??'')+'" aria-label="'+t('Powtórzenia do:')+' '+esc(label)+'" placeholder="Do"></div></fieldset></div>'+
    restSetting(item,i,'plan')+'</div>';
}
function showPlanEditor(){
  const {id,name,exercises,quick}=planEdit;
  return heading(quick?t('Ustaw trening'):id?t('Edytuj plan'):t('Nowy plan'),t('Ustaw serie i opcjonalny zakres powtórzeń dla każdego ćwiczenia.'))+
    '<form id="plan-form" class="stack"><section class="card card-pad stack">'+
    '<label class="field">'+t('Nazwa planu')+'<input name="label" value="'+esc(name)+'" maxlength="60" required placeholder="np. Push A"></label>'+
    exercises.map(planExercise).join('')+
    action(t('Dodaj ćwiczenia'),'plan-picker','ghost full','plus')+'</section>'+
    '<button class="btn primary full" type="submit" value="'+(quick?'start':'save')+'">'+icon(quick?'play':'check')+(quick?' '+t('Rozpocznij trening'):' '+t('Zapisz plan'))+'</button>'+
    (quick?'<button class="btn ghost full" type="submit" value="save">'+t('Zapisz jako własny plan')+'</button>':'')+
    '<div class="controls">'+action(t('Anuluj'),'cancel-plan')+(id?action(t('Usuń plan'),'delete-plan','danger'):'')+'</div></form>';
}
function showTraining(){
  if(planEdit) return showPlanEditor();
  const draft=data.draft;
  if(!draft) return heading(t('Trening'),t('Użyj gotowego planu albo ułóż własną sesję.'))+
    '<div class="stack">'+action(t('Rozpocznij nowy trening'),'custom-start','primary full','plus')+
    '<section class="card card-pad stack"><h2>'+t('Moje plany')+'</h2>'+planRows()+action(t('Utwórz plan'),'new-plan','ghost full','plus')+'</section>'+
    '<section class="card card-pad stack"><h2>'+t('Gotowe plany')+'</h2><div class="templates">'+Object.entries(plans).map(([name,exercises])=>
      '<div class="template-group"><button type="button" class="template" data-act="start" data-key="'+name+'">'+icon('dumbbell')+'<b>'+name+'</b><span class="meta">'+exercises.length+' '+t('ćwiczenia')+'</span></button>'+
      '<button type="button" class="btn ghost template-config" data-act="configure-template" data-key="'+name+'" aria-label="'+t('Ustaw serie i powtórzenia:')+' '+name+'">'+icon('edit')+' '+t('Ustaw')+'</button></div>').join('')+'</div></section></div>';
  const count=completedCount(draft);
  return '<div class="training-main">'+heading(esc(draft.name),t('Wpisz ciężar i powtórzenia, potem odhacz wykonaną serię.'),action(t('Zmień nazwę'),'rename-draft','ghost rename','edit'))+'<div class="stack">'+
    '<section class="card card-pad session-hdr"><div class="card-head"><div><span class="eyebrow">'+t('Czas treningu')+'</span><div class="workout-clock" aria-label="'+t('Czas treningu')+'" data-elapsed></div><p class="meta">'+t('Ukończone serie:')+' '+count+'</p></div>'+
    '<button class="btn primary" type="button" data-act="finish" '+(!count?'disabled':'')+'>'+icon('check')+' '+t('Zakończ')+'</button></div>'+workoutPhotoImage()+workoutPhotoButton(draft.id)+'</section>'+
    draft.exercises.map(exerciseCard).join('')+
    action(t('Dodaj ćwiczenia'),'workout-picker','primary full','plus')+
    (draft.exercises.length?action(t('Zapisz jako plan'),'plan-from-workout','ghost full'):'')+
    action(t('Porzuć trening'),'discard','danger')+'</div></div>';
}

function liftCards(results={}){
  return '<section class="card card-pad lifts-panel"><h2>'+t('Rekordy siłowe')+'</h2><p class="meta">'+t('1RM · Najcięższy zaliczony ciężar')+'</p>'+
    '<div class="lift-grid">'+lifts.map(lift=>{
      const result=results?.[lift.id];
      return '<div class="lift-tile"><h3>'+t(lift.display)+'</h3><strong>'+
        (Number.isFinite(result?.kg)?formatKg.format(result.kg)+' <small>kg</small>':'—')+'</strong></div>';
    }).join('')+'</div></section>';
}
function profileAvatar(person,own=false){
  if(own) return buddyModel('przod');
  return buddyModel('przod',null,null,{worn:person.worn??[],tattoos:person.tattoos??{},skin:person.previewSkin??person.skin??'default',model:modelFor(person.model)});
}
function clanLeaderBadge(id){
  return id===clanState.clan?.ownerId?'<span class="clan-leader-badge">'+t('Lider')+'</span>':'';
}
function clanMembers(){
  const members=clanState.members;
  const count=member=>member.week===clanState.week?member.workouts??0:0;
  return '<p class="meta clan-count">'+t('Treningi klanu w tym tygodniu:')+' <strong>'+members.reduce((sum,member)=>sum+count(member),0)+'</strong></p>'+
    '<div class="clan-members">'+members.map(member=>
      '<button type="button" class="session-row" data-act="clan-member" data-key="'+esc(member.id)+'">'+
      portrait(member.photo,profileAvatar(member,member.id===clanState.self),'clan-avatar')+
      '<span class="row-main"><span class="name">'+esc(member.nick)+(member.id===clanState.self?' '+t('· Ty'):'')+clanLeaderBadge(member.id)+'</span>'+
      '<span class="desc">'+t('Poziom')+' '+(member.level??1)+' '+t('· Treningi w tym tygodniu:')+' '+count(member)+'</span>'+
      '<span class="desc clan-tenure">'+tenureText(member.tenure)+'</span></span>'+icon('chevron')+'</button>'
    ).join('')+'</div>';
}
function clanMessages(fresh=new Set()){
  if(!clanState.messages.length) return '<p class="empty">'+t('Tutaj pojawią się wiadomości i aktywności klanu.')+'</p>';
  const photos=new Map(clanState.members.map(member=>[member.id,member.photo]));
  return clanState.messages.map(message=>{
    const sender=esc(message.nick);
    const timestamp=clanTime.format(message.sent_at);
    const photo=photos.get(message.sender);
    const meta='<div class="clan-message-meta">'+(photo?portrait(photo,icon('person'),'chat-portrait'):'')+'<b>'+sender+'</b><time datetime="'+new Date(message.sent_at).toISOString()+'">'+timestamp+'</time></div>';
    if(message.type==='chat') return '<article class="clan-message'+(message.sender===clanState.self?' mine':'')+'">'+meta+'<p>'+esc(message.body)+'</p></article>';
    const item=message.body;
    if(item.kind==='pr') return '<article class="clan-message clan-activity">'+meta+
      '<div class="clan-pr'+(fresh.has(message.seq)?' fresh':'')+'">'+recordContent(item.label,item.kg,item.previous)+'</div>'+
      '<button type="button" class="clan-replay" data-act="clan-replay" data-key="'+message.seq+'">'+icon('play')+' '+t('Odtwórz animację')+'</button></article>';
    if(item.kind==='tenure') return '<article class="clan-message clan-activity tenure-event">'+meta+
      '<p class="clan-activity-text">'+icon('calendar')+'<span><strong>'+sender+'</strong> '+t('osiąga')+' '+tenureText(item.months)+'.</span></p></article>';
    const info=item.kind==='level'?t('Awans na poziom')+' <strong>'+item.level+'</strong>':
      t('Trening')+' <strong>'+esc(item.label)+'</strong> '+t('ukończony')+(item.xp?' · +'+item.xp+' XP':'');
    const workoutLink=message.workoutAvailable?'<button type="button" class="btn ghost clan-workout-link" data-act="shared-workout" data-source="clan-message" data-key="'+message.seq+'">'+
      t('Zobacz trening')+icon('chevron')+'</button>':'';
    return '<article class="clan-message clan-activity">'+meta+'<p class="clan-activity-text">'+icon(item.kind==='level'?'bolt':'dumbbell')+info+'</p>'+workoutLink+'</article>';
  }).join('');
}
function showClan(){
  if(!clanState) return '<section class="card card-pad stack"><p id="clan-status" role="status">'+esc(clanError||t('Ładowanie klanu…'))+'</p>'+
    (clanError?action(t('Spróbuj ponownie'),'clan-retry','ghost'):'')+'</section>';
  if(!clanState.clan){
    const create=clanMode==='create';
    return '<section class="card card-pad stack">'+segment(t('Dołącz lub utwórz klan'),clanMode,[['create',t('Utwórz klan')],['join',t('Dołącz przez kod')]],'clan-mode')+
      '<div data-clan-nick '+(nickname?'hidden':'')+'>'+action(t('Ustaw nick'),'edit-nickname','ghost','edit')+'</div>'+
      '<form id="clan-start" class="stack">'+
      (create?'<label class="field">'+t('Nazwa klanu')+'<input name="name" required minlength="2" maxlength="40" placeholder="'+t('np. Żelazne Słonie')+'"></label>'+
      '<label class="field">'+t('Tag (3–4 znaki)')+'<input name="tag" class="clan-code" required minlength="3" maxlength="4" pattern="[A-Za-z0-9]{3,4}" placeholder="'+t('np. GYM')+'"></label>':
      '<label class="field">'+t('Kod zaproszenia')+'<input name="code" class="clan-code" required minlength="6" maxlength="6" pattern="[A-Za-z0-9]{6}" placeholder="'+t('6 znaków')+'"></label>')+
      '<p class="meta">'+t('Członkowie zobaczą Twój profil i szczegóły pięciu ostatnich treningów. Zapis treningu i nowe PR-y pojawią się na czacie klanu.')+'</p>'+
      '<p class="form-error" id="clan-start-error" role="alert" hidden></p><button class="btn primary" type="submit"'+(!nickname?' disabled':'')+'>'+(create?t('Utwórz klan'):t('Dołącz do klanu'))+'</button></form></section>';
  }
  const {tag,name,code}=clanState.clan;
  return '<div class="stack"><section class="card card-pad clan-invite">'+
    '<div><h2><em>['+esc(tag)+']</em> '+esc(name)+'</h2><span class="meta">'+t('Kod zaproszenia')+'</span><strong>'+esc(code)+'</strong></div>'+action(t('Kopiuj'),'clan-copy','ghost')+'</section>'+
    '<details class="card card-pad clan-roster"><summary><strong>'+t('Członkowie')+'</strong><span class="clan-roster-count" id="clan-member-count">'+clanState.members.length+'</span>'+icon('chevron')+'</summary>'+
    '<div id="clan-member-list">'+clanMembers()+'</div></details>'+
    '<section class="card card-pad clan-chat"><h2>'+t('Czat klanu')+'</h2><p id="clan-status" class="form-error" role="status" '+(!clanError?'hidden':'')+'>'+esc(clanError)+'</p>'+
    '<div id="clan-feed" class="clan-feed" role="log" aria-label="'+t('Wiadomości i aktywności klanu')+'">'+clanMessages()+'</div>'+
    '<form id="clan-chat" class="clan-compose"><label class="field">'+t('Wiadomość')+'<input name="message" maxlength="500" required autocomplete="off" placeholder="'+t('Napisz do klanu')+'"></label>'+
    '<button class="btn primary" type="submit">'+t('Wyślij')+'</button></form></section>'+
    action(t('Opuść klan'),'clan-leave','ghost')+'</div>';
}
function openClanMember(id){
  const member=clanState?.members?.find(entry=>entry.id===id);
  if(!member) return;
  const actions=canRemoveClanMember(id)?friendButton('clan-confirm-kick',id,t('Usuń z klanu'),'danger'):'';
  openMemberProfile(member,'clan',' · '+tenureText(member.tenure)+' '+t('· Treningi w tym tygodniu:')+' '+(member.week===clanState.week?member.workouts??0:0),actions);
}
function canRemoveClanMember(id){
  const clan=clanState?.clan;
  return Boolean(clan&&clan.ownerId===clanState.self&&id!==clanState.self&&clanState.members.some(member=>member.id===id));
}
function confirmClanRemoval(id){
  if(!canRemoveClanMember(id)) return;
  const member=clanState.members.find(entry=>entry.id===id);
  const message=t('Czy na pewno chcesz usunąć z klanu osobę o nicku {nick}?').replace('{nick}',()=>esc(member.nick));
  openModal(t('Usunąć członka klanu?'),'<p class="meta">'+message+'</p>'+
    '<p id="clan-kick-error" class="form-error" role="alert" hidden></p>'+
    '<div class="controls">'+friendButton('clan-member',id,t('Wróć'))+
    friendButton('clan-kick',id,t('Usuń z klanu'),'danger')+'</div>');
}
async function removeClanMember(id,button){
  if(button.disabled||!canRemoveClanMember(id)) return;
  const clanId=clanState.clan.id;
  const errorBox=dialog.querySelector('#clan-kick-error');
  button.disabled=true;
  errorBox.hidden=true;
  clanVersion++;
  try{
    const {removed,snapshot}=await clanRequest({action:'kick',clanId,memberId:id});
    if(dialog.open&&dialog.contains(button)) dialog.close();
    if(clanState?.clan?.id!==clanId) return;
    clanVersion++;
    applyClan(snapshot);
    toast(t(removed?'Usunięto członka klanu.':'Ta osoba nie jest już w klanie.'));
  }catch(error){
    errorBox.textContent=error.message;
    errorBox.hidden=false;
  }finally{
    button.disabled=false;
  }
}
function setClanStatus(message){
  clanError=message;
  const status=app.querySelector('#clan-status');
  if(status&&clanState?.clan){
    status.textContent=message;
    status.hidden=!message;
  }else if(clanVisible()&&!clanState){
    render();
  }
}
function applyClan(snapshot,scrollToEnd=false){
  const previous=clanState;
  clanState=snapshot;
  const clanId=snapshot.clan?.id??null;
  if(data.clanLink!==clanId){
    data.clanLink=clanId;
    data.clanOutbox=data.clanOutbox.filter(event=>event.clanId===clanId);
    lastProfile='';
    pendingChat=null;
    save();
  }
  if(!clanVisible()) return;
  if(!previous||(previous.clan?.id??null)!==clanId){
    if(previous?.clan&&dialog.open) dialog.close();
    render();
    return;
  }
  if(!clanId) return;
  const members=app.querySelector('#clan-member-list');
  if(members&&(previous.week!==snapshot.week||JSON.stringify(previous.members)!==JSON.stringify(snapshot.members))){
    app.querySelector('#clan-member-count').textContent=snapshot.members.length;
    members.innerHTML=clanMembers();
  }
  const feed=app.querySelector('#clan-feed');
  const photosChanged=previous.members.length!==snapshot.members.length||previous.members.some((member,i)=>
    member.id!==snapshot.members[i]?.id||member.photo!==snapshot.members[i]?.photo);
  if(!feed||!photosChanged&&JSON.stringify(previous.messages)===JSON.stringify(snapshot.messages)) return;
  const atEnd=feed.scrollHeight-feed.scrollTop-feed.clientHeight<40;
  const old=new Set(previous.messages.map(message=>message.seq));
  const fresh=new Set(snapshot.messages.filter(message=>!old.has(message.seq)).map(message=>message.seq));
  feed.innerHTML=clanMessages(fresh);
  if(atEnd||scrollToEnd) feed.scrollTop=feed.scrollHeight;
}
async function syncClan(){
  const clanId=clanState?.clan?.id;
  if(!clanId) return false;
  const profile=clanProfile(data.sessions,data.wardrobe,currentProgress(),data.appearanceAt,data.skinPreview);
  const version=JSON.stringify(profile);
  const events=data.clanOutbox.filter(event=>event.clanId===clanId).slice(0,24);
  if(lastProfile===version&&!events.length) return false;
  const recent=new Set(profile.recent.map(workout=>workout.id));
  const payload=events.map(event=>{
    if(event.body.kind!=='workout') return event;
    const id=event.id.slice(0,-8);
    const workout=!recent.has(id)&&data.sessions.find(session=>session.id===id);
    return workout?{...event,workout:workoutRecord(workout)}:event;
  });
  await clanRequest({action:'sync',clanId,profile,events:payload});
  lastProfile=version;
  if(events.length){
    const sent=new Set(events.map(event=>event.id));
    data.clanOutbox=data.clanOutbox.filter(event=>event.clanId!==clanId||!sent.has(event.id));
    save();
  }
  if(data.clanOutbox.some(event=>event.clanId===clanId)) syncAgain=true;
  return true;
}
async function refreshClan(){
  if(clanBusy){syncAgain=true;return;}
  clanBusy=true;
  const version=clanVersion;
  try{
    const snapshot=await clanRequest();
    if(version!==clanVersion) return;
    clanError='';
    applyClan(snapshot);
    if(await syncClan()){
      if(clanVisible()){
        const refreshed=await clanRequest();
        if(version===clanVersion) applyClan(refreshed);
      }
    }
    if(clanVisible()) setClanStatus('');
  }catch(error){
    if(clanVisible()) setClanStatus(error.message);
  }finally{
    clanBusy=false;
    if(syncAgain){
      syncAgain=false;
      setTimeout(refreshClan,0);
    }
  }
}
async function submitClanStart(form,fields){
  const button=form.querySelector('button[type="submit"]');
  const errorBox=form.querySelector('#clan-start-error');
  button.disabled=true;
  form.dataset.submitting='true';
  clanVersion++;
  errorBox.hidden=true;
  try{
    const snapshot=await clanRequest({action:clanMode,...Object.fromEntries(fields)});
    applyClan(snapshot);
    refreshClan();
  }catch(error){
    errorBox.textContent=error.message;
    errorBox.hidden=false;
  }finally{
    delete form.dataset.submitting;
    updateClanStartNickname();
  }
}
async function sendClanChat(form,fields){
  const field=form.elements.message;
  const message=fields.get('message').trim();
  const button=form.querySelector('button[type="submit"]');
  if(!message||button.disabled) return;
  button.disabled=true;
  clanVersion++;
  if(pendingChat?.message!==message) pendingChat={id:newId(),message};
  try{
    const snapshot=await clanRequest({action:'chat',clanId:data.clanLink,...pendingChat});
    pendingChat=null;
    applyClan(snapshot,true);
    if(field.value.trim()===message) form.reset();
    setClanStatus('');
  }catch(error){setClanStatus(error.message);}
  finally{button.disabled=false;}
}
async function leaveClan(){
  clanVersion++;
  if(dialog.open) dialog.close();
  try{
    applyClan(await clanRequest({action:'leave',clanId:data.clanLink}));
  }catch(error){setClanStatus(error.message);}
}

function friendButton(act,id,label,styles='ghost'){
  return '<button class="btn '+styles+'" type="button" data-act="'+act+'" data-key="'+esc(id)+'">'+label+'</button>';
}
function friendRows(){
  const {friends,incoming,outgoing}=friendsState;
  const requests=(list,received)=>list.map(person=>'<div class="friend-request"><strong>'+esc(person.nick)+'</strong><div class="controls">'+
    (received?friendButton('friend-accept',person.id,t('Akceptuj'),'primary')+friendButton('friend-decline',person.id,t('Odrzuć')):
      friendButton('friend-remove',person.id,t('Anuluj')))+'</div></div>').join('');
  return (incoming.length?'<section class="card card-pad stack"><h2>'+t('Otrzymane zaproszenia')+'</h2>'+requests(incoming,true)+'</section>':'')+
    (outgoing.length?'<section class="card card-pad stack"><h2>'+t('Wysłane zaproszenia')+'</h2>'+requests(outgoing,false)+'</section>':'')+
    '<section class="card card-pad stack"><h2>'+t('Znajomi')+'</h2>'+(friends.length?'<div class="clan-members">'+friends.map(person=>
      '<button type="button" class="session-row" data-act="friend-profile" data-key="'+esc(person.id)+'">'+
      portrait(person.photo,profileAvatar(person),'clan-avatar')+
      '<span class="row-main"><span class="name">'+esc(person.nick)+'</span><span class="desc">'+t('Poziom')+' '+(person.level??1)+'</span></span>'+icon('chevron')+'</button>'
    ).join('')+'</div>':'<p class="empty">'+t('Po zaakceptowaniu zaproszenia znajomy pojawi się tutaj.')+'</p>')+'</section>';
}
function showFriends(){
  if(!friendsState) return '<section class="card card-pad stack"><p role="status">'+esc(friendsError||t('Ładowanie znajomych…'))+'</p>'+
    (friendsError?action(t('Spróbuj ponownie'),'friends-refresh','ghost'):'')+'</section>';
  if(!friendsState.self) return '<section class="card card-pad stack"><h2>'+t('Profil znajomych')+'</h2>'+
    '<form id="friends-setup" class="stack">'+
    '<p class="meta">'+t('Po zaakceptowaniu zaproszenia znajomi zobaczą Twój strój, rekordy i szczegóły maksymalnie pięciu ostatnich treningów.')+'</p>'+
    '<p id="friends-status" class="form-error" role="status" '+(!friendsError?'hidden':'')+'>'+esc(friendsError)+'</p>'+
    (nickname?'<button class="btn primary" type="submit">'+t('Utwórz profil')+'</button>':link(t('Ustaw nick w ustawieniach'),'ustawienia','btn ghost'))+'</form></section>';
  return '<div class="stack"><section class="card card-pad clan-invite"><div><span class="meta">'+t('Twój kod znajomego')+'</span>'+
    '<strong>'+esc(friendsState.self.code)+'</strong></div>'+action(t('Kopiuj'),'friend-copy','ghost')+'</section>'+
    (data.friendsId!==friendsState.self.id?'<section class="card card-pad stack"><p class="meta">'+t('Połącz treningi zapisane w tej przeglądarce ze swoim profilem znajomych.')+'</p>'+
      action(t('Połącz dane z tego urządzenia'),'friend-link','ghost')+'</section>':'')+
    '<section class="card card-pad stack"><h2>'+t('Dodaj znajomego')+'</h2><form id="friends-invite" class="clan-compose">'+
    '<label class="field">'+t('Kod znajomego')+'<input name="code" class="clan-code" required minlength="8" maxlength="12" autocomplete="off" placeholder="'+t('Wpisz kod')+'"></label>'+
    '<button class="btn primary" type="submit">'+t('Zaproś')+'</button></form><p id="friends-status" class="form-error" role="status" '+(!friendsError?'hidden':'')+'>'+esc(friendsError)+'</p></section>'+
    '<div class="stack" id="friends-list">'+friendRows()+'</div></div>';
}
function showSocial(){
  return heading(t('Społeczność'),t('Trenuj ze znajomymi i śledź aktywność klanu.'))+
    '<div class="stack"><div class="social-tabs">'+
    segment(t('Sekcja społeczności'),socialTab,[['klan',t('Klan')],['friends',t('Znajomi')]],'social-tab')+'</div>'+
    (socialTab==='klan'?showClan():showFriends())+'</div>';
}
function openMemberProfile(person,source,detail='',actions=''){
  const recent=person.recent??[];
  const own=source==='clan'&&person.id===clanState.self;
  const preview=own?data.skinPreview:person.previewSkin;
  openModal(esc(person.nick),'<div class="profile-identity">'+portrait(own?profilePhoto:person.photo)+'<p class="meta">'+t('Poziom')+' '+(person.level??1)+detail+(source==='clan'?clanLeaderBadge(person.id):'')+'</p></div>'+
    '<div class="buddy-stage clan-profile-stage" style="'+modelMotionStyle()+'">'+profileAvatar(person,own)+'</div>'+
    (preview?'<p class="skin-test-badge">'+t('Skórka testowa')+'</p>':'')+
    liftCards(person.best)+'<section class="card card-pad profile-training"><h2>'+t('Ostatnie treningi')+'</h2>'+
    (recent.length?'<ul>'+recent.map(workout=>{
      const title='<span class="row-main"><strong>'+esc(workout.name)+'</strong><span class="desc">'+formatter.format(workout.finished)+' '+t('· Serie:')+' '+workout.sets+'</span></span>';
      const photo=workout.photo?'<img class="workout-photo-thumb" data-shared-photo src="'+sharedWorkoutPhotoUrl(workout.photo)+'" alt="" loading="lazy" decoding="async">':'';
      if(!workout.hasDetails) return '<li class="profile-workout-summary">'+photo+title+'<small class="meta">'+t('Brak szczegółów')+'</small></li>';
      return '<li><button class="session-row" type="button" data-act="shared-workout" data-source="'+source+'" data-peer="'+esc(person.id)+'" data-key="'+esc(workout.id)+'">'+photo+title+icon('chevron')+'</button></li>';
    }).join('')+'</ul>':'<p class="empty">'+t('Brak udostępnionych treningów.')+'</p>')+
    '<p class="form-error" id="shared-workout-error" role="alert" hidden></p></section>'+actions+action(t('Gotowe'),'close','ghost full'));
}
function openFriend(id){
  const friend=friendsState?.friends.find(person=>person.id===id);
  if(friend) openMemberProfile(friend,'friends','',friendButton('friend-confirm-remove',id,t('Usuń ze znajomych'),'danger'));
}
async function openSharedWorkout(button){
  const {source,peer,key}=button.dataset;
  const fromFeed=source==='clan-message';
  const isClan=source!=='friends';
  const clanId=isClan?clanState?.clan?.id:null;
  if(isClan&&!clanId) return;
  const status=dialog.querySelector('#shared-workout-error');
  if(status) status.hidden=true;
  const isCurrent=()=>fromFeed?clanVisible()&&clanState?.clan?.id===clanId&&!dialog.open:dialog.open&&dialog.contains(button);
  button.disabled=true;
  try{
    const request=fromFeed?{action:'workout-message',seq:Number(key)}:{action:'workout',peer,workout:key};
    const workout=await (isClan?clanRequest({...request,clanId}):friendsRequest(request));
    if(!isCurrent()) return;
    const duration=workout.started?' '+t('· Czas:')+' '+timeLabel(elapsedSeconds(workout.started,workout.finished),true):'';
    const lines=workout.exercises.map(exercise=>'<section class="card card-pad logged-sets"><h3>'+esc(exerciseLabel(exercise.label))+'</h3><ol>'+
      exercise.sets.map(([kg,reps],i)=>'<li><span>'+t('Seria')+' '+(i+1)+'</span><strong>'+formatKg.format(kg)+' kg × '+reps+'</strong></li>').join('')+'</ol></section>').join('');
    const back=fromFeed?action(t('Wróć do klanu'),'close','ghost full'):
      friendButton(isClan?'clan-member':'friend-profile',peer,t('Wróć do profilu'));
    openModal(esc(workout.name),'<p class="meta">'+formatter.format(workout.finished)+' '+t('· Serie:')+' '+workout.sets+duration+'</p>'+
      (workout.photo?workoutPhotoImage(workout.photo):'')+lines+back);
    dialog.scrollTop=0;
    dialog.querySelector('button').focus({preventScroll:true});
  }catch(error){
    if(!isCurrent()) return;
    if(status){
      status.textContent=error.message;
      status.hidden=false;
    }else toast(error.message);
  }finally{button.disabled=false;}
}
function friendsVisible(){return route()==='klan'&&socialTab==='friends';}
function clanVisible(){return route()==='klan'&&socialTab==='klan';}
function setFriendsStatus(message){
  friendsError=message;
  const status=app.querySelector('#friends-status');
  if(status){status.textContent=message;status.hidden=!message;}
  else if(friendsVisible()&&!friendsState) render();
}
function applyFriends(snapshot){
  const previous=friendsState;
  friendsState=snapshot;
  if(!friendsVisible()) return;
  if(!previous||previous.self?.id!==snapshot.self?.id){render();return;}
  const list=app.querySelector('#friends-list');
  if(list&&JSON.stringify([previous.friends,previous.incoming,previous.outgoing])!==JSON.stringify([snapshot.friends,snapshot.incoming,snapshot.outgoing]))
    list.innerHTML=friendRows();
}
async function syncFriendsProfile(snapshot){
  if(!snapshot.self||snapshot.self.id!==data.friendsId) return;
  const profile=clanProfile(data.sessions,data.wardrobe,currentProgress(),data.appearanceAt,data.skinPreview);
  const version=JSON.stringify(profile);
  if(version===lastFriendsProfile) return;
  await friendsRequest({action:'sync',profileId:snapshot.self.id,profile});
  lastFriendsProfile=version;
}
function retryFriends(){
  if(friendsAgain&&!friendsWriting){
    friendsAgain=false;
    setTimeout(refreshFriends,0);
  }
}
function refreshFriends(){
  if(friendsWriting||friendsRead){friendsAgain=true;return friendsRead;}
  friendsRead=(async()=>{
    try{
      const snapshot=await friendsRequest();
      friendsError='';
      applyFriends(snapshot);
      await syncFriendsProfile(snapshot);
      if(friendsVisible()) setFriendsStatus('');
    }catch(error){if(friendsVisible()) setFriendsStatus(error.message);}
    finally{friendsRead=null;retryFriends();}
  })();
  return friendsRead;
}
async function modifyFriends(payload,button){
  if(friendsWriting) return false;
  friendsWriting=true;
  if(button) button.disabled=true;
  try{
    await friendsRead;
    const snapshot=await friendsRequest(payload);
    if(payload.action==='setup'&&snapshot.self){
      data.friendsId=snapshot.self.id;
      lastFriendsProfile='';
      save();
    }
    setFriendsStatus('');
    applyFriends(snapshot);
    try{await syncFriendsProfile(snapshot);}catch{friendsAgain=true;}
    return true;
  }catch(error){
    if(friendsVisible()) setFriendsStatus(error.message);
    return false;
  }finally{
    friendsWriting=false;
    if(button) button.disabled=false;
    retryFriends();
  }
}
function refreshSocialTab(){if(socialTab==='friends') refreshFriends();else refreshClan();}
function syncSocialProfiles(){
  if(data.clanLink) refreshClan();
  if(data.friendsId) refreshFriends();
}
function updateClanStartNickname(){
  const form=app.querySelector('#clan-start');
  if(!form) return;
  app.querySelector('[data-clan-nick]').hidden=Boolean(nickname);
  form.querySelector('button[type="submit"]').disabled=!nickname||form.dataset.submitting==='true';
}
function refreshNickname(){
  if(nicknameWriting||photoWriting||nicknameRead) return nicknameRead;
  nicknameRead=profileRequest().then(({nick,photo=null})=>{
    const first=Boolean(nick)!==Boolean(nickname);
    const nameChanged=nick!==nickname;
    if(!nameChanged&&photo===profilePhoto) return;
    nickname=nick;
    profilePhoto=photo;
    renderAccount();
    updateClanStartNickname();
    updateSettingsNickname();
    updateSettingsPhoto();
    if(nameChanged&&(route()==='dom'||first&&friendsVisible()&&!friendsState?.self)) render();
  }).catch(()=>{}).finally(()=>{nicknameRead=null;});
  return nicknameRead;
}
function editNickname(){
  openModal(nicknameAction(),'<form id="nickname-form" class="stack">'+
    '<label class="field">'+t('Twój nick')+'<input name="nick" autocomplete="nickname" value="'+esc(nickname)+'" placeholder="np. GymJul" required minlength="2" maxlength="26" autofocus></label>'+
    '<p class="meta">'+t('Tego nicku używa Dom, klan i profil znajomych.')+'</p><p class="form-error" role="alert" hidden></p>'+
    '<button type="submit" class="btn primary">'+t('Zapisz nick')+'</button></form>');
}
async function submitNickname(form,button,nick){
  if(nicknameWriting) return;
  nicknameWriting=true;
  button.disabled=true;
  const status=form.querySelector('.form-error');
  status.hidden=true;
  try{
    await nicknameRead;
    nickname=(await profileRequest({nick})).nick;
    if(dialog.contains(form)&&dialog.open) dialog.close();
    if(app.querySelector('#clan-start')){
      renderAccount();
      updateClanStartNickname();
    }else if(route()==='ustawienia'){
      renderAccount();
      updateSettingsNickname();
    }else render();
    syncSocialProfiles();
    toast(t('Nick zapisany'));
  }catch(error){
    status.textContent=error.message;
    status.hidden=false;
  }finally{
    nicknameWriting=false;
    button.disabled=false;
  }
}
const views={dom:showHome,trening:showTraining,klan:showSocial,gymbro:showGymBro,mapa:showMap,historia:showProgress,ustawienia:showSettings};
function renderAccount(){
  document.querySelector('#account-tools').innerHTML=accountTools();
}
function render({shine}={}){
  const page=route();
  renderAccount();
  document.querySelector('.nav').innerHTML=Object.entries(nav).map(([key,[ico,label]])=>
    '<a class="'+(page===key?'active':'')+'" '+(page===key?'aria-current="page"':'')+' href="#'+key+'">'+icon(ico)+t(label)+'</a>').join('');
  app.innerHTML=(!storageOK?'<p class="empty">'+t('Zapis w przeglądarce jest niedostępny.')+'</p>':'')+views[page](shine);
  refreshDraftPhoto();
  renderRest();
  const feed=app.querySelector('#clan-feed');
  if(feed) feed.scrollTop=feed.scrollHeight;
}
function go(page){
  if(route()===page && location.hash) render();
  else location.hash=page;
}
function setSkinPreview(enabled){
  data.skinPreview=enabled?activeSkin():null;
  rememberAppearance();
}
function rememberAppearance(){
  data.appearanceAt=Math.max(Date.now(),data.appearanceAt+1);
  save();
}
function openSkinTestLink(){
  if(location.hash!=='#test-skorek') return;
  setSkinPreview(true);
  wardrobeTab='skorki';
  history.replaceState(history.state,'','#gymbro');
}
window.addEventListener('hashchange',()=>{
  openSkinTestLink();
  if(route()!=='gymbro') tryOn=null;
  if(dialog.open) dialog.close();
  render();
  window.scrollTo(0,0);
  if(route()==='klan') refreshSocialTab();
});
function openModal(title,body,options={}){
  dialog.className=options.sheet?'picker-dialog':'';
  dialog.innerHTML='<div class="dialog-card"><div class="card-head"><h2 id="dialog-title">'+title+'</h2><button type="button" class="btn ghost" data-act="close" aria-label="'+t('Zamknij')+'">'+icon('x')+'</button></div>'+body+'</div>';
  if(!dialog.open) dialog.showModal();
}
function confirmModal(title,body,act,label){
  openModal(title,'<p class="meta">'+body+'</p><div class="controls">'+action(t('Wróć'),'close')+action(label,act,'danger')+'</div>');
}
function openMuscle(key){
  const context=mapData();
  const stat=context.map[key];
  const value=intensity(context,key);
  const visible=[...document.querySelectorAll('.figure .glow')];
  for (const layer of visible) {
    if (layer.dataset.glow===key) {
      layer.hidden=false;
      layer.style.opacity='1';
    } else if (!layer.hidden) layer.style.opacity='.25';
    layer.style.animation='none';
  }
  openModal(esc(t(activeModel().layout[side].warstwy[key].nazwa)),
    (context.demo?'<p class="meta">'+t('Przykładowe obciążenie')+'</p>':'<div class="stats"><div><span class="meta">'+t('Liczba serii')+'</span><strong>'+(stat?.sets??0)+'</strong></div><div><span class="meta">'+t('Ostatni trening')+'</span><strong>'+
    (stat?.recent?formatter.format(stat.recent):'–')+'</strong></div></div>')+
    '<p class="meta">'+t('Intensywność na mapie:')+' '+Math.round(value*100)+'%</p>'+action(t('Zamknij'),'close','primary'));
  dialog.addEventListener('close',()=>{
    for(const layer of visible){
      layer.style.removeProperty('opacity');
      layer.style.removeProperty('animation');
      layer.hidden=!intensity(context,layer.dataset.glow);
    }
  },{once:true});
}
function workoutPhotoButton(id){
  return '<button type="button" class="btn ghost workout-photo-button" data-act="workout-photo" data-key="'+esc(id)+'">'+
    icon('camera')+' <span>'+t('Zdjęcie treningu')+'</span></button>';
}
function workoutPhotoImage(sharedId){
  return '<img class="workout-photo" alt="'+t('Zdjęcie treningu')+'" '+
    (sharedId?'data-shared-photo src="'+sharedWorkoutPhotoUrl(sharedId)+'"':'hidden')+'>';
}
function setWorkoutPhotoSource(image,src){
  image.hidden=!src;
  if(src) image.src=src;
  else image.removeAttribute('src');
}
async function showWorkoutPhoto(image,photo,sharedId){
  if(!photo&&!sharedId) return;
  const src=sharedId?sharedWorkoutPhotoUrl(sharedId):await photoDataUrl(photo);
  if(!image.isConnected||!sharedId&&image.hasAttribute('data-shared-photo')) return;
  if(sharedId) image.dataset.sharedPhoto='';
  setWorkoutPhotoSource(image,src);
}
function refreshDraftPhoto(){
  const id=data.draft?.id;
  if(draftPhotoPreview?.id!==id) draftPhotoPreview=null;
  const image=app.querySelector('.session-hdr .workout-photo');
  if(!image||!id) return;
  if(!draftPhotoPreview){
    const src=readWorkoutPhoto(id).then(photo=>photo?photoDataUrl(photo):null);
    draftPhotoPreview={id,src};
  }
  const preview=draftPhotoPreview;
  preview.src.then(src=>{
    if(image.isConnected&&draftPhotoPreview===preview) setWorkoutPhotoSource(image,src);
  }).catch(()=>{
    if(draftPhotoPreview===preview) draftPhotoPreview=null;
  });
}
function workoutForPhoto(id){
  return data.draft?.id===id?data.draft:data.sessions.find(session=>session.id===id);
}
function openPhotoEditor(id){
  const avatar=id===undefined;
  const workout=avatar?null:workoutForPhoto(id);
  if(!avatar&&!workout) return;
  const finished=Boolean(workout?.finished);
  const hasPhoto=avatar&&Boolean(profilePhoto);
  const note=avatar?'Widoczne dla członków Twojego klanu i zaakceptowanych znajomych.':
    finished?'Zdjęcie publiczne zobaczą członkowie klanu i zaakceptowani znajomi przy tym treningu.':
      'Widoczność zdjęcia zmienisz po zapisaniu treningu.';
  const visibility=finished?'<label class="field" data-photo-visibility>'+t('Widoczność zdjęcia')+
    '<select name="visibility"><option value="private">'+t('Prywatne')+'</option>'+
    '<option value="public">'+t('Publiczne w profilu')+'</option></select></label>':'';
  openModal(avatar?t('Zdjęcie profilowe'):t('Zdjęcie treningu'),
    (avatar?'<div class="photo-profile-preview">'+portrait(profilePhoto)+'</div>':'<strong>'+esc(workout.name)+'</strong>'+workoutPhotoImage())+
    '<p class="meta" data-photo-note>'+t(note)+'</p>'+
    '<form id="photo-form" class="stack"'+(avatar?'':' data-workout="'+esc(id)+'"')+'><fieldset class="photo-fields stack" '+(avatar?'':'disabled')+'>'+
    '<label class="field">'+t('Wybierz zdjęcie')+'<input type="file" name="photo" accept="image/*" '+(hasPhoto?'':'required')+'></label>'+
    visibility+'<p class="form-error" role="alert" hidden></p><button type="submit" class="btn primary">'+t('Zapisz zdjęcie')+'</button>'+
    '<button type="submit" class="btn danger" value="remove" formnovalidate '+(hasPhoto?'':'hidden')+'>'+t('Usuń zdjęcie')+'</button></fieldset></form>'+
    (finished?friendButton('details',id,t('Wróć do treningu')):''));
  if(!avatar) loadWorkoutPhotoEditor(dialog.querySelector('#photo-form'),id,finished);
}
async function loadWorkoutPhotoEditor(form,id,finished){
  const [local,remote]=await Promise.allSettled([readWorkoutPhoto(id),finished?getWorkoutPhotoShare(id):null]);
  if(!dialog.contains(form)) return;
  const photo=local.value;
  const sharedId=remote.value;
  const knowsVisibility=finished&&remote.status==='fulfilled';
  const visibility=form.elements.visibility;
  if(visibility){
    if(knowsVisibility){
      form.dataset.shareReady='true';
      form.dataset.publicPhoto=sharedId??'';
      visibility.value=sharedId?'public':'private';
    }else{
      form.querySelector('[data-photo-visibility]').hidden=true;
      dialog.querySelector('[data-photo-note]').textContent=t('Nie udało się sprawdzić widoczności. Możesz zapisać kopię w tej przeglądarce.');
    }
  }
  const hasPhoto=Boolean(photo||sharedId);
  form.elements.photo.required=!hasPhoto;
  form.querySelector('[value="remove"]').hidden=!hasPhoto||(finished&&!knowsVisibility);
  form.querySelector('fieldset').disabled=false;
  try{await showWorkoutPhoto(dialog.querySelector('.workout-photo'),photo,sharedId);}
  catch{if(dialog.contains(form)) setPhotoError(form,t('Nie udało się odczytać zdjęcia.'));}
}
async function persistWorkoutPhoto(form,id,file,remove,visibility){
  const canShare=form.dataset.shareReady==='true';
  const currentShare=form.dataset.publicPhoto;
  if(remove){
    if(canShare) await setWorkoutPhotoShare(id,null);
    await saveWorkoutPhoto(id,null);
    return;
  }
  const photo=file?.size?await preparePhoto(file):
    currentShare?await fetchSharedWorkoutPhoto(currentShare):await readWorkoutPhoto(id);
  if(!photo) throw Error(t('Wybierz prawidłowe zdjęcie.'));
  if(!workoutForPhoto(id)) return;
  await saveWorkoutPhoto(id,photo);
  if(canShare&&visibility==='private') await setWorkoutPhotoShare(id,null);
  if(canShare&&visibility==='public'&&(!currentShare||file?.size)) await setWorkoutPhotoShare(id,photo);
}
function setPhotoError(form,message){
  const status=form.querySelector('.form-error');
  status.textContent=message;
  status.hidden=!message;
}
async function submitPhoto(form,file,remove,visibility){
  if(photoWriting) return;
  const id=form.dataset.workout;
  const avatar=id===undefined;
  photoWriting=true;
  const fields=form.querySelector('fieldset');
  fields.disabled=true;
  setPhotoError(form,'');
  try{
    if(avatar){
      const photo=remove?null:await preparePhoto(file,{avatar:true});
      await nicknameRead;
      profilePhoto=await saveProfilePhoto(photo);
      renderAccount();
      updateSettingsPhoto();
      if(route()==='klan') refreshSocialTab();
    }else if(workoutForPhoto(id)){
      await persistWorkoutPhoto(form,id,file,remove,visibility);
      if(data.draft?.id===id){
        draftPhotoPreview=null;
        refreshDraftPhoto();
      }
    }else return;
    if(dialog.open&&dialog.contains(form)){
      if(avatar||data.draft?.id===id) dialog.close();
      else details(id);
    }
    toast(t(remove?'Zdjęcie usunięte':'Zdjęcie zapisane'));
  }catch(error){
    const message=error.name==='Error'?error.message:t('Nie udało się zapisać zdjęcia.');
    if(dialog.open&&dialog.contains(form)) setPhotoError(form,message);
    else toast(message);
  }finally{
    photoWriting=false;
    fields.disabled=false;
  }
}
function details(id){
  const session=data.sessions.find(s=>s.id===id);
  if(!session) return;
  const lines=session.exercises.filter(e=>e.sets.some(s=>s.done)).map(e=>'<div><h3>'+esc(exerciseLabel(e.label))+'</h3><p class="meta">'+e.sets.filter(s=>s.done).map(s=>esc(s.kg)+' kg × '+esc(s.reps)).join(' · ')+'</p></div>').join('');
  openModal(esc(session.name),'<p class="meta">'+formatter.format(session.finished)+' '+t('· Serii:')+' '+completedCount(session)+' '+t('· Czas:')+' '+timeLabel(elapsedSeconds(session.started,session.finished),true)+'</p>'+workoutPhotoImage()+'<p class="meta workout-photo-visibility" hidden></p>'+workoutPhotoButton(id)+lines+
    '<button type="button" class="btn ghost" data-act="rename-session" data-key="'+esc(id)+'">'+icon('edit')+' '+t('Zmień nazwę')+'</button>'+
    '<button type="button" class="btn primary" data-act="session-map" data-key="'+esc(id)+'">'+t('Pokaż mapę')+' '+icon('arrow')+'</button>');
  const image=dialog.querySelector('.workout-photo');
  const label=dialog.querySelector('.workout-photo-visibility');
  const local=readWorkoutPhoto(id).then(async photo=>{
    await showWorkoutPhoto(image,photo);
    return Boolean(photo);
  }).catch(()=>false);
  getWorkoutPhotoShare(id).then(async sharedId=>{
    if(!dialog.contains(image)) return;
    if(sharedId) await showWorkoutPhoto(image,null,sharedId);
    else if(!await local) return;
    label.textContent=t(sharedId?'Publiczne w profilu':'Prywatne');
    label.hidden=false;
  }).catch(()=>{});
}
function assign(name){
  openModal(esc(name),'<form id="assignment" class="stack"><input type="hidden" name="exercise" value="'+esc(name)+'">'+
    '<p class="meta">'+t('Zaznacz co najmniej jedną główną partię.')+'</p><div class="assignment-options">'+Object.entries(muscles).map(([key,label])=>
    '<label><input type="checkbox" name="muscle" value="'+key+'">'+esc(t(label))+'</label>').join('')+'</div><button class="btn primary" type="submit">'+t('Zapisz przypisanie')+'</button></form>');
}
function start(name,exercises){data.draft=newDraft(name,Date.now(),exercises);save();render();window.scrollTo(0,0);}
function editPlan(plan={id:null,name:'',exercises:[]}){
  planEdit={...plan,exercises:plan.exercises.map(exerciseConfig)};
  render();
  window.scrollTo(0,0);
}
function submitPlan(form,operation){
  const {id,name,exercises}=planEdit;
  if(!name.trim()||!exercises.length){toast(t('Podaj nazwę planu i dodaj co najmniej jedno ćwiczenie.'));return;}
  const invalid=exercises.findIndex(item=>item.repMin&&item.repMax&&Number(item.repMin)>Number(item.repMax));
  if(invalid!==-1){
    const input=form.querySelector('[data-plan-field="repMax"][data-ex="'+invalid+'"]');
    input.setCustomValidity(t('Górna granica musi być równa lub wyższa od dolnej.'));
    input.reportValidity();
    return;
  }
  if(operation==='start'){
    planEdit=null;
    start(name.trim(),exercises);
    return;
  }
  if(data.savedPlans.some(p=>p.id!==id&&normalize(p.name)===normalize(name))){
    toast(t('Masz już plan o tej nazwie. Wpisz inną nazwę.'));
    return;
  }
  const plan={id:id??newId(),name:name.trim(),exercises:exercises.map(exerciseConfig)};
  data.savedPlans=id?data.savedPlans.map(p=>p.id===id?plan:p):[...data.savedPlans,plan];
  planEdit=null;
  save();render();
  if(storageOK) toast(t('Plan zapisany w sekcji Moje plany.'));
}
function openPicker(target){
  const labels=(target==='plan'?planEdit.exercises:data.draft.exercises).map(e=>e.label);
  picker={target,category:'all',existing:new Set(labels.map(exerciseKey)),chosen:new Map()};
  showPicker();
}
function showPicker(){
  openModal(t('Dodaj ćwiczenia'),
    '<label class="catalog-search">'+icon('search')+'<input type="search" id="catalog-query" aria-label="'+t('Szukaj ćwiczeń')+'" placeholder="'+t('Szukaj ćwiczeń')+'"></label>'+
    '<div class="catalog-chips" aria-label="'+t('Partia mięśni')+'">'+[['all',t('Wszystkie')],...categories,['wlasne',t('Własne')]].map(([key,label])=>
      '<button type="button" data-act="catalog-filter" data-key="'+key+'" aria-pressed="'+(key===picker.category)+'">'+t(label)+'</button>').join('')+'</div>'+
    '<div class="catalog-scroll" id="catalog-list"></div>'+
    '<div class="catalog-footer">'+action(t('Wpisz własne ćwiczenie'),'catalog-custom','ghost full','plus')+
    '<button type="button" class="btn primary full" data-act="catalog-apply" disabled>'+t('Dodaj wybrane')+'</button></div>',{sheet:true});
  drawCatalog();
}
function catalogThumb(label){
  const {layout,root}=activeModel();
  const frames=previewFrames(layout,weightsFor(label,data.custom));
  if(!frames.length) return '<span class="catalog-thumb" aria-hidden="true">'+icon('dumbbell')+'</span>';
  return '<span class="catalog-thumb '+(frames.length>1?'dual':'')+'" aria-hidden="true">'+frames.map(frame=>
    '<span class="catalog-frame" data-preview-side="'+frame.side+'" data-preview-muscles="'+frame.keys.join(',')+'">'+
    '<span class="catalog-zoom" style="width:'+frame.width+'%;height:'+frame.height+'%;left:'+frame.left+'%;top:'+frame.top+'%">'+
    '<img class="catalog-base" src="'+root+frame.side+'_baza.webp" loading="lazy" alt="">'+
    frame.files.map(file=>'<img src="'+file+'" loading="lazy" alt="">').join('')+'</span></span>').join('')+'</span>';
}
function openOwnExercise(){
  openModal(t('Własne ćwiczenie'),'<form id="catalog-custom" class="stack">'+
    '<label class="field">'+t('Nazwa ćwiczenia')+'<input name="label" required maxlength="85" placeholder="'+t('np. Wiosłowanie na mojej maszynie')+'"></label>'+
    '<fieldset class="custom-muscles"><legend>'+t('Pracujące partie')+'</legend><div class="assignment-options">'+
    Object.entries(muscles).map(([key,label])=>'<label><input type="checkbox" name="muscle" value="'+key+'">'+esc(t(label))+'</label>').join('')+'</div></fieldset>'+
    '<label class="field">'+t('Własny opis techniki (opcjonalnie)')+'<textarea name="technique" maxlength="600" rows="3" placeholder="'+t('Np. ustawienie siedziska i tor ruchu')+'"></textarea></label>'+
    '<p class="form-error" role="alert" hidden></p>'+action(t('Wróć do katalogu'),'catalog-back','ghost full')+
    '<button type="submit" class="btn primary full">'+t('Zapisz ćwiczenie')+'</button></form>');
}
function saveOwnExercise(form,fields){
  const label=fields.get('label').trim();
  const key=exerciseKey(label);
  const parts=fields.getAll('muscle').filter(muscle=>Object.hasOwn(muscles,muscle));
  const error=form.querySelector('.form-error');
  if(!label||!parts.length||[...catalog,...data.ownExercises].some(entry=>exerciseKey(entry.label)===key)){
    error.textContent=!label?t('Wpisz nazwę ćwiczenia.'):!parts.length?t('Zaznacz co najmniej jedną partię.'):t('Ta nazwa jest już w katalogu. Wpisz inną lub wybierz ćwiczenie z listy.');
    error.hidden=false;
    return;
  }
  data.custom={...data.custom,['own:'+key]:Object.fromEntries(parts.map(muscle=>[muscle,1]))};
  data.ownExercises.push({label,group:'wlasne',equipment:'Własne',technique:fields.get('technique').trim()});
  save();
  if(!picker.existing.has(key)) picker.chosen.set(key,label);
  picker.category='wlasne';
  showPicker();
}
function catalogRow(item,index){
  const key=exerciseKey(item.label);
  const present=picker.existing.has(key), selected=present||picker.chosen.has(key);
  return '<button class="catalog-item" type="button" data-act="catalog-toggle" data-key="'+index+'" aria-pressed="'+selected+'" '+(present?'disabled':'')+'>'+
    catalogThumb(item.label)+
    '<span class="catalog-name"><strong>'+esc(exerciseLabel(item.label))+'</strong><small>'+esc(t(item.equipment))+'</small></span>'+
    '<span class="catalog-check">'+icon(selected?'check':'plus')+(present?'<span class="sr-only">'+t('Już na liście')+'</span>':'')+'</span></button>';
}
function drawCatalog(resetScroll=false){
  const list=dialog.querySelector('#catalog-list');
  const query=dialog.querySelector('#catalog-query').value;
  picker.items=[...catalog,...data.ownExercises];
  list.innerHTML=picker.items.map((item,index)=>
    (picker.category==='all'||picker.category===item.group)&&matchesExercise(item,query)?
      catalogRow(item,index):'').join('')||'<p class="empty">'+t('Brak wyników. Zmień filtr lub wpisz własne ćwiczenie.')+'</p>';
  if(resetScroll) list.scrollTop=0;
  const submit=dialog.querySelector('[data-act="catalog-apply"]');
  submit.disabled=!picker.chosen.size;
  submit.textContent=picker.chosen.size?t('Dodaj wybrane (')+picker.chosen.size+')':t('Dodaj wybrane');
}
function applyPicker(){
  const labels=[...picker.chosen.values()];
  if(!labels.length) return;
  if(picker.target==='plan') planEdit.exercises.push(...labels.map(exerciseConfig));
  else {
    data.draft.exercises.push(...labels.map(label=>({...exerciseConfig(label),sets:[blankSet()]})));
    save();
  }
  dialog.close();render();
  if(labels.length&&picker.target==='workout') [...document.querySelectorAll('.exercise')].at(-labels.length)?.scrollIntoView({block:'start'});
}
function restSetting(exercise,index,target){
  const duration=exercise.restSeconds??0;
  return '<button type="button" class="rest-setting" data-act="rest-settings" data-key="'+target+'" data-ex="'+index+'" aria-label="'+t('Przerwa:')+' '+esc(exerciseLabel(exercise.label))+'">'+
    icon('stopwatch')+' <span>'+(duration?t('Przerwa ·')+' '+timeLabel(duration):t('Ustaw przerwę'))+'</span></button>';
}
function openRestSettings(target,index){
  const exercise=(target==='plan'?planEdit.exercises:data.draft.exercises)[index];
  const duration=exercise.restSeconds??0;
  openModal(t('Przerwa między seriami'),
    '<form class="stack" id="rest-form"><p class="meta">'+esc(exerciseLabel(exercise.label))+'</p>'+
    '<input type="hidden" name="target" value="'+target+'"><input type="hidden" name="index" value="'+index+'">'+
    '<div class="rest-inputs"><label class="field">'+t('Minuty')+'<input type="number" inputmode="numeric" name="minutes" min="0" max="59" step="1" value="'+Math.floor(duration/60)+'"></label>'+
    '<label class="field">'+t('Sekundy')+'<input type="number" inputmode="numeric" name="seconds" min="0" max="59" step="1" value="'+duration%60+'"></label></div>'+
    '<div class="controls rest-presets">'+[0,60,90,120,180].map(seconds=>'<button class="btn ghost" type="button" data-act="rest-preset" data-key="'+seconds+'">'+(seconds?timeLabel(seconds):t('Wyłącz'))+'</button>').join('')+'</div>'+
    '<button type="submit" class="btn primary full">'+t('Zapisz przerwę')+'</button></form>');
}
function renderRest(){
  const rest=data.draft?.rest;
  restDock.hidden=!rest||route()!=='trening'||Boolean(planEdit);
  restDock.innerHTML=restDock.hidden?'':'<div class="rest-main">'+icon('stopwatch')+
    '<div class="rest-copy"><strong data-rest-state></strong><span>'+esc(exerciseLabel(rest.label))+'</span></div>'+
    '<strong class="rest-count" data-rest-count></strong></div>'+
    '<div class="rest-actions">'+action('−15 s','rest-minus','ghost')+action('+15 s','rest-plus','ghost')+action(t('Pomiń'),'skip-rest','ghost')+'</div>'+
    '<div class="rest-progress" aria-hidden="true"><i></i></div>';
  tickClocks();
}
function tickClocks(){
  const draft=data.draft;
  if(!draft) return;
  const now=Date.now();
  const elapsed=app.querySelector('[data-elapsed]');
  if(elapsed) elapsed.textContent=timeLabel(elapsedSeconds(draft.started,now),true);
  const rest=draft.rest;
  if(!rest) return;
  const seconds=remainingSeconds(rest.deadline,now);
  if(!seconds&&!rest.notified&&!document.hidden){
    rest.notified=true;
    save();
    playRestSignal();
    if(restDock.hidden) toast(t('Koniec przerwy ·')+' '+exerciseLabel(rest.label));
  }
  if(restDock.hidden) return;
  restDock.querySelector('[data-rest-count]').textContent=timeLabel(seconds);
  const status=restDock.querySelector('[data-rest-state]');
  const label=seconds?t('Przerwa'):t('Koniec przerwy');
  if(status.textContent!==label){
    if(!seconds) status.setAttribute('role','status');
    status.textContent=label;
  }
  restDock.style.setProperty('--progress',seconds/draft.rest.duration);
  restDock.classList.toggle('rest-finished',!seconds);
  if(!seconds){
    restDock.querySelector('[data-act="rest-minus"]').disabled=true;
    restDock.querySelector('[data-act="rest-plus"]').disabled=true;
    restDock.querySelector('[data-act="skip-rest"]').textContent=t('Zamknij');
  }
}
function changeRest(seconds){
  const rest=data.draft?.rest;
  const now=Date.now();
  if(!rest||rest.deadline<=now) return;
  armRestSound();
  rest.deadline=Math.max(now,rest.deadline+seconds*1000);
  rest.duration=Math.max(rest.duration,remainingSeconds(rest.deadline,now));
  save();tickClocks();
}
function cancelRestForSet(set){
  if(set.timerId&&data.draft.rest?.id===set.timerId) delete data.draft.rest;
}
function renameWorkout(session){
  if(!session) return;
  openModal(t('Zmień nazwę treningu'),'<form class="stack" id="rename-workout">'+
    '<input type="hidden" name="session-id" value="'+esc(session.id)+'">'+
    '<label class="field">'+t('Nazwa treningu')+'<input name="label" required maxlength="60" value="'+esc(session.name)+'" autofocus></label>'+
    '<button class="btn primary full" type="submit">'+t('Zapisz nazwę')+'</button></form>');
}

function recordContent(label,kg,previous){
  return '<div class="pr-emblem" aria-hidden="true">'+icon('dumbbell')+'<i></i><i></i><i></i></div>'+
    '<div class="pr-copy"><span>'+t('NOWY PR')+'</span><strong>'+formatKg.format(kg)+' kg</strong><p>'+esc(exerciseLabel(label))+' '+t('· poprzednio')+' '+formatKg.format(previous)+' kg</p></div>';
}
function showRecord(label,kg,previous){
  const el=document.querySelector('#record');
  clearTimeout(recordTimeout);
  el.classList.remove('visible');
  el.innerHTML=recordContent(label,kg,previous);
  el.classList.add('visible');
  recordTimeout=setTimeout(()=>el.classList.remove('visible'),4600);
}
function updateSet(input){
  const set=data.draft?.exercises[Number(input.dataset.ex)]?.sets[Number(input.dataset.set)];
  if(!set) return;
  set[input.dataset.field]=input.value;
  save();
}
function toggleSet(exercise,set,button){
  let record;
  if(!set.done){
    const kg=set.kg.trim().replace(',','.');
    const reps=set.reps.trim();
    if(!/^\d+$/.test(reps)||Number(reps)<1|| (kg && (!/^\d+(\.\d+)?$/.test(kg)||!Number.isFinite(Number(kg))))){
      toast(t('Podaj poprawny ciężar i co najmniej jedno powtórzenie.'));
      button.closest('.set-row').querySelector(!/^\d+$/.test(reps)||Number(reps)<1?'[data-field="reps"]':'[data-field="kg"]').focus();
      return;
    }
    set.kg=kg||'0';
    set.reps=String(Number(reps));
    const key=exerciseKey(exercise.label);
    const best=previousBest([...data.sessions,data.draft],exercise.label);
    const seen=data.draft.announcedRecords;
    const announced=seen&&Object.hasOwn(seen,key)?seen[key]:0;
    if(best>0&&Number(set.kg)>Math.max(best,announced)){
      record={label:exercise.label,kg:Number(set.kg),best};
      data.draft.announcedRecords={...seen,[key]:record.kg};
    }
  }
  set.done=!set.done;
  if(!set.done) cancelRestForSet(set);
  if(set.done){
    delete data.draft.rest;
    if(exercise.restSeconds){
      armRestSound();
      set.timerId=newId();
      data.draft.rest={id:set.timerId,label:exercise.label,duration:exercise.restSeconds,deadline:Date.now()+exercise.restSeconds*1000};
    }
  }
  save();render();
  if(record) showRecord(record.label,record.kg,record.best);
}
function finish(){
  const draft=data.draft;
  if(!draft||!completedCount(draft)) return;
  const session={id:draft.id,name:draft.name,started:draft.started,finished:Date.now(),exercises:draft.exercises
    .map(e=>({...e,sets:numberedCompletedSets(e.sets)})).filter(e=>e.sets.length)};
  const before=currentProgress();
  data.sessions.unshift(session);
  const after=currentProgress();
  if(data.clanLink){
    const clanId=data.clanLink;
    for(const event of workoutActivities(session,data.sessions.slice(1),before,after)) data.clanOutbox.push({...event,clanId});
  }
  data.draft=null;
  selectSession(session);
  save();
  if(dialog.open) dialog.close();
  go('mapa');
  syncSocialProfiles();
  if(storageOK){
    const xp=after.xp-before.xp;
    const levels=after.level-before.level;
    const parts=[levels?t('Poziom')+' '+after.level:t('Trening zapisany')];
    if(xp) parts.push('+'+xp+' XP');
    if(levels) parts.push('+'+levels*COINS_PER_LEVEL+' '+t('monet'));
    toast(parts.join(' · '));
  }
}

document.addEventListener('input',event=>{
  if(event.target.id==='progress-query'){
    progressState.query=event.target.value;
    app.querySelector('#progress-results').innerHTML=progressResults();
  }
  if(event.target.id==='catalog-query') drawCatalog(true);
  if(event.target.form?.id==='plan-form'){
    const input=event.target;
    const {planField,ex}=input.dataset;
    if(input.name==='label') planEdit.name=input.value;
    if(planField){
      input.form.querySelector('[data-plan-field="repMax"][data-ex="'+ex+'"]').setCustomValidity('');
      planEdit.exercises[Number(ex)][planField]=input.value;
    }
  }
  if(event.target.matches('[data-field]')){
    const field=event.target;
    const set=data.draft?.exercises[Number(field.dataset.ex)]?.sets[Number(field.dataset.set)];
    if(set?.done){
      cancelRestForSet(set);renderRest();
      set.done=false;
      const row=field.closest('.set-row');
      const button=row.querySelector('[data-act="check"]');
      row.classList.remove('checked');
      button.setAttribute('aria-pressed','false');
      button.setAttribute('aria-label',t('Ukończ serię')+' '+(Number(field.dataset.set)+1));
      const count=completedCount(data.draft);
      const summary=document.querySelector('.session-hdr .meta');
      summary.textContent=t('Ukończone serie:')+' '+count;
      document.querySelector('[data-act="finish"]').disabled=!count;
      const exercise=field.closest('.exercise');
      const exerciseData=data.draft.exercises[Number(field.dataset.ex)];
      if(weightsFor(exerciseData.label,data.custom)){
        exercise.querySelector('.meta').textContent=t('Serii:')+' '+exerciseData.sets.filter(s=>s.done).length;
      }
    }
    updateSet(field);
  }
});
document.addEventListener('change',event=>{
  if(event.target.id==='app-language'){
    const draft=new FormData(app.querySelector('#measurements-form'));
    data.language=event.target.value==='en'?'en':'pl';
    save();
    updateLocale();
    render();
    const measurements=app.querySelector('#measurements-form').elements;
    for(const [key,value] of draft) measurements[key].value=value;
    app.querySelector('#app-language').focus({preventScroll:true});
  }
  if(event.target.id==='progress-order'){
    progressState.order=event.target.value;
    app.querySelector('#progress-results').innerHTML=progressResults();
  }
  if(event.target.id==='session-select'){selectSession(data.sessions.find(s=>s.id===event.target.value));render();}
  if(event.target.id==='threshold'){
    const number=Number(event.target.value);
    if(Number.isInteger(number)&&number>=1&&number<=100){data.threshold=number;save();render();}
    else {event.target.value=data.threshold;toast(t('Wpisz liczbę od 1 do 100.'));}
  }
});
document.addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.target;
  const fields=new FormData(form);
  if(form.id==='auth-form'){
    const email=fields.get('email').trim();
    const password=fields.get('password');
    const isReg=event.submitter?.value==='register';
    const res=isReg?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});
    if(res.error){toast(res.error.message);return;}
    currentUser=res.data.user;
    toast(isReg?'Konto utworzone! Ustaw teraz swój nick poniżej.':'Zalogowano!');
    await loadCloudData();
    render();
  }
  if(form.id==='measurements-form'){
    data.measurements=Object.fromEntries(measurementFields.flatMap(([id,,,min,max])=>{
      const value=Number(fields.get(id));
      return Number.isFinite(value)&&value>=min&&value<=max?[[id,value]]:[];
    }));
    save();
    if(storageOK) toast(t('Pomiary zapisane'));
  }
  if(form.id==='nickname-form') submitNickname(form,event.submitter,fields.get('nick'));
  if(form.id==='photo-form') submitPhoto(form,fields.get('photo'),event.submitter?.value==='remove',fields.get('visibility'));
  if(form.id==='friends-setup') modifyFriends({action:'setup'},event.submitter);
  if(form.id==='friends-invite') modifyFriends({action:'invite',code:fields.get('code')},event.submitter)
    .then(sent=>{if(sent){form.reset();toast(t('Zaproszenie wysłane'));}});
  if(form.id==='clan-start') submitClanStart(form,fields);
  if(form.id==='clan-chat') sendClanChat(form,fields);
  if(form.id==='plan-form') submitPlan(form,event.submitter?.value);
  if(form.id==='rest-form'){
    const plan=fields.get('target')==='plan';
    const exercise=(plan?planEdit.exercises:data.draft.exercises)[Number(fields.get('index'))];
    exercise.restSeconds=Number(fields.get('minutes'))*60+Number(fields.get('seconds'));
    if(!plan) save();
    dialog.close();render();
  }
  if(form.id==='rename-workout'){
    const id=fields.get('session-id');
    const draft=data.draft?.id===id;
    const session=draft?data.draft:data.sessions.find(s=>s.id===id);
    const name=fields.get('label').trim();
    if(!name||!session) return;
    session.name=name;
    save();render();
    if(draft) dialog.close(); else {details(id);syncSocialProfiles();}
  }
  if(form.id==='catalog-custom') saveOwnExercise(form,fields);
  if(form.id==='new-custom'){
    const name=fields.get('label').trim();
    if(!name) return;
    dialog.close();start(name);
  }
  if(form.id==='assignment'){
    const keys=fields.getAll('muscle').filter(key=>Object.hasOwn(muscles,key));
    if(!keys.length){toast(t('Wybierz co najmniej jedną partię mięśni.'));return;}
    const key=normalize(fields.get('exercise'));
    data.custom={...data.custom,[key]:Object.fromEntries(keys.map(k=>[k,1]))};
    save();dialog.close();render();
  }
});
document.addEventListener('keydown',event=>{
  const target=event.target.closest('.muscle-targets [data-act="muscle"]');
  if(!target||(event.key!=='Enter'&&event.key!==' ')) return;
  event.preventDefault();
  openMuscle(target.dataset.key);
});
document.addEventListener('click',async event=>{
  if(data.draft?.rest?.deadline>Date.now()) armRestSound();
  const button=event.target.closest('[data-act]');
  if(!button) return;
  const {act,key,ex,set:idx,slot,color}=button.dataset;
  const exercise=data.draft?.exercises[Number(ex)];
  const set=exercise?.sets[Number(idx)];
  switch(act){
    case 'auth-logout':
      if(restPush.status(currentUser?.id).busy) break;
      await restPush.disable(currentUser?.id);
      await supabase.auth.signOut();
      currentUser=null;nickname='';
      render();toast('Wylogowano');break;
    case 'enable-rest-push':
      await restPush.enable(currentUser?.id,()=>data.draft?.rest,()=>data.language);break;
    case 'disable-rest-push':
      await restPush.disable(currentUser?.id);break;
    case 'edit-nickname':editNickname();break;
    case 'profile-photo':openPhotoEditor();break;
    case 'workout-photo':openPhotoEditor(key);break;
    case 'toggle-skin-preview':
      setSkinPreview(data.skinPreview===null);
      render();
      syncSocialProfiles();
      app.querySelector('[data-act="toggle-skin-preview"]')?.focus({preventScroll:true});
      break;
    case 'select-skin':{
      if(unlockedSkin(key,skinLevel())!==key) break;
      const testing=data.skinPreview!==null;
      if(testing) data.skinPreview=key;
      else data.wardrobe.skin=key;
      rememberAppearance();
      render();
      app.querySelector('[data-act="select-skin"][data-key="'+key+'"]')?.focus({preventScroll:true});
      syncSocialProfiles();
      break;
    }
    case 'shared-workout':openSharedWorkout(button);break;
    case 'calendar-prev':
    case 'calendar-next':
      progressState.month=moveMonth(progressState.month,act==='calendar-prev'?-1:1);
      progressState.day=null;render();
      app.querySelector('[data-act="'+act+'"]').focus({preventScroll:true});
      break;
    case 'calendar-today':
      progressState.month=dayKey(Date.now()).slice(0,7);
      progressState.day=null;render();
      app.querySelector('[data-act="calendar-today"]').focus({preventScroll:true});
      break;
    case 'calendar-day':
      progressState.day=progressState.day===key?null:key;
      render();
      app.querySelector('[data-act="calendar-day"][data-key="'+key+'"]').focus({preventScroll:true});
      break;
    case 'calendar-clear':progressState.day=null;render();break;
    case 'side':side=key;render();break;
    case 'range':mode=key;render();break;
    case 'close':dialog.close();break;
    case 'muscle':openMuscle(key);break;
    case 'social-tab':
      socialTab=key;render();refreshSocialTab();break;
    case 'friends-refresh':refreshFriends();break;
    case 'friend-copy':{
      const code=friendsState?.self?.code;
      if(code&&navigator.clipboard) navigator.clipboard.writeText(code).then(()=>toast(t('Skopiowano kod znajomego'))).catch(()=>toast(t('Kod znajomego:')+' '+code));
      else if(code) toast(t('Kod znajomego:')+' '+code);
      break;
    }
    case 'friend-link':
      if(friendsState?.self){data.friendsId=friendsState.self.id;lastFriendsProfile='';save();render();refreshFriends();}
      break;
    case 'friend-profile':openFriend(key);break;
    case 'friend-accept':modifyFriends({action:'accept',peer:key},button);break;
    case 'friend-decline':modifyFriends({action:'decline',peer:key},button);break;
    case 'friend-remove':modifyFriends({action:'remove',peer:key},button);break;
    case 'friend-confirm-remove':
      confirmModal(t('Usunąć znajomego?'),t('Przestaniecie widzieć swoje profile znajomych.'),'friend-remove-confirmed',t('Usuń znajomego'));
      dialog.querySelector('[data-act="friend-remove-confirmed"]').dataset.key=key;
      break;
    case 'friend-remove-confirmed':
      dialog.close();modifyFriends({action:'remove',peer:key});break;
    case 'clan-mode':clanMode=key;render();break;
    case 'clan-retry':refreshClan();break;
    case 'clan-copy':{
      const code=clanState?.clan?.code;
      if(code&&navigator.clipboard) navigator.clipboard.writeText(code).then(()=>toast(t('Skopiowano kod zaproszenia'))).catch(()=>toast(t('Kod zaproszenia:')+' '+code));
      else if(code) toast(t('Kod zaproszenia:')+' '+code);
      break;
    }
    case 'clan-member':openClanMember(key);break;
    case 'clan-confirm-kick':confirmClanRemoval(key);break;
    case 'clan-kick':removeClanMember(key,button);break;
    case 'clan-replay':{
      const body=clanState?.messages.find(message=>String(message.seq)===key)?.body;
      if(body?.kind==='pr') showRecord(body.label,body.kg,body.previous);
      break;
    }
    case 'clan-leave':
      confirmModal(t('Opuścić klan?'),t('Aby wrócić, użyj kodu zaproszenia.'),'clan-confirm-leave',t('Opuść klan'));break;
    case 'clan-confirm-leave':leaveClan();break;
    case 'avatar-side':avatarSide=key;render();break;
    case 'select-model':{
      const model=modelFor(key);
      if(model.id!==key||model.id===activeModel().id) break;
      data.wardrobe.model=model.id;
      rememberAppearance();
      render();
      app.querySelector('[data-act="select-model"][data-key="'+key+'"]')?.focus({preventScroll:true});
      syncSocialProfiles();
      break;
    }
    case 'wardrobe-tab':
      wardrobeTab=key;tryOn=null;render();
      app.querySelector('[data-act="wardrobe-tab"][aria-pressed="true"]')?.focus({preventScroll:true});
      break;
    case 'wardrobe-filter':
      wardrobeFilter=key;tryOn=null;render();
      app.querySelector('[data-act="wardrobe-filter"][aria-pressed="true"]')?.focus({preventScroll:true});
      break;
    case 'tattoo-area':
      tattooArea=key;tattooSlot=tattooAreas.find(area=>area.id===key).slots[0];updateTattooPreview();render();
      break;
    case 'tattoo-slot':
      tattooSlot=key;updateTattooPreview();render();break;
    case 'tattoo-color':
      tattooColor=key;updateTattooPreview();render();break;
    case 'open-shop':wardrobeTab='sklep';render();break;
    case 'outfit-try':
      tryOn=tryOn?.id===key?null:{id:key};
      if(tryOn&&items.find(item=>item.id===key)?.back===false) avatarSide='przod';
      render({shine:tryOn?.id});break;
    case 'tattoo-try':
      if(tattooFits(items.find(item=>item.id===key),slot,color)){
        tryOn=tryOn?.id===key&&tryOn.slot===slot&&tryOn.color===color?null:{id:key,slot,color};
        if(tryOn) avatarSide='przod';
        render();
      }
      break;
    case 'tattoo-equip':
      if(toggleTattoo(data.wardrobe,key,slot,color)){
        tryOn=null;avatarSide='przod';
        rememberAppearance();render();syncSocialProfiles();
      }
      break;
    case 'outfit-buy':
      if(buyItem(data.wardrobe,key,currentProgress().coins,slot,color)){
        tryOn=null;
        if(slot||items.find(item=>item.id===key)?.back===false) avatarSide='przod';
        rememberAppearance();render({shine:key});
        syncSocialProfiles();
        if(storageOK) toast(t(slot?'Tatuaż kupiony i założony':'Ubranko kupione i założone'));
      }
      break;
    case 'outfit-toggle':
      if(toggleItem(data.wardrobe,key)){
        const equipped=data.wardrobe.worn.includes(key);
        if(equipped&&items.find(item=>item.id===key)?.back===false) avatarSide='przod';
        rememberAppearance();render({shine:equipped?key:null});
        syncSocialProfiles();
      }
      break;
    case 'details':details(key);break;
    case 'assign':assign(key);break;
    case 'session-map':selectSession(data.sessions.find(s=>s.id===key));dialog.close();go('mapa');break;
    case 'start':start(key);break;
    case 'configure-template':editPlan({id:null,name:key,exercises:plans[key],quick:true});break;
    case 'start-plan':{
      const plan=data.savedPlans.find(p=>p.id===key);
      if(plan&&!data.draft) start(plan.name,plan.exercises);
      break;
    }
    case 'new-plan':editPlan();break;
    case 'edit-plan':{
      const plan=data.savedPlans.find(p=>p.id===key);
      if(plan) editPlan(plan);
      break;
    }
    case 'plan-from-workout':
      editPlan({id:null,name:data.draft.name,exercises:data.draft.exercises.map(item=>({...item,setCount:Math.max(1,Math.min(MAX_PLAN_SETS,item.sets.length))}))});
      break;
    case 'cancel-plan':planEdit=null;render();break;
    case 'delete-plan':
      confirmModal(t('Usunąć plan?'),t('Plan zniknie z sekcji Moje plany. Zapisane treningi zostaną w historii.'),'confirm-delete-plan',t('Usuń plan'));
      break;
    case 'confirm-delete-plan':
      data.savedPlans=data.savedPlans.filter(plan=>plan.id!==planEdit.id);
      planEdit=null;save();dialog.close();render();break;
    case 'plan-remove-exercise':planEdit.exercises.splice(Number(ex),1);render();break;
    case 'plan-picker':openPicker('plan');break;
    case 'workout-picker':openPicker('workout');break;
    case 'catalog-filter':
      picker.category=key;
      for(const chip of dialog.querySelectorAll('[data-act="catalog-filter"]')) chip.setAttribute('aria-pressed',String(chip===button));
      drawCatalog(true);
      break;
    case 'catalog-toggle':{
      const item=picker.items[Number(key)];
      const labelKey=exerciseKey(item.label);
      if(picker.existing.has(labelKey)) break;
      if(picker.chosen.has(labelKey)) picker.chosen.delete(labelKey);
      else picker.chosen.set(labelKey,item.label);
      drawCatalog();
      dialog.querySelector('[data-act="catalog-toggle"][data-key="'+key+'"]')?.focus({preventScroll:true});
      break;
    }
    case 'catalog-custom':openOwnExercise();break;
    case 'catalog-back':showPicker();break;
    case 'technique':technique(key);break;
    case 'exercise-history':if(exercise) openExerciseHistory(exercise.label);break;
    case 'catalog-apply':applyPicker();break;
    case 'custom-start':
      openModal(t('Rozpocznij nowy trening'),'<form id="new-custom" class="stack"><label class="field">'+t('Nazwa treningu')+'<input name="label" placeholder="'+t('np. Góra ciała')+'" maxlength="60" required autofocus></label><button class="btn primary">'+t('Rozpocznij')+'</button></form>');
      break;
    case 'rename-draft':renameWorkout(data.draft);break;
    case 'rename-session':renameWorkout(data.sessions.find(s=>s.id===key));break;
    case 'rest-settings':openRestSettings(key,Number(ex));break;
    case 'rest-preset':{
      const form=dialog.querySelector('#rest-form');
      form.elements.minutes.value=Math.floor(Number(key)/60);
      form.elements.seconds.value=Number(key)%60;
      break;
    }
    case 'rest-minus':changeRest(-15);break;
    case 'rest-plus':changeRest(15);break;
    case 'skip-rest':delete data.draft.rest;save();renderRest();break;
    case 'check':if(set)toggleSet(exercise,set,button);break;
    case 'add-set':
      if(exercise){
        const last=exercise.sets.at(-1);
        exercise.sets.push(last?{kg:last.kg,reps:last.reps,done:false}:blankSet());save();render();
      }
      break;
    case 'remove-set':if(set){cancelRestForSet(set);exercise.sets.splice(Number(idx),1);save();render();}break;
    case 'remove-exercise':
      if(exercise?.sets.some(s=>s.done)){
        confirmModal(t('Usunąć ćwiczenie?'),t('Usuniesz też zapisane serie tego ćwiczenia.'),'confirm-remove-exercise',t('Usuń ćwiczenie'));
        dialog.querySelector('[data-act="confirm-remove-exercise"]').dataset.ex=ex;
      } else if(exercise){data.draft.exercises.splice(Number(ex),1);save();render();}
      break;
    case 'confirm-remove-exercise':if(exercise){exercise.sets.forEach(cancelRestForSet);data.draft.exercises.splice(Number(ex),1);save();dialog.close();render();}break;
    case 'finish':{
      const skipped=data.draft.exercises.reduce((sum,e)=>sum+e.sets.filter(s=>!s.done).length,0);
      if(skipped) openModal(t('Zakończyć trening?'),'<p class="meta">'+t('Do historii trafią odhaczone serie. Pominięte serie:')+' '+skipped+'.</p><div class="controls">'+action(t('Wróć'),'close')+action(t('Zapisz trening'),'confirm-finish','primary')+'</div>');
      else finish();
      break;
    }
    case 'confirm-finish': finish();break;
    case 'discard':confirmModal(t('Porzucić trening?'),t('Serie z tego treningu zostaną usunięte.'),'confirm-discard',t('Porzuć trening'));break;
    case 'confirm-discard':
      if(data.draft) saveWorkoutPhoto(data.draft.id,null).catch(()=>{});
      data.draft=null;save();dialog.close();render();break;
  }
});
document.addEventListener('error',event=>{
  if(event.target.matches?.('.portrait-image,[data-shared-photo]')) event.target.hidden=true;
},true);
updateLocale();
document.querySelector('[data-icon]').innerHTML=icon('bolt');
openSkinTestLink();
async function loadCloudData(){
  const {data:{user}}=await supabase.auth.getUser();
  currentUser=user;
  if(!user) return;
  const {data:prof}=await supabase.from('profiles').select('username,app_data').eq('id',user.id).maybeSingle();
  if(prof?.username) nickname=prof.username;
  if(prof?.app_data&&typeof prof.app_data==='object'){
    data={...data,...prof.app_data,wardrobe:wardrobeFrom(prof.app_data.wardrobe??data.wardrobe)};
    savedRestPushSignature=restPushSignature(data.draft?.rest);
    localStorage.setItem(storage,JSON.stringify(data));
  }
  restPush.retry(user.id);
}
render();
loadCloudData().then(()=>{render();refreshNickname();syncSocialProfiles();});
if(route()==='klan'&&!data.clanLink) refreshSocialTab();
setInterval(()=>{if(route()==='klan'&&!document.hidden) refreshSocialTab();},3000);
window.addEventListener('online',()=>{
  restPush.retry(currentUser?.id);
  refreshNickname();
  syncSocialProfiles();
  if(route()==='klan') refreshSocialTab();
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden) return;
  updateRestPushSettings();
  restPush.retry(currentUser?.id);
  refreshNickname();
  if(route()==='dom'||route()==='gymbro'){
    const cached=progressCache;
    if(currentProgress()!==cached) render();
  }
  syncSocialProfiles();
  if(route()==='klan') refreshSocialTab();
});
setInterval(tickClocks,250);
document.addEventListener('visibilitychange',tickClocks);
window.addEventListener('pageshow',tickClocks);
