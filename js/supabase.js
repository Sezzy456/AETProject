// ═══════════════════════════════════════════════════════════════
//  AET Portal — Supabase Data Access Layer
//  Replaces localStorage with live Supabase reads/writes.
//  Keeps the same getData()/updateData()/addData() interface
//  so app.js render functions work unchanged.
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://bhfuframpeysqncouxax.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Q1XB1iVRhiJq29cYubL0VQ_oANxFDOp';

let _sb = null;
let _sbReady = false;
let _sbCache = {};  // In-memory cache: { stakeholders: [...], actions: [...], ... }

// ── Initialise Supabase client ──────────────────────────────────

function initSupabase() {
    try {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('[Supabase] Client initialised');
            return true;
        }
    } catch (e) {
        console.warn('[Supabase] Failed to init:', e);
    }
    return false;
}

// ── Status lookup maps ──────────────────────────────────────────

const STATUS_INT_TO_LABEL = {
    1: 'Operational', 2: 'Stable', 3: 'Friction Points',
    4: 'Strained', 5: 'Critical/At Risk', 6: 'Dormant'
};

const INFLUENCE_INT_TO_LABEL = { 1: 'Low', 2: 'Medium', 3: 'High' };

// ═══════════════════════════════════════════════════════════════
//  ENTITY FETCHERS — DB shape → UI shape
// ═══════════════════════════════════════════════════════════════

async function fetchStakeholders() {
    if (!_sb) return null;
    try {
        // Get active stakeholders
        const { data: rows, error } = await _sb
            .from('tbl_Stakeholder')
            .select('*')
            .eq('STA_active', true);
        if (error) throw error;

        // Get all versions for status history
        const { data: allVersions } = await _sb
            .from('tbl_Stakeholder')
            .select('STA_original_ID, STA_status, STA_modified, STA_note, STA_active')
            .order('STA_modified', { ascending: true });

        // Get contacts for stakeholders
        const { data: stcRows } = await _sb
            .from('tbl_Stakeholder_Contact')
            .select('STC_stakeholder_original_ID, STC_contact_ID, STC_is_lead')
            .eq('STC_active', true);

        // Get all contacts
        const { data: contacts } = await _sb
            .from('tbl_Contact')
            .select('*')
            .eq('CO_active', true);

        const contactMap = {};
        (contacts || []).forEach(c => { contactMap[c.CO_ID] = c; });

        return (rows || []).map(r => {
            // Build status history from all versions of this entity
            const versions = (allVersions || []).filter(v => v.STA_original_ID === r.STA_original_ID);
            const statusHistory = versions.map(v => ({
                date: v.STA_modified ? new Date(v.STA_modified).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
                status: STATUS_INT_TO_LABEL[v.STA_status] || v.STA_status || 'Unknown',
                notes: v.STA_note || ''
            }));

            // Build contacts array
            const stcForThis = (stcRows || []).filter(s => s.STC_stakeholder_original_ID === r.STA_original_ID);
            const contactsList = stcForThis.map(stc => {
                const c = contactMap[stc.STC_contact_ID];
                if (!c) return null;
                return {
                    id: 'c' + c.CO_ID,
                    name: `${c.CO_first_name} ${c.CO_last_name}`.trim(),
                    role: c.CO_role || '',
                    isLead: stc.STC_is_lead || false,
                    phone: c.CO_phone || '',
                    email: c.CO_email || ''
                };
            }).filter(Boolean);

            // Get owner contact name
            const ownerContact = contactMap[r.STA_owner_contact_ID];
            const ownerName = ownerContact ? `${ownerContact.CO_first_name} ${ownerContact.CO_last_name}`.trim() : '';

            return {
                id: r.STA_original_ID,
                _dbId: r.STA_ID,
                name: r.STA_name || '',
                role: r.STA_role || '',
                status: STATUS_INT_TO_LABEL[r.STA_status] || r.STA_status || 'Unknown',
                statusHistory: statusHistory,
                narrativeHook: r.STA_narrative_hook || '',
                values: r.STA_values || [],
                powerDynamics: {
                    influence: INFLUENCE_INT_TO_LABEL[r.STA_influence] || 'Low',
                    interest: INFLUENCE_INT_TO_LABEL[r.STA_interest] || 'Low',
                    authority: r.STA_decision_authority || '',
                    values: r.STA_values || []
                },
                postureJourney: {
                    current: r.STA_posture_current || '',
                    desired: r.STA_posture_desired || '',
                    nextStep: r.STA_posture_next_step || '',
                    target: r.STA_posture_target_date || ''
                },
                strategicApproach: {
                    barriers: r.STA_barriers || '',
                    engagementApproach: r.STA_engagement_approach || '',
                    tactics: []
                },
                contactConduct: {
                    preferences: r.STA_comm_preference || '',
                    emailTone: r.STA_email_tone || '',
                    elevatorPitches: r.STA_elevator_pitch || ''
                },
                relationships: {
                    internalLink: '',
                    externalTension: '',
                    keyTies: contactsList.filter(c => c.isLead).map(c => c.name),
                    frictionPoints: []
                },
                owner: ownerName,
                contacts: contactsList,
                _note: r.STA_note || ''
            };
        });
    } catch (e) {
        console.error('[Supabase] fetchStakeholders error:', e);
        return null;
    }
}

async function fetchActions() {
    if (!_sb) return null;
    try {
        const { data: rows, error } = await _sb
            .from('tbl_Action')
            .select('*')
            .eq('AC_active', true);
        if (error) throw error;

        // Get owners
        const { data: ownerRows } = await _sb
            .from('tbl_Action_Owner')
            .select('AO_action_original_ID, AO_contact_ID')
            .eq('AO_active', true);

        // Get audiences
        const { data: audRows } = await _sb
            .from('tbl_Action_Audience')
            .select('AA_action_original_ID, AA_stakeholder_original_ID')
            .eq('AA_active', true);

        // Get contacts for owner names
        const { data: contacts } = await _sb
            .from('tbl_Contact')
            .select('CO_ID, CO_first_name, CO_last_name, CO_organisation')
            .eq('CO_active', true);

        // Get stakeholders for audience names
        const { data: stakeholders } = await _sb
            .from('tbl_Stakeholder')
            .select('STA_original_ID, STA_name')
            .eq('STA_active', true);

        // Get objectives for linking
        const { data: objectives } = await _sb
            .from('tbl_Strategy_Objective')
            .select('SO_ID, SO_text')
            .eq('SO_active', true);

        // All versions for version history
        const { data: allVersions } = await _sb
            .from('tbl_Action')
            .select('AC_original_ID, AC_status, AC_modified, AC_modified_by, AC_active')
            .order('AC_modified', { ascending: true });

        const contactMap = {};
        (contacts || []).forEach(c => { contactMap[c.CO_ID] = c; });
        const staMap = {};
        (stakeholders || []).forEach(s => { staMap[s.STA_original_ID] = s.STA_name; });
        const objMap = {};
        (objectives || []).forEach(o => { objMap[o.SO_ID] = { id: 'obj' + o.SO_ID, text: o.SO_text }; });

        return (rows || []).map(r => {
            const origId = String(r.AC_original_ID);

            // Build owner string
            const owners = (ownerRows || [])
                .filter(o => String(o.AO_action_original_ID) === origId)
                .map(o => {
                    const c = contactMap[o.AO_contact_ID];
                    return c ? (c.CO_organisation || `${c.CO_first_name} ${c.CO_last_name}`.trim()) : '';
                })
                .filter(Boolean);
            const ownerStr = [...new Set(owners)].join(' + ');

            // Build audience array
            const audiences = (audRows || [])
                .filter(a => String(a.AA_action_original_ID) === origId)
                .map(a => staMap[a.AA_stakeholder_original_ID] || a.AA_stakeholder_original_ID)
                .filter(Boolean);

            // Objective link
            const objRef = r.AC_objective_ID ? objMap[r.AC_objective_ID] : null;

            // Version history
            const versions = (allVersions || []).filter(v => String(v.AC_original_ID) === origId);
            const previousVersions = versions.slice(0, -1).map(v => ({
                version: v.AC_modified ? new Date(v.AC_modified).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' + new Date(v.AC_modified).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
                note: v.AC_active ? 'Current version' : 'Previous version',
                who: ''
            }));

            const createdStr = r.AC_created ? new Date(r.AC_created).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' + new Date(r.AC_created).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
            const modifiedStr = r.AC_modified ? new Date(r.AC_modified).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' + new Date(r.AC_modified).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

            return {
                id: origId,
                _dbId: r.AC_ID,
                activity: r.AC_title || '',
                description: r.AC_description || '',
                owner: ownerStr,
                audience: audiences,
                status: r.AC_status || 'Pending',
                advancedStatus: r.AC_status_detail || '',
                tags: r.AC_tags || [],
                priority: r.AC_priority || 'Medium',
                complexity: String(r.AC_complexity || 3),
                phase: r.AC_phase ? 'Phase ' + r.AC_phase : '',
                commsObjectiveId: objRef ? objRef.id : '',
                desiredOutcome: r.AC_desired_outcome || '',
                desiredOutcomeType: r.AC_desired_outcome_type || 'text',
                desiredOutcomeStakeholderId: r.AC_outcome_stakeholder_original_ID || '',
                desiredPosture: r.AC_desired_posture || '',
                successCriteria: r.AC_success_criteria || '',
                kpiTarget: r.AC_kpi_target || '',
                timing: {
                    granularity: r.AC_due_date_granularity || 'day',
                    dueDate: r.AC_due_date ? new Date(r.AC_due_date).toISOString().substring(0, 10) : '',
                    dueDateDisplay: r.AC_due_date_display || '',
                    dueDetail: r.AC_due_detail || '',
                    startDate: r.AC_start_date ? new Date(r.AC_start_date).toISOString().substring(0, 10) : '',
                    predictedLength: r.AC_predicted_length || '',
                    predecessorActions: []
                },
                resourceRequirement: r.AC_resource_requirement || '',
                todos: r.AC_todos || [],
                other: r.AC_note || '',
                privacy: 'Public/Official',
                versionControl: {
                    currentVersion: modifiedStr,
                    recentProgress: r.AC_recent_progress || '',
                    currentBlockers: r.AC_current_blockers || '',
                    taskCreated: createdStr,
                    lastEdited: modifiedStr,
                    whoEdited: '',
                    highlightChanges: false,
                    dateCompleted: r.AC_date_completed ? new Date(r.AC_date_completed).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '',
                    previousVersions: previousVersions
                }
            };
        });
    } catch (e) {
        console.error('[Supabase] fetchActions error:', e);
        return null;
    }
}

async function fetchInteractions() {
    if (!_sb) return null;
    try {
        const { data: rows, error } = await _sb
            .from('tbl_Interaction')
            .select('*')
            .eq('IN_active', true)
            .order('IN_date', { ascending: false });
        if (error) throw error;

        // Get attendees
        const { data: attRows } = await _sb
            .from('tbl_Interaction_Attendee')
            .select('IA_interaction_original_ID, IA_contact_ID')
            .eq('IA_active', true);

        // Get agenda items
        const { data: agendaRows } = await _sb
            .from('tbl_Interaction_Agenda_Item')
            .select('*')
            .eq('IAI_active', true)
            .order('IAI_order', { ascending: true });

        // Get contacts
        const { data: contacts } = await _sb
            .from('tbl_Contact')
            .select('CO_ID, CO_first_name, CO_last_name')
            .eq('CO_active', true);

        const contactMap = {};
        (contacts || []).forEach(c => { contactMap[c.CO_ID] = `${c.CO_first_name} ${c.CO_last_name}`.trim(); });

        const now = new Date();

        return (rows || []).map(r => {
            const origId = r.IN_original_ID;
            const intDate = r.IN_date ? new Date(r.IN_date) : null;
            const isUpcoming = intDate && intDate > now;

            // Attendee names
            const attendees = (attRows || [])
                .filter(a => a.IA_interaction_original_ID === origId)
                .map(a => contactMap[a.IA_contact_ID] || 'Unknown')
                .filter(Boolean);

            // Agenda items as topics
            const topics = (agendaRows || [])
                .filter(a => a.IAI_interaction_original_ID === origId)
                .map(a => a.IAI_details || a.IAI_type || '');

            const dateStr = intDate ? intDate.toLocaleDateString('en-GB', { weekday: 'long', hour: '2-digit', minute: '2-digit' }) : '';
            const rawDate = intDate ? intDate.toISOString().substring(0, 10) : '';

            return {
                id: origId,
                _dbId: r.IN_ID,
                date: dateStr,
                rawDate: rawDate,
                type: isUpcoming ? 'Upcoming' : 'Recent',
                title: r.IN_title || '',
                agenda: r.IN_purpose || '',
                discussed: r.IN_description || '',
                topics: topics,
                attendees: attendees,
                outcomeScore: r.IN_outcome_score,
                outcomeNotes: r.IN_outcome_notes || '',
                followUpDate: r.IN_follow_up_date ? new Date(r.IN_follow_up_date).toISOString().substring(0, 10) : ''
            };
        });
    } catch (e) {
        console.error('[Supabase] fetchInteractions error:', e);
        return null;
    }
}

async function fetchSpine() {
    if (!_sb) return null;
    try {
        const { data: objectives } = await _sb
            .from('tbl_Strategy_Objective')
            .select('*')
            .eq('SO_active', true)
            .order('SO_order', { ascending: true });

        if (!objectives || objectives.length === 0) return null;

        return {
            purpose: 'The single source of truth for AET\'s Communication & Engagement Strategy (Phase 1).',
            narrative: {
                core: 'AET is turning regional waste into regional opportunity – keeping value, jobs and skills in the Loddon Mallee through one of Australia\'s most advanced resource recovery projects.',
                simple: 'We take household waste, clean it, sort it, and recover useful materials. Local businesses turn those materials into new products. It\'s smart recycling that keeps value in the region.'
            },
            objectives: (objectives || []).map(o => ({
                id: 'obj' + o.SO_ID,
                text: o.SO_text || ''
            })),
            pillars: [],
            qa_library: []
        };
    } catch (e) {
        console.error('[Supabase] fetchSpine error:', e);
        return null;
    }
}

async function fetchKnowledgeBank() {
    // Knowledge bank content (key messages, FAQs, audience messages) are currently
    // stored in mockData and aren't yet modelled as separate DB tables.
    // Return null to fall back to mockData.
    return null;
}

async function fetchStats() {
    if (!_sb) return null;
    try {
        const { data: stas } = await _sb.from('tbl_Stakeholder').select('STA_status').eq('STA_active', true);
        const { data: ints } = await _sb.from('tbl_Interaction').select('IN_date').eq('IN_active', true);
        const { data: acts } = await _sb.from('tbl_Action').select('AC_status').eq('AC_active', true);

        const now = new Date();
        const staTotal = (stas || []).length;
        const staHealthy = (stas || []).filter(s => [1, 2].includes(s.STA_status)).length;
        const staRisk = (stas || []).filter(s => [4, 5].includes(s.STA_status)).length;
        const staNeutral = staTotal - staHealthy - staRisk;

        const intUpcoming = (ints || []).filter(i => i.IN_date && new Date(i.IN_date) > now).length;

        const actTotal = (acts || []).length;
        const actActive = (acts || []).filter(a => a.AC_status === 'In Progress').length;

        return {
            stakeholders: { total: staTotal, healthy: staHealthy, neutral: staNeutral, atRisk: staRisk },
            interactions: { upcoming: intUpcoming, total: (ints || []).length },
            actions: { total: actTotal, active: actActive }
        };
    } catch (e) {
        console.error('[Supabase] fetchStats error:', e);
        return null;
    }
}


// ═══════════════════════════════════════════════════════════════
//  ENTITY SAVERS — UI shape → DB shape
// ═══════════════════════════════════════════════════════════════

const LABEL_TO_STATUS_INT = {};
Object.entries(STATUS_INT_TO_LABEL).forEach(([k, v]) => { LABEL_TO_STATUS_INT[v] = parseInt(k); });
const LABEL_TO_INFLUENCE_INT = { 'Low': 1, 'Medium': 2, 'High': 3 };

async function saveStakeholderStatus(originalId, newStatus, note) {
    if (!_sb) return false;
    try {
        // Get current active version
        const { data: current } = await _sb
            .from('tbl_Stakeholder')
            .select('*')
            .eq('STA_original_ID', originalId)
            .eq('STA_active', true)
            .single();
        if (!current) return false;

        // Mark current as inactive
        await _sb
            .from('tbl_Stakeholder')
            .update({ STA_active: false })
            .eq('STA_ID', current.STA_ID);

        // Create new version with updated status
        const { STA_ID, ...rest } = current;
        const newRow = {
            ...rest,
            STA_status: LABEL_TO_STATUS_INT[newStatus] || current.STA_status,
            STA_note: note || `Status updated to ${newStatus}`,
            STA_active: true,
            STA_modified: new Date().toISOString()
        };

        const { error } = await _sb.from('tbl_Stakeholder').insert(newRow);
        if (error) throw error;

        console.log('[Supabase] Stakeholder version created:', originalId, '→', newStatus);
        return true;
    } catch (e) {
        console.error('[Supabase] saveStakeholderStatus error:', e);
        return false;
    }
}

async function saveInteraction(uiData, isNew) {
    if (!_sb) return false;
    try {
        if (isNew) {
            const origId = 'int-' + Date.now();
            const { error } = await _sb.from('tbl_Interaction').insert({
                IN_original_ID: origId,
                IN_title: uiData.title || 'New Interaction',
                IN_date: uiData.rawDate || new Date().toISOString(),
                IN_type: 'Other',
                IN_purpose: uiData.agenda || '',
                IN_description: uiData.discussed || uiData.agenda || '',
                IN_active: true,
                IN_created: new Date().toISOString(),
                IN_created_by: 1,
                IN_modified: new Date().toISOString(),
                IN_modified_by: 1
            });
            if (error) throw error;
        }
        return true;
    } catch (e) {
        console.error('[Supabase] saveInteraction error:', e);
        return false;
    }
}


// ═══════════════════════════════════════════════════════════════
//  PRE-FETCH + CACHE LAYER
//  Loads all data from Supabase at startup, then serves from cache.
//  This lets getData() stay synchronous (matching existing app.js).
// ═══════════════════════════════════════════════════════════════

async function preloadSupabaseData() {
    if (!_sb) return false;
    console.log('[Supabase] Pre-loading data...');

    try {
        const [stakeholders, actions, interactions, spine, stats] = await Promise.all([
            fetchStakeholders(),
            fetchActions(),
            fetchInteractions(),
            fetchSpine(),
            fetchStats()
        ]);

        if (stakeholders) _sbCache.stakeholders = stakeholders;
        if (actions) _sbCache.actions = actions;
        if (interactions) _sbCache.interactions = interactions;
        if (spine) _sbCache.spine = spine;
        if (stats) _sbCache.stats = stats;
        // knowledgeBank falls back to mockData (not in DB yet)

        _sbReady = Object.keys(_sbCache).length > 0;
        console.log('[Supabase] Cache loaded:', Object.keys(_sbCache).join(', '));
        return _sbReady;
    } catch (e) {
        console.error('[Supabase] Preload failed:', e);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
//  OVERRIDE getData / updateData / addData
//  These replace the mockdata.js versions when Supabase is active.
// ═══════════════════════════════════════════════════════════════

// Store originals for fallback
const _origGetData = window.getData;
const _origUpdateData = window.updateData;
const _origAddData = window.addData;
const _origUpdateStakeholder = window.updateStakeholder;

window.getData = function (key) {
    if (_sbReady && _sbCache[key] !== undefined) {
        return _sbCache[key];
    }
    // Fallback to mockData/localStorage
    return _origGetData ? _origGetData(key) : null;
};

window.updateData = function (key, value) {
    if (_sbReady) {
        _sbCache[key] = value;
        // Fire-and-forget DB write for supported entities
        // (For now, cache-only. Full DB writes added per entity as needed.)
        return true;
    }
    return _origUpdateData ? _origUpdateData(key, value) : false;
};

window.addData = function (key, item) {
    if (_sbReady && _sbCache[key]) {
        item.id = item.id || Date.now();
        _sbCache[key].push(item);
        return item;
    }
    return _origAddData ? _origAddData(key, item) : null;
};

// Override stakeholder status update to write to Supabase
const _origUpdateDetailStatus = window.updateDetailStatus;
window.updateDetailStatus = async function (newStatus) {
    if (_sbReady) {
        const id = window.currentStakeholderId;
        if (!id) return;

        // Write new version to Supabase
        const saved = await saveStakeholderStatus(id, newStatus, 'Status manually updated in portal.');

        if (saved) {
            // Refresh stakeholder cache from DB
            const fresh = await fetchStakeholders();
            if (fresh) _sbCache.stakeholders = fresh;

            // Re-render
            if (typeof renderStakeholderDetail === 'function') {
                renderStakeholderDetail();
            }
            console.log('[Supabase] Stakeholder status updated:', id, '→', newStatus);
            return;
        }
    }
    // Fallback
    if (_origUpdateDetailStatus) _origUpdateDetailStatus(newStatus);
};

// Override save interaction to write to Supabase
const _origSaveInteraction = window.saveInteraction;
window.saveInteraction = async function () {
    if (_sbReady) {
        const title = document.getElementById('edit-int-purpose')?.value || 'New Interaction';
        const date = document.getElementById('edit-int-date')?.value || '';
        const desc = document.getElementById('edit-int-description')?.value || '';
        const isNew = !window.currentInteractionId;

        const saved = await saveInteraction({ title, rawDate: date, agenda: desc, discussed: desc }, isNew);

        if (saved) {
            // Refresh cache
            const fresh = await fetchInteractions();
            if (fresh) _sbCache.interactions = fresh;

            loadView('interactions');
            history.pushState(null, '', '#interactions');
            console.log('[Supabase] Interaction saved');
            return;
        }
    }
    // Fallback
    if (_origSaveInteraction) _origSaveInteraction();
};


// ═══════════════════════════════════════════════════════════════
//  BOOT — called from portal.html after all scripts load
// ═══════════════════════════════════════════════════════════════

window.bootSupabase = async function () {
    const ok = initSupabase();
    if (!ok) {
        console.warn('[Supabase] Client not available — using localStorage fallback');
        return;
    }

    const loaded = await preloadSupabaseData();
    if (loaded) {
        console.log('[Supabase] ✅ Data loaded from Supabase — reloading current view');
        // Re-render the current view with fresh data
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        loadView(hash);
    } else {
        console.warn('[Supabase] No data loaded — falling back to localStorage');
    }
};
