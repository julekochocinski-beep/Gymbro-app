import {beatenRecords,completedBest,elapsedSeconds,statsFor,timeLabel} from './training.mjs';
import {localizedExerciseLabel} from './catalog.mjs';
import {t} from './locale.mjs';

function image(source){
  const asset=new Image();
  const ready=new Promise((resolve,reject)=>{
    asset.onload=()=>resolve(asset);
    asset.onerror=()=>reject(new Error('Heatmap asset could not be loaded'));
  });
  asset.src=source;
  return ready;
}

async function drawStage(ctx,model,view,stats,x){
  const {plotno:[width,height],warstwy}=model.layout[view];
  const scale=Math.min(448/width,690/height);
  const w=width*scale,h=height*scale;
  const coords=[x+(448-w)/2,285+(690-h)/2,w,h];
  const active=Object.entries(warstwy).filter(([key])=>stats[key]?.intensity>0);
  const assets=await Promise.all([image(model.root+view+'_baza.webp'),image(model.root+view+'_kontury.webp'),
    ...active.map(([,layer])=>image(layer.plik))]);
  ctx.drawImage(assets[0],...coords);
  ctx.drawImage(assets[1],...coords);
  active.forEach(([key],index)=>{
    ctx.globalAlpha=.25+.75*stats[key].intensity;
    ctx.drawImage(assets[index+2],...coords);
  });
  ctx.globalAlpha=1;
  ctx.fillStyle='#dbc3ed';
  ctx.font='600 23px system-ui';
  ctx.textAlign='center';
  ctx.fillText(t(view==='przod'?'Przód':'Tył'),x+224,1008);
  ctx.textAlign='start';
}

export async function workoutCardBlob(session,history,model,custom,locale){
  const canvas=document.createElement('canvas');
  canvas.width=1080;
  canvas.height=1350;
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('Canvas unavailable');

  const glow=ctx.createRadialGradient(545,550,30,545,550,994);
  glow.addColorStop(0,'#52326c');
  glow.addColorStop(.6,'#241730');
  glow.addColorStop(1,'#14101b');
  ctx.fillStyle=glow;
  ctx.fillRect(0,0,1080,1350);
  ctx.strokeStyle='#9262b57a';
  ctx.lineWidth=2;
  ctx.strokeRect(36,36,1008,1278);
  ctx.fillStyle='#d398f7';
  ctx.font='800 30px system-ui';
  ctx.fillText('GYMBRO',68,100);
  ctx.fillStyle='#fff3ff';
  ctx.font='850 62px system-ui';
  ctx.fillText(session.name,68,177,940);
  ctx.font='500 27px system-ui';
  ctx.fillStyle='#ddcbe9';
  const date=new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'Europe/Warsaw'}).format(session.finished);
  ctx.fillText(date+' · '+timeLabel(elapsedSeconds(session.started,session.finished),true),68,234);

  const {map}=statsFor([session],custom);
  await drawStage(ctx,model,'przod',map,70);
  await drawStage(ctx,model,'tyl',map,562);

  const prior=history.filter(workout=>workout.id!==session.id&&workout.finished<session.finished);
  const records=beatenRecords(completedBest([session]),completedBest(prior)).slice(0,3);
  ctx.fillStyle='#f8e8ff';
  ctx.font='750 29px system-ui';
  ctx.fillText(t('Rekordy z sesji'),68,1090);
  ctx.font='500 25px system-ui';
  ctx.fillStyle='#e2c7f2';
  if(records.length){
    const number=new Intl.NumberFormat(locale,{maximumFractionDigits:2});
    records.forEach((entry,index)=>ctx.fillText(localizedExerciseLabel(entry.label)+' · '+number.format(entry.kg)+' kg',68,1140+43*index,930));
  }else ctx.fillText(t('Brak nowych rekordów'),68,1140);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Card export failed')),'image/png'));
}
