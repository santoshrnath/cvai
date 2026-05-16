"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  FileText,
  Loader2,
  TriangleAlert,
  UploadCloud,
  X,
} from "lucide-react";
import { LiveScanCenter } from "./live-scan-center";
import { StatusBadge, type CandidateStatus } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type LocalFile = {
  id: string;
  file: File;
  state: "queued" | "uploading" | "processing" | "ready" | "failed";
  progress: number;
  candidateId?: string;
  error?: string;
};

export function UploadStudio() {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const candidateIds = useMemo(
    () => files.map((f) => f.candidateId).filter((x): x is string => !!x),
    [files],
  );

  const addFiles = useCallback((list: FileList | File[]) => {
    const incoming = Array.from(list).map<LocalFile>((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      state: "queued",
      progress: 0,
    }));
    setFiles((prev) => [...incoming, ...prev]);
    void startUpload(incoming);
  }, []);

  async function startUpload(batch: LocalFile[]) {
    for (const item of batch) {
      const fd = new FormData();
      fd.append("files", item.file);
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, state: "uploading", progress: 10 } : f)),
      );

      try {
        // We can't trivially stream XHR progress with fetch — fake a small
        // bump to "uploading" then jump to "processing" once we get a response.
        const bumpTimer = window.setInterval(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id && f.state === "uploading"
                ? { ...f, progress: Math.min(80, f.progress + 8) }
                : f,
            ),
          );
        }, 350);

        const res = await fetch("/api/cv/upload", { method: "POST", body: fd });
        window.clearInterval(bumpTimer);
        const json = (await res.json()) as {
          results?: Array<{
            fileName: string;
            ok: boolean;
            candidateId?: string;
            duplicate?: boolean;
            error?: string;
          }>;
        };
        const r = json.results?.[0];
        if (!r?.ok) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, state: "failed", progress: 100, error: r?.error ?? "Upload failed" }
                : f,
            ),
          );
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? {
                    ...f,
                    state: r.duplicate ? "ready" : "processing",
                    progress: 100,
                    candidateId: r.candidateId,
                  }
                : f,
            ),
          );
        }
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  state: "failed",
                  progress: 100,
                  error: err instanceof Error ? err.message : "Network error",
                }
              : f,
          ),
        );
      }
    }
  }

  // Poll status for files that have a candidateId and aren't ready/failed.
  useEffect(() => {
    const inflight = files.filter(
      (f) => f.candidateId && (f.state === "processing" || f.state === "uploading"),
    );
    if (inflight.length === 0) return;
    const ids = inflight.map((f) => f.candidateId!).join(",");
    const handle = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/candidates/status?ids=${encodeURIComponent(ids)}`);
        const json = (await res.json()) as {
          statuses?: Array<{
            id: string;
            processingStatus: CandidateStatus;
            processingError?: string | null;
          }>;
        };
        setFiles((prev) =>
          prev.map((f) => {
            if (!f.candidateId) return f;
            const s = json.statuses?.find((x) => x.id === f.candidateId);
            if (!s) return f;
            if (s.processingStatus === "READY")
              return { ...f, state: "ready", progress: 100 };
            if (s.processingStatus === "FAILED")
              return {
                ...f,
                state: "failed",
                progress: 100,
                error: s.processingError ?? "Processing failed",
              };
            return f;
          }),
        );
      } catch {
        /* keep polling */
      }
    }, 1200);
    return () => window.clearInterval(handle);
  }, [files]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeOne = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <motion.label
          htmlFor="cv-file"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "block cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition",
            dragOver
              ? "border-violet-glow/60 bg-violet-glow/10"
              : "border-white/10 bg-white/[0.03] hover:border-violet-glow/40 hover:bg-violet-glow/[0.04]",
          )}
          whileHover={{ scale: 1.005 }}
        >
          <input
            id="cv-file"
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-glow/30 bg-violet-glow/10 shadow-glow">
            <UploadCloud className="h-6 w-6 text-violet-200" />
          </div>
          <p className="text-base font-semibold text-white">
            Drop CVs here, or click to browse
          </p>
          <p className="mt-1 text-xs text-slate-400">
            PDF · DOCX · TXT — up to 25MB each, batch any size
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            <span className="pill">PDF</span>
            <span className="pill">DOCX</span>
            <span className="pill">TXT</span>
          </div>
        </motion.label>

        <div className="card !p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Upload queue</h3>
            <span className="text-xs text-slate-400">
              {files.length} file{files.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="scrollbar-thin max-h-[420px] space-y-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {files.length === 0 && (
                <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center text-xs text-slate-500">
                  No files yet. Drop CVs to start the agent.
                </p>
              )}
              {files.map((f) => (
                <UploadRow key={f.id} item={f} onRemove={removeOne} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <LiveScanCenter candidateIds={candidateIds} />
    </div>
  );
}

function UploadRow({
  item,
  onRemove,
}: {
  item: LocalFile;
  onRemove: (id: string) => void;
}) {
  const icon =
    item.state === "ready" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
    ) : item.state === "failed" ? (
      <TriangleAlert className="h-4 w-4 text-rose-300" />
    ) : item.state === "uploading" || item.state === "processing" ? (
      <Loader2 className="h-4 w-4 animate-spin text-violet-300" />
    ) : (
      <FileText className="h-4 w-4 text-slate-300" />
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-white">
              {item.file.name}
            </span>
            <span className="ml-auto text-[10px] text-slate-500">
              {(item.file.size / 1024).toFixed(0)} KB
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  item.state === "failed"
                    ? "bg-rose-400"
                    : item.state === "ready"
                      ? "bg-emerald-glow"
                      : "bg-gradient-to-r from-violet-glow to-cyan-glow",
                )}
                initial={{ width: 0 }}
                animate={{ width: `${item.progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            {item.state === "ready" && (
              <StatusBadge status="READY" className="!py-0.5" />
            )}
            {item.state === "processing" && (
              <StatusBadge status="ANALYSING" className="!py-0.5" />
            )}
            {item.state === "uploading" && (
              <StatusBadge status="UPLOADED" className="!py-0.5" />
            )}
            {item.state === "failed" && (
              <StatusBadge status="FAILED" className="!py-0.5" />
            )}
          </div>
          {item.error && (
            <p className="mt-1.5 text-[11px] text-rose-300">{item.error}</p>
          )}
        </div>
        <button
          aria-label="Remove"
          className="rounded-md p-1 text-slate-500 transition hover:bg-white/5 hover:text-white"
          onClick={() => onRemove(item.id)}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
