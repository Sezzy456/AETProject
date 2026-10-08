// text-data.js
const totalDuration = 10; // Think of this as a virtual 10-second timeline

// Define your text cues and their active duration
export const textData = [
    { 
        id: "text-1", 
        title: "Introduction",
        content: "This text explains the first section.",
        // Appears at 0s, active until 3s (takes up 30% of scroll)
        start: 0.0, 
        end: 0.3 
    },
    { 
        id: "text-2", 
        title: "The Transition",
        content: "Relevant text for the middle portion.",
        // Appears at 3s, active until 7s (takes up 40% of scroll)
        start: 0.3, 
        end: 0.7 
    },
    { 
        id: "text-3", 
        title: "The Climax",
        content: "Final text for the end.",
        // Appears at 7s, active until 10s (takes up 30% of scroll)
        start: 0.7, 
        end: 1.0 
    }
];