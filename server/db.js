// ===== SUPABASE CLIENT =====
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL and SUPABASE_KEY must be set in .env');
    process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
