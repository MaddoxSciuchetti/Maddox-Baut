import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Briefcase, User2, Phone, Menu, X, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { ComingSoonBadge } from "@/components/ui/coming-soon-badge";

interface LayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onPanelChange?: (panel: string | null) => void;
}

const translations = {
  en: {
    about: "About",
    projects: "Projects",
    contact: "Contact",
    virtualWorld: "Virtual World",
    passionateLearner: "passionate learner"
  },
  de: {
    about: "Über mich",
    projects: "Projekte",
    contact: "Kontakt",
    virtualWorld: "Virtuelle Welt",
    passionateLearner: "leidenschaftlicher Lerner"
  },
};

export default function Layout({ children, activeSection, onSectionChange, onPanelChange }: LayoutProps) {
  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];
  const [imageError, setImageError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (section: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onSectionChange(section);
    setMobileMenuOpen(false);
  };

  const handleVirtualWorldClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onPanelChange?.('virtual-world');
    setMobileMenuOpen(false);
  };

  const navItems = [
    { icon: <User2 className="w-4 h-4" />, label: t.about, section: "about" },
    { icon: <Briefcase className="w-4 h-4" />, label: t.projects, section: "projects" },
    { icon: <Phone className="w-4 h-4" />, label: t.contact, section: "contact" },
    { 
      icon: <Globe className="w-4 h-4" />, 
      label: t.virtualWorld, 
      section: "virtual-world",
      comingSoon: true,
      action: (e: React.MouseEvent) => {
        e.preventDefault();
        onPanelChange?.('virtual-world');
        setMobileMenuOpen(false);
      }
    },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black text-white">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 sticky top-0 z-30 bg-black">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 p-0.5 overflow-hidden">
            {!imageError ? (
              <img 
                src="/Maddox.JPG"
                alt="Maddox Sciuchetti" 
                className="w-full h-full object-cover rounded-full"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
                <span className="text-lg font-bold tracking-tighter">MS</span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Maddox Sciuchetti</h2>
          </div>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-white/5 hover:bg-white/10"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 border-b border-white/10 overflow-hidden sticky top-[57px] z-20"
          >
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.section}
                  href={`#${item.section}`}
                  onClick={item.action || handleNavClick(item.section)}
                  className={`flex items-center px-3 py-3 rounded-md transition-all duration-200 ${
                    activeSection === item.section
                      ? "bg-white/10 text-white font-medium"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.comingSoon && <ComingSoonBadge />}
                </a>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className="w-full justify-start mt-2 border-white/10 text-white/80 hover:text-white hover:bg-white/5"
              >
                {language === 'en' ? 'Deutsch' : 'English'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar (desktop) */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden md:flex md:w-72 bg-black/95 p-6 flex-col border-r border-white/10 backdrop-blur-sm md:sticky md:top-0 md:h-screen"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-white/20 to-white/5 p-1 flex items-center justify-center mb-5 overflow-hidden shadow-xl">
            {!imageError ? (
              <img 
                src="/Maddox.JPG"
                alt="Maddox Sciuchetti" 
                className="w-full h-full object-cover rounded-full"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
                <span className="text-3xl font-bold tracking-tighter">MS</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Maddox Sciuchetti</h1>
          <Badge variant="outline" className="text-xs font-normal bg-white/5 border-white/20">
            {t.passionateLearner}
          </Badge>
          <Separator className="w-12 h-px bg-white/20 my-4" />
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-grow mb-6 pr-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.section}
                href={`#${item.section}`}
                onClick={item.action || handleNavClick(item.section)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-all duration-200 ${
                  activeSection === item.section
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </div>
                {item.comingSoon && <ComingSoonBadge />}
              </a>
            ))}
          </nav>
        </ScrollArea>

        <div className="pt-4 border-t border-white/10">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="w-full justify-start border-white/10 text-white/80 hover:text-white hover:bg-white/5"
          >
            {language === 'en' ? 'Deutsch' : 'English'}
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-24 pt-4 relative">
        {children}
      </main>
    </div>
  );
}