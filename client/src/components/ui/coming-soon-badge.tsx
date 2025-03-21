import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const translations = {
  en: {
    comingSoon: "Coming Soon"
  },
  de: {
    comingSoon: "Demnächst verfügbar"
  }
};

export function ComingSoonBadge() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <motion.div 
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-medium px-3 py-1 rounded-md flex items-center gap-1"
    >
      <Clock className="h-3 w-3" />
      {t.comingSoon}
    </motion.div>
  );
}
