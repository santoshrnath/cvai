"use client";

import { SignedOut, SignInButton } from "@clerk/nextjs";
import { Lock, LogIn } from "lucide-react";

// Soft inline banner shown to anonymous visitors on cost-bearing pages
// (Upload, Candidates). They can still SEE the UI; they just can't run
// the cost-bearing endpoints without signing in.
export function AuthGateBanner({
  feature,
  reason,
}: {
  feature: string;
  reason: string;
}) {
  return (
    <SignedOut>
      <div className="card relative overflow-hidden !p-4">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.18),transparent_60%)]" />
        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-violet-glow/30 bg-violet-glow/10">
              <Lock className="h-4 w-4 text-violet-200" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Sign in to {feature}
              </p>
              <p className="text-xs text-slate-400">{reason}</p>
            </div>
          </div>
          <SignInButton mode="modal">
            <button className="btn-primary !py-2">
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </button>
          </SignInButton>
        </div>
      </div>
    </SignedOut>
  );
}
