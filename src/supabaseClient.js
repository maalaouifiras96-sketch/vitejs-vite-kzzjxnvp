import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvrfmbxjkomwpmkdbdz.supabase.co';
const supabaseKey = 'sb_publishable_o47f4PrXhBbRTawYD0t7fKQ_KNDINlq9';

export const supabase = createClient(supabaseUrl, supabaseKey);