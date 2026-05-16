"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Database,
  FileSearch,
  Lock,
  Sparkles,
  Wand2,
} from "lucide-react";

const features = [
  {
    icon: FileSearch,
    title: "CV-aware chunking",
    body: "Sections are detected (Summary, Experience, Projects, Education) and kept whole so context survives retrieval.",
  },
  {
    icon: Brain,
    title: "Claude-grounded extraction",
    body: "Strict-JSON parsing with explicit anti-hallucination rules. Missing facts return null — never invented.",
  },
  {
    icon: Sparkles,
    title: "Explainable matching",
    body: "Every score is decomposed into skills / experience / domain / seniority, with evidence quotes from the CV.",
  },
  {
    icon: Database,
    title: "Qdrant vector store",
    body: "Embeddings live in Qdrant on your own Hetzner box. Originals + chunks land in Hetzner Storage Box.",
  },
  {
    icon: Wand2,
    title: "Interview kits",
    body: "Role + CV → 6-10 grounded interview questions across technical, behavioural, scenario and CV-validation.",
  },
  {
    icon: Lock,
    title: "Tenant-isolated by design",
    body: "Every row, vector and storage key carries a tenant id. Single-tenant today, multi-tenant tomorrow.",
  },
];

export function LandingFeatures() {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-white">
            What the agent does, in seven moves
          </h3>
          <p className="text-xs text-slate-400">
            Premium UX, production-grade pipeline, your own infrastructure.
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card !p-5"
            >
              <div className="flex items-center gap-2 text-violet-300">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-semibold text-white">
                  {f.title}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {f.body}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
