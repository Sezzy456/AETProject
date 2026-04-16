// Mock Data Assets (Phase 3 Integration)

const mockData = {
    stats: {
        stakeholders: { total: 16, healthy: 5, neutral: 8, atRisk: 3 },
        interactions: { upcoming: 2, total: 12 },
        actions: { total: 12, active: 4 }
    },
    aiOverview: "The team is currently focused on realigning key stakeholders following recent regulatory announcements. Immediate action is required on the messaging toolkit to ensure consistent communication across all channels. Upcoming interactions heavily feature Council engagement.",
    interactions: [
        {
            id: 201, date: "Friday 10:30am", rawDate: "2026-03-05", type: "Upcoming", title: "Weekly Update",
            agenda: "Update on what everyone's been up to",
            discussed: null,
            topics: ["Animation", "Government grant", "Council engagment"],
            attendees: ["Matt Griffin", "Linda Vo", "Rebecca Grant", "Adam Riley", "Sarah Evans"]
        },
        {
            id: 202, date: "Friday 10:30am", rawDate: "2026-02-27", type: "Recent", title: "Weekly Update",
            agenda: null,
            discussed: "Discussed blockages in the progress of the project",
            topics: ["Animation", "Government grant", "Council engagment"],
            attendees: ["Matt Griffin", "Linda Vo", "Rebecca Grant", "Adam Riley", "Sarah Evans"]
        }
    ],
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
            status: "Stable",
            statusHistory: [
                { date: "15 Jan 2026", status: "Critical/At Risk", notes: "Negotiations stalled. Mayor requested update." },
                { date: "02 Feb 2026", status: "Friction Points", notes: "Concerns raised over noise." },
                { date: "14 Mar 2026", status: "Stable", notes: "Initial meetings successful." }
            ],
            narrativeHook: "This project delivers long-term stability and value for Bendigo.",
            values: ["job creation", "budget savings", "environmental compliance"],
            powerDynamics: {
                influence: "Low",
                interest: "High",
                authority: "Veto power, Consultant, or informed",
                values: ["finance", "regulatory", "community-based"]
            },
            postureJourney: {
                current: "uneven; contract strain",
                desired: "strong, aligned advocate",
                nextStep: "\"MOU Signed\" or \"Council Approval.\"",
                target: "APR 2026"
            },
            strategicApproach: {
                barriers: "Concerned about noise pollution",
                engagementApproach: "The plan is currently to continue trying to go through via investors but now we will also try to approach the mayor and committee members directly.",
                tactics: [
                    { type: "brochure", text: "Brochure for committee members" }
                ]
            },
            contactConduct: {
                preferences: "formal letters, informal coffee meetings, or official briefings",
                emailTone: "make sure to be overly considerate, legally need to be able to say we've kept them in the loop",
                elevatorPitches: "for Council and Community"
            },
            relationships: {
                internalLink: "Linda Vo is the primary gatekeeper for the Mayor.",
                externalTension: "CoGB has a historical dispute with [Stakeholder X] over landfill sites.",
                keyTies: ["Linda Vo"],
                frictionPoints: []
            },
            owner: "AET + Vant",
            contacts: [
                {
                    id: "c1",
                    name: "Linda Vo",
                    role: "Comms",
                    isLead: true,
                    phone: "+61 400 000 000",
                    email: "linda.vo@cogb.vic.gov.au"
                },
                {
                    id: "c2",
                    name: "Sarah Evans",
                    role: "Web Developer",
                    isLead: false,
                    phone: "+61 411 111 111",
                    email: "sarah@example.com"
                }
            ]
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
            name: "Community",
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
            id: "media-stakeholder-1234",
            name: "Media",
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
    // ACTIONS (Expanded with full data schema v19)
    actions: [
        {
            id: "996cc5e6-a6f9-487e-8132-fb22b23d18bc",
            activity: "Stakeholder Messaging Toolkit",
            description: "Create a comprehensive toolkit providing clear, concise and repeatable messaging for stakeholders. This should cover core project benefits, risk mitigation, and responses to common objections.",
            owner: "Vant",
            audience: ["City of Greater Bendigo (CoGB)", "Surrounding Councils", "Local Business Groups"],
            status: "Pending",
            advancedStatus: "At Risk",
            tags: ["Comms", "Strategy"],
            priority: "ASAP",
            complexity: "3",
            phase: "Phase 1",
            commsObjectiveId: "obj2",
            desiredOutcome: "Stakeholders have clear, consistent messaging they can use when asked about the project.",
            desiredOutcomeType: "stakeholder_posture",
            desiredOutcomeStakeholderId: "sh1",
            desiredPosture: "Strong advocate",
            successCriteria: "Toolkit delivered to all key stakeholders. At least 3 council reps can independently articulate the core project benefits.",
            kpiTarget: "Toolkit delivered and distributed",
            assetIds: [],
            timing: {
                granularity: "month",
                dueDate: "2026-03-01",
                dueDateDisplay: "March 2026",
                dueDetail: "Ideally delivered before end-of-month Council meeting",
                startDate: "2026-02-10",
                predecessorActions: [],
                predictedLength: "3 weeks"
            },
            resourceRequirement: "Design time (~20hrs) + copywriting (~8hrs) + printing costs ($400-$600 est.)",
            todos: [
                { id: "t1", completed: false, detail: "Draft core messaging pillars" },
                { id: "t2", completed: false, detail: "Review with AET team" },
                { id: "t3", completed: false, detail: "Finalise design & layout" },
                { id: "t4", completed: false, detail: "Distribute to stakeholder contacts" }
            ],
            prerequisites: [],
            versionControl: {
                currentVersion: "24/03/26 17:40",
                recentProgress: "Messaging structure drafted — awaiting sign-off from Matt.",
                currentBlockers: "Pending AET sign-off on core messaging pillars before design can begin.",
                taskCreated: "24/03/26 17:38",
                lastEdited: "24/03/26 17:40",
                whoEdited: "Sarah Evans",
                highlightChanges: false,
                dateCompleted: "",
                previousVersions: [
                    { version: "24/03/26 17:38", note: "Task created", who: "Sarah Evans" }
                ]
            },
            other: "Consider coordinating timing with Council Exec Briefings to avoid messaging overlap.",
            privacy: {
                level: "attendees",
                customViewers: [],
                customEditors: []
            }
        },
        {
            id: "ce26e0fe-c915-455a-a934-75bed1df828a",
            activity: "Council Exec Briefings (CoGB)",
            description: "Coordinate and facilitate a series of executive briefings with City of Greater Bendigo council leadership to align on project scope, timeline and benefits.",
            owner: "AET",
            audience: ["City of Greater Bendigo (CoGB)"],
            status: "Planned",
            advancedStatus: "Underway - aim for mid-Mar completion",
            tags: ["Legal", "Financial"],
            priority: "High",
            complexity: "4",
            phase: "Phase 1",
            commsObjectiveId: "obj1",
            desiredOutcome: "Council executives briefed, aligned and actively supportive of the project proceeding to next phase.",
            desiredOutcomeType: "stakeholder_posture",
            desiredOutcomeStakeholderId: "sh2",
            desiredPosture: "Champion",
            successCriteria: "Briefing completed with documented next steps agreed. Council exec rep agrees to co-present at community meeting.",
            kpiTarget: "Briefing completed; next steps agreed",
            assetIds: [],
            timing: {
                granularity: "day",
                dueDate: "2026-03-15",
                dueDateDisplay: "15 Mar 2026",
                dueDetail: "",
                startDate: "2026-02-20",
                predecessorActions: ["996cc5e6-a6f9-487e-8132-fb22b23d18bc"],
                predictedLength: "4 weeks"
            },
            resourceRequirement: "Meeting facilitation (~4hrs/session x 3 sessions) + presentation materials preparation (~12hrs)",
            todos: [
                { id: "t1", completed: true, detail: "Confirm exec contact at CoGB" },
                { id: "t2", completed: true, detail: "Book initial meeting" },
                { id: "t3", completed: false, detail: "Prepare briefing deck" },
                { id: "t4", completed: false, detail: "Conduct briefing session 1" },
                { id: "t5", completed: false, detail: "Follow up with agreed actions" }
            ],
            prerequisites: ["996cc5e6-a6f9-487e-8132-fb22b23d18bc"],
            versionControl: {
                currentVersion: "14/03/26 09:00",
                recentProgress: "Initial meeting booked for 20th March. Briefing deck structure agreed.",
                currentBlockers: "Awaiting council calendar confirmation for sessions 2 & 3.",
                taskCreated: "10/02/26 10:00",
                lastEdited: "14/03/26 09:00",
                whoEdited: "Matt Griffin",
                highlightChanges: false,
                dateCompleted: "",
                previousVersions: [
                    { version: "10/02/26 10:00", note: "Task created", who: "Matt Griffin" },
                    { version: "01/03/26 14:30", note: "Status updated to Planned", who: "Sarah Evans" }
                ]
            },
            other: "",
            privacy: {
                level: "restricted",
                customViewers: ["Matt Griffin", "Sarah Evans"],
                customEditors: ["Matt Griffin"]
            }
        },
        {
            id: "e4bd8482-852c-4107-8a1d-608101c5c5bb",
            activity: "A5 Council Brochure",
            description: "Produce a high-quality brochure for council committee members.",
            owner: "Vant",
            audience: ["Surrounding Councils"],
            status: "In Progress",
            advancedStatus: "",
            tags: ["Comms"],
            priority: "High",
            complexity: "2",
            phase: "Phase 1",
            commsObjectiveId: "obj1",
            desiredOutcome: "Strengthen alignment & confidence across key stakeholders",
            kpiTarget: "Brochure printed and distributed",
            assetIds: [],
            stakeholderPosture: "",
            timing: {
                dueDate: "2026-04-01",
                startDate: "2026-03-01",
                predictedLength: "1 month"
            },
            resourceRequirement: "Graphic design + printing costs",
            todos: [
                { id: "t1", completed: true, detail: "Draft content approved" },
                { id: "t2", completed: false, detail: "Send to printer" }
            ],
            prerequisites: ["996cc5e6-a6f9-487e-8132-fb22b23d18bc"],
            versionControl: {
                currentVersion: "01/04/26 12:00",
                recentProgress: "Design finalised",
                currentBlockers: "",
                taskCreated: "01/03/26 09:00",
                lastEdited: "01/04/26 12:00",
                whoEdited: "Sarah Evans",
                highlightChanges: false,
                dateCompleted: ""
            },
            other: "",
            privacy: "Public/Official"
        },
        {
            id: "75d9daa1-8bcc-4f54-8bdd-468240e253f8",
            activity: "Project Microsite Launch",
            description: "Launch the public-facing project microsite with key messaging.",
            owner: "Vant",
            audience: [],
            status: "Completed",
            advancedStatus: "",
            tags: ["Comms"],
            priority: "ASAP",
            complexity: "4",
            phase: "Phase 1",
            commsObjectiveId: "obj2",
            desiredOutcome: "Public has a clear, accessible source of project information.",
            kpiTarget: "Site live with 500+ visits in month 1",
            assetIds: [],
            stakeholderPosture: "",
            timing: {
                dueDate: "2026-02-28",
                startDate: "2026-01-15",
                predictedLength: "6 weeks"
            },
            resourceRequirement: "Web development + content",
            todos: [],
            prerequisites: [],
            versionControl: {
                currentVersion: "28/02/26 17:00",
                recentProgress: "Site launched successfully",
                currentBlockers: "",
                taskCreated: "15/01/26 09:00",
                lastEdited: "28/02/26 17:00",
                whoEdited: "Sarah Evans",
                highlightChanges: false,
                dateCompleted: "28/02/26"
            },
            other: "",
            privacy: "Public/Official"
        },
        {
            id: "8bc069d0-9c35-4da8-a54a-3416e1545b80",
            activity: "Media Pack Production",
            description: "Produce a media pack for press and public relations outreach.",
            owner: "Vant",
            audience: [],
            status: "Pending",
            advancedStatus: "",
            tags: ["Comms", "Financial"],
            priority: "Medium",
            complexity: "3",
            phase: "Phase 1",
            commsObjectiveId: "obj2",
            desiredOutcome: "Media have accurate, positive information about the project.",
            kpiTarget: "Pack distributed to 10+ media contacts",
            assetIds: [],
            stakeholderPosture: "",
            timing: {
                dueDate: "2026-02-20",
                startDate: "2026-02-01",
                predictedLength: "3 weeks"
            },
            resourceRequirement: "Copywriting + photography",
            todos: [],
            prerequisites: [],
            versionControl: {
                currentVersion: "01/02/26 09:00",
                recentProgress: "",
                currentBlockers: "Waiting on finalized project photos",
                taskCreated: "01/02/26 09:00",
                lastEdited: "01/02/26 09:00",
                whoEdited: "Matt Griffin",
                highlightChanges: false,
                dateCompleted: ""
            },
            other: "",
            privacy: "Public/Official"
        },
        {
            id: "f7ec565b-470a-43ca-89d2-f331f237c211",
            activity: "Technical Q&A Docs",
            description: "Develop structured technical documentation for regulators.",
            owner: "AET",
            audience: [],
            status: "Planned",
            advancedStatus: "",
            tags: ["Legal"],
            priority: "Medium",
            complexity: "5",
            phase: "Phase 2",
            commsObjectiveId: "obj3",
            desiredOutcome: "Regulators have confidence in technical competence.",
            kpiTarget: "Docs reviewed and accepted by EPA",
            assetIds: [],
            stakeholderPosture: "",
            timing: {
                dueDate: "2026-05-01",
                startDate: "2026-04-01",
                predictedLength: "4 weeks"
            },
            resourceRequirement: "Technical writing + legal review",
            todos: [],
            prerequisites: [],
            versionControl: {
                currentVersion: "01/04/26 09:00",
                recentProgress: "",
                currentBlockers: "",
                taskCreated: "01/04/26 09:00",
                lastEdited: "01/04/26 09:00",
                whoEdited: "Matt Griffin",
                highlightChanges: false,
                dateCompleted: ""
            },
            other: "",
            privacy: "Restricted"
        }
    ],
    // KNOWLEDGE BANK
    knowledgeBank: {
        keyMessages: [
            {
                id: "k1",
                title: "Environmental Outcomes",
                message: "The Advanced Resource Recovery Centre (ARRC) will reduce landfill and help create a cleaner, healthier environment.",
                proofPoints: [
                    "The project significantly reduces greenhouse gas emissions, with the potential to avoid around 80,000 tonnes of CO₂e annually.",
                    "Line about reducing landfill and why this is critical",
                    "The ARRC will produce high-quality materials that can be reused by local industries and help improve soil health and land management.",
                    "Processing materials locally at the ARRC will reduce long-distance transport and associated emissions.",
                    "The project directly supports Victoria's Recycling Victoria 80% diversion target and aligns with the National Circular Economy Framework."
                ]
            },
            {
                id: "k2",
                title: "Regional economic benefits",
                message: "The ARRC will create jobs, attract investment and build new circular industries, strengthening the local economy.",
                proofPoints: [
                    "The project will create up to 80 direct jobs and 150 indirect roles across operations, logistics, maintenance and R&D, with training pathways through local tertiary partner.",
                    "It will help establish new circular industries such as plastics reprocessing, organics, soil products and biochar.",
                    "The project will attract private investment and strengthen local supply chains, supporting long-term regional growth.",
                    "The project keeps economic value local by processing waste in the region rather than transporting materials - and the economic opportunity tied to them - elsewhere.",
                    "Recovering valuable materials creates additional revenue streams, helping make the regional waste system more financially stable over time."
                ]
            },
            {
                id: "k3",
                title: "Circular Leadership and Innovation",
                message: "The project brings the latest, AI-enabled recovery technology to the Loddon Mallee - positioning the region as a national leader in modern resource recovery and circular innovation.",
                proofPoints: [
                    "State of the art sorting facility.",
                    "AI systems adapt to waste streams."
                ]
            },
            {
                id: "k4",
                title: "Partnerships",
                message: "AET values councils, communities and industry as genuine long-term partners, with open and transparent communication and engagement at the heart of the project.",
                proofPoints: [
                    "Community Reference Groups.",
                    "Transparent reporting structures."
                ]
            }
        ],
        faqs: [
            { id: "f1", question: "Who is AET?", answer: "AET develops smart projects that turn everyday waste into valuable resources - reducing landfill, cutting emissions and keeping value in the region.\n\nWe help regional communities move toward a circular economy by designing systems that recover materials, support local industry and create long-term environmental benefits.\n\nAET's Pyramid Hill R&D facility plays a critical role in this work. It allows the team to test how organic waste can be transformed into valuable carbon products and, by working with local businesses, identify practical ways to return these materials to industry. These proven methods will be applied at the Advanced Resource Recovery Centre (ARRC) to ensure as much waste as possible is put to good use." },
            { id: "f2", question: "What does AET do?", answer: "AET develops smart projects..." },
            { id: "f3", question: "What is the ARRC project?", answer: "The advanced resource recovery center..." },
            { id: "f4", question: "What stage is the project at?", answer: "Feasibility." },
            { id: "f5", question: "What technology will the ARRC use?", answer: "AI and machine learning." },
            { id: "f6", question: "Will AI reduce the number of local jobs at the ARRC?", answer: "No, it augments the process." }
        ],
        audienceMessages: [
            {
                id: "a1",
                icon: "groups",
                title: "City of Greater Bendigo (CoGB)",
                text: "The Advanced Resource Recovery Centre (ARRC) delivers long-term stability and value for the region - keeping jobs, skills and investment local, while reducing landfill and future cost pressures."
            },
            {
                id: "a2",
                icon: "groups",
                title: "Neighbouring Councils",
                text: "The ARRC is a reliable, future-ready regional solution backed by clear data, modern technology and long-term value for councils - that will benefit the region now and into the future."
            },
            {
                id: "a3",
                icon: "groups",
                title: "Community",
                text: "The ARRC will help the Loddon Mallee region turn everyday waste into valuable resources - reducing landfill, cutting emissions and creating more jobs and attracting local investment."
            },
            {
                id: "a4",
                icon: "groups",
                title: "Local Industry",
                text: "The ARRC will supply high-quality recovered materials that create new commercial opportunities and strengthen regional supply chains."
            },
            {
                id: "a5",
                icon: "groups",
                title: "Media",
                text: "The Loddon Mallee region is emerging as a leader in clean, modern resource recovery - turning local waste into local opportunity using AI and advanced sorting technology."
            }
        ]
    }
};

// Simulate local storage persistence
// Bumping to v17 to ensure new structure loads (FRESH LOAD)
const CACHE_VERSION = 'v19';
if (!localStorage.getItem(CACHE_VERSION)) {
    localStorage.setItem(CACHE_VERSION, JSON.stringify(mockData));
}

window.getData = function (key) {
    const data = JSON.parse(localStorage.getItem(CACHE_VERSION));
    return data ? data[key] : null; 
};

window.updateData = function (key, value) {
    const data = JSON.parse(localStorage.getItem(CACHE_VERSION));
    if (data) {
        data[key] = value;
        localStorage.setItem(CACHE_VERSION, JSON.stringify(data));
        return true;
    }
    return false;
};

window.addData = function (key, item) {
    const data = JSON.parse(localStorage.getItem(CACHE_VERSION));
    if (data && data[key]) {
        item.id = item.id || Date.now(); // Keep existing ID if present
        data[key].push(item);
        localStorage.setItem(CACHE_VERSION, JSON.stringify(data));
        return item;
    }
    return null;
};

// Helper for adding a contact to a stakeholder
window.addContact = function (stakeholderId, contact) {
    const data = JSON.parse(localStorage.getItem(CACHE_VERSION));
    const sh = data.stakeholders.find(s => s.id == stakeholderId);
    if (sh) {
        if (!sh.contacts) sh.contacts = [];
        sh.contacts.push(contact);
        localStorage.setItem(CACHE_VERSION, JSON.stringify(data));
        return true;
    }
    return false;
}

// Helper for updating a stakeholder
window.updateStakeholder = function (id, updates) {
    const data = JSON.parse(localStorage.getItem(CACHE_VERSION));
    const index = data.stakeholders.findIndex(s => s.id == id);
    if (index !== -1) {
        data.stakeholders[index] = { ...data.stakeholders[index], ...updates };
        localStorage.setItem(CACHE_VERSION, JSON.stringify(data));
        return true;
    }
    return false;
}
