import { supabase } from './supabase.mjs';
import { t } from './locale.mjs';
import { exerciseKey, exerciseLabel } from './catalog.mjs';
import { unlockedSkin } from './skins.mjs';
import { modelFor } from './models.mjs';
import { tattoosFrom } from './tattoos.mjs';
import { backgroundId } from './gymbro.mjs';
import { instagramHandle,sharedPlansFrom } from './profile-extras.mjs';
import { beatenRecords, completedBest, completedCount, dayKey, weekKeys } from './training.mjs';

export const lifts = [
  { id: 'bench', label: 'Wyciskanie leżąc', display: 'Wyciskanie na ławce' },
  { id: 'squat', label: 'Przysiad', display: 'Przysiad ze sztangą' },
  { id: 'deadlift', label: 'Martwy ciąg', display: 'Martwy ciąg' },
];
export const clanPrLabels = new Set(lifts.map(({ label }) => exerciseLabel(label)));

export function liftResults(sessions) {
  const best = completedBest(sessions);
  return Object.fromEntries(lifts.map(({ id, label }) => {
    const entry = best.get(exerciseKey(label));
    return [id, entry ? { kg: entry.kg, reps: entry.reps } : null];
  }));
}

export function workoutRecord({ id, name, started, finished, exercises }) {
  return {
    id, name, started, finished, sets: completedCount({ exercises }),
    exercises: exercises.flatMap(({ label, sets }) => {
      const done = sets.filter(set => set.done).map(set => [Number(set.kg), Number(set.reps)]);
      return done.length ? [{ label, sets: done }] : [];
    }),
  };
}

export function clanProfile(sessions, wardrobe, progress, appearanceAt = 0) {
  const week = weekKeys();
  return {
    worn: wardrobe.worn,
    skin: unlockedSkin(wardrobe.skin, progress.level),
    appearanceAt,
    level: progress.level,
    week: week[0],
    workouts: sessions.filter(session => week.includes(dayKey(session.finished))).length,
    best: liftResults(sessions),
    recent: [...sessions].sort((a, b) => b.finished - a.finished).slice(0, 5).map(workoutRecord),
  };
}

export function workoutActivities(session, history, before, after) {
  const xp = after.xp - before.xp;
  const events = [{ id: session.id + '-workout', body: { kind: 'workout', label: session.name, xp } }];
  for (const record of beatenRecords(completedBest([session]), completedBest(history))) {
    if (!clanPrLabels.has(record.label)) continue;
    events.push({ id: session.id + '-pr-' + events.length, body: { kind: 'pr', ...record } });
  }
  if (after.level > before.level) events.push({ id: session.id + '-level', body: { kind: 'level', level: after.level } });
  return events;
}

const randomCode = (len) => Array.from({ length: len }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw Error(t('Zaloguj się w Ustawieniach, żeby korzystać ze Społeczności.'));
  return user;
}

const clanCalendar = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  fractionalSecondDigits: 3,
  hourCycle: 'h23',
});

function clanLocalTime(timestamp) {
  const { year, month, day, hour, minute, second, fractionalSecond } = Object.fromEntries(
    clanCalendar.formatToParts(timestamp).map(({ type, value }) => [type, Number(value)])
  );
  return new Date(Date.UTC(year, month-1, day, hour, minute, second, fractionalSecond));
}

export function clanTenure(joinedAt, now = Date.now()) {
  if (!joinedAt) return null;
  const joined = Date.parse(joinedAt);
  if (!Number.isFinite(joined) || joined > now) return null;
  const start = clanLocalTime(joined);
  const end = clanLocalTime(now);
  const days = Math.max(0, Math.floor((end-start)/86400000));
  if (days < 7) return { unit: 'day', amount: days };

  const year = end.getUTCFullYear(), month = end.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month+1, 0)).getUTCDate();
  const anniversary = Date.UTC(year, month, Math.min(lastDay, start.getUTCDate()),
    start.getUTCHours(), start.getUTCMinutes(), start.getUTCSeconds(), start.getUTCMilliseconds());
  const months = (year-start.getUTCFullYear())*12 + month-start.getUTCMonth() - Number(end < anniversary);
  if (months >= 12) return { unit: 'year', amount: Math.floor(months/12), months: months%12 };
  if (months > 0) return { unit: 'month', amount: months };
  return { unit: 'week', amount: Math.floor(days/7) };
}

function mapMember(p) {
  return {
    id: p.id,
    nick: p.username,
    level: p.level ?? 1,
    worn: p.worn ?? [],
    tattoos: tattoosFrom(p.app_data?.wardrobe?.tattoos),
    skin: unlockedSkin(p.equipped_skin, p.level ?? 1),
    model: modelFor(p.app_data?.wardrobe?.model).id,
    background: backgroundId(p.app_data?.wardrobe?.background),
    instagram: instagramHandle(p.app_data?.publicProfile?.instagram) ?? '',
    plans: sharedPlansFrom(p.app_data?.publicProfile?.plans),
    week: p.week_key ?? '',
    workouts: p.week_workouts ?? 0,
    tenure: clanTenure(p.clan_joined_at),
    photo: null,
    best: p.best_lifts ?? {},
    recent: (p.recent_workouts ?? []).map(w => ({ ...w, hasDetails: Boolean(w.exercises?.length) })),
  };
}

export async function profileRequest(payload) {
  const user = await getUser();
  if (payload?.nick) {
    const nick = payload.nick.trim();
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
    if (existing) {
      const { error } = await supabase.from('profiles').update({ username: nick }).eq('id', user.id);
      if (error) throw Error(error.message.includes('unique') ? t('Ten nick jest już zajęty.') : error.message);
    } else {
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        username: nick,
        friend_code: randomCode(8),
      });
      if (error) throw Error(error.message.includes('unique') ? t('Ten nick jest już zajęty.') : error.message);
    }
    return { nick, photo: null };
  }
  const { data } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
  return { nick: data?.username ?? '', photo: null };
}

async function buildClanSnapshot(userId) {
  const week = weekKeys()[0];
  const { data: me } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!me?.clan_id) return { self: userId, week, clan: null, members: [], messages: [] };

  const [{ data: clan }, { data: members }, { data: msgs }] = await Promise.all([
    supabase.from('clans').select('*').eq('id', me.clan_id).maybeSingle(),
    supabase.from('profiles').select('*').eq('clan_id', me.clan_id),
    supabase.from('clan_messages').select('*').eq('clan_id', me.clan_id).order('created_at', { ascending: false })
      .order('id', { ascending: false }).limit(80),
  ]);

  if (!clan) return { self: userId, week, clan: null, members: [], messages: [] };

  return {
    self: userId,
    week,
    clan: { id: clan.id, name: clan.name, tag: clan.tag, code: clan.code, ownerId: clan.owner_id },
    members: (members ?? []).map(mapMember),
    messages: (msgs ?? []).reverse().map((m, idx) => ({
      seq: idx + 1,
      id: m.id,
      sender: m.user_id,
      nick: m.username,
      type: m.type ?? 'chat',
      body: m.type === 'activity' ? m.payload : m.content,
      sent_at: new Date(m.created_at).getTime(),
      workoutAvailable: false,
    })),
  };
}

export async function clanRequest(payload) {
  const user = await getUser();
  if (!payload) return buildClanSnapshot(user.id);

  if (payload.action === 'create') {
    const code = randomCode(6);
    const { data: clan, error } = await supabase
      .from('clans')
      .insert({ name: payload.name.trim(), tag: payload.tag.trim().toUpperCase(), code, owner_id: user.id })
      .select()
      .single();
    if (error) throw Error(t('Nie udało się utworzyć klanu (sprawdź, czy nazwa lub tag nie są zajęte).'));
    await supabase.from('profiles').update({ clan_id: clan.id }).eq('id', user.id);
    return buildClanSnapshot(user.id);
  }

  if (payload.action === 'join') {
    const { data: clan } = await supabase.from('clans').select('id').eq('code', payload.code.trim().toUpperCase()).maybeSingle();
    if (!clan) throw Error(t('Nie znaleziono klanu o tym kodzie.'));
    await supabase.from('profiles').update({ clan_id: clan.id }).eq('id', user.id);
    return buildClanSnapshot(user.id);
  }

  if (payload.action === 'leave') {
    await supabase.from('profiles').update({ clan_id: null }).eq('id', user.id);
    return buildClanSnapshot(user.id);
  }

  if (payload.action === 'kick') {
    const { data: removed, error } = await supabase.rpc('gymbro_remove_clan_member', {
      p_clan_id: String(payload.clanId),
      p_member_id: payload.memberId,
    });
    if (error?.code === '42501') throw Error(t('Tylko lider może usunąć innego członka klanu.'));
    if (error?.code === 'PGRST202') throw Error(t('Usuwanie członków wymaga aktualizacji bazy danych.'));
    if (error) throw Error(t('Nie udało się usunąć członka klanu. Spróbuj ponownie.'));
    return { removed, snapshot: await buildClanSnapshot(user.id) };
  }

  if (payload.action === 'chat') {
    const { data: me } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    await supabase.from('clan_messages').upsert({
      clan_id: payload.clanId,
      user_id: user.id,
      username: me.username,
      type: 'chat',
      content: payload.message,
      client_id: payload.id,
    }, { onConflict: 'client_id' });
    return buildClanSnapshot(user.id);
  }

  if (payload.action === 'sync') {
    const p = payload.profile;
    const { data: me } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    await supabase.from('profiles').update({
      level: p.level,
      equipped_skin: p.skin,
      preview_skin: null,
      worn: p.worn,
      appearance_at: p.appearanceAt,
      week_key: p.week,
      week_workouts: p.workouts,
      best_lifts: p.best,
      recent_workouts: p.recent,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    for (const ev of payload.events ?? []) {
      await supabase.from('clan_messages').upsert({
        clan_id: payload.clanId,
        user_id: user.id,
        username: me.username,
        type: 'activity',
        content: ev.body.kind,
        payload: ev.body,
        client_id: ev.id,
      }, { onConflict: 'client_id' });
    }
    return { ok: true };
  }

  if (payload.action === 'workout') {
    const { data: peer } = await supabase.from('profiles').select('recent_workouts').eq('id', payload.peer).single();
    const workout = (peer?.recent_workouts ?? []).find(w => w.id === payload.workout);
    if (!workout) throw Error(t('Nie znaleziono szczegółów treningu.'));
    return workout;
  }

  return buildClanSnapshot(user.id);
}

async function buildFriendsSnapshot(userId) {
  const { data: me } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!me?.username) return { self: null, friends: [], incoming: [], outgoing: [] };
  if (!me.friend_code) {
    const code = randomCode(8);
    await supabase.from('profiles').update({ friend_code: code }).eq('id', userId);
    me.friend_code = code;
  }
  const { data: rels } = await supabase.from('friendships').select('*').or(`user_a.eq.${userId},user_b.eq.${userId}`);
  const peerIds = [...new Set((rels ?? []).map(r => (r.user_a === userId ? r.user_b : r.user_a)))];
  const { data: peers } = peerIds.length ? await supabase.from('profiles').select('*').in('id', peerIds) : { data: [] };
  const byId = new Map((peers ?? []).map(p => [p.id, mapMember(p)]));

  const friends = [], incoming = [], outgoing = [];
  for (const r of rels ?? []) {
    const peerId = r.user_a === userId ? r.user_b : r.user_a;
    const person = byId.get(peerId);
    if (!person) continue;
    if (r.status === 'accepted') friends.push(person);
    else if (r.user_b === userId) incoming.push(person);
    else outgoing.push(person);
  }
  return { self: { id: me.id, code: me.friend_code }, friends, incoming, outgoing };
}

export async function friendsRequest(payload) {
  const user = await getUser();
  if (!payload) return buildFriendsSnapshot(user.id);

  if (payload.action === 'setup') return buildFriendsSnapshot(user.id);

  if (payload.action === 'invite') {
    const { data: peer } = await supabase.from('profiles').select('id').eq('friend_code', payload.code.trim().toUpperCase()).maybeSingle();
    if (!peer || peer.id === user.id) throw Error(t('Nie znaleziono gracza o tym kodzie.'));
    await supabase.from('friendships').insert({ user_a: user.id, user_b: peer.id, status: 'pending' });
    return buildFriendsSnapshot(user.id);
  }

  if (payload.action === 'accept') {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('user_a', payload.peer).eq('user_b', user.id);
    return buildFriendsSnapshot(user.id);
  }

  if (payload.action === 'decline' || payload.action === 'remove') {
    await supabase.from('friendships').delete().or(`and(user_a.eq.${user.id},user_b.eq.${payload.peer}),and(user_a.eq.${payload.peer},user_b.eq.${user.id})`);
    return buildFriendsSnapshot(user.id);
  }

  if (payload.action === 'sync') {
    const p = payload.profile;
    await supabase.from('profiles').update({
      level: p.level,
      equipped_skin: p.skin,
      preview_skin: null,
      worn: p.worn,
      appearance_at: p.appearanceAt,
      best_lifts: p.best,
      recent_workouts: p.recent,
    }).eq('id', user.id);
    return { ok: true };
  }

  if (payload.action === 'workout') {
    const { data: peer } = await supabase.from('profiles').select('recent_workouts').eq('id', payload.peer).single();
    const workout = (peer?.recent_workouts ?? []).find(w => w.id === payload.workout);
    if (!workout) throw Error(t('Nie znaleziono szczegółów treningu.'));
    return workout;
  }

  return buildFriendsSnapshot(user.id);
}
