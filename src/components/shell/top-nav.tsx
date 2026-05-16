"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, LayoutDashboard, UploadCloud, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Cockpit", icon: Sparkles },
  { href: "/upload", label: "Upload & Scan", icon: UploadCloud },
  { href: "/candidates", label: "Candidates", icon: LayoutDashboard },
];

export function TopNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-3 md:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 shadow-glow">
            <Cpu className="h-5 w-5 text-white" />
            <span className="absolute inset-0 -z-10 animate-pulse-slow rounded-xl bg-violet-glow/40 blur-xl" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-white">
              CV Intelligence Agent
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
              OnePlace · Talent Cockpit
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "border border-violet-glow/30 bg-violet-glow/10 text-violet-100"
                    : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{l.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
