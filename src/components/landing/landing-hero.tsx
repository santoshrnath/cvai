"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, UploadCloud } from "lucide-react";
import { ScanningOrb } from "@/components/ui/scanning-orb";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-800/80 via-ink-900/60 to-ink-950 px-6 py-12 md:px-12 md:py-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.25),transparent_60%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_50%,rgba(34,211,238,0.15),transparent_50%)]" />

      <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pill-accent"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Claude Sonnet 4.6
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-gradient-violet font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl"
          >
            Scan every CV.
            <br />
            Understand every skill.
            <br />
            <span className="text-gradient-cyan">Find the right talent instantly.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-xl text-base leading-relaxed text-slate-300 md:text-lg"
          >
            An AI talent intelligence cockpit. Bulk-upload CVs, watch Claude
            extract structured candidate profiles in real time, then search,
            score and compare talent in plain English — all on your own
            Hetzner infrastructure.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Link href="/upload" className="btn-primary">
              <UploadCloud className="h-4 w-4" />
              Upload CVs
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/candidates" className="btn-ghost">
              Search the talent pool
            </Link>
            <div className="hidden items-center gap-2 text-xs text-slate-500 md:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-glow" />
              Agent online · vector store ready
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="hidden md:block"
        >
          <ScanningOrb size={360} />
        </motion.div>
      </div>
    </section>
  );
}
