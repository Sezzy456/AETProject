// main.js

gsap.registerPlugin(ScrollTrigger);

// =================================================================
// 1. VIDEO PARALLAX & AUTO-PAUSE (Vimeo API)
// =================================================================
const iframe = document.getElementById('vimeo-video');
const player = new Vimeo.Player(iframe);

// Pause the video when we scroll past the video section
ScrollTrigger.create({
    trigger: ".video-section",
    start: "bottom top", // when bottom of video hits top of viewport
    onEnter: () => player.pause(),
    onLeaveBack: () => player.play().catch(e => console.log("Autoplay prevented:", e))
});

// Allow the user to click the video background to manually pause/play
const videoContainer = document.querySelector('.video-container');
const playPauseIcon = document.getElementById('play-pause-icon');
let isVideoPlaying = true; // Vimeo background videos auto-play by default

videoContainer.addEventListener('click', () => {
    if (isVideoPlaying) {
        player.pause();
        playPauseIcon.classList.add('show');
    } else {
        player.play();
        playPauseIcon.classList.remove('show');
    }
    isVideoPlaying = !isVideoPlaying;
});

// =================================================================
// 2. 'WHAT WE DO' SCROLLYTELLING ANIMATION & CAROUSEL DOTS
// =================================================================
const canvas = document.getElementById("animation-canvas");
const context = canvas.getContext("2d");
const textColumn = document.getElementById("text-column");

canvas.width = 1920;
canvas.height = 1080;
const TOTAL_FRAMES = 294;

const getFramePath = (index) => `frames/frame_${index.toString().padStart(5, '0')}.png`;

const textData = [
    {
        id: "text-1",
        title: "Rubbish is Collected",
        content: "Some amount of rubbish is thrown out every period of time."
    },
    {
        id: "text-2",
        title: "Where it goes",
        content: "Rubbish can be taken to a tip, <span class='delay-1' style='opacity:0;'>a Waste to Energy facility or</span> <span class='delay-2' style='opacity:0;'>to (our proposal) an Advanced Resource Recovery Centre.</span>"
    },
    {
        id: "text-3",
        title: "The Advanced Resource Recovery Centre",
        content: "Clean the rubbish and then sort it."
    }
];

const images = [];
const animationData = { currentFrame: 1 };
let loadedCount = 0;

generateTextHTML();

// Preload loop
for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFramePath(i);
    img.onload = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
            initScrollytelling();
        }
    };
    img.onerror = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
            initScrollytelling();
        }
    }
    images.push(img);
}

function generateTextHTML() {
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
    function drawFrame(frameIndex) {
        if (images[frameIndex - 1] && images[frameIndex - 1].complete) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(images[frameIndex - 1], 0, 0);
        }
    }
    drawFrame(1);

    const DURATION = 15; // 15 seconds total playback time
    const whatDots = document.querySelectorAll('#what-we-do-dots .dot');

    function updateWhatDots(activeIndex) {
        whatDots.forEach((d, idx) => {
            if (idx === activeIndex) d.classList.add('active');
            else d.classList.remove('active');
        });
    }

    // Create a master timeline that auto-plays when triggered
    const tl = gsap.timeline({
        paused: true,
        repeat: -1, // Loop endlessly
        scrollTrigger: {
            trigger: ".scrolly-section",
            start: "top 60%", // Trigger when section is mostly in view
            toggleActions: "play pause resume pause" // Pauses when off-screen to save performance
        }
    });

    // The canvas animation is the backbone of the timeline
    tl.to(animationData, {
        currentFrame: TOTAL_FRAMES,
        snap: "currentFrame",
        ease: "none",
        duration: DURATION,
        onUpdate: () => drawFrame(animationData.currentFrame)
    }, 0);

    // Initial states
    gsap.set("#text-1", { autoAlpha: 0, y: 30 }); // Start hidden so it can fade in smoothly
    gsap.set("#text-2", { autoAlpha: 0, y: 30 });
    gsap.set("#text-3", { autoAlpha: 0, y: 30 });

    const FADE = 0.8; // Snappy 0.8 second fade transitions

    // Text timing scales with DURATION, but fade duration stays fixed and snappy
    tl.to("#text-1", { autoAlpha: 1, y: 0, duration: FADE, onStart: () => updateWhatDots(0) }, 0.0 * DURATION);
    tl.to("#text-1", { autoAlpha: 0, y: -20, duration: FADE }, 0.25 * DURATION);

    tl.to("#text-2", { autoAlpha: 1, y: 0, duration: FADE, onStart: () => updateWhatDots(1) }, 0.3 * DURATION);
    tl.to("#text-2 .delay-1", { opacity: 1, duration: 0.5 }, 0.4 * DURATION);
    tl.to("#text-2 .delay-2", { opacity: 1, duration: 0.5 }, 0.5 * DURATION);
    tl.to("#text-2", { autoAlpha: 0, y: -20, duration: FADE }, 0.7 * DURATION);

    tl.to("#text-3", { autoAlpha: 1, y: 0, duration: FADE, onStart: () => updateWhatDots(2) }, 0.75 * DURATION);
    tl.to("#text-3", { autoAlpha: 0, y: -20, duration: FADE }, 0.95 * DURATION);

    // Clickable dots for What We Do
    const stepTimes = [0.05 * DURATION, 0.35 * DURATION, 0.8 * DURATION];
    whatDots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            tl.seek(stepTimes[index]);
            updateWhatDots(index);
        });
    });

    // Initialize the who-we-are section AFTER the what-we-do section so pin spacers order correctly!
    initWhoWeAre();
}

// =================================================================
// 3. 'WHO WE ARE' ROTATING BLOB & CONTENT SWAP WITH DOT CAROUSEL
// =================================================================
const whoData = [
    { image: 'images/DSC03781.jpg', title: 'Our Dedicated Team', desc: 'We bring decades of engineering and community experience to the table, ensuring sustainable growth.', overlay: 'images/DSC03781-removebg-preview.png' },
    { image: 'images/IMG_1549.JPG', title: 'Community Outreach', desc: 'Working closely with local groups to educate and empower citizens in waste reduction.', overlay: 'images/IMG_1549-removebg-preview.png' },
    { image: 'images/DSC03786.jpg', title: 'Innovative Engineers', desc: 'Designing the systems that turn everyday waste into tomorrow\'s clean energy.', overlay: 'images/DSC03786-removebg-preview.png' }
];

// Soft organic rounded SVG blob paths with gentle rounded curves (no spiky star corners)
const whoPaths = [
    "M 100,22 C 140,22 175,50 175,95 C 175,140 145,178 100,178 C 55,178 25,140 25,95 C 25,50 60,22 100,22 Z",
    "M 100,26 C 148,18 178,58 172,102 C 166,146 138,175 96,172 C 52,169 22,138 28,94 C 34,50 52,34 100,26 Z",
    "M 96,22 C 138,26 178,48 175,96 C 172,144 142,178 98,174 C 54,170 22,142 26,96 C 30,50 54,18 96,22 Z"
];

function initWhoWeAre() {
    const blobImage1 = document.getElementById('who-image-1');
    const blobImage2 = document.getElementById('who-image-2');
    const blobOverlay1 = document.getElementById('who-overlay-1');
    const blobOverlay2 = document.getElementById('who-overlay-2');
    const blobTitle = document.getElementById('who-title');
    const blobDesc = document.getElementById('who-desc');
    const blobPath1 = document.getElementById('blob-path-1');
    const blobPath2 = document.getElementById('blob-path-2');
    const whoDots = document.querySelectorAll('#who-we-are-dots .dot');
    
    // Set initial overlays
    if (whoData[0].overlay) {
        blobOverlay1.setAttribute('href', whoData[0].overlay);
    }

    const CYCLE_TIME = 4; // 4 seconds per image
    const DURATION = CYCLE_TIME * whoData.length; // 12 seconds total

    function updateWhoDots(activeIndex) {
        whoDots.forEach((d, idx) => {
            if (idx === activeIndex) d.classList.add('active');
            else d.classList.remove('active');
        });
    }

    const tl = gsap.timeline({
        paused: true,
        repeat: -1, // Loop endlessly
        scrollTrigger: {
            trigger: ".who-we-are",
            start: "top 60%", // Trigger when section is mostly in view
            toggleActions: "play pause resume pause"
        }
    });

    // 1. Rotate the SVG paths continuously 360 degrees over the full loop
    tl.to(["#blob-path-1", "#blob-path-2"], { 
        rotation: 360, 
        svgOrigin: "100 100", 
        ease: "none", 
        duration: DURATION 
    }, 0);

    // Function to trigger a crossfade swap
    function triggerSwap(index) {
        updateWhoDots(index);

        // Pre-load the next image, path, and overlay into the hidden layer
        blobImage2.setAttribute('href', whoData[index].image);
        blobPath2.setAttribute('d', whoPaths[index]);
        
        if (whoData[index].overlay) {
            blobOverlay2.setAttribute('href', whoData[index].overlay);
        } else {
            blobOverlay2.removeAttribute('href');
        }

        // Crossfade text
        gsap.to([blobTitle, blobDesc], {
            opacity: 0, duration: 0.2, onComplete: () => {
                blobTitle.innerText = whoData[index].title;
                blobDesc.innerText = whoData[index].desc;
                gsap.to([blobTitle, blobDesc], { opacity: 1, duration: 0.2 });
            }
        });

        // Fade IN Layer 2
        gsap.to(blobImage2, { opacity: 1, duration: 0.4 });
        gsap.to(blobOverlay2, { opacity: 1, duration: 0.4 });

        // Fade OUT Layer 1's overlay so it smoothly disappears, then reset the layers
        gsap.to(blobOverlay1, { opacity: 0, duration: 0.4, onComplete: () => {
            // Update layer 1 to match
            blobImage1.setAttribute('href', whoData[index].image);
            blobPath1.setAttribute('d', whoPaths[index]);
            
            if (whoData[index].overlay) {
                blobOverlay1.setAttribute('href', whoData[index].overlay);
            } else {
                blobOverlay1.removeAttribute('href');
            }
            
            // Reset opacities so Layer 1 is fully visible and Layer 2 is hidden, ready for next fade
            gsap.set(blobOverlay1, { opacity: 1 });
            gsap.set([blobImage2, blobOverlay2], { opacity: 0 });
        }});
    }

    // 2. Call triggerSwap on a fixed schedule (every 4 seconds)
    tl.call(() => triggerSwap(1), [], CYCLE_TIME);
    tl.call(() => triggerSwap(2), [], CYCLE_TIME * 2);
    tl.call(() => triggerSwap(0), [], DURATION - 0.05); 

    // Clickable dots for Who We Are
    whoDots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerSwap(index);
            tl.seek(index * CYCLE_TIME);
        });
    });
}

// =================================================================
// 4. INFOGRAPHIC INTERACTIVITY
// =================================================================
const infoData = {
    1: { title: "Stage 1: Collection", text: "Waste is securely collected from communities and brought to our advanced facility." },
    2: { title: "Stage 2: Sorting", text: "Automated systems sort recyclables from organic waste, ensuring maximum resource recovery." },
    3: { title: "Stage 3: Energy Generation", text: "Residual waste is safely converted into clean, renewable energy to power local homes." }
};

const stages = document.querySelectorAll('.circle-stage');
const infoTitle = document.getElementById('info-title');
const infoText = document.getElementById('info-text');

stages.forEach(stage => {
    stage.addEventListener('click', () => {
        stages.forEach(s => s.classList.remove('active'));
        stage.classList.add('active');

        const stageNum = stage.getAttribute('data-stage');

        gsap.to([infoTitle, infoText], {
            opacity: 0, y: -10, duration: 0.2, onComplete: () => {
                infoTitle.innerText = infoData[stageNum].title;
                infoText.innerText = infoData[stageNum].text;
                gsap.to([infoTitle, infoText], { opacity: 1, y: 0, duration: 0.2 });
            }
        });
    });
});

// =================================================================
// 5. WAVY BORDER TOGGLE
// =================================================================
const toggleWavesBtn = document.getElementById('toggle-waves-btn');
const waveToggleText = document.getElementById('wave-toggle-text');
let wavesEnabled = true;

if (toggleWavesBtn) {
    toggleWavesBtn.addEventListener('click', () => {
        wavesEnabled = !wavesEnabled;
        if (wavesEnabled) {
            document.body.classList.remove('no-waves');
            waveToggleText.innerText = 'Wavy Borders: ON';
            toggleWavesBtn.style.background = '#ffffff';
            toggleWavesBtn.style.color = '#2193b0';
        } else {
            document.body.classList.add('no-waves');
            waveToggleText.innerText = 'Wavy Borders: OFF';
            toggleWavesBtn.style.background = '#2193b0';
            toggleWavesBtn.style.color = '#ffffff';
        }
    });
}

// =================================================================
// 6. ACTIVE NAV HIGHLIGHTING
// =================================================================
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

const observerOptions = {
    root: null,
    rootMargin: "-20% 0px -60% 0px", // Trigger when section is in top half of viewport
    threshold: 0
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => {
                link.classList.remove("active");
                if (link.getAttribute("href") === `#${entry.target.id}`) {
                    link.classList.add("active");
                }
            });
        }
    });
}, observerOptions);

sections.forEach(sec => observer.observe(sec));