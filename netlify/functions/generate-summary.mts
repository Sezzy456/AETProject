import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export default async (req: Request, context: Context) => {
  try {
    // 1. Initialize Supabase client (Read-Only)
    const supabaseUrl = Netlify.env.get('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseKey = Netlify.env.get('SUPABASE_ANON_KEY') || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // 2. Fetch Context Data (Read-Only)
    // - Actions (active/overdue)
    const { data: actions, error: actErr } = await supabaseClient
      .from('tbl_action')
      .select('act_activity, act_status, act_due_date, act_owner')
      .neq('act_status', 'Completed')
      .limit(10);

    // - Interactions (Upcoming or recent)
    const { data: interactions, error: intErr } = await supabaseClient
      .from('tbl_activity_log')
      .select('al_title, al_date, al_type')
      .order('al_date', { ascending: false })
      .limit(10);

    // - Stakeholders needing attention
    const { data: stakeholders, error: staErr } = await supabaseClient
      .from('tbl_stakeholder')
      .select('sta_name, sta_status')
      .in('sta_status', ['Needs Attention', 'Critical/At Risk', 'Strained', 'Friction Points']);

    if (actErr || intErr || staErr) {
      console.error("Error fetching data from Supabase", { actErr, intErr, staErr });
      throw new Error("Failed to fetch context data");
    }

    // 3. Prepare prompt for OpenAI
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

    // 4. Call OpenAI API
    const OPENAI_API_KEY = Netlify.env.get('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Updated to gpt-4
      messages: [
        { role: "system", content: "You are a helpful executive assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
    });

    let generatedSummary = completion.choices[0]?.message?.content?.trim();

    if (!generatedSummary) {
      throw new Error("Failed to generate summary from OpenAI");
    }

    // Return the summary. We are NOT writing back to Supabase. This is READ-ONLY.
    return new Response(JSON.stringify({ success: true, summary: generatedSummary }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Netlify function error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

export const config: Config = {
  path: "/api/generate-summary"
};
