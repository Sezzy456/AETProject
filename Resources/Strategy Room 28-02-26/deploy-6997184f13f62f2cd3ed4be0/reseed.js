
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { strategyData } from './data.js';
import { SUPABASE_URL, SUPABASE_KEY } from './src/container.js';

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

async function reseed() {
    console.log("Reseeding Stakeholders...");

    // 1. Delete existing stakeholders (for MVP clean reset)
    // Note: Since cascade delete might not be on, we hope ID conflicts are handled or we upsert.
    // Upsert is safer.

    // Transform data.js structure to DB structure (snake_case)
    const seedStakeholders = strategyData.stakeholders.map(s => ({
        // We let Supabase generate IDs or map s.id if UUID? 
        // Current SupabaseAdapter didn't map s.id (s1, s2) to DB UUID.
        // It let DB generate UUIDs. 
        // IF we re-seed, we will create duplicates unless we truncate first.
        // Let's TRUNCATE for MVP purity to match data.js exactly.
        name: s.name,
        role: s.role,
        influence: s.influence,
        interest: s.interest,
        posture_current: s.posture.current,
        posture_desired: s.posture.desired,
        posture_status: s.posture.status,
        narrative_hook: s.narrativeHook,
        engagement_strategy: s.engagementStrategy,
        owner: s.owner
    }));

    const { error: deleteError } = await client.from('stakeholders').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (deleteError) {
        console.error("Delete Error:", deleteError);
    } else {
        console.log("Cleared existing stakeholders.");
    }

    const { data, error } = await client.from('stakeholders').insert(seedStakeholders).select();

    if (error) {
        console.error("Insert Error:", error);
    } else {
        console.log("Successfully inserted " + data.length + " stakeholders.");
    }
}

reseed();
