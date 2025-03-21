import { Card, CardContent } from "@/components/ui/card";
import { Code2, Activity, Users, Brain } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const translations = {
  en: {
    title: "About Me",
    subtitle: "Hello, I'm Maddox and 18 years old! In my free time I develop MVPs for Ideas/Solutions that I need in my life. Besides this I enjoy improving myself by going to the gym, meditating and learning about new technologies.",
    passions: "My Passions",
    webDev: "Web Development",
    webDevDesc: "Creating modern websites and applications that solve real-world problems",
    llmFineTuning: "LLM Fine-Tuning",
    llmFineTuningDesc: "Specializing in fine-tuning large language models for custom applications and specific use cases",
    selfImprovement: "Improving Myself",
    selfImprovementDesc: "Going to the gym, meditating, and constantly learning new technologies",
    meetingPeople: "Meeting People",
    meetingPeopleDesc: "Connecting with others, sharing ideas and collaborating on interesting projects"
  },
  de: {
    title: "Über Mich",
    subtitle: "Hallo, ich bin Maddox! Als leidenschaftlicher Webentwickler erschaffe ich moderne und benutzerfreundliche Webseiten mit einem Auge für Design und technischem Know-how.",
    passions: "Meine Leidenschaften",
    webDev: "Webentwicklung",
    webDevDesc: "Moderne Websites und Anwendungen erstellen, die reale Probleme lösen",
    llmFineTuning: "LLM Fine-Tuning",
    llmFineTuningDesc: "Spezialisierung auf das Fine-Tuning von großen Sprachmodellen für benutzerdefinierte Anwendungen und spezifische Anwendungsfälle",
    selfImprovement: "Selbstverbesserung",
    selfImprovementDesc: "Ins Fitnessstudio gehen, meditieren und ständig neue Technologien lernen",
    meetingPeople: "Menschen Treffen",
    meetingPeopleDesc: "Mit anderen in Kontakt treten, Ideen austauschen und an interessanten Projekten zusammenarbeiten"
  }
};

export default function About() {
  const { language } = useLanguage();
  const t = translations[language];

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
        <Separator className="my-3 sm:my-4" />
      </div>

      <motion.h3 
        variants={item}
        className="text-lg sm:text-xl font-bold mb-4"
      >
        {t.passions}
      </motion.h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <motion.div 
          variants={item}
          whileHover={{ 
            y: -5,
            transition: { duration: 0.2 }
          }}
        >
          <Card className="bg-black/50 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all duration-300">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col items-center text-center">
                <motion.div 
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/10 flex items-center justify-center mb-2 sm:mb-3"
                  whileHover={{ scale: 1.1 }}
                >
                  <Code2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.div>
                <h4 className="font-bold text-base sm:text-lg mb-1">{t.webDev}</h4>
                <p className="text-xs sm:text-sm text-white/70">{t.webDevDesc}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          variants={item}
          whileHover={{ 
            y: -5,
            transition: { duration: 0.2 }
          }}
        >
          <Card className="bg-black/50 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all duration-300">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col items-center text-center">
                <motion.div 
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/10 flex items-center justify-center mb-2 sm:mb-3"
                  whileHover={{ scale: 1.1 }}
                >
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.div>
                <h4 className="font-bold text-base sm:text-lg mb-1">{t.llmFineTuning}</h4>
                <p className="text-xs sm:text-sm text-white/70">{t.llmFineTuningDesc}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          variants={item}
          whileHover={{ 
            y: -5,
            transition: { duration: 0.2 }
          }}
        >
          <Card className="bg-black/50 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all duration-300">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col items-center text-center">
                <motion.div 
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/10 flex items-center justify-center mb-2 sm:mb-3"
                  whileHover={{ scale: 1.1 }}
                >
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.div>
                <h4 className="font-bold text-base sm:text-lg mb-1">{t.selfImprovement}</h4>
                <p className="text-xs sm:text-sm text-white/70">{t.selfImprovementDesc}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          variants={item}
          whileHover={{ 
            y: -5,
            transition: { duration: 0.2 }
          }}
        >
          <Card className="bg-black/50 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all duration-300">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col items-center text-center">
                <motion.div 
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/10 flex items-center justify-center mb-2 sm:mb-3"
                  whileHover={{ scale: 1.1 }}
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.div>
                <h4 className="font-bold text-base sm:text-lg mb-1">{t.meetingPeople}</h4>
                <p className="text-xs sm:text-sm text-white/70">{t.meetingPeopleDesc}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}