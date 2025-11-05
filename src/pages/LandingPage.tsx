import { useEffect } from "react";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CtaSection from "@/components/landing/CtaSection";
import FaqSection from "@/components/landing/FaqSection";
import Footer from "@/components/landing/Footer";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const LandingPage = () => {
  useScrollReveal();

  useEffect(() => {
    document.title = "Aivy - Your Notes. Your Plan. Your Success.";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Transform your learning with AI-powered study planning. Upload notes, create smart schedules, and achieve academic success with our intelligent study planner.');
    }

    // Force light theme on landing page
    const root = document.documentElement;
    root.classList.remove('dark');
    
    // Cleanup: restore previous theme when leaving
    return () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        root.classList.add('dark');
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <CtaSection />
      <FaqSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
