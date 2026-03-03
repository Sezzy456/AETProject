
// Strategy Control Room Data Layer
// Version: 2.1 (Strategic & Tactical Alignment)

export const strategyData = {
    meta: {
        title: "AET Strategy Control Room",
        lastUpdated: "2026-01-23",
        version: "Control Room v2.1",
        status: "Live"
    },
    spine: {
        purpose: "The single source of truth for AET's Communication & Engagement Strategy (Phase 1).",
        objectives: [
            { id: "obj1", text: "Strengthen alignment and confidence across key stakeholders" },
            { id: "obj2", text: "Establish a clear, accessible and repeatable narrative" },
            { id: "obj3", text: "Build early trust and credibility" },
            { id: "obj4", text: "Equip advocates with practical tools" },
            { id: "obj5", text: "Shape early media understanding and tone" }
        ],
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
        narrative: {
            core: "AET is turning regional waste into regional opportunity – keeping value, jobs and skills in the Loddon Mallee through one of Australia’s most advanced resource recovery projects.",
            simple: "We take household waste, clean it, sort it, and recover useful materials. Local businesses turn those materials into new products. It’s smart recycling that keeps value in the region."
        },
        qa_library: [
            {
                category: "Facility Overview",
                question: "What is the purpose of the ARRC?",
                answer: "It is a modern facility to recover valuable materials from household waste, reduce landfill, and support local circular industries. NOT a waste-to-energy facility."
            },
            {
                category: "Technology",
                question: "What is 'precision sorting'?",
                answer: "A combination of AI, robotics, and optical sensors to separate materials by shape, colour, and composition with high accuracy."
            },
            {
                category: "Environment",
                question: "How will it reduce emissions?",
                answer: "By diverting organics from landfill (methane avoidance), reducing long-haul transport, and enabling local recycling."
            },
            {
                category: "Local Impact",
                question: "What about traffic and smell?",
                answer: "Fully enclosed negative-pressure system to manage odour. Traffic will be managed via major routes to minimize local street impact."
            },
            {
                category: "Governance",
                question: "How is this different from waste-to-energy?",
                answer: "Materials are cleaned, sorted and reused. This is resource recovery. Energy outcomes are secondary."
            }
        ]
    },
    stakeholders: [
        {
            id: "s1",
            name: "City of Greater Bendigo (CoGB)",
            role: "Primary Partner",
            influence: "High",
            interest: "High",
            posture: {
                current: "Uneven; contract strain",
                desired: "Strong, aligned advocate",
                status: "Needs Attention"
            },
            narrativeHook: "This project delivers long-term stability and value for Bendigo.",
            engagementStrategy: "Direct briefings; Rebuild confidence; Align narrative.",
            owner: "AET + Vant",
            governance: {
                context: "Risk-averse, politically exposed. Sensitive to 'Lock-in'.",
                safe_words: ["Control", "Choice", "Consequence", "Defensibility"],
                danger_words: ["Default", "Probability", "Exit rights", "Locked in"]
            }
        },
        {
            id: "s2",
            name: "Neighbouring Councils",
            role: "Feedstock Partners",
            influence: "High",
            interest: "Medium",
            posture: {
                current: "Emerging awareness",
                desired: "Supportive partners",
                status: "Active"
            },
            narrativeHook: "A reliable, future-ready regional solution.",
            engagementStrategy: "Benefit-led presentations; low-pressure education.",
            owner: "AET (Matt)",
            governance: {
                context: "Solution-seeking but cautious.",
                safe_words: ["Regional capability", "Reliability", "Option"],
                danger_words: ["Mandate", "Cost shifting"]
            }
        },
        {
            id: "s3",
            name: "Regulators (EPA/State/Fed)",
            role: "Governance",
            influence: "High",
            interest: "Medium",
            posture: {
                current: "Constructive but intermittent",
                desired: "Predictable, supportive",
                status: "Stable"
            },
            narrativeHook: "Alignment with State circular economy targets.",
            engagementStrategy: "Structured technical documentation.",
            owner: "AET",
            governance: {
                context: "Policy-aligned, outcomes-focused.",
                safe_words: ["Compliance", "Targets", "Systems"],
                danger_words: ["Workaround", "Exception"]
            }
        },
        {
            id: "s4",
            name: "Local Industry",
            role: "Supply Chain",
            influence: "Medium",
            interest: "High",
            posture: {
                current: "Positive early partners",
                desired: "Visible champions",
                status: "Supportive"
            },
            narrativeHook: "High-quality materials for new commercial opportunities.",
            engagementStrategy: "Partnership meetings; co-branding.",
            owner: "Vant",
            governance: {
                context: "Commercial, execution-focused.",
                safe_words: ["Feedstock quality", "Certainty", "Partnership"],
                danger_words: ["Bureaucracy", "Delay"]
            }
        },
        {
            id: "s5",
            name: "Community & Media",
            role: "Public License",
            influence: "High",
            interest: "High",
            posture: {
                current: "Limited specific exposure",
                desired: "Informed & Supportive",
                status: "Monitor"
            },
            narrativeHook: "Clean, smart recycling – not waste-to-energy.",
            engagementStrategy: "Proactive education; simple explainers.",
            owner: "Vant",
            governance: {
                context: "Amenity-focused, sensitive to misinformation.",
                safe_words: ["Smart recycling", "Local value", "Enclosed"],
                danger_words: ["Incinerator", "Risk", "Financial model"]
            }
        },
        {
            id: "s6",
            name: "Education Sector",
            role: "Future Workforce",
            influence: "Medium",
            interest: "High",
            posture: {
                current: "Very positive; strong youth interest",
                desired: "Long-term education & skills partners",
                status: "Active"
            },
            narrativeHook: "STEM learning and career pathways in the circular economy.",
            engagementStrategy: "School visits; site tours; curriculum resources.",
            owner: "Vant + AET"
        },
        {
            id: "s7",
            name: "Dja Dja Wurrung",
            role: "Cultural Partner",
            influence: "Medium",
            interest: "High",
            posture: {
                current: "Early engagement only",
                desired: "Cultural co-design partner",
                status: "Needs Attention"
            },
            narrativeHook: "Respecting Country and integrating cultural values.",
            engagementStrategy: "Cultural protocols; formal meetings; listening.",
            owner: "AET"
        },
        {
            id: "s8",
            name: "Local Sustainability Groups",
            role: "Advocates",
            influence: "Medium",
            interest: "High",
            posture: {
                current: "Generally positive; expect transparency",
                desired: "Environmental champions",
                status: "Active"
            },
            narrativeHook: "Reframe waste as central to climate outcomes.",
            engagementStrategy: "Tailored briefings; co-presentations; data transparency.",
            owner: "AET + Vant"
        },
        {
            id: "s9",
            name: "Local MPs (State/Fed)",
            role: "Political Support",
            influence: "High",
            interest: "Medium",
            posture: {
                current: "Initial briefings complete",
                desired: "Supportive political stakeholders",
                status: "Stable"
            },
            narrativeHook: "Jobs, environmental benefit, and cost stability.",
            engagementStrategy: "Short briefings; high-level summaries.",
            owner: "AET + Vant"
        },
        {
            id: "s10",
            name: "Opposition Members",
            role: "Political Support",
            influence: "Medium",
            interest: "Medium",
            posture: {
                current: "Limited awareness; no prior engagement",
                desired: "Informed, bipartisan supporters",
                status: "Monitor"
            },
            narrativeHook: "Early, non-political framing; regional benefits.",
            engagementStrategy: "High-level briefings; economic narrative.",
            owner: "AET + Vant"
        },
        {
            id: "s11",
            name: "Investors & Finance Partners",
            role: "Capital",
            influence: "High",
            interest: "Medium",
            posture: {
                current: "Monitoring closely",
                desired: "Confident in project momentum",
                status: "Stable"
            },
            narrativeHook: "Alignment, feedstock certainty, and regulatory stability.",
            engagementStrategy: "Milestone updates; demonstrate de-risking.",
            owner: "AET"
        }
    ],
    // REAL Strategic Actions
    initialActions: [
        { id: "a1", activity: "Stakeholder Messaging Toolkit", owner: "Vant", linkType: "Objective", linkId: "obj2", status: "Pending", phase: "Phase 1" },
        { id: "a2", activity: "Council Exec Briefings (CoGB)", owner: "AET", linkType: "Stakeholder", linkId: "s1", status: "Planned", phase: "Phase 1" },
        { id: "a3", activity: "Regional Council Forum", owner: "AET + Vant", linkType: "Stakeholder", linkId: "s2", status: "Planned", phase: "Phase 1" },
        { id: "a4", activity: "Project Microsite Launch", owner: "Vant", linkType: "Stakeholder", linkId: "s5", status: "In Progress", phase: "Phase 1" },
        { id: "a5", activity: "Media Pack Production", owner: "Vant", linkType: "Stakeholder", linkId: "s5", status: "Pending", phase: "Phase 1" },
        { id: "a6", activity: "Storytelling Pipeline Dev", owner: "Vant", linkType: "Objective", linkId: "obj3", status: "Ongoing", phase: "Phase 1" },
        { id: "a7", activity: "Community FAQ (Plain English)", owner: "Vant", linkType: "Stakeholder", linkId: "s5", status: "Pending", phase: "Phase 1" },
        { id: "a8", activity: "Technical Q&A Docs", owner: "AET", linkType: "Stakeholder", linkId: "s3", status: "Planned", phase: "Phase 2" }
    ]
};

export const activityLog = [];
export const decisionRegister = [];
export const engagementTypes = ["Meeting", "Briefing", "Workshop", "Email", "Event", "Media Call"];
