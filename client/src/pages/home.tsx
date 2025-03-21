import { useState, useEffect, useRef } from "react";
import Layout from "@/components/layout";
import About from "@/components/about";
import Projects from "@/components/projects";
import Contact from "@/components/contact";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const translations = {
  en: {
    greeting: "Hello, I'm Maddox",
    subtitle: "This is my Meta Front. Optimizing my own life and constantly learning.",
  },
  de: {
    greeting: "Hallo, ich bin Maddox",
    subtitle: "Dies ist meine Meta Front. Ich optimiere mein Leben und lerne ständig dazu.",
  }
};

export default function Home() {
  const [activeSection, setActiveSection] = useState("about");
  const contentRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const t = translations[language];

  // Function to handle section changes without scrolling
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    const url = new URL(window.location.href);
    url.hash = section;
    window.history.pushState({}, "", url.toString());
  };

  // Function to handle panel changes
  const handlePanelChange = (panel: string | null) => {
    // Find the closest App component and update its state
    const event = new CustomEvent('panelChange', { detail: panel });
    window.dispatchEvent(event);
  };

  // Check URL hash on load and when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["about", "projects", "contact"].includes(hash)) {
        setActiveSection(hash);
      }
    };

    handleHashChange();
    const handleUrlChange = () => {
      handleHashChange();
    };

    window.addEventListener("popstate", handleUrlChange);
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, []);

  return (
    <Layout 
      activeSection={activeSection} 
      onSectionChange={handleSectionChange}
      onPanelChange={handlePanelChange}
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 sm:space-y-8"
      >
        {/* Header Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 sm:mb-12 px-4 sm:px-6 md:px-8 pt-8 sm:pt-10 md:pt-12"
        >
          <Badge 
            variant="outline" 
            className="mb-3 sm:mb-4 text-xs sm:text-sm font-medium bg-white/10 border-white/30 px-3 py-1 sm:px-4 sm:py-1.5 ml-1 shadow-sm"
          >
            Portfolio
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 tracking-tight text-white pl-1">
            {t.greeting}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed pl-1">
            {t.subtitle}
          </p>
          <Separator className="mt-6 sm:mt-8 bg-white/10" />
        </motion.div>

        {/* Content Container */}
        <div ref={contentRef} className="relative min-h-[500px] sm:min-h-[600px] md:min-h-[700px] overflow-y-visible">
          <AnimatePresence mode="wait">
            {/* About Me Section */}
            {activeSection === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="relative w-full" 
              >
                <About />
              </motion.div>
            )}

            {/* Projects Section */}
            {activeSection === "projects" && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="relative w-full"
              >
                <Projects />
              </motion.div>
            )}

            {/* Contact Section */}
            {activeSection === "contact" && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="relative w-full"
              >
                <Contact />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </Layout>
  );
}