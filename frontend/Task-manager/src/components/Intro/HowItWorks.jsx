import { useEffect, useRef, useState } from "react";
import "./HowItWorks.css";

function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create an Account",
      description: "Register in just a few seconds to get started."
    },
    {
      number: "02",
      title: "Login",
      description: "Access your personal dashboard securely."
    },
    {
      number: "03",
      title: "Manage Tasks",
      description: "Create, edit, delete, and organize your daily tasks."
    },
    {
      number: "04",
      title: "Track Progress",
      description: "Monitor completed and pending tasks to stay productive."
    }
  ];

  // One clone of the first card appended, so we can scroll "forward" onto it
  // then instantly (no animation) snap back to the real first card.
  const loopedSteps = [...steps, { ...steps[0], key: "clone" }];

  const containerRef = useRef(null);
  const indexRef = useRef(0); // 0..steps.length-1 = real cards, steps.length = clone
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e) => setIsDesktop(e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (isDesktop) return;

    const interval = setInterval(() => {
      const container = containerRef.current;
      if (!container) return;

      const firstCard = container.firstElementChild;
      if (!firstCard) return;

      const style = window.getComputedStyle(container);
      const gap = parseFloat(style.columnGap || style.gap) || 0;
      const cardWidth = firstCard.offsetWidth + gap;

      // Re-sync from real scroll position in case user manually scrolled
      indexRef.current = Math.round(container.scrollLeft / cardWidth);

      const nextIndex = indexRef.current + 1;

      // Always move forward, smoothly, to the next card (real or clone)
      container.scrollTo({
        left: nextIndex * cardWidth,
        behavior: "smooth"
      });
      indexRef.current = nextIndex;

      // Landed on the clone (index === steps.length) -> instantly snap back to 0
      if (nextIndex === loopedSteps.length - 1) {
        setTimeout(() => {
          // Direct assignment = truly instant, ignores scroll-behavior CSS entirely
          container.scrollLeft = 0;
          indexRef.current = 0;
        }, 500); // must be >= time it takes the smooth scroll above to finish
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isDesktop, loopedSteps.length]);

  return (
    <section className="how-it-works" id="how-it-works">
      <h2>How It Works</h2>
      <p className="how-subtitle">Get started in four simple steps.</p>

      <div className="steps-container" ref={containerRef}>
        {loopedSteps.map((step) => (
          <div className="step-card" key={step.key || step.number}>
            <div className="step-number">{step.number}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;