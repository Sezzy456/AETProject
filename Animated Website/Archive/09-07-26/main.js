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

// =================================================================
// 2. 'WHAT WE DO' SCROLLYTELLING ANIMATION
// =================================================================
const canvas = document.getElementById("animation-canvas");
const context = canvas.getContext("2d");
const textColumn = document.getElementById("text-column");

canvas.width = 1920;
canvas.height = 1080;
const TOTAL_FRAMES = 294;
const SCROLL_LENGTH = "+=4000"; // Shorter since we just need scroll space to trigger steps

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

    // Create a master timeline that is scrubbed
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: ".scrolly-section",
            start: "top 80px", // Pins immediately below navbar
            end: "+=6000",
            scrub: 2.5, // Buttery smooth 2.5 second delay
            pin: true
        }
    });

    // The canvas animation is the backbone of the timeline
    tl.to(animationData, {
        currentFrame: TOTAL_FRAMES,
        snap: "currentFrame",
        ease: "none",
        duration: 1,
        onUpdate: () => drawFrame(animationData.currentFrame)
    }, 0);

    // Initial states
    gsap.set("#text-1", { autoAlpha: 1, y: 0 });
    gsap.set("#text-2", { autoAlpha: 0, y: 30 });
    gsap.set("#text-3", { autoAlpha: 0, y: 30 });

    // Text animations synced with the timeline progress (0 to 1)
    tl.to("#text-1", { autoAlpha: 0, y: -20, duration: 0.1 }, 0.2); // fade out at 20%

    tl.to("#text-2", { autoAlpha: 1, y: 0, duration: 0.1 }, 0.3); // fade in at 30%
    tl.to("#text-2 .delay-1", { opacity: 1, duration: 0.05 }, 0.4);
    tl.to("#text-2 .delay-2", { opacity: 1, duration: 0.05 }, 0.5);
    tl.to("#text-2", { autoAlpha: 0, y: -20, duration: 0.1 }, 0.7); // fade out at 70%

    tl.to("#text-3", { autoAlpha: 1, y: 0, duration: 0.1 }, 0.8); // fade in at 80%

    // Initialize the who-we-are section AFTER the what-we-do section so pin spacers order correctly!
    initWhoWeAre();
}

// =================================================================
// 3. 'WHO WE ARE' ROTATING BLOB & CONTENT SWAP
// =================================================================
const whoData = [
    { image: 'images/DSC03781.jpg', title: 'Our Dedicated Team', desc: 'We bring decades of engineering and community experience to the table, ensuring sustainable growth.', overlay: 'images/DSC03781-removebg-preview.png' },
    { image: 'images/IMG_1549.JPG', title: 'Community Outreach', desc: 'Working closely with local groups to educate and empower citizens in waste reduction.', overlay: 'images/IMG_1549-removebg-preview.png' },
    { image: 'images/DSC03786.jpg', title: 'Innovative Engineers', desc: 'Designing the systems that turn everyday waste into tomorrow\'s clean energy.', overlay: 'images/DSC03786-removebg-preview.png' }
];

const whoPaths = [
    // 5-Petal Star Shape (all 3 the same for now)
    "M 100,15 C 120,15 125,60 140,65 C 155,70 185,55 185,75 C 185,95 150,110 150,125 C 150,140 170,180 150,185 C 130,190 110,145 100,145 C 90,145 70,190 50,185 C 30,180 50,140 50,125 C 50,110 15,95 15,75 C 15,55 45,70 60,65 C 75,60 80,15 100,15 Z",
    // 5-Petal Star Shape
    "M 100,15 C 120,15 125,60 140,65 C 155,70 185,55 185,75 C 185,95 150,110 150,125 C 150,140 170,180 150,185 C 130,190 110,145 100,145 C 90,145 70,190 50,185 C 30,180 50,140 50,125 C 50,110 15,95 15,75 C 15,55 45,70 60,65 C 75,60 80,15 100,15 Z",
    // 5-Petal Star Shape
    "M 100,15 C 120,15 125,60 140,65 C 155,70 185,55 185,75 C 185,95 150,110 150,125 C 150,140 170,180 150,185 C 130,190 110,145 100,145 C 90,145 70,190 50,185 C 30,180 50,140 50,125 C 50,110 15,95 15,75 C 15,55 45,70 60,65 C 75,60 80,15 100,15 Z"
];

function initWhoWeAre() {
    let currentWhoIndex = 0;
    const blobImage1 = document.getElementById('who-image-1');
    const blobImage2 = document.getElementById('who-image-2');
    const blobOverlay1 = document.getElementById('who-overlay-1');
    const blobOverlay2 = document.getElementById('who-overlay-2');
    const blobTitle = document.getElementById('who-title');
    const blobDesc = document.getElementById('who-desc');
    const blobPath1 = document.getElementById('blob-path-1');
    const blobPath2 = document.getElementById('blob-path-2');
    
    // Set initial overlays
    if (whoData[0].overlay) {
        blobOverlay1.setAttribute('href', whoData[0].overlay);
    }

    ScrollTrigger.create({
        trigger: ".who-we-are",
        start: "top top", // Pin at top
        end: "+=3000", // Scroll length to give user time to see all 3 images
        pin: true,
        scrub: true,
        onUpdate: (self) => {
            // Rotate BOTH SVG paths natively around their global SVG center (100,100) using svgOrigin
            gsap.set(["#blob-path-1", "#blob-path-2"], { rotation: self.progress * 360, svgOrigin: "100 100" });

            const index = Math.min(Math.floor(self.progress * whoData.length), whoData.length - 1);

            if (index !== currentWhoIndex) {
                currentWhoIndex = index;
                
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
        }
    });

    // Force GSAP to recalculate pin spacers since we just dynamically added them
    ScrollTrigger.refresh();
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
// 5. ACTIVE NAV HIGHLIGHTING
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