import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register the ScrollTrigger plugin with GSAP
gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  // 1. Landing Page Parallax Effect
  // As the user scrolls down, the layers move at different speeds
  gsap.to(".layer-1", {
    y: -50,
    ease: "none",
    scrollTrigger: {
      trigger: "#landing",
      start: "top top",
      end: "bottom top",
      scrub: true
    }
  });

  gsap.to(".layer-2", {
    y: -100,
    ease: "none",
    scrollTrigger: {
      trigger: "#landing",
      start: "top top",
      end: "bottom top",
      scrub: true
    }
  });

  gsap.to(".layer-3", {
    y: -200,
    ease: "none",
    scrollTrigger: {
      trigger: "#landing",
      start: "top top",
      end: "bottom top",
      scrub: true
    }
  });

  // 2. ARRC Cycle Nodes Animation
  // Animate the nodes appearing one by one
  const nodes = gsap.utils.toArray('.node');
  const arrows = gsap.utils.toArray('.cycle-arrow');

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".arrc-cycle-container",
      start: "top 80%", // Start animation when container is 80% down the viewport
    }
  });

  // Start with elements hidden
  gsap.set(nodes, { scale: 0, opacity: 0 });
  gsap.set(arrows, { scaleX: 0, opacity: 0, transformOrigin: "left center" });

  // Animate them in sequentially
  tl.to(nodes[0], { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
    .to(arrows[0], { scaleX: 1, opacity: 1, duration: 0.3 })
    .to(nodes[1], { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
    .to(arrows[1], { scaleX: 1, opacity: 1, duration: 0.3 })
    .to(nodes[2], { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" });


  // 3. Economic Section: Number Counters
  // Animate numbers counting up
  const jobStat = document.getElementById('stat-jobs');
  const revStat = document.getElementById('stat-revenue');

  gsap.to(jobStat, {
    innerHTML: 150,
    duration: 2,
    snap: { innerHTML: 1 },
    scrollTrigger: {
      trigger: "#economic",
      start: "top 70%"
    }
  });

  gsap.to(revStat, {
    innerHTML: 2.5, // 2.5M
    duration: 2,
    scrollTrigger: {
      trigger: "#economic",
      start: "top 70%"
    },
    onUpdate: function() {
      // Format to 1 decimal place
      revStat.innerHTML = this.targets()[0].innerHTML.slice(0, 3);
    }
  });
  // Quick fix for the number formatting issue with direct innerHTML tweening:
  gsap.to({ val: 0 }, {
    val: 2.5,
    duration: 2,
    scrollTrigger: {
      trigger: "#economic",
      start: "top 70%"
    },
    onUpdate: function() {
      revStat.innerHTML = this.targets()[0].val.toFixed(1);
    }
  });


  // 4. Environmental Section: Bar Charts
  // Animate the bars growing from the bottom
  const bars = gsap.utils.toArray('.bar');
  
  bars.forEach(bar => {
    const targetHeight = bar.getAttribute('data-height');
    gsap.to(bar, {
      height: targetHeight,
      duration: 1.5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#environmental",
        start: "top 60%"
      }
    });
  });

  // 5. Council Section: Staggered Steps
  gsap.from(".step", {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2, // Animate one after another with 0.2s delay
    scrollTrigger: {
      trigger: ".action-steps",
      start: "top 80%"
    }
  });
});
