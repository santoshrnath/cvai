# CV Intelligence Agent

**An AI talent intelligence cockpit. Scan every CV. Understand every skill. Find the right talent instantly.**

> Bulk-upload CVs and watch Claude Sonnet 4.6 extract structured candidate profiles in real time. Search the talent pool in plain English. Every match score is explained and traced back to specific CV evidence — on your own infrastructure.

Part of the **OnePlace / OneDataLens** ecosystem of AI products. Sister project: [OpenKPI Studio](https://openstudio.oneplaceplatform.com).

---

## Why this exists

Every recruiter, consulting firm and staffing team sits on a folder of PDFs they can't search. Existing ATSes treat CVs as documents to file, not as evidence to reason over. This agent flips that:

- **Upload one file or a thousand.** PDF, DOCX, TXT.
- **Watch the agent work.** A live pipeline animates Extract → Chunk → Embed → Analyse → Index → Ready for each CV.
- **Search in plain English.** *"Power BI + Azure Data Factory + finance domain experience."* Claude reasons over retrieved CV chunks, scores candidates on five weighted dimensions, cites the exact evidence, and surfaces gaps.
- **Generate interview kits.** Role + CV → 6–10 grounded questions across technical, behavioural, scenario and CV-validation. Each question carries a "look for" rubric and points back to the CV evidence that prompted it.
- **Your data, your infrastructure.** Originals + chunks land in Hetzner Storage Box. Vectors live in a private Qdrant instance. The app is a single Docker image you deploy on your own server.

---

## What's built

A working end-to-end product with four screens:

| Screen | What it does |
|---|---|
| **Cockpit** (`/`) | Cinematic landing with live pool stats, an animated scanning orb, and a seven-stage pipeline strip. |
| **Upload & Scan** (`/upload`) | Drag-drop bulk upload, per-file queue with status, and a **Live Scan Center** that polls the database every second and animates each CV through the pipeline as Claude parses it. |
| **Candidates** (`/candidates`) | Semantic search powered by Claude + Qdrant. Stats strip, skill cloud (highlighted by current search), candidate cards with scoring rings, score breakdown bars, and CV evidence quotes. |
| **Candidate Profile** (`/candidates/[id]`) | Premium three-column layout: skills/toolkit, AI summary + CV evidence by section, education/certifications/source documents. **Interview Kit dialog** that calls Claude with the CV context. |

And a real processing pipeline:

```
Upload → Hetzner S3 (originals)
       → pdf-parse / mammoth (extract text)
       → CV-aware chunker (sections preserved: Summary, Experience, Projects, Education, etc.)
       → Hetzner S3 (chunks.json)
       → Embedding provider (local Xenova / Voyage AI / OpenAI — all swappable)
       → Qdrant (vectors with rich payload: skills, years, industries, section)
       → Claude Sonnet 4.6 (strict-JSON metadata extraction, anti-hallucination)
       → Postgres (Candidate row with structured fields)
       → READY
```

Every step updates `Candidate.processingStatus` so the Live Scan Center animates the actual pipeline in real time. Failures are caught, recorded with a message, and surfaced in the UI.

---

## Architecture

```
┌────────────────────┐        ┌─────────────────────────────────────────────┐
│   Recruiter / HR   │        │     CV Intelligence Agent (Next.js 14)      │
│   uploads CVs      │───────▶│                                              │
└────────────────────┘        │   ┌────────────────────────────────────┐    │
                              │   │  Processing pipeline (server)      │    │
                              │   │  - text extraction (PDF/DOCX/TXT)  │    │
                              │   │  - CV-aware chunker (sections)     │    │
                              │   │  - embedding provider (swappable)  │    │
                              │   │  - Claude Sonnet 4.6 → strict JSON │    │
                              │   └────────────────────────────────────┘    │
                              │   ┌────────────────────────────────────┐    │
┌────────────────────┐  ◀────▶│   │  AI layer (Claude Sonnet 4.6)      │    │
│ Anthropic Claude   │        │   │  - CV metadata extraction          │    │
└────────────────────┘        │   │  - role / query matching + reasons │    │
                              │   │  - interview-kit generator        │    │
                              │   └────────────────────────────────────┘    │
                              │   ┌────────────────────────────────────┐    │
                              │   │  Storage abstraction               │    │
                              │   │  - S3Storage (Hetzner Storage Box) │    │
                              │   │  - LocalStorage (dev)              │    │
                              │   └────────────────────────────────────┘    │
                              │   ┌────────────────────────────────────┐    │
                              │   │  Vector abstraction                │    │
                              │   │  - QdrantVectorService (primary)   │    │
                              │   │  - PgVectorService (fallback)      │    │
                              │   └────────────────────────────────────┘    │
                              └─────────────────────────────────────────────┘
                                      │             │              │
                                      ▼             ▼              ▼
                              ┌──────────────┐ ┌────────┐ ┌────────────────┐
                              │  Postgres 17 │ │ Qdrant │ │ Hetzner Storage│
                              │  (pgvector)  │ │  vDB   │ │ Box (S3 compat)│
                              └──────────────┘ └────────┘ └────────────────┘
                              all hosted on your own Hetzner Cloud network
```

---

## Tech stack

**Frontend:** Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion · Lucide icons. Dark executive theme with glassmorphism, glow rings, and Framer-animated transitions throughout.

**Backend:** Next.js Route Handlers · Prisma ORM · Postgres 17 with pgvector · Qdrant · Anthropic SDK.

**AI:** Claude Sonnet 4.6 for *all* reasoning (CV parsing, candidate matching, interview-kit generation). Strict-JSON outputs with explicit anti-hallucination instructions in every prompt.

**Embeddings:** Provider abstraction with three backends:
- **Local** — `@xenova/transformers` `Xenova/all-MiniLM-L6-v2` (no API key, downloads on first run). Default — so the repo clones-and-runs.
- **Voyage AI** — `voyage-3-lite`. Anthropic's officially recommended embedding partner.
- **OpenAI** — `text-embedding-3-small`. Optional fallback.

> A note on Claude and embeddings: Anthropic's Claude does not expose an embedding endpoint — it is a text-generation model. Voyage AI is Anthropic's recommended embedding partner. This project keeps Claude as the reasoning layer (where it's exceptional) and isolates embeddings behind a provider interface.

**Storage:** S3-compatible (Hetzner Storage Box) for original CVs + extracted chunks. Local-filesystem fallback for dev.

**Deployment:** Docker Compose. Same `rsync + scp .env + docker compose up` pattern as the rest of the OnePlace ecosystem.

---

## What's intentionally not built (yet)

This is a focused, polished MVP for the most demoable surface. Deferred for v2:

- Role Matching workspace (the spec's full role-builder UI)
- Shortlist Builder
- Candidate Comparison (radar/spider visualisation)
- Multi-tenant authentication (the data model is tenant-scoped; auth wires in over the existing `tenantId` column)
- Admin Processing Monitor (the data is there — just no dedicated screen yet)

The processing pipeline runs inline on the upload request rather than via a separate BullMQ + Redis worker. This was a deliberate choice: status updates come from real DB writes, the UI polls every second, and the "live scan" animation is genuinely live. For thousands of CVs/day, swap `processCv()` into a BullMQ job — the pipeline is already a pure function over a buffer.

---

## Run it locally

```bash
git clone https://github.com/santoshrnath/cvai.git
cd cvai

# 1. Configure
cp .env.example .env.local
# Open .env.local and set ANTHROPIC_API_KEY at minimum.

# 2. Spin up Postgres + Qdrant + the app
docker compose up -d --build

# 3. Apply the Prisma schema
docker compose exec cvai-app npx prisma db push

# 4. Open the cockpit
open http://localhost:3060
```

That's it. Drop a CV on `/upload` and watch the agent.

### Pure-Node dev (no Docker)

If you want hot reload:

```bash
npm install --ignore-scripts
npm run prisma:generate
# Make sure Postgres + Qdrant are running (or use STORAGE_PROVIDER=local and VECTOR_DB_PROVIDER=pgvector for a one-DB setup).
npm run dev
```

---

## Deploy to Hetzner

Same pattern as [OpenKPI Studio](https://openstudio.oneplaceplatform.com):

```bash
CVAI_SSH_HOST=root@<your-hetzner-ip> ./deploy/hetzner/deploy.sh
```

The script `rsync`s the project (excluding `node_modules`, `.next`, `.git`, all `.env*` files), `scp`s your local `.env.local` to the server as `.env`, runs `docker compose up -d --build`, and pushes the Prisma schema. The container labels assume a shared Coolify-managed Traefik network — adjust if you use a different reverse proxy.

---

## Security and privacy

CVs contain personal data. The defaults here are conservative:

- Every row, vector and storage key carries a `tenantId` — single-tenant today, multi-tenant tomorrow with no schema migration.
- Storage URLs for originals are signed (or proxied via app routes locally) — no public CV links.
- Claude prompts include explicit instructions to ignore protected characteristics (age, gender, religion, nationality, ethnicity, marital status) and to never invent facts not present in the CV.
- Match scores are decomposed and traceable to evidence quotes — the AI supports the recruiter's decision, never replaces it.
- All AI extractions return strict JSON; missing data returns `null` or `[]`, never a hallucinated value.

This product is designed to **assist** human decisions about hiring. It does not make them.

---

## Project layout

```
src/
├── app/
│   ├── page.tsx                    Landing / Cockpit
│   ├── upload/page.tsx             Upload + Live Scan
│   ├── candidates/page.tsx         Dashboard + Search
│   ├── candidates/[id]/page.tsx    Candidate Profile
│   └── api/
│       ├── cv/upload               POST — multipart bulk upload
│       ├── candidates              GET — list + stats
│       ├── candidates/[id]         GET / DELETE — profile + cascade delete
│       ├── candidates/status       GET — live processing status (polled)
│       ├── search                  POST — semantic search with Claude scoring
│       ├── interview-kit           POST — generate per-candidate interview kit
│       └── storage/[bucket]        GET — local-storage download proxy
├── components/
│   ├── shell/top-nav.tsx
│   ├── landing/                    Hero, pipeline strip, stats, features
│   ├── upload/                     Upload studio + Live Scan Center
│   ├── dashboard/                  Dashboard, search, stats, skills cloud, candidate card
│   ├── profile/                    Profile + interview-kit dialog
│   └── ui/                         Score ring, skill chip, avatar, status badge, scanning orb
├── lib/
│   ├── ai/                         parse-cv, match-candidates, interview-kit
│   ├── documents/                  extractor (PDF/DOCX/TXT), CV-aware chunker, checksum
│   ├── embeddings/                 EmbeddingService + local/voyage/openai
│   ├── processing/pipeline.ts      The pipeline that wires it all together
│   ├── storage/                    StorageService + s3/local
│   ├── vector/                     VectorService + qdrant/pgvector
│   ├── anthropic.ts                Claude client + JSON extraction helpers
│   ├── prisma.ts                   Prisma singleton
│   └── env.ts                      Centralised env access
└── prisma/schema.prisma            Candidate, Document, Chunk, Role, Match models
```

---

## License

MIT.

---

Built by Santosh Raghunath as part of the [OnePlace / OneDataLens](https://oneplaceplatform.com) ecosystem.
