const cracks={
  chest:['M132 104l-12 10-17 5-9 11-15 3','M103 119l4 11-11 13m24-29 10 6 14 1'],
  back:['M123 91l-14 14 3 10-12 14-2 14','M109 105l-16 4-13-4m20 24 13 5 10 13'],
  legs:['M78 250l-8 13 4 12-12 11m65-36 7 11-4 12 11 14','M70 263l-12 1-7 8m83-11 12 2 8 11'],
};

export function armorCount(battle,zone,goal){
  return Math.max(0,Math.min(goal,Math.floor(Number(battle.hits?.[zone])||0)));
}

export function golemArt(battle,view,goal){
  const back=view==='back';
  const zones=back?['back','legs']:['chest','legs'];
  return '<div class="golem-scene" aria-hidden="true"><img src="./assets/golem/'+(back?'back':'front')+'.webp" width="480" height="637" alt="" loading="lazy" decoding="async">'+
    '<svg viewBox="0 0 210 279" preserveAspectRatio="none">'+zones.map(zone=>{
      const count=armorCount(battle,zone,goal);
      if(!count) return '';
      const paths=cracks[zone];
      return '<g class="golem-damage damage-'+count+'" data-zone="'+zone+'"><path class="golem-fracture" d="'+paths[0]+'"/>'+
        (count>1?'<path class="golem-fracture branch" d="'+paths[1]+'"/>':'')+'</g>';
    }).join('')+'</svg></div>';
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
