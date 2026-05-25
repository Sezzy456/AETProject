import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register the ScrollTrigger plugin with GSAP
gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  // 1. Global Parallax Background
  // These layers span the entire body scroll. We move them upwards (negative y) at different speeds.
  // We use large numbers so the effect is very obvious over the long scroll of the site.
  gsap.to(".layer-1", {
    y: "-40vh", // Move up slowly
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1 
    }
  });

  gsap.to(".layer-2", {
    y: "-80vh", // Move up faster
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1
    }
  });

  gsap.to(".layer-3", {
    y: "-120vh", // Move up fastest (closest to camera)
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1
    }
  });

  // 2. ARRC Cycle Nodes Animation
  const nodes = gsap.utils.toArray('.node');
  const arrows = gsap.utils.toArray('.cycle-arrow');

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".arrc-cycle-container",
      start: "top 80%",
    }
  });

  gsap.set(nodes, { scale: 0, opacity: 0 });
  gsap.set(arrows, { scaleX: 0, opacity: 0, transformOrigin: "left center" });

  tl.to(nodes[0], { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
    .to(arrows[0], { scaleX: 1, opacity: 1, duration: 0.3 })
    .to(nodes[1], { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
    .to(arrows[1], { scaleX: 1, opacity: 1, duration: 0.3 })
    .to(nodes[2], { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" });


  // 3. Economic Section: Number Counters
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
    stagger: 0.2,
    scrollTrigger: {
      trigger: ".action-steps",
      start: "top 80%"
    }
  });
});
