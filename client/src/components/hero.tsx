import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

export default function Hero() {
  const scrollToProjects = () => {
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="py-10 sm:py-16 relative overflow-visible">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Webentwicklung für die Zukunft
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto">
            Innovative digitale Lösungen mit modernster Technologie
          </p>
          <Button 
            size="sm"
            onClick={scrollToProjects}
            className="bg-primary/20 hover:bg-primary/30 backdrop-blur-sm text-sm py-1 h-auto"
          >
            Projekte ansehen
            <ArrowDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}