import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvrfmbxjkomwpzmkdbdz.supabase.co/rest/v1/';
const supabaseKey = 'sb_publishable_o47f4PrxHbRTawyD0t7fKQ_KNDINLq9';

export const supabase = createClient(supabaseUrl, supabaseKey);