import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LandingHero } from "@/components/landing/landing-hero";
import { PipelineStrip } from "@/components/landing/pipeline-strip";
import { LandingStats } from "@/components/landing/landing-stats";
import { LandingFeatures } from "@/components/landing/landing-features";
import { ArrowRight, Search, Upload } from "lucide-react";

export const dynamic = "force-dynamic";

async function loadStats() {
  // Be tolerant of an unmigrated DB — landing should still render.
  try {
    const [total, ready, processing, topSkill, recent] = await Promise.all([
      prisma.candidate.count(),
      prisma.candidate.count({ where: { processingStatus: "READY" } }),
      prisma.candidate.count({
        where: {
          processingStatus: {
            in: ["UPLOADED", "QUEUED", "EXTRACTING_TEXT", "CHUNKING", "EMBEDDING", "ANALYSING"],
          },
        },
      }),
      prisma.candidate.findFirst({
        where: { primarySkills: { not: null as any } },
        orderBy: { createdAt: "desc" },
        select: { primarySkills: true },
      }),
      prisma.candidate.findMany({
        where: { processingStatus: "READY" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          fullName: true,
          currentTitle: true,
          yearsExperience: true,
          primarySkills: true,
        },
      }),
    ]);
    return { total, ready, processing, topSkill, recent };
  } catch {
    return { total: 0, ready: 0, processing: 0, topSkill: null, recent: [] };
  }
}

export default async function HomePage() {
  const stats = await loadStats();
  return (
    <div className="space-y-16">
      <LandingHero />

      <LandingStats
        total={stats.total}
        ready={stats.ready}
        processing={stats.processing}
        recent={stats.recent}
      />

      <PipelineStrip />

      <LandingFeatures />

      <section className="card relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.18),transparent_70%)]" />
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl space-y-2">
            <h2 className="h-cinematic text-gradient-violet">Start the agent.</h2>
            <p className="text-slate-400">
              Drop CVs in. Watch the agent scan, structure and rank them. Search
              talent in plain English. Built on Claude Sonnet 4.6 + a private
              vector store on your own Hetzner infrastructure.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/upload" className="btn-primary">
              <Upload className="h-4 w-4" /> Upload CVs
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/candidates" className="btn-ghost">
              <Search className="h-4 w-4" /> Search talent
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
