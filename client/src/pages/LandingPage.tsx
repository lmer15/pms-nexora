import Navbar from "../components/Land/Navbar";
import Hero from "../components/Land/Hero";
import FeatureTabs from "../components/Land/Features";
import Steps from "../components/Land/Steps";
import Counters from "../components/Land/Counters";
import Testimonials from "../components/Land/Testimonials";
import CTA from "../components/Land/CTA";
import Footer from "../components/Land/Footer";
import React, { useState, useEffect } from "react";

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nexora-theme");
    if (saved) setDarkMode(saved === "dark");
  }, []);

  useEffect(() => {
    localStorage.setItem("nexora-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Add landing page class to root element for proper scrolling
  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.classList.add('landing-page-root');
    }
    
    // Cleanup: remove the class when component unmounts
    return () => {
      if (rootElement) {
        rootElement.classList.remove('landing-page-root');
      }
    };
  }, []);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="landing-page-container bg-neutral-light text-neutral-dark dark:bg-neutral-dark dark:text-neutral-light">
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="pt-20">
          <Hero />
          <FeatureTabs />
          <Steps />
          <Counters />
          <Testimonials />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
