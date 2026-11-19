import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://cokmninazxmytcamfebd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_f12TezLEskQddifajhfgvw_QgWTmXxy';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);