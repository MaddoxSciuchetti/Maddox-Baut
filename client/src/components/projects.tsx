import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const translations = {
  en: {
    title: "Projects",
    subtitle: "Here are some of my recent projects.",
    viewProject: "View Project",
    comingSoon: "Coming Soon",
    projects: [
      {
        title: "Goal Booster",
        description: "Type your goal and get daily affirmations, inspired by Napoleon Hill's 'Think and Grow Rich'."
      },
      {
        title: "MadDream",
        description: "Getting a detailed plan on how to achieve your dream"
      },
      {
        title: "Maddox Blogger",
        description: "Here I blog daily content"
      },
      {
        title: "Handyman Digital",
        description: "Prototype of how a automation system would look like for a Handyman business"
      },
      {
        title: "Create your Vision",
        description: "Making your own visionboard and describing how your future should look like with images and text"
      },
      {
        title: "AI Scheduler",
        description: "Naturally talking to your personal assistant that schedules tasks or retrieves important emails",
        comingSoon: true
      }
    ]
  },
  de: {
    title: "Projekte",
    subtitle: "Hier sind einige meiner neuesten Projekte.",
    viewProject: "Projekt ansehen",
    comingSoon: "Demnächst verfügbar",
    projects: [
      {
        title: "Goal Booster",
        description: "Eine Ziel-Tracking-App, die Benutzern hilft, motiviert und verantwortlich zu bleiben, indem sie tägliche Erinnerungen und Fortschrittsvisualisierung bietet."
      },
      {
        title: "MadDream",
        description: "Eine Traumjournal-Anwendung, die KI verwendet, um Muster zu analysieren und Einblicke in dein Unterbewusstsein zu geben."
      },
      {
        title: "Maddox Blogger",
        description: "Eine persönliche Blogging-Plattform, auf der ich meine Gedanken, Erfahrungen und Einsichten zu verschiedenen Themen teile."
      },
      {
        title: "Handyman Digital",
        description: "Eine professionelle Website für ein Handwerksunternehmen mit Dienstleistungen, Kundenbewertungen und Kontaktinformationen."
      },
      {
        title: "Create your Vision",
        description: "Eine digitale Vision-Board-Plattform, die dir hilft, deine Ziele und Träume durch personalisierte visuelle Darstellungen zu visualisieren und zu manifestieren."
      },
      {
        title: "AI Scheduler",
        description: "Ein intelligentes Planungstool, das deinen Kalender basierend auf deinen Produktivitätsmustern und Meeting-Präferenzen optimiert.",
        comingSoon: true
      }
    ]
  }
};

const projectLinks = [
  "https://goal-booster-maddoxsciuchett.replit.app",
  "https://maddream.de",
  "https://maddox-blogger-maddoxsciuchett.replit.app",
  "https://handyman-digital-maddoxsciuchett.replit.app",
  "https://interactive-canvas-maddoxsciuchett.replit.app/",
  "https://aischeduler.example.com"
];

export default function Projects() {
  const { language } = useLanguage();
  const t = translations[language];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pulseOpacity, setPulseOpacity] = useState(0.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseOpacity(prev => prev === 0.5 ? 1 : 0.5);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="w-full max-w-4xl mx-auto px-4 pb-16 overflow-visible"
    >
      <div className="space-y-2 mb-4 sm:mb-6">
        <motion.h1 
          variants={item}
          className="text-2xl sm:text-3xl font-bold tracking-tight"
        >
          {t.title}
        </motion.h1>
        <motion.p 
          variants={item}
          className="text-sm sm:text-base text-white/70"
        >
          {t.subtitle}
        </motion.p>
        <Separator className="my-3 sm:my-4 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-cyan-500/50" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {t.projects.map((project, index) => (
          <motion.div 
            key={index}
            variants={item}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="relative"
            whileHover={{ 
              y: -8,
              transition: { duration: 0.2 }
            }}
          >
            <Card className="bg-black/50 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all duration-300">
              {project.comingSoon && (
                <div className="absolute top-0 right-0 z-10">
                  <motion.div 
                    style={{ opacity: pulseOpacity }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-medium px-3 py-1 rounded-bl-md flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {t.comingSoon}
                  </motion.div>
                </div>
              )}
              <CardContent className="p-3 sm:p-4">
                <motion.div 
                  className="relative"
                  initial={false}
                  animate={{ 
                    y: hoveredIndex === index ? -2 : 0
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{project.title}</h3>
                  <p className="text-xs sm:text-sm text-white/70 mb-3">{project.description}</p>
                  <a 
                    href={project.comingSoon ? "#" : projectLinks[index]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full"
                    onClick={e => project.comingSoon && e.preventDefault()}
                  >
                    <Button 
                      variant="outline" 
                      className={`w-full border-white/10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 
                                hover:from-blue-500/30 hover:to-cyan-500/30 text-xs sm:text-sm py-1 h-auto 
                                ${project.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {project.comingSoon ? t.comingSoon : t.viewProject}
                      {!project.comingSoon && <ExternalLink className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />}
                    </Button>
                  </a>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}