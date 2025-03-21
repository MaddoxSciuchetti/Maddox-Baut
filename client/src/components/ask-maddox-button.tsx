import { motion } from "framer-motion";
import { useState } from "react";
import MaddoxModal from "./MaddoxModal";
import { Mic } from "lucide-react";

export default function AskMaddoxButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <motion.div 
        className="fixed top-20 right-8 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-20 h-20 rounded-full overflow-hidden relative shadow-lg hover:shadow-xl transition-shadow"
            onClick={openModal}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 animate-gradient" />
            <div className="absolute inset-0 backdrop-blur-sm bg-black/10" />
            <div className="absolute inset-0 flex items-center justify-center flex-col text-white">
              <Mic className="mb-1" size={20} />
              <span className="text-sm font-medium">Voice<br />Assistant</span>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* MaddoxModal */}
      <MaddoxModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}