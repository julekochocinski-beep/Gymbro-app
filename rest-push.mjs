const storageKey = 'gymbro-rest-push-v1';

function readDevice() {
  try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; }
}

function decodeKey(value) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}

export function createRestPush(supabase, onChange, onScheduleError) {
  const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const installed = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  const needsInstall = appleMobile && !installed;
  const supported = !needsInstall && isSecureContext && 'serviceWorker' in navigator &&
    'PushManager' in window && 'Notification' in window;
  let registration;
  let busy = false;
  let error = '';
  const sending = new Set();
  let retryTimeout;

  if (supported) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then(worker => { registration = worker; onChange(); })
      .catch(() => { error = 'Nie udało się uruchomić powiadomień w tej przeglądarce.'; onChange(); });
  }

  const deviceFor = account => {
    const device = readDevice();
    return device?.account === account ? device : null;
  };

  async function sendPending(account, reportError = false) {
    if (!account || !supported || busy || Notification.permission !== 'granted') return;
    const device = deviceFor(account);
    const pending = device?.pending;
    if (!pending || sending.has(pending.version)) return;
    if (pending.deadline !== null && pending.deadline < Date.now() - 15000) return;
    sending.add(pending.version);
    let issue = '';
    try {
      const { data, error: failure } = await supabase.rpc('gymbro_set_rest_push', {
        p_device_id: device.id,
        p_version: pending.version,
        p_due_at: pending.deadline === null ? null : new Date(pending.deadline).toISOString(),
        p_language: pending.language,
      });
      if (failure) throw failure;
      const latest = deviceFor(account);
      if (latest?.id !== device.id || latest.pending?.version !== pending.version) return;
      if (data === true) {
        localStorage.setItem(storageKey, JSON.stringify({ ...latest, pending: null }));
      } else {
        localStorage.removeItem(storageKey);
        issue = 'Włącz powiadomienia ponownie w ustawieniach GymBro.';
      }
    } catch {
      const latest = deviceFor(account);
      if (latest?.id !== device.id || latest.pending?.version !== pending.version) return;
      issue = pending.deadline === null
        ? 'Nie udało się potwierdzić anulowania powiadomienia.'
        : 'Nie udało się zaplanować powiadomienia. Timer nadal działa.';
    } finally {
      sending.delete(pending.version);
    }
    error = issue;
    if (issue && reportError) {
      onScheduleError(issue);
      clearTimeout(retryTimeout);
      retryTimeout = setTimeout(() => { void sendPending(account); }, 3000);
    }
    onChange();
  }

  function update(account, rest, language) {
    if (!account || !supported || Notification.permission !== 'granted') return;
    const device = deviceFor(account);
    if (!device) return;
    const version = Math.max(Date.now(), device.version + 1);
    try {
      const pending = { version, deadline: rest?.deadline ?? null, language };
      localStorage.setItem(storageKey, JSON.stringify({ ...device, version, pending }));
      void sendPending(account, true);
    } catch {
      onScheduleError('Nie udało się zapisać ustawień powiadomień na tym urządzeniu.');
    }
  }

  async function enable(account, getRest, getLanguage) {
    if (busy || !account || !registration) return;
    busy = true;
    error = '';
    onChange();
    let enabled = false;
    try {
      // Safari requires the permission request within the tap, before any network call.
      if (await Notification.requestPermission() !== 'granted') return;
      const { data, error: failure } = await supabase.functions.invoke('rest-push', { method: 'GET' });
      if (failure || !data?.publicKey) throw Error('Serwer powiadomień GymBro jest niedostępny.');
      const key = decodeKey(data.publicKey);
      if (key.length !== 65 || key[0] !== 4) throw Error('Serwer powiadomień GymBro jest niedostępny.');
      const previous = deviceFor(account);
      let subscription = await registration.pushManager.getSubscription();
      const previousKey = subscription?.options?.applicationServerKey;
      if (subscription && (!previous || (previousKey && String(new Uint8Array(previousKey)) !== String(key)))) {
        await subscription.unsubscribe();
        subscription = null;
      }
      subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      const { endpoint, keys } = subscription.toJSON();
      const id = previous?.id ?? crypto.randomUUID();
      const result = await supabase.rpc('gymbro_register_rest_push', {
        p_device_id: id,
        p_endpoint: endpoint,
        p_p256dh: keys?.p256dh,
        p_auth: keys?.auth,
      });
      if (result.error) throw Error('Nie udało się zapisać subskrypcji powiadomień.');
      localStorage.setItem(storageKey, JSON.stringify({ account, id, version: previous?.version ?? 0, pending: null }));
      enabled = true;
    } catch (failure) {
      error = failure instanceof Error && [
        'Serwer powiadomień GymBro jest niedostępny.',
        'Nie udało się zapisać subskrypcji powiadomień.',
      ].includes(failure.message) ? failure.message : 'Nie udało się włączyć powiadomień. Spróbuj ponownie.';
    } finally {
      busy = false;
      onChange();
      if (enabled) {
        const rest = getRest();
        update(account, rest?.deadline > Date.now() ? rest : null, getLanguage());
      }
    }
  }

  async function disable(account) {
    const device = deviceFor(account);
    if (!device || busy) return;
    busy = true;
    error = '';
    onChange();
    try {
      const unsubscribe = async () => {
        const worker = registration ?? await navigator.serviceWorker.getRegistration();
        const subscription = await worker?.pushManager.getSubscription();
        return subscription ? subscription.unsubscribe() : true;
      };
      const remove = async () => {
        const { error: failure } = await supabase.rpc('gymbro_remove_rest_push', { p_device_id: device.id });
        return !failure;
      };
      const results = await Promise.allSettled([unsubscribe(), remove()]);
      if (!results.some(result => result.status === 'fulfilled' && result.value)) {
        throw Error();
      }
      if (deviceFor(account)?.id === device.id) localStorage.removeItem(storageKey);
    } catch {
      error = 'Nie udało się wyłączyć powiadomień. Spróbuj ponownie.';
    } finally {
      busy = false;
      onChange();
    }
  }

  return {
    status(account) {
      return {
        needsInstall, supported, ready: Boolean(registration), busy, error,
        subscribed: Boolean(account && deviceFor(account)),
        permission: supported ? Notification.permission : null,
      };
    },
    enable, disable, update, retry: account => sendPending(account),
  };
}
