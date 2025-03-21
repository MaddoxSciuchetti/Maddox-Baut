import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import VirtualWorld from "@/pages/virtual-world";
import NotFound from "@/pages/not-found";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AskMaddoxButton from "@/components/ask-maddox-button";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function App() {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  useEffect(() => {
    const handlePanelChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setActivePanel(customEvent.detail);
    };

    window.addEventListener('panelChange', handlePanelChange);
    return () => {
      window.removeEventListener('panelChange', handlePanelChange);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <div className="relative">
          <Home />
          <AnimatePresence>
            {activePanel === 'virtual-world' && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                  onClick={() => setActivePanel(null)}
                />
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ 
                      type: "spring",
                      duration: 0.3,
                      bounce: 0.15
                    }}
                    className="w-[90%] max-w-4xl max-h-[85vh] bg-black/95 rounded-lg border border-white/10 shadow-2xl overflow-hidden"
                  >
                    <VirtualWorld onClose={() => setActivePanel(null)} />
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>
        </div>
        <AskMaddoxButton />
        <Toaster />
      </LanguageProvider>
    </QueryClientProvider>
  );
}