// main.js
// import { gsap } from "gsap";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// import { textData } from "./text-data.js"; // Import your text content

// Register the ScrollTrigger plugin with GSAP
gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("animation-canvas");
const context = canvas.getContext("2d");
const textColumn = document.getElementById("text-column");

// ================================================================= 
// ========================= CONFIGURATION ========================= 
// ================================================================= 
canvas.width = 1920; // dimensions of the animation frames
canvas.height = 1080;
const TOTAL_FRAMES = 294; // Update this
const FRAME_DURATION = 10; // Virtual duration for the timeline
const SCROLL_LENGTH = "+=9000"

// A helper function to format the file name to match your exported files
// e.g., if index is 5, it turns into "frames/frame_0005.jpg"
const getFramePath = (index) => `frames/frame_${index.toString().padStart(5, '0')}.png`;

// ===================== TEXT DATA TIMING ==========================
// Define your text cues and their active duration right here
const textData = [
    { 
        id: "text-1", 
        title: "Rubbish is Collected",
        content: "Some amount of rubbish is thrown out every period of time.",
        start: 0.0, // Appears at 0% scroll
        end: 0.25    // Fades out at 30% scroll
    },
    { 
        id: "text-2", 
        title: "Where it goes",
        content: "Rubbish can be taken to a tip, <span class='delay-1'>a Waste to Energy facility or</span> <span class='delay-2'>to (our proposal) an Advanced Resource Recovery Centre.</span>",
        start: 0.25, // Appears at 30% scroll
        end: 0.6    // Fades out at 70% scroll
    },
    { 
        id: "text-3", 
        title: "The Advanced Resource Recovery Centre",
        content: "Clean the rubbish and then sort it.",
        start: 0.6, // Appears at 70% scroll
        end: 1.0    // Fades out at 100% scroll
    }
];

// ======================== PRELOAD IMAGES ========================= 
// memory for lag-free scrubbing// Create an array to preload all images into 
const images = [];
const animationData = { currentFrame: 1 }; // Start at frame 1
let loadedCount = 0;

generateTextHTML(); 

// Preload loop
for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFramePath(i);
    img.onload = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
            // Once all images are downloaded, initialize the GSAP timeline
    	    initScrollytelling();
        }
    };
    images.push(img);
}

// ================================================================= 
// 1. GENERATE THE HTML FOR TEXT BLOCKS
// ================================================================= 
function generateTextHTML() {
    // Clear out any residual text first to prevent duplicates
    textColumn.innerHTML = ''; 

    textData.forEach((item) => {
        const textBlock = document.createElement("div");
        textBlock.className = "text-block";
        textBlock.id = item.id;
        textBlock.innerHTML = `<h2>${item.title}</h2><p>${item.content}</p>`;
        textColumn.appendChild(textBlock);
    });
}

function initScrollytelling() {
    // generateTextHTML(); // Create the DOM elements

    // Helper function to draw frame
    function drawFrame(frameIndex) {
        if (images[frameIndex - 1]) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(images[frameIndex - 1], 0, 0);
        }
    }
    drawFrame(1); // Draw first frame initially
    // ===========================================================
    // 2. CREATE A MASTER TIMELINE
    // ===========================================================
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".scrolly-section",
            start: "top top",
            end: SCROLL_LENGTH, // Increased distance for slower animation
            scrub: 2.5, // Smooth scrolling catch-up
            pin: true, // Pin the whole .scrolly-section
        }
    });
    // ============================================================
    // 3. ADD THE CANVAS FRAME-DRAWING TO THE TIMELINE
    // ============================================================
    tl.to(animationData, {
        currentFrame: TOTAL_FRAMES,
        snap: "currentFrame",
        ease: "none", // Keeps frame playback linear to scroll
        duration: FRAME_DURATION, // Virtual duration (match text timing ratio)
        onUpdate: () => drawFrame(animationData.currentFrame)
    }, 0); // Start at time 0 (the beginning)

    // ============================================================
    // 4. ADD TEXT ANIMATIONS TO THE TIMELINE
    // ============================================================
    textData.forEach((item) => {
        const target = `#${item.id}`;
        
        // Calculate virtual start and end time based on ratio
        // const startTime = item.start * FRAME_DURATION;
        // const endTime = item.end * FRAME_DURATION;

        // Convert decimal ratios directly into timeline percentage strings
        const startTime = item.start * FRAME_DURATION;
        const endTime = item.end * FRAME_DURATION;

        const slideDuration = endTime - startTime;
        const midTime1 = startTime + (slideDuration * 0.20); // 20% through this slide
        const midTime2 = startTime + (slideDuration * 0.40); // 40% through this slide
        
        // Calculate midpoints for our sentence fragments based on this slide's duration
        // const slideDuration = (item.end - item.start) * 100;
        // const midPercent1 = `${(item.start + (item.end - item.start) * 0.20) * FRAME_DURATION}`; // 35% through the slide
        // const midPercent2 = `${(item.start + (item.end - item.start) * 0.40) * FRAME_DURATION}`; // 70% through the slide

        // Reset initial block state
        // gsap.set(target, { opacity: 0, y: 30, visibility: "hidden" });
        // use autoAlpha: 0 to set opacity: 0 and visibility: hidden cleanly
        gsap.set(target, { autoAlpha: 0, y: 30 });

        // A. FADE IN AND HOVER UP
        tl.to(target, {
            autoAlpha: 1, // Fades opacity to 1 and manages visibility automatically
            // opacity: 1,
            y: 0,
            visibility: "visible",
            ease: "power2.out", // A nice fade-in curve
            duration: 0.5, // 0.5s of virtual time to animate in
        }, startTime) // Start when specified in data
        
        // B. NEW: Fade in "a Waste to Energy facility" a bit later
        .to(`${target} .delay-1`, {
            opacity: 1,
            duration: 0.5
        }, midTime1)

        // C. NEW: Fade in "an Advanced Resource Recovery Centre" right before the slide ends
        .to(`${target} .delay-2`, {
            opacity: 1,
            duration: 0.5
        }, midTime2);

        // FADE OUT AND HOVER UP (optional)
        tl.to(target, {
            autoAlpha: 0, // Fades opacity to 1 and manages visibility automatically
            // opacity: 0,
            y: -20, // Hover UP when fading out
            visibility: "hidden",
            ease: "power2.in", // A matching curve for fade-out
            duration: 0.5, // 0.5s of virtual time to animate out
        }, endTime -0.5); // (-0.5) End slightly BEFORE the next text appears
    });
}