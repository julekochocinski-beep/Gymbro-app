export function armorCount(battle,zone,goal){
  return Math.max(0,Math.min(goal,Math.floor(Number(battle.hits?.[zone])||0)));
}

export function golemArt(battle,view,goal){
  const side=view==='back'?'back':'front';
  const upper=armorCount(battle,side==='back'?'back':'chest',goal);
  const legs=armorCount(battle,'legs',goal);
  const frame=(step,layer='')=>'<img'+(layer?' class="'+layer+'"':'')+
    ' src="./assets/golem/'+side+(step?'-'+step:'')+'.webp" width="480" height="637" alt="" decoding="async">';
  return '<div class="golem-scene" aria-hidden="true">'+frame(upper)+
    (upper!==legs?frame(legs,'golem-scene-legs'):'')+
    (upper<goal?'<span class="golem-shield-glow" data-side="'+side+'" data-step="'+upper+'"></span>':'')+'</div>';
}

export function clanCodeFromSearch(search){
  const code=new URLSearchParams(search).get('klan')?.trim().toUpperCase()??'';
  return /^[A-Z0-9]{6}$/.test(code)?code:'';
}

export function clanInviteUrl(currentUrl,code){
  const url=new URL(currentUrl);
  url.search='';
  url.hash='';
  url.searchParams.set('klan',code);
  return url.href;
}
