import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VirtualWorldProps {
  onClose?: () => void;
}

const translations = {
  en: {
    title: "Virtual World",
    subtitle: "Experience Maddox's world in 3D",
    description: "A unique virtual experience is coming soon. You'll be able to explore my projects and ideas in an interactive 3D environment."
  },
  de: {
    title: "Virtuelle Welt",
    subtitle: "Erleben Sie Maddox' Welt in 3D",
    description: "Eine einzigartige virtuelle Erfahrung kommt bald. Sie werden meine Projekte und Ideen in einer interaktiven 3D-Umgebung erkunden können."
  }
};

export default function VirtualWorld({ onClose }: VirtualWorldProps) {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="bg-black/95 h-full p-6 overflow-y-auto">
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-0 top-0 text-white/70 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.title}</h1>
          <ComingSoonBadge />
        </div>

        <p className="text-white/70 mb-4">{t.subtitle}</p>
        <Separator className="mb-8 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-cyan-500/50" />

        <Card className="bg-black/50 border border-white/10 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="aspect-video w-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
              <p className="text-white/50">3D Preview Coming Soon</p>
            </div>
            <p className="text-white/70">{t.description}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}