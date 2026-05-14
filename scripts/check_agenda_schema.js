const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bhfuframpeysqncouxax.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Q1XB1iVRhiJq29cYubL0VQ_oANxFDOp';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
    // Just try inserting a dummy row and catch the error to see what columns don't exist
    const { data, error } = await supabase.from('tbl_interaction_agenda_item').insert([{
        iai_interaction_original_id: 'test',
        iai_type: 'test',
        iai_action_id: 'test',
        iai_objective_id: 1,
        iai_details: 'test',
        iai_order: 1,
        iai_active: true,
        iai_created: new Date().toISOString()
    }]).select();
    
    console.log("Error:", error);
}

checkSchema();
