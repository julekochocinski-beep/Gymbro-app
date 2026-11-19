import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://cokmninazxmytcamfebd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_f12TezLEskQddifajhfgvw_QgWTmXxy';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    fetch(input, init) {
      const url = new URL(input instanceof Request ? input.url : input);
      const isRestSchedule = url.origin === new URL(SUPABASE_URL).origin &&
        url.pathname === '/rest/v1/rpc/gymbro_set_rest_push';
      return fetch(input, isRestSchedule ? { ...init, keepalive: true } : init);
    },
  },
});
