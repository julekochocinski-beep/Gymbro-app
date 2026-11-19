import {t} from './locale.mjs';

const maxOriginalBytes=32*1024*1024;

export async function preparePhoto(file,{avatar=false}={}){
  if(!file?.size||(file.type&&!file.type.startsWith('image/')))
    throw Error(t('Wybierz prawidłowe zdjęcie.'));
  if(file.size>maxOriginalBytes) throw Error(t('Zdjęcie nie może przekraczać 32 MB.'));

  const image=new Image();
  const source=URL.createObjectURL(file);
  image.src=source;
  try{
    try{await image.decode();}
    catch{throw Error(t('Nie udało się otworzyć zdjęcia. Spróbuj użyć JPG lub PNG.'));}
    const {naturalWidth:width,naturalHeight:height}=image;
    const crop=avatar?Math.min(width,height):0;
    const scale=Math.min(1,1280/Math.max(width,height));
    const canvas=document.createElement('canvas');
    canvas.width=avatar?256:Math.max(1,Math.round(width*scale));
    canvas.height=avatar?256:Math.max(1,Math.round(height*scale));
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx||!width||!height) throw Error(t('Nie udało się przygotować zdjęcia.'));
    ctx.fillStyle='#1e1826';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    if(crop) ctx.drawImage(image,(width-crop)/2,(height-crop)/2,crop,crop,0,0,256,256);
    else ctx.drawImage(image,0,0,canvas.width,canvas.height);
    for(const quality of [.88,.74,.58,.4]){
      const photo=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
      if(photo?.type==='image/jpeg'&&photo.size<=(avatar?96000:600000)) return photo;
    }
    throw Error(t('Nie udało się przygotować zdjęcia.'));
  }finally{URL.revokeObjectURL(source);}
}

async function photoRequest(path,options){
  const response=await fetch(path,options);
  if(!response.headers.get('content-type')?.includes('application/json'))
    throw Error(t('Zaloguj się ponownie, żeby otworzyć Społeczność.'));
  const result=await response.json();
  if(!response.ok) throw Error(t(result.error));
  return result.photo;
}

function saveRemotePhoto(path,photo){
  return photoRequest(path,photo?{method:'POST',headers:{'Content-Type':'image/jpeg'},body:photo}:{method:'DELETE'});
}
const workoutPhotoPath=id=>'/api/workout-photo?workout='+encodeURIComponent(id);
export const sharedWorkoutPhotoUrl=id=>'/api/workout-photo/'+encodeURIComponent(id);
export const saveProfilePhoto=photo=>saveRemotePhoto('/api/avatar',photo);
export const getWorkoutPhotoShare=id=>photoRequest(workoutPhotoPath(id),{cache:'no-store'});
export const setWorkoutPhotoShare=(id,photo)=>saveRemotePhoto(workoutPhotoPath(id),photo);

export async function fetchSharedWorkoutPhoto(id){
  const response=await fetch(sharedWorkoutPhotoUrl(id));
  if(!response.ok||response.headers.get('content-type')!=='image/jpeg')
    throw Error(t('Nie udało się odczytać zdjęcia.'));
  return response.blob();
}

let photoDatabase;
function openPhotoDatabase(){
  if(!photoDatabase){
    photoDatabase=new Promise((resolve,reject)=>{
      const request=indexedDB.open('gymbro-photos',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('workout-photos');
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
    }).catch(error=>{
      photoDatabase=null;
      throw error;
    });
  }
  return photoDatabase;
}

async function workoutPhotoRequest(mode,operation){
  const database=await openPhotoDatabase();
  return new Promise((resolve,reject)=>{
    const transaction=database.transaction('workout-photos',mode);
    const request=operation(transaction.objectStore('workout-photos'));
    transaction.oncomplete=()=>resolve(request.result);
    transaction.onabort=()=>reject(transaction.error);
  });
}
export const readWorkoutPhoto=id=>workoutPhotoRequest('readonly',store=>store.get(id));
export const saveWorkoutPhoto=(id,photo)=>workoutPhotoRequest('readwrite',store=>photo?store.put(photo,id):store.delete(id));

export function photoDataUrl(photo){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(reader.error);
    reader.readAsDataURL(photo);
  });
}
