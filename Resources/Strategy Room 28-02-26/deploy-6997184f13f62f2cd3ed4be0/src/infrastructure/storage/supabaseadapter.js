
import { strategyData } from '../../../data.js';

/**
 * Adapter: Supabase (Live)
 * Connects to the real database for multiplayer sync.
 * V2: Supports Relational Data (Stakeholders <-> Contacts)
 */
export class SupabaseAdapter {
    constructor(url, key, toastService) {
        console.log("SupabaseAdapter Loaded: v2.5 (High Stability)");
        this.toast = toastService;
        if (!window.supabase) {
            console.error("Supabase SDK not loaded. Check index.html");
            return;
        }
        this.client = window.supabase.createClient(url, key);
        this.initialized = false;
    }

    async load(isRetry = false) {
        try {
            // 1. Load all tables in parallel
            const [stakeholders, logs, decisions, actions, spine] = await Promise.all([
                this.client.from('stakeholders').select('*, contacts(*)'),
                this.client.from('activity_log').select('*'),
                this.client.from('decisions').select('*'),
                this.client.from('actions').select('*'),
                this.client.from('spine').select('*').limit(1)
            ]);

            // 2. Check for critical errors
            if (stakeholders.error) console.error("Load Error (SH):", stakeholders.error);
            if (logs.error) console.error("Load Error (Logs):", logs.error);
            if (decisions.error) console.error("Load Error (Dec):", decisions.error);
            if (actions.error) console.error("Load Error (Actions):", actions.error);

            if (stakeholders.error) return null;

            // 3. Auto-Seed if empty (First run)
            if (stakeholders.data.length === 0) {
                if (isRetry) {
                    console.warn("Database empty even after seeding attempt. Loading empty state.");
                } else {
                    console.log("Database empty. Seeding initial data from data.js...");
                    await this.seed();
                    return this.load(true); // Retry load once
                }
            }

            // 4. Map to App State Structure (Relational -> Flat View Model)
            const mappedStakeholders = stakeholders.data.map(s => {
                // Compatibility: Flatten primary contact into the main object for UI
                const primaryContact = s.contacts && s.contacts.length > 0
                    ? (s.contacts.find(c => c.is_primary) || s.contacts[0])
                    : null;

                return {
                    ...s,
                    // Legacy UI fields
                    contactName: primaryContact ? primaryContact.name : null,
                    email: primaryContact ? primaryContact.email : null,
                    phone: primaryContact ? primaryContact.phone : null,
                    address: primaryContact ? primaryContact.address : null,
                    // Data Model v2
                    contacts: s.contacts || []
                };
            });

            // Handle Spine
            let loadedSpine = strategyData.spine;
            const sData = spine.data[0];
            if (sData) {
                loadedSpine = {
                    purpose: sData.purpose || loadedSpine.purpose,
                    narrative: {
                        core: sData.narrative_core || (sData.content?.narrative?.core) || loadedSpine.narrative.core,
                        simple: sData.narrative_simple || (sData.content?.narrative?.simple) || loadedSpine.narrative.simple
                    },
                    pillars: sData.pillars || sData.content?.pillars || loadedSpine.pillars,
                    objectives: sData.objectives || sData.content?.objectives || loadedSpine.objectives,
                    qa_library: sData.qa_library || sData.content?.qa_library || loadedSpine.qa_library
                };
            }

            return {
                spine: loadedSpine,
                stakeholders: mappedStakeholders,
                activityLog: (logs.data || []).map(l => ({
                    ...l,
                    tags: l.implications || [], // Map DB implications -> UI tags
                    implications: l.implications || [],
                    stakeholders: l.stakeholders || [] // UI wants an array
                })),
                decisionRegister: decisions.data || [],
                initialActions: (actions.data || []).map(a => ({
                    ...a,
                    linkType: a.link_type, // Map snake_case to camelCase
                    linkId: a.link_id,
                    phase: a.phase
                }))
            };
        } catch (e) {
            console.error("Supabase Connection Failed:", e);
            if (this.toast) this.toast.show("Connection Failed. Working Offline.", "error");
            return null;
        }
    }

    async saveItem(collectionKey, item) {
        // 1. Initialize DB object immediately
        const dbItem = { ...item };
        let table = '';

        console.log(`DATABASE: Attempting save for [${collectionKey}]`, item);

        // 2. Route to specialized handlers if needed
        if (collectionKey === 'stakeholders') return this.saveStakeholder(item);

        // 3. Clean IDs for new items
        if (typeof dbItem.id === 'string' && (dbItem.id.startsWith('local_') || dbItem.id.startsWith('temp_'))) {
            delete dbItem.id;
        }

        // 4. Feature-Specific Mapping
        if (collectionKey === 'activityLog') {
            table = 'activity_log';
            // Map UI format to DB format
            dbItem.implications = item.tags || item.implications || [];
            dbItem.stakeholders = item.stakeholders || [];
            dbItem.date = item.date || new Date().toISOString().split('T')[0];

            // Remove UI-only properties
            delete dbItem.tags;
        }
        else if (collectionKey === 'decisionRegister' || collectionKey === 'decisions') {
            table = 'decisions';
            dbItem.impact = item.impact || item.implications || [];
            delete dbItem.implications;
        }
        else if (collectionKey === 'initialActions' || collectionKey === 'actions') {
            table = 'actions';
            dbItem.link_type = item.linkType;
            dbItem.link_id = item.linkId;
            delete dbItem.linkType;
            delete dbItem.linkId;
        }

        if (!table) {
            console.error("DATABASE ERROR: Unknown collection key", collectionKey);
            return item;
        }

        // 5. Execute Supabase Call
        try {
            console.log(`DATABASE: Final payload for ${table}:`, dbItem);
            const { data, error } = await this.client.from(table).upsert(dbItem).select().single();

            if (error) {
                console.error(`DATABASE ERROR [${table}]:`, error);
                if (this.toast) this.toast.show(`Save failed: ${error.message}`, "error");
                return item;
            }

            if (this.toast) this.toast.show("Saved successfully", "success");
            return data;
        } catch (e) {
            console.error("DATABASE CRITICAL ERROR:", e);
            return item;
        }
    }

    // Special handler for Stakeholder + Contact logic
    async saveStakeholder(s) {
        // 1. Separate Stakeholder Data from Contact Data
        const { contactName, email, phone, address, contacts, ...shData } = s;

        // Clean ID
        if (shData.id && shData.id.startsWith('local_')) delete shData.id;

        // 2. Upsert Stakeholder
        const { data: savedSh, error: shError } = await this.client.from('stakeholders').upsert(shData).select().single();

        if (shError) {
            console.error("SH Save Error:", shError);
            if (this.toast) this.toast.show("Failed to save Stakeholder", "error");
            return s; // Return original on error
        }

        // 3. Handle Contacts (V2: Multi-Contact Support)
        if (contacts && Array.isArray(contacts) && contacts.length > 0) {
            // Map partial UI contacts to DB schema 
            const contactPayloads = contacts.map(c => ({
                stakeholder_id: savedSh.id,
                id: (c.id && !c.id.toString().startsWith('local_')) ? c.id : undefined, // Let DB gen ID if new
                name: c.name,
                role: c.role,
                email: c.email,
                phone: c.phone,
                // address: c.address, 
                is_primary: c.is_primary || false
            }));

            // We must loop to upsert individually or use bulk upsert if IDs are present. 
            // Simple approach: Upsert one by one to key safe.
            for (const c of contactPayloads) {
                await this.client.from('contacts').upsert(c);
            }

        }
        // 4. Fallback: Legacy Implicit Primary Contact
        else if (contactName || email) {
            const contactPayload = {
                stakeholder_id: savedSh.id,
                name: contactName || "Primary Contact",
                role: "Primary",
                email: email,
                phone: phone,
                address: address,
                is_primary: true
            };

            const { data: existingContacts } = await this.client.from('contacts').select('id').eq('stakeholder_id', savedSh.id).eq('is_primary', true);

            if (existingContacts && existingContacts.length > 0) {
                await this.client.from('contacts').update(contactPayload).eq('id', existingContacts[0].id);
            } else {
                await this.client.from('contacts').insert(contactPayload);
            }
        }

        if (this.toast) this.toast.show("Saved Stakeholder", "success");
        return { ...s, id: savedSh.id };
    }

    async updateItem(collectionKey, item) {
        // reuse save logic for simplicity in this architecture
        return this.saveItem(collectionKey, item);
    }

    async deleteItem(collectionKey, id) {
        let table = '';
        if (collectionKey === 'activityLog') table = 'activity_log';
        else if (collectionKey === 'decisionRegister' || collectionKey === 'decisions') table = 'decisions';
        else if (collectionKey === 'initialActions' || collectionKey === 'actions') table = 'actions';
        else if (collectionKey === 'stakeholders') table = 'stakeholders';

        if (!table || !id) return;

        const { error } = await this.client.from(table).delete().eq('id', id);

        if (error) {
            console.error("Delete Error:", error);
            // if (this.toast) this.toast.show(`Delete failed: ${error.message}`, "error"); 
            return false;
        }
        if (this.toast) this.toast.show("Deleted", "success");
        return true;
    }

    async saveSpine(newSpine) {
        const { error } = await this.client.from('spine').upsert({
            id: 1,
            purpose: newSpine.purpose,
            narrative_core: newSpine.narrative.core,
            narrative_simple: newSpine.narrative.simple,
            pillars: newSpine.pillars,
            objectives: newSpine.objectives,
            qa_library: newSpine.qa_library
        });
        if (error) console.error("Spine Save Error:", error);
        return newSpine;
    }

    async resetDatabase() {
        console.log("Resetting Database...");
        const tables = ['actions', 'decisions', 'activity_log', 'contacts', 'stakeholders', 'spine'];

        // Delete all rows
        for (const t of tables) {
            try {
                // Delete everything where id is not null (effectively truncate)
                const { error } = await this.client.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                if (error) console.error(`Reset Error (${t}):`, error);
            } catch (e) { console.warn(e); }
        }

        await this.seed();
        // Force reload to refresh UI with new IDs
        window.location.reload();
    }

    async seed() {
        console.log("Seeding V2.1 Data (With Governance & Q&A)...");

        // 1. Stakeholders (With Governance)
        // Note: 'governance' field effectively needs to be stored. 
        // V2 Schema assumes 'governance' is a JSONB column. 
        // If it's not present, Supabase might throw an error if strict. 
        // However, Supabase JSON columns are flexible.
        const dbStakeholders = strategyData.stakeholders.map(s => ({
            name: s.name,
            role: s.role,
            influence: s.influence,
            interest: s.interest,
            posture_current: s.posture.current,
            posture_desired: s.posture.desired,
            posture_status: s.posture.status,
            narrative_hook: s.narrativeHook,
            engagement_strategy: s.engagementStrategy,
            owner: s.owner,
            governance: s.governance // Store as JSON
        }));

        const { data: savedStakeholders, error: shError } = await this.client.from('stakeholders').insert(dbStakeholders).select();
        if (shError) {
            console.error("Seeding Failed (Stakeholders):", shError);
            if (shError.message.includes('governance')) {
                console.warn("Schema mismatch: 'governance' column missing? Seeding without it.");
                // Fallback: Try seeding without governance if column is missing
                const fallbackStakeholders = dbStakeholders.map(({ governance, ...rest }) => rest);
                await this.client.from('stakeholders').insert(fallbackStakeholders).select();
            }
            // Continue best effort
        }

        // 2. Actions (With Linking)
        // Helper to resolve Link IDs from names
        const getID = (namePart) => {
            // Need to match against savedStakeholders which has REAL IDs
            if (!namePart || !savedStakeholders) return null;
            const found = savedStakeholders.find(s => s.name.toLowerCase().includes(namePart.toLowerCase()));
            return found ? found.id : null;
        };

        const dbActions = strategyData.initialActions.map(a => {
            let realLinkId = null;
            if (a.linkType === 'Stakeholder') {
                const sourceStakeholder = strategyData.stakeholders.find(s => s.id === a.linkId);
                // We try to find the NEWLY created ID for this stakeholder
                if (sourceStakeholder) {
                    realLinkId = getID(sourceStakeholder.name);
                }
            } else {
                realLinkId = a.linkId;
            }

            return {
                activity: a.activity,
                owner: a.owner,
                link_type: a.linkType,
                link_id: realLinkId || "unknown",
                status: a.status,
                phase: a.phase // Store Phase ("Phase 1" etc) - requires Schema column or loose
            };
        });

        const { error: axError } = await this.client.from('actions').insert(dbActions);
        if (axError) console.error("Seeding Actions Error:", axError);

        // 3. Spine (With Q&A Library)
        await this.saveSpine(strategyData.spine);

        console.log("Seeding Complete.");
    }
}
