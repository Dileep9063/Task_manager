import Navbar from "../components/Intro/Navbar";
import Hero from "../components/Intro/Hero";
import Features from "../components/Intro/Features";
import HowItWorks from "../components/Intro/HowItWorks";
import CTA from "../components/Intro/CTA";
import Footer from "../components/Intro/Footer";
import { useTheme } from "../context/ThemeContext";

import "./LandingPage.css";

function LandingPage() {
  const { theme } = useTheme();

  return (
    <div className="landing-container" data-theme={theme}>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}

export default LandingPage;