import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { TopNav } from "@/components/shell/top-nav";

export const metadata: Metadata = {
  title: "CV Intelligence Agent — AI Talent Cockpit",
  description:
    "Scan every CV. Understand every skill. Find the right talent instantly. Powered by Claude.",
  metadataBase: new URL(
    process.env.PUBLIC_URL ?? "https://cv.oneplaceplatform.com",
  ),
  openGraph: {
    title: "CV Intelligence Agent",
    description:
      "Bulk-upload CVs, extract structured candidate profiles with Claude, search semantically, generate shortlists and interview kits.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#8b5cf6",
          colorBackground: "#0a0c1c",
          colorInputBackground: "#0f1228",
          colorInputText: "#ffffff",
          colorText: "#e2e8f0",
          colorTextSecondary: "#94a3b8",
          borderRadius: "0.75rem",
        },
        elements: {
          card: "shadow-glow",
          formButtonPrimary:
            "bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className="min-h-screen bg-ink-950 text-slate-100 antialiased selection:bg-violet-glow/40">
          <div className="fixed inset-0 -z-10 bg-executive-gradient" />
          <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
          <TopNav />
          <main className="relative mx-auto w-full max-w-[1400px] px-6 pb-24 pt-8 md:px-8">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
