import { UploadStudio } from "@/components/upload/upload-studio";
import { AuthGateBanner } from "@/components/shell/auth-gate-banner";

export const metadata = {
  title: "Upload & Scan — CV Intelligence Agent",
};

// Page uses Clerk's <SignedOut> which requires runtime auth context.
export const dynamic = "force-dynamic";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <span className="pill-accent w-fit">CV Upload Studio</span>
        <h1 className="h-cinematic text-gradient-violet">
          Drop CVs. Watch the agent scan in real time.
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          PDF, DOCX or TXT. The pipeline extracts text, chunks by CV section,
          embeds with your chosen provider, indexes vectors in Qdrant, and asks
          Claude to extract structured candidate metadata — all on your own
          Hetzner infrastructure.
        </p>
      </header>
      <AuthGateBanner
        feature="upload CVs"
        reason="Parsing uses Anthropic credits and creates a private candidate pool for you."
      />
      <UploadStudio />
    </div>
  );
}
