import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase client
    // We use the SERVICE_ROLE_KEY to bypass RLS since this is an automated background task
    // updating dashboard content.
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch Context Data
    // - Actions (active/overdue)
    const { data: actions, error: actErr } = await supabaseClient
      .from('tbl_action')
      .select('ac_title, ac_status, ac_due_date')
      .not('ac_status', 'in', '("Completed","Complete")')
      .order('ac_due_date', { ascending: true })
      .limit(10);

    // - Interactions (Upcoming or recent)
    const { data: interactions, error: intErr } = await supabaseClient
      .from('tbl_interaction')
      .select('in_title, in_date')
      .order('in_date', { ascending: false })
      .limit(10);

    // - Stakeholders needing attention (3: Friction Points, 4: Strained, 5: Critical/At Risk)
    const { data: stakeholders, error: staErr } = await supabaseClient
      .from('tbl_stakeholder')
      .select('sta_name, sta_status')
      .in('sta_status', [3, 4, 5]);

    const { data: aiBrain, error: abErr } = await supabaseClient
      .from('tbl_ai_brain')
      .select('ab_type, ab_domain, ab_statement')
      .eq('ab_active', true)
      .limit(50);

    if (actErr || intErr || staErr || abErr) {
      console.error("Error fetching data", { actErr, intErr, staErr, abErr });
      return new Response(JSON.stringify({ error: "Failed to fetch context data", details: { actErr, intErr, staErr, abErr } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    let currentDate = new Date().toISOString().split('T')[0];
    try {
      if (req.method === 'POST') {
        const bodyText = await req.clone().text();
        if (bodyText) {
          const body = JSON.parse(bodyText);
          if (body.localDate) {
            currentDate = body.localDate;
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse request body:", e);
    }

    // 3. Prepare prompt for LLM
    const contextStr = `
Current Date: ${currentDate}

AI Brain Items (Constraints, Rules, and Learned Patterns):
${JSON.stringify(aiBrain, null, 2)}

Current Active Actions:
${JSON.stringify(actions, null, 2)}

Recent/Upcoming Interactions:
${JSON.stringify(interactions, null, 2)}

Stakeholders Needing Attention:
${JSON.stringify(stakeholders, null, 2)}
`;

    const prompt = `You are an executive AI strategic advisor managing a strategic portfolio dashboard. Based on the raw data from the system, write a concise, professional executive summary (1 paragraph, max 4 sentences). 

Crucially, you must evaluate the Actions, Interactions, and Stakeholders against the "Project Core Truths" and the Current Date. Highlight the most critical upcoming or overdue actions, identify key stakeholders needing immediate attention, and provide synthesis and strategic advice on how to navigate friction points. 
IMPORTANT: Do not just parrot or copy-paste the exact phrases from the Core Truths (like "divergent BATNAs" or "Failed process"). Synthesize them into natural, high-level strategic guidance. Be direct, actionable, and use a professional business tone. Do not use markdown formatting.

Data:
${contextStr}
`;

    // 4. Call OpenAI API
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    const openaiReq = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, // Low temperature for more factual/direct summaries
      })
    });

    const openaiRes = await openaiReq.json();
    let generatedSummary = "AI could not generate a summary at this time.";
    
    if (openaiRes.choices && openaiRes.choices.length > 0) {
      generatedSummary = openaiRes.choices[0].message.content.trim();
    } else {
      console.error("OpenAI API Error:", openaiRes);
      throw new Error("Failed to generate summary from LLM");
    }

    // 5. Update the Executive Summary card in the database
    // Update the main Overview dashboard summary
    const { error: updateErr1 } = await supabaseClient
      .from('tbl_content_card')
      .update({ cc_content: generatedSummary })
      .eq('cc_title', 'Executive Summary');

    // Update the Retrospective dashboard summary as well (optional, but good to keep synced)
    const { error: updateErr2 } = await supabaseClient
      .from('tbl_content_card')
      .update({ cc_content: generatedSummary })
      .eq('cc_title', 'Retrospective Summary');

    if (updateErr1 || updateErr2) {
      console.error("Error updating summary card", { updateErr1, updateErr2 });
      throw new Error("Failed to update dashboard card");
    }

    return new Response(JSON.stringify({ success: true, summary: generatedSummary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
