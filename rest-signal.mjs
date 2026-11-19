let context;

export function armRestSound(){
  const Audio=window.AudioContext??window.webkitAudioContext;
  if(!Audio) return;
  try{
    context??=new Audio();
    if(context.state!=='running') context.resume().catch(()=>{});
  } catch {
    // The visual timer remains available whenever audio is blocked.
  }
}

export function playRestSignal(){
  if(typeof navigator.vibrate==='function') navigator.vibrate(180);
  if(!context||context.state!=='running') return;
  for(const [offset,frequency] of [[0,740],[.16,980]]){
    const at=context.currentTime+offset;
    const tone=context.createOscillator();
    const volume=context.createGain();
    tone.frequency.value=frequency;
    volume.gain.setValueAtTime(.001,at);
    volume.gain.exponentialRampToValueAtTime(.15,at+.02);
    volume.gain.exponentialRampToValueAtTime(.001,at+.13);
    tone.connect(volume).connect(context.destination);
    tone.start(at);
    tone.stop(at+.14);
  }
}
