import { CandidateDashboard } from "@/components/dashboard/candidate-dashboard";
import { AuthGateBanner } from "@/components/shell/auth-gate-banner";

export const metadata = {
  title: "Candidates — CV Intelligence Agent",
};

export default function CandidatesPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <span className="pill-accent w-fit">Candidate intelligence</span>
        <h1 className="h-cinematic text-gradient-violet">
          Your talent pool, in one cockpit.
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Search candidates in plain English. Every match is scored, explained
          and traced back to exact CV evidence.
        </p>
      </header>
      <AuthGateBanner
        feature="search the talent pool"
        reason="Semantic search calls Claude. Sign in to keep results scoped to your private pool."
      />
      <CandidateDashboard />
    </div>
  );
}
