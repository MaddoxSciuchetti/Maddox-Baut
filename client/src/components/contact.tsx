import { Button } from "@/components/ui/button";
import { Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const translations = {
  en: {
    title: "Contact",
    subtitle: "If you want to work on something, get in touch with me.",
    location: "Location",
    emailLabel: "Email",
    phone: "Phone",
    locationValue: "Berlin, Germany",
  },
  de: {
    title: "Kontakt",
    subtitle: "Kontaktieren Sie mich, wenn Sie zusammenarbeiten möchten oder Fragen haben.",
    location: "Standort",
    emailLabel: "E-Mail",
    phone: "Telefon",
    locationValue: "Berlin, Deutschland",
  },
};

export default function Contact() {
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
      className="w-full max-w-4xl mx-auto px-4 pb-20 overflow-visible"
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

      <div className="flex justify-center">
        <motion.div 
          variants={item} 
          className="w-full max-w-md"
          whileHover={{ 
            y: -5,
            transition: { duration: 0.2 }
          }}
        >
          <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md">
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg tracking-tight">{t.title}</CardTitle>
              <CardDescription className="text-white/60 text-xs sm:text-sm">Get in touch</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-4 sm:space-y-5">
              <motion.div 
                className="flex items-start space-x-2 sm:space-x-3"
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
              >
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white/60 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white">{t.location}</p>
                  <p className="text-xs sm:text-sm text-white/70">{t.locationValue}</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start space-x-2 sm:space-x-3"
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
              >
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-white/60 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white">{t.emailLabel}</p>
                  <a 
                    href="mailto:maddoxsciuchetti@gmail.com" 
                    className="text-xs sm:text-sm text-white/70 hover:text-white transition-colors break-all"
                  >
                    maddoxsciuchetti@gmail.com
                  </a>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-start space-x-2 sm:space-x-3"
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-white/60 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-white">{t.phone}</p>
                  <a 
                    href="tel:+4915123180706" 
                    className="text-xs sm:text-sm text-white/70 hover:text-white transition-colors"
                  >
                    +49 151 2318 0706
                  </a>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}