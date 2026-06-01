const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabaseUrl = 'https://bhfuframpeysqncouxax.supabase.co';
  const supabaseKey = 'sb_publishable_Q1XB1iVRhiJq29cYubL0VQ_oANxFDOp';
  const supabaseClient = createClient(supabaseUrl, supabaseKey);

  console.log("Fetching actions...");
  const { data: actions, error: actErr } = await supabaseClient
    .from('tbl_action')
    .select('ac_title, ac_status, ac_due_date')
    .neq('ac_status', 'Completed')
    .limit(10);
  console.log("Actions err:", actErr);

  console.log("Fetching interactions...");
  const { data: interactions, error: intErr } = await supabaseClient
    .from('tbl_interaction')
    .select('in_title, in_date, in_type')
    .order('in_date', { ascending: false })
    .limit(10);
  console.log("Interactions err:", intErr);

  console.log("Fetching stakeholders...");
  const { data: stakeholders, error: staErr } = await supabaseClient
    .from('tbl_stakeholder')
    .select('sta_name, sta_role, sta_status')
    .limit(15);
  console.log("Stakeholders err:", staErr);
}
run();
