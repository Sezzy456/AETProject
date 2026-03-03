
/**
 * Domain Model: Strategy Spine
 * The core "North Star" content that doesn't change often.
 */
export const strategySpine = {
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
    }
};
