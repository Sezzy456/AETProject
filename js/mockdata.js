// Mock Data Assets (Phase 3 Integration)

const mockData = {
    stats: {
        totalStakeholders: 12, // Updated based on JSON length
        upcomingMeetings: 5,
        openActions: 8,
        completedActions: 45
    },
    // STRATEGY SPINE (From strategy_backup_2026-02-02.json)
    spine: {
        pillars: [
            {
                id: "p1",
                title: "Regional Value",
                message: "AET’s ARRC keeps jobs, skills, and investment in the Loddon Mallee.",
                proofPoints: ["250 construction jobs", "New circular industries", "Local supply chains"]
            },
            {
                id: "p2",
                title: "Circular Leadership",
                message: "Positioning the region as a national leader in modern resource recovery.",
                proofPoints: ["AI-enabled precision sorting", "Scalable design (30k-80k tonnes)", "High-quality material recovery"]
            },
            {
                id: "p3",
                title: "Partnership and Trust",
                message: "Genuine long-term partners with open and transparent communication.",
                proofPoints: ["Community Reference Group", "Clear governance channels", "Strong CoGB engagement"]
            },
            {
                id: "p4",
                title: "Environmental Responsibility",
                message: "Turning waste into value for a cleaner, healthier environment.",
                proofPoints: ["80,000 tonnes CO₂e avoidance", "Supports 80% diversion target", "Reduced transport emissions"]
            },
            {
                id: "p5",
                title: "Economic Resilience",
                message: "A stable, reliable waste system providing long-term cost certainty.",
                proofPoints: ["Predictable pricing", "Reduced metro dependence", "Diversified revenue streams"]
            }
        ],
        purpose: "The single source of truth for AET's Communication & Engagement Strategy (Phase 1).",
        narrative: {
            core: "AET is turning regional waste into regional opportunity – keeping value, jobs and skills in the Loddon Mallee through one of Australia’s most advanced resource recovery projects.",
            simple: "We take household waste, clean it, sort it, and recover useful materials. Local businesses turn those materials into new products. It’s smart recycling that keeps value in the region."
        },
        objectives: [
            { id: "obj1", text: "Strengthen alignment and confidence across key stakeholders" },
            { id: "obj2", text: "Establish a clear, accessible and repeatable narrative" },
            { id: "obj3", text: "Build early trust and credibility" },
            { id: "obj4", text: "Equip advocates with practical tools" },
            { id: "obj5", text: "Shape early media understanding and tone" }
        ],
        qa_library: [
            {
                category: "Facility Overview",
                question: "What is the purpose of the ARRC?",
                answer: "It is a modern facility designed to recover valuable materials from household waste, reduce landfill use, and support local circular industries. It is not a waste-to-energy facility."
            },
            {
                category: "Technology",
                question: "What is 'precision sorting'?",
                answer: "A combination of AI, robotics, and optical sensors used to separate materials by shape, colour, and composition with high accuracy."
            },
            {
                category: "Environment",
                question: "How will it reduce emissions?",
                answer: "By diverting organics from landfill to avoid methane emissions, reducing long-haul transport, and enabling more local recycling."
            },
            {
                category: "Local Impact",
                question: "What about traffic and smell?",
                answer: "The facility uses a fully enclosed negative-pressure system to manage odour. Traffic will be routed via major roads to minimise impacts on local streets."
            },
            {
                category: "Governance",
                question: "How is this different from waste-to-energy?",
                answer: "Materials are cleaned, sorted, and reused as part of a resource recovery process. Energy outcomes are secondary and not the primary function."
            }
        ]
    },
    // STAKEHOLDERS (From strategy_backup_2026-02-02.json)
    stakeholders: [
        {
            id: "f1a8e4ef-fab6-4fb9-b45d-369a6a55abee",
            name: "City of Greater Bendigo (CoGB)",
            role: "Primary Partner",
            influence: "High",
            interest: "High",
            status: "Needs Attention",
            narrativeHook: "This project delivers long-term stability and value for Bendigo.",
            engagementStrategy: "Direct briefings; Rebuild confidence; Align narrative.",
            owner: "AET + Vant",
            contacts: []
        },
        {
            id: "f6f8e1e4-73a3-41d6-a1ec-58630add951d",
            name: "Neighbouring Councils",
            role: "Feedstock Partners",
            influence: "High",
            interest: "Medium",
            status: "Active",
            narrativeHook: "A reliable, future-ready regional solution.",
            engagementStrategy: "Benefit-led presentations; low-pressure education.",
            owner: "AET (Matt)",
            contacts: []
        },
        {
            id: "0dbcbb1c-4532-43e2-8a5b-5cb4286bb9dd",
            name: "Regulators (EPA/State/Fed)",
            role: "Governance",
            influence: "High",
            interest: "Medium",
            status: "Stable",
            narrativeHook: "Alignment with State circular economy targets.",
            engagementStrategy: "Structured technical documentation.",
            owner: "AET",
            contacts: []
        },
        {
            id: "457faa73-4a02-4a33-b199-4d0287df4405",
            name: "Local Industry",
            role: "Supply Chain",
            influence: "Medium",
            interest: "High",
            status: "Supportive",
            narrativeHook: "High-quality materials for new commercial opportunities.",
            engagementStrategy: "Partnership meetings; co-branding.",
            owner: "Vant",
            contacts: []
        },
        {
            id: "49bc9bc9-60e5-42dd-9366-ce4c6483bd16",
            name: "Community & Media",
            role: "Public License",
            influence: "High",
            interest: "High",
            status: "Monitor",
            narrativeHook: "Clean, smart recycling – not waste-to-energy.",
            engagementStrategy: "Proactive education; simple explainers.",
            owner: "Vant",
            contacts: []
        },
        {
            id: "514990eb-585f-4e2e-a823-aadae728d672",
            name: "Education Sector",
            role: "Future Workforce",
            influence: "Medium",
            interest: "High",
            status: "Active",
            narrativeHook: "STEM learning and career pathways in the circular economy.",
            engagementStrategy: "School visits; site tours; curriculum resources.",
            owner: "Vant + AET",
            contacts: []
        },
        {
            id: "a14dfa34-cf67-4f01-926e-a047926d8992",
            name: "Dja Dja Wurrung",
            role: "Cultural Partner",
            influence: "Medium",
            interest: "High",
            status: "Needs Attention",
            narrativeHook: "Respecting Country and integrating cultural values.",
            engagementStrategy: "Cultural protocols; formal meetings; listening.",
            owner: "AET",
            contacts: []
        },
        {
            id: "4aaaaaf3-3fb4-4941-a451-4f790a410e7b",
            name: "Local Sustainability Groups",
            role: "Advocates",
            influence: "Medium",
            interest: "High",
            status: "Active",
            narrativeHook: "Reframe waste as central to climate outcomes.",
            engagementStrategy: "Tailored briefings; co-presentations; data transparency.",
            owner: "AET + Vant",
            contacts: []
        },
        {
            id: "a28598e1-e3a7-4d3e-8f71-0b2627fe0dc8",
            name: "Local MPs (State/Fed)",
            role: "Political Support",
            influence: "High",
            interest: "Medium",
            status: "Stable",
            narrativeHook: "Jobs, environmental benefit, and cost stability.",
            engagementStrategy: "Short briefings; high-level summaries.",
            owner: "AET + Vant",
            contacts: []
        },
        {
            id: "17eda203-d814-42b7-9ebb-9fbc724f7885",
            name: "Investors & Finance Partners",
            role: "Capital",
            influence: "High",
            interest: "Medium",
            status: "Stable",
            narrativeHook: "Alignment, feedstock certainty, and regulatory stability.",
            engagementStrategy: "Milestone updates; demonstrate de-risking.",
            owner: "AET",
            contacts: []
        }
    ],
    // ACTIVITY LOG (Retained existing mock data for now, or could clear it)
    activityLog: [
        { id: 101, type: "Meeting", title: "Q3 Strategy Review", date: "2023-10-24", notes: "Reviewed quarterly goals.", attendees: "Sarah, John", status: "Completed" },
        { id: 102, type: "Decision", title: "Vendor Selection", date: "2023-10-25", notes: "Selected Tech Corp for IT overhaul.", attendees: "Board", status: "Final" },
        { id: 103, type: "Signal", title: "Policy Change Rumor", date: "2023-10-26", notes: "Heard rumors of new waste regulations.", attendees: "N/A", status: "Investigating" },
        { id: 104, type: "Meeting", title: "Partnership Kickoff", date: "2023-10-26", notes: "Kickoff with Green Initiative.", attendees: "Emily, Jessica", status: "Scheduled" }
    ],
    // ACTIONS (From strategy_backup_2026-02-02.json "initialActions")
    actions: [
        {
            id: "996cc5e6-a6f9-487e-8132-fb22b23d18bc",
            activity: "Stakeholder Messaging Toolkit",
            owner: "Vant",
            status: "Pending",
            phase: "Phase 1",
            linkType: "Objective",
            linkId: "obj2",
            dueDate: "2026-03-01" // Added mock due date
        },
        {
            id: "ce26e0fe-c915-455a-a934-75bed1df828a",
            activity: "Council Exec Briefings (CoGB)",
            owner: "AET",
            status: "Planned",
            phase: "Phase 1",
            linkType: "Stakeholder",
            linkId: "f1a8e4ef-fab6-4fb9-b45d-369a6a55abee", // Linked to CoGB
            dueDate: "2026-03-15"
        },
        {
            id: "e4bd8482-852c-4107-8a1d-608101c5c5bb",
            activity: "Regional Council Forum",
            owner: "AET + Vant",
            status: "Planned",
            phase: "Phase 1",
            linkType: "Stakeholder",
            linkId: "f6f8e1e4-73a3-41d6-a1ec-58630add951d",
            dueDate: "2026-04-01"
        },
        {
            id: "75d9daa1-8bcc-4f54-8bdd-468240e253f8",
            activity: "Project Microsite Launch",
            owner: "Vant",
            status: "In Progress",
            phase: "Phase 1",
            linkType: "Stakeholder",
            linkId: "all",
            dueDate: "2026-02-28"
        },
        {
            id: "8bc069d0-9c35-4da8-a54a-3416e1545b80",
            activity: "Media Pack Production",
            owner: "Vant",
            status: "Pending",
            phase: "Phase 1",
            linkType: "Stakeholder",
            linkId: "49bc9bc9-60e5-42dd-9366-ce4c6483bd16",
            dueDate: "2026-02-20"
        },
        {
            id: "166512b0-2dc8-4db3-9abc-b4bc9f02fe36",
            activity: "Community FAQ (Plain English)",
            owner: "Vant",
            status: "Pending",
            phase: "Phase 1",
            linkType: "Stakeholder",
            linkId: "49bc9bc9-60e5-42dd-9366-ce4c6483bd16",
            dueDate: "2026-02-25"
        },
        {
            id: "f7ec565b-470a-43ca-89d2-f331f237c211",
            activity: "Technical Q&A Docs",
            owner: "AET",
            status: "Planned",
            phase: "Phase 2",
            linkType: "Stakeholder",
            linkId: "0dbcbb1c-4532-43e2-8a5b-5cb4286bb9dd",
            dueDate: "2026-05-01"
        }
    ]
};

// Simulate local storage persistence
// Bumping to v8 to ensure new structure loads (FRESH LOAD)
if (!localStorage.getItem('portalData_v9')) {
    localStorage.setItem('portalData_v9', JSON.stringify(mockData));
}

window.getData = function (key) {
    const data = JSON.parse(localStorage.getItem('portalData_v9'));
    return data ? data[key] : null; // This will return 'spine' object if key is 'spine'
};

window.addData = function (key, item) {
    const data = JSON.parse(localStorage.getItem('portalData_v9'));
    if (data && data[key]) {
        item.id = item.id || Date.now(); // Keep existing ID if present
        data[key].push(item);
        localStorage.setItem('portalData_v9', JSON.stringify(data));
        return true;
    }
    return false;
};

// Helper for adding a contact to a stakeholder
window.addContact = function (stakeholderId, contact) {
    const data = JSON.parse(localStorage.getItem('portalData_v9'));
    const sh = data.stakeholders.find(s => s.id == stakeholderId);
    if (sh) {
        if (!sh.contacts) sh.contacts = [];
        sh.contacts.push(contact);
        localStorage.setItem('portalData_v9', JSON.stringify(data));
        return true;
    }
    return false;
}

// Helper for updating a stakeholder
window.updateStakeholder = function (id, updates) {
    const data = JSON.parse(localStorage.getItem('portalData_v9'));
    const index = data.stakeholders.findIndex(s => s.id == id);
    if (index !== -1) {
        data.stakeholders[index] = { ...data.stakeholders[index], ...updates };
        localStorage.setItem('portalData_v9', JSON.stringify(data));
        return true;
    }
    return false;
}
