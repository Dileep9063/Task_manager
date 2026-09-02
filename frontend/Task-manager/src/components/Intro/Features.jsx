import { useEffect, useRef, useState } from "react";
import "./Features.css";

const features = [
  {
    title: "Create Tasks",
    description: "Quickly create and organize your daily tasks."
  },
  {
    title: "Edit Tasks",
    description: "Update task details whenever your plans change."
  },
  {
    title: "Delete Tasks",
    description: "Remove completed or unwanted tasks easily."
  },
  {
    title: "Track Progress",
    description: "Monitor completed and pending tasks in one place."
  },
  {
    title: "Due Dates",
    description: "Set deadlines so you never miss important work."
  },
  {
    title: "Secure Access",
    description: "Your account is protected with secure authentication."
  }
];

function Features() {
  const featuresRef = useRef(null);

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth > 1024 : true
  );

  // Keep isDesktop in sync with viewport (handles resize/rotate too)
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1025px)");
    const handleChange = (e) => setIsDesktop(e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // No auto-scroll on desktop — it's a static grid
    if (isDesktop) return;

    const container = featuresRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      const cards = container.querySelectorAll(".feature-card");
      if (!cards.length) return;

      const cardWidth = cards[0].offsetWidth;
      const gap = 20;
      const moveAmount = cardWidth + gap;
      const firstSetWidth = moveAmount * features.length;

      // If we've scrolled past the first full set, snap back instantly
      // (direct scrollLeft assignment = no animation, ever)
      if (container.scrollLeft >= firstSetWidth - 5) {
        container.scrollLeft = container.scrollLeft - firstSetWidth;
      }

      container.scrollBy({
        left: moveAmount,
        behavior: "smooth"
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isDesktop]);

  return (
    <section className="features" id="features">
      <h2>Features</h2>
      <p className="features-subtitle">
        Everything you need to stay productive.
      </p>

      <div className="features-grid" ref={featuresRef}>
        {features.map((feature, index) => (
          <div className="feature-card" key={index}>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}

        {/* Only render duplicates on mobile/tablet for the infinite scroll effect.
            Desktop never gets these in the DOM at all. */}
        {!isDesktop &&
          features.map((feature, index) => (
            <div className="feature-card" key={`duplicate-${index}`}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
      </div>
    </section>
  );
}

export default Features;