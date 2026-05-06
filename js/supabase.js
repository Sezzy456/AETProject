// ═══════════════════════════════════════════════════════════════
//  AET Portal — Supabase Data Access Layer
//  All table/column names are LOWERCASE because PostgreSQL
//  folds unquoted identifiers to lowercase.
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://bhfuframpeysqncouxax.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Q1XB1iVRhiJq29cYubL0VQ_oANxFDOp';

let _sb = null;
let _sbReady = false;
let _sbCache = {};

function initSupabase() {
    try {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('[Supabase] Client initialised');
            return true;
        }
    } catch (e) { console.warn('[Supabase] Failed to init:', e); }
    return false;
}

const STATUS_INT_TO_LABEL = { 1:'Operational', 2:'Stable', 3:'Friction Points', 4:'Strained', 5:'Critical/At Risk', 6:'Dormant' };
const INFLUENCE_INT_TO_LABEL = { 1:'Low', 2:'Medium', 3:'High' };
const LABEL_TO_STATUS_INT = {};
Object.entries(STATUS_INT_TO_LABEL).forEach(([k,v]) => { LABEL_TO_STATUS_INT[v] = parseInt(k); });

// ── STAKEHOLDERS ────────────────────────────────────────────────

async function fetchStakeholders() {
    if (!_sb) return null;
    try {
        const { data: rows, error } = await _sb.from('tbl_stakeholder').select('*').eq('sta_active', true);
        if (error) throw error;

        const { data: allVersions } = await _sb.from('tbl_stakeholder')
            .select('sta_original_id, sta_status, sta_modified, sta_note, sta_active')
            .order('sta_modified', { ascending: true });

        const { data: stcRows } = await _sb.from('tbl_stakeholder_contact')
            .select('stc_stakeholder_original_id, stc_contact_id, stc_is_lead')
            .eq('stc_active', true);

        const { data: contacts } = await _sb.from('tbl_contact').select('*').eq('co_active', true);

        const contactMap = {};
        (contacts || []).forEach(c => { contactMap[c.co_id] = c; });

        return (rows || []).map(r => {
            const versions = (allVersions || []).filter(v => v.sta_original_id === r.sta_original_id);
            const statusHistory = versions.map(v => ({
                date: v.sta_modified ? new Date(v.sta_modified).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '',
                status: STATUS_INT_TO_LABEL[v.sta_status] || v.sta_status || 'Unknown',
                notes: v.sta_note || ''
            }));

            const stcForThis = (stcRows || []).filter(s => s.stc_stakeholder_original_id === r.sta_original_id);
            const contactsList = stcForThis.map(stc => {
                const c = contactMap[stc.stc_contact_id];
                if (!c) return null;
                return { id:'c'+c.co_id, name:`${c.co_first_name} ${c.co_last_name}`.trim(), role:c.co_role||'', isLead:stc.stc_is_lead||false, phone:c.co_phone||'', email:c.co_email||'' };
            }).filter(Boolean);

            const oc = contactMap[r.sta_owner_contact_id];
            const ownerName = oc ? `${oc.co_first_name} ${oc.co_last_name}`.trim() : '';

            return {
                id: r.sta_original_id, _dbId: r.sta_id, name: r.sta_name||'', role: r.sta_role||'',
                status: STATUS_INT_TO_LABEL[r.sta_status] || r.sta_status || 'Unknown',
                statusHistory, narrativeHook: r.sta_narrative_hook||'', values: r.sta_values||[],
                powerDynamics: { influence: INFLUENCE_INT_TO_LABEL[r.sta_influence]||'Low', interest: INFLUENCE_INT_TO_LABEL[r.sta_interest]||'Low', authority: r.sta_decision_authority||'', values: r.sta_values||[] },
                postureJourney: { current: r.sta_posture_current||'', desired: r.sta_posture_desired||'', nextStep: r.sta_posture_next_step||'', target: r.sta_posture_target_date||'' },
                strategicApproach: { barriers: r.sta_barriers||'', engagementApproach: r.sta_engagement_approach||'', tactics: [] },
                contactConduct: { preferences: r.sta_comm_preference||'', emailTone: r.sta_email_tone||'', elevatorPitches: r.sta_elevator_pitch||'' },
                relationships: { internalLink:'', externalTension:'', keyTies: contactsList.filter(c=>c.isLead).map(c=>c.name), frictionPoints:[] },
                owner: ownerName, contacts: contactsList, _note: r.sta_note||''
            };
        });
    } catch (e) { console.error('[Supabase] fetchStakeholders error:', e); return null; }
}

// ── ACTIONS ─────────────────────────────────────────────────────

async function fetchActions() {
    if (!_sb) return null;
    try {
        const { data: rows, error } = await _sb.from('tbl_action').select('*').eq('ac_active', true);
        if (error) throw error;

        const { data: ownerRows } = await _sb.from('tbl_action_owner').select('ao_action_original_id, ao_contact_id').eq('ao_active', true);
        const { data: audRows } = await _sb.from('tbl_action_audience').select('aa_action_original_id, aa_stakeholder_original_id').eq('aa_active', true);
        const { data: contacts } = await _sb.from('tbl_contact').select('co_id, co_first_name, co_last_name, co_organisation').eq('co_active', true);
        const { data: stakeholders } = await _sb.from('tbl_stakeholder').select('sta_original_id, sta_name').eq('sta_active', true);
        const { data: objectives } = await _sb.from('tbl_strategy_objective').select('so_id, so_text').eq('so_active', true);
        const { data: allVersions } = await _sb.from('tbl_action').select('ac_original_id, ac_status, ac_modified, ac_active').order('ac_modified', { ascending: true });

        const contactMap = {}; (contacts||[]).forEach(c => { contactMap[c.co_id] = c; });
        const staMap = {}; (stakeholders||[]).forEach(s => { staMap[s.sta_original_id] = s.sta_name; });
        const objMap = {}; (objectives||[]).forEach(o => { objMap[o.so_id] = { id:'obj'+o.so_id, text:o.so_text }; });

        return (rows || []).map(r => {
            const origId = String(r.ac_original_id);
            const owners = (ownerRows||[]).filter(o => String(o.ao_action_original_id)===origId).map(o => { const c=contactMap[o.ao_contact_id]; return c?(c.co_organisation||`${c.co_first_name} ${c.co_last_name}`.trim()):''; }).filter(Boolean);
            const audiences = (audRows||[]).filter(a => String(a.aa_action_original_id)===origId).map(a => staMap[a.aa_stakeholder_original_id]||a.aa_stakeholder_original_id).filter(Boolean);
            const objRef = r.ac_objective_id ? objMap[r.ac_objective_id] : null;
            const versions = (allVersions||[]).filter(v => String(v.ac_original_id)===origId);
            const previousVersions = versions.slice(0,-1).map(v => ({ version: v.ac_modified ? new Date(v.ac_modified).toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'2-digit'})+' '+new Date(v.ac_modified).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : '', note: v.ac_active?'Current':'Previous', who:'' }));
            const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'2-digit'})+' '+new Date(d).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : '';

            return {
                id: origId, _dbId: r.ac_id, activity: r.ac_title||'', description: r.ac_description||'',
                owner: [...new Set(owners)].join(' + '), audience: audiences,
                status: r.ac_status||'Pending', advancedStatus: r.ac_status_detail||'',
                tags: r.ac_tags||[], priority: r.ac_priority||'Medium', complexity: String(r.ac_complexity||3),
                phase: r.ac_phase ? 'Phase '+r.ac_phase : '', commsObjectiveId: objRef?objRef.id:'',
                desiredOutcome: r.ac_desired_outcome||'', desiredOutcomeType: r.ac_desired_outcome_type||'text',
                desiredOutcomeStakeholderId: r.ac_outcome_stakeholder_original_id||'', desiredPosture: r.ac_desired_posture||'',
                successCriteria: r.ac_success_criteria||'', kpiTarget: r.ac_kpi_target||'',
                timing: { granularity: r.ac_due_date_granularity||'day', dueDate: r.ac_due_date?new Date(r.ac_due_date).toISOString().substring(0,10):'', dueDateDisplay: r.ac_due_date_display||'', dueDetail: r.ac_due_detail||'', startDate: r.ac_start_date?new Date(r.ac_start_date).toISOString().substring(0,10):'', predictedLength: r.ac_predicted_length||'', predecessorActions:[] },
                resourceRequirement: r.ac_resource_requirement||'', todos: r.ac_todos||[], other: r.ac_note||'', privacy:'Public/Official',
                versionControl: { currentVersion: fmtDate(r.ac_modified), recentProgress: r.ac_recent_progress||'', currentBlockers: r.ac_current_blockers||'', taskCreated: fmtDate(r.ac_created), lastEdited: fmtDate(r.ac_modified), whoEdited:'', highlightChanges:false, dateCompleted: r.ac_date_completed?new Date(r.ac_date_completed).toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'2-digit'}):'', previousVersions }
            };
        });
    } catch (e) { console.error('[Supabase] fetchActions error:', e); return null; }
}

// ── INTERACTIONS ────────────────────────────────────────────────

async function fetchInteractions() {
    if (!_sb) return null;
    try {
        const { data: rows, error } = await _sb.from('tbl_interaction').select('*').eq('in_active', true).order('in_date', { ascending: false });
        if (error) throw error;

        const { data: attRows } = await _sb.from('tbl_interaction_attendee').select('ia_interaction_original_id, ia_contact_id').eq('ia_active', true);
        const { data: agendaRows } = await _sb.from('tbl_interaction_agenda_item').select('*').eq('iai_active', true).order('iai_order', { ascending: true });
        const { data: contacts } = await _sb.from('tbl_contact').select('co_id, co_first_name, co_last_name').eq('co_active', true);

        const contactMap = {}; (contacts||[]).forEach(c => { contactMap[c.co_id] = `${c.co_first_name} ${c.co_last_name}`.trim(); });
        const now = new Date();

        return (rows || []).map(r => {
            const origId = r.in_original_id;
            const intDate = r.in_date ? new Date(r.in_date) : null;
            const attendees = (attRows||[]).filter(a => a.ia_interaction_original_id===origId).map(a => contactMap[a.ia_contact_id]||'Unknown');
            const topics = (agendaRows||[]).filter(a => a.iai_interaction_original_id===origId).map(a => a.iai_details||a.iai_type||'');

            return {
                id: origId, _dbId: r.in_id, date: intDate?intDate.toLocaleDateString('en-GB',{weekday:'long',hour:'2-digit',minute:'2-digit'}):'',
                rawDate: intDate?intDate.toISOString().substring(0,10):'', type: intDate&&intDate>now?'Upcoming':'Recent',
                title: r.in_title||'', agenda: r.in_purpose||'', discussed: r.in_description||'',
                topics, attendees, outcomeScore: r.in_outcome_score, outcomeNotes: r.in_outcome_notes||'',
                followUpDate: r.in_follow_up_date?new Date(r.in_follow_up_date).toISOString().substring(0,10):''
            };
        });
    } catch (e) { console.error('[Supabase] fetchInteractions error:', e); return null; }
}

// ── STRATEGY SPINE ──────────────────────────────────────────────

async function fetchSpine() {
    if (!_sb) return null;
    try {
        const { data: objectives } = await _sb.from('tbl_strategy_objective').select('*').eq('so_active', true).order('so_order', { ascending: true });

        // Fetch content cards for the Strategy page (page 1)
        const { data: cards } = await _sb.from('tbl_content_card').select('*').eq('cc_page_id', 1).eq('cc_active', true).order('cc_order', { ascending: true });

        // Extract purpose from first card (order 1)
        const purposeCard = (cards||[]).find(c => c.cc_order === 1 && c.cc_card_type === 'card');
        const purpose = purposeCard ? purposeCard.cc_content : "The single source of truth for AET's Communication & Engagement Strategy (Phase 1).";

        // Extract narrative from the narrative card (order 5)
        const narrativeCard = (cards||[]).find(c => c.cc_order === 5 && c.cc_card_type === 'card');
        let narrative = { core: '', simple: '' };
        if (narrativeCard && narrativeCard.cc_content) {
            const parts = narrativeCard.cc_content.split('\n\nSimple: ');
            narrative.core = parts[0] || '';
            narrative.simple = parts[1] || '';
        }

        // Extract pillars: cards after the "Strategic Pillars" section (order > 6)
        const pillarCards = (cards||[]).filter(c => c.cc_order > 6 && c.cc_card_type === 'card');
        const pillars = pillarCards.map(c => {
            const lines = (c.cc_content || '').split('\n').filter(l => l.trim());
            const message = lines[0] || '';
            const proofPoints = lines.slice(1).map(l => l.replace(/^[•\-]\s*/, '').trim()).filter(Boolean);
            return { id: 'p' + c.cc_id, title: c.cc_title || '', message, proofPoints };
        });

        return {
            purpose, narrative,
            objectives: (objectives||[]).map(o => ({ id:'obj'+o.so_id, text:o.so_text||'' })),
            pillars, qa_library: []
        };
    } catch (e) { console.error('[Supabase] fetchSpine error:', e); return null; }
}

async function fetchKnowledgeBank() { return null; } // Falls back to mockData

// ── STATS ───────────────────────────────────────────────────────

async function fetchStats() {
    if (!_sb) return null;
    try {
        const { data: stas } = await _sb.from('tbl_stakeholder').select('sta_status').eq('sta_active', true);
        const { data: ints } = await _sb.from('tbl_interaction').select('in_date').eq('in_active', true);
        const { data: acts } = await _sb.from('tbl_action').select('ac_status').eq('ac_active', true);
        const now = new Date();
        return {
            stakeholders: { total:(stas||[]).length, healthy:(stas||[]).filter(s=>[1,2].includes(s.sta_status)).length, neutral:(stas||[]).length-(stas||[]).filter(s=>[1,2].includes(s.sta_status)).length-(stas||[]).filter(s=>[4,5].includes(s.sta_status)).length, atRisk:(stas||[]).filter(s=>[4,5].includes(s.sta_status)).length },
            interactions: { upcoming:(ints||[]).filter(i=>i.in_date&&new Date(i.in_date)>now).length, total:(ints||[]).length },
            actions: { total:(acts||[]).length, active:(acts||[]).filter(a=>a.ac_status==='In Progress').length }
        };
    } catch (e) { console.error('[Supabase] fetchStats error:', e); return null; }
}

// ── ENTITY SAVERS ───────────────────────────────────────────────

async function saveStakeholderStatus(originalId, newStatus, note) {
    if (!_sb) return false;
    try {
        const { data: current } = await _sb.from('tbl_stakeholder').select('*').eq('sta_original_id', originalId).eq('sta_active', true).single();
        if (!current) return false;
        await _sb.from('tbl_stakeholder').update({ sta_active: false }).eq('sta_id', current.sta_id);
        const { sta_id, ...rest } = current;
        const { error } = await _sb.from('tbl_stakeholder').insert({ ...rest, sta_status: LABEL_TO_STATUS_INT[newStatus]||current.sta_status, sta_note: note||`Status updated to ${newStatus}`, sta_active: true, sta_modified: new Date().toISOString() });
        if (error) throw error;
        console.log('[Supabase] Stakeholder version created:', originalId, '→', newStatus);
        return true;
    } catch (e) { console.error('[Supabase] saveStakeholderStatus error:', e); return false; }
}

async function saveInteraction(uiData, isNew) {
    if (!_sb) return false;
    try {
        if (isNew) {
            const { error } = await _sb.from('tbl_interaction').insert({
                in_original_id: 'int-'+Date.now(), in_title: uiData.title||'New Interaction',
                in_date: uiData.rawDate||new Date().toISOString(), in_type:'Other',
                in_purpose: uiData.agenda||'', in_description: uiData.discussed||uiData.agenda||'',
                in_active: true, in_created: new Date().toISOString(), in_created_by: 1,
                in_modified: new Date().toISOString(), in_modified_by: 1
            });
            if (error) throw error;
        }
        return true;
    } catch (e) { console.error('[Supabase] saveInteraction error:', e); return false; }
}

// ── DASHBOARD CARDS ─────────────────────────────────────────────

async function fetchDashboardCards() {
    if (!_sb) return null;
    try {
        const { data: cards } = await _sb.from('tbl_content_card').select('*').eq('cc_page_id', 3).eq('cc_active', true).order('cc_order', { ascending: true });
        return cards || [];
    } catch (e) { console.error('[Supabase] fetchDashboardCards error:', e); return null; }
}

async function fetchPageLinks() {
    if (!_sb) return null;
    try {
        const { data: links } = await _sb.from('tbl_content_page_content').select('*').eq('cpc_active', true);
        return links || [];
    } catch (e) { console.error('[Supabase] fetchPageLinks error:', e); return null; }
}

// ── PRE-FETCH + CACHE ───────────────────────────────────────────

async function preloadSupabaseData() {
    if (!_sb) return false;
    console.log('[Supabase] Pre-loading data...');
    try {
        const [stakeholders, actions, interactions, spine, stats, dashCards, pageLinks] = await Promise.all([
            fetchStakeholders(), fetchActions(), fetchInteractions(), fetchSpine(), fetchStats(),
            fetchDashboardCards(), fetchPageLinks()
        ]);
        if (stakeholders) _sbCache.stakeholders = stakeholders;
        if (actions) _sbCache.actions = actions;
        if (interactions) _sbCache.interactions = interactions;
        if (spine) _sbCache.spine = spine;
        if (stats) _sbCache.stats = stats;
        if (dashCards) _sbCache.dashboardCards = dashCards;
        if (pageLinks) _sbCache.pageLinks = pageLinks;
        _sbReady = Object.keys(_sbCache).length > 0;
        console.log('[Supabase] Cache loaded:', Object.keys(_sbCache).join(', '));
        return _sbReady;
    } catch (e) { console.error('[Supabase] Preload failed:', e); return false; }
}

// ── OVERRIDE getData/updateData/addData ─────────────────────────

const _origGetData = window.getData;
const _origUpdateData = window.updateData;
const _origAddData = window.addData;

window.getData = function(key) {
    if (_sbReady && _sbCache[key] !== undefined) return _sbCache[key];
    return _origGetData ? _origGetData(key) : null;
};
window.updateData = function(key, value) {
    if (_sbReady) { _sbCache[key] = value; return true; }
    return _origUpdateData ? _origUpdateData(key, value) : false;
};
window.addData = function(key, item) {
    if (_sbReady && _sbCache[key]) { item.id = item.id||Date.now(); _sbCache[key].push(item); return item; }
    return _origAddData ? _origAddData(key, item) : null;
};

// Override stakeholder status update
const _origUpdateDetailStatus = window.updateDetailStatus;
window.updateDetailStatus = async function(newStatus) {
    if (_sbReady) {
        const id = window.currentStakeholderId;
        if (!id) return;
        const saved = await saveStakeholderStatus(id, newStatus, 'Status manually updated in portal.');
        if (saved) {
            const fresh = await fetchStakeholders();
            if (fresh) _sbCache.stakeholders = fresh;
            if (typeof renderStakeholderDetail === 'function') renderStakeholderDetail();
            return;
        }
    }
    if (_origUpdateDetailStatus) _origUpdateDetailStatus(newStatus);
};

// Override save interaction
const _origSaveInteraction = window.saveInteraction;
window.saveInteraction = async function() {
    if (_sbReady) {
        const title = document.getElementById('edit-int-purpose')?.value||'New Interaction';
        const date = document.getElementById('edit-int-date')?.value||'';
        const desc = document.getElementById('edit-int-description')?.value||'';
        const saved = await saveInteraction({ title, rawDate:date, agenda:desc, discussed:desc }, !window.currentInteractionId);
        if (saved) {
            const fresh = await fetchInteractions();
            if (fresh) _sbCache.interactions = fresh;
            loadView('interactions');
            history.pushState(null,'','#interactions');
            return;
        }
    }
    if (_origSaveInteraction) _origSaveInteraction();
};

// ── BOOT ────────────────────────────────────────────────────────

window.bootSupabase = async function() {
    if (!initSupabase()) { console.warn('[Supabase] Client not available — using localStorage'); return; }
    const loaded = await preloadSupabaseData();
    if (loaded) {
        console.log('[Supabase] ✅ Data loaded — reloading current view');
        loadView(window.location.hash.replace('#','')||'dashboard');
    } else {
        console.warn('[Supabase] No data loaded — falling back to localStorage');
    }
};
