"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";

// Animated scanning orb — the hero of the landing + scan-center screens.
// Three concentric rotating rings with a glowing document at the centre.

export function ScanningOrb({ size = 320 }: { size?: number }) {
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-full bg-violet-glow/25 blur-3xl"
        style={{ width: size, height: size }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border border-violet-glow/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-violet-glow shadow-glow" />
      </motion.div>
      <motion.div
        className="absolute inset-6 rounded-full border border-cyan-glow/30"
        animate={{ rotate: -360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute -right-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-cyan-glow shadow-glow-cyan" />
      </motion.div>
      <motion.div
        className="absolute inset-14 rounded-full border border-emerald-glow/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute left-1/2 -top-1.5 h-2 w-2 -translate-x-1/2 rounded-full bg-emerald-glow shadow-glow-emerald" />
      </motion.div>

      <motion.div
        className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-violet-600/40 to-violet-900/40 backdrop-blur-xl"
        animate={{
          boxShadow: [
            "0 0 30px rgba(139,92,246,0.5)",
            "0 0 60px rgba(139,92,246,0.85)",
            "0 0 30px rgba(139,92,246,0.5)",
          ],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <FileText className="h-10 w-10 text-violet-200" />
      </motion.div>

      <motion.div
        className="absolute left-1/2 top-1/2 h-1 w-[80%] -translate-x-1/2 -translate-y-1/2 origin-center"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.55) 50%, transparent 100%)",
        }}
        animate={{ scaleX: [0.6, 1, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
