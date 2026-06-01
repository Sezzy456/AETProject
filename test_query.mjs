import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://bhfuframpeysqncouxax.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Q1XB1iVRhiJq29cYubL0VQ_oANxFDOp';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
    // Attempt anon query
    console.log("Anon Query:");
    const anonRes = await supabase.from('tbl_stakeholder').select('*').limit(1);
    console.log(anonRes);
}

test();
