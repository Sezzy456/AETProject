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
      .neq('ac_status', 'Completed')
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

    if (actErr || intErr || staErr) {
      console.error("Error fetching data", { actErr, intErr, staErr });
      return new Response(JSON.stringify({ error: "Failed to fetch context data", details: { actErr, intErr, staErr } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // 3. Prepare prompt for LLM
    const contextStr = `
Current Active Actions:
${JSON.stringify(actions, null, 2)}

Recent/Upcoming Interactions:
${JSON.stringify(interactions, null, 2)}

Stakeholders Needing Attention:
${JSON.stringify(stakeholders, null, 2)}
`;

    const prompt = `You are an executive AI assistant managing a strategic portfolio dashboard. Based on the following raw data from the system, write a concise, professional executive summary (1 paragraph, max 4 sentences). The summary should highlight the most critical upcoming or overdue actions, key stakeholders that need immediate attention, and briefly mention any upcoming strategic interactions. Be direct, actionable, and use a professional business tone. Do not use markdown formatting.

Data:
${contextStr}
`;

    // 4. Call Gemini API
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    const genaiReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3, // Low temperature for more factual/direct summaries
        }
      })
    });

    const genaiRes = await genaiReq.json();
    let generatedSummary = "AI could not generate a summary at this time.";
    
    if (genaiRes.candidates && genaiRes.candidates.length > 0) {
      generatedSummary = genaiRes.candidates[0].content.parts[0].text.trim();
    } else {
      console.error("Gemini API Error:", genaiRes);
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
