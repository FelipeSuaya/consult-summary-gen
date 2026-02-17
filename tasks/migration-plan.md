# Migration Plan: ConsultSummary (Vite SPA → Next.js App Router)

## Context

**ConsultSummary** is a medical consultation recording app that uses AssemblyAI for transcription and GPT-4.1-nano for SOAP note generation. Currently it's a Vite + React 18 SPA with no backend — all API calls (including sensitive ones with hardcoded keys) happen client-side, and AI processing runs through n8n webhooks.

**Why migrate**: The app has critical security issues (API keys exposed in browser), no SSR, and depends on an external n8n instance for core business logic. Moving to Next.js App Router lets us run sensitive operations server-side, eliminate the n8n dependency, and follow the project's established 5-layer architecture pattern.

**User decisions**: App Router, API Routes (eliminate n8n), new Supabase project (schema only), Supabase Realtime for status updates, Vercel deployment, full security refactor.

---

## Phase 0: New Supabase Project Setup (~1h)

1. Create new Supabase project (region `sa-east-1`)
2. Run the existing migration SQL from `supabase/migrations/20250801184557_*.sql` (creates all 5 tables, RLS, triggers, default prompt)
3. Add `status` column + indexes to `consultations`:
   ```sql
   ALTER TABLE public.consultations ADD COLUMN status TEXT DEFAULT 'completed';
   CREATE INDEX idx_consultations_status ON public.consultations(status);
   CREATE INDEX idx_consultations_user_id ON public.consultations(user_id);
   CREATE INDEX idx_consultations_patient_id ON public.consultations(patient_id);
   ```
4. Create `consultation-audios` storage bucket (public, 50MB, audio mimes)
5. Enable Realtime on `consultations` table
6. Enable email/password auth provider
7. Record: project URL, anon key, service role key

**Verify**: `SELECT * FROM prompts` returns default prompt; RLS blocks cross-user queries.

---

## Phase 1: Next.js Project Scaffolding (~3h)

### New project structure
```
consult-summary-next/
├── .env.local                    # ALL secrets (never committed)
├── .env.example                  # Template
├── next.config.ts
├── tailwind.config.ts
├── middleware.ts                  # Auth middleware
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root: providers, fonts, metadata
│   │   ├── page.tsx              # Dashboard (server shell)
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── auth/
│   │   │   ├── page.tsx
│   │   │   └── callback/route.ts
│   │   ├── consultation/[id]/page.tsx
│   │   └── api/
│   │       ├── transcribe/route.ts         # Full pipeline: AssemblyAI + GPT SOAP
│   │       ├── upload-audio/route.ts       # Upload audio to AssemblyAI
│   │       └── medical-analytics/route.ts  # AI analytics chat
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser client (@supabase/ssr)
│   │   │   ├── server.ts         # Server client (cookies)
│   │   │   └── service.ts        # Service role (admin only)
│   │   ├── ai/
│   │   │   ├── assemblyai.ts     # Server-only: create/poll transcript
│   │   │   ├── openai.ts         # Server-only: SOAP generation
│   │   │   └── prompts.ts        # SOAP prompt + analytics prompt
│   │   ├── errors/app-error.ts
│   │   ├── utils.ts              # cn() + parseTextToSoapData
│   │   └── medical-terms.ts      # 90+ term corrections
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── actions/auth-actions.ts
│   │   │   ├── hooks/use-auth.ts
│   │   │   └── components/auth-form.tsx
│   │   ├── consultations/
│   │   │   ├── actions/consultation-actions.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-consultation-queries.ts
│   │   │   │   ├── use-consultation-mutations.ts
│   │   │   │   ├── use-consultations.ts          # Unified hook
│   │   │   │   └── use-realtime-status.ts        # Supabase Realtime
│   │   │   ├── stores/consultation-ui-store.ts   # Zustand (UI only)
│   │   │   ├── components/
│   │   │   │   ├── audio-recorder.tsx
│   │   │   │   ├── consultations-list.tsx
│   │   │   │   ├── consultation-detail.tsx
│   │   │   │   ├── consultation-transformer.tsx
│   │   │   │   └── consultation-fullscreen-modal.tsx
│   │   │   └── types/index.ts
│   │   ├── patients/
│   │   │   ├── actions/patient-actions.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-patient-queries.ts
│   │   │   │   ├── use-patient-mutations.ts
│   │   │   │   └── use-patients.ts               # Unified hook
│   │   │   ├── stores/patient-ui-store.ts
│   │   │   ├── components/
│   │   │   │   ├── patients-list.tsx
│   │   │   │   ├── patient-selector.tsx
│   │   │   │   ├── patient-consultations.tsx
│   │   │   │   └── date-filter.tsx
│   │   │   └── types/index.ts
│   │   ├── soap/
│   │   │   ├── components/
│   │   │   │   ├── soap-summary.tsx              # 'use client'
│   │   │   │   ├── medical-soap-cards.tsx        # Server Component
│   │   │   │   ├── section-card.tsx              # 'use client'
│   │   │   │   ├── lab-table.tsx                 # Server Component
│   │   │   │   ├── lab-card.tsx                  # 'use client'
│   │   │   │   ├── clinical-header.tsx           # Server Component
│   │   │   │   ├── alerts-panel.tsx              # Server Component
│   │   │   │   ├── key-chips.tsx                 # Server Component
│   │   │   │   ├── print-header.tsx              # Server Component
│   │   │   │   ├── header-bar.tsx                # 'use client'
│   │   │   │   └── history-panel.tsx             # 'use client'
│   │   │   └── types/soap.ts
│   │   ├── analytics/
│   │   │   ├── components/
│   │   │   │   ├── medical-analytics-chat.tsx
│   │   │   │   └── markdown-renderer.tsx
│   │   │   └── hooks/use-analytics.ts
│   │   └── logging/actions/log-actions.ts
│   │
│   ├── components/
│   │   ├── ui/           # shadcn/ui primitives (copy all)
│   │   ├── header.tsx
│   │   └── providers.tsx # QueryClient + Tooltip + Toaster
│   │
│   └── types/database.ts  # Auto-generated Supabase types
```

### Key Dependencies to Install
```
next@^15, react@^19, react-dom@^19, @supabase/supabase-js@^2.49, @supabase/ssr@^0.6,
@tanstack/react-query@^5.56, zustand@^5, openai@^4, zod@^3.23, react-hook-form@^7.53,
@hookform/resolvers@^3.9, date-fns@^4.1, recharts@^2.12, lucide-react@^0.462,
class-variance-authority@^0.7, clsx@^2.1, tailwind-merge@^2.5, sonner@^1.5,
server-only, + all current @radix-ui/* packages
```

### Environment Variables (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Server only
ASSEMBLYAI_API_KEY=xxx                   # Server only
OPENAI_API_KEY=sk-xxx                    # Server only
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Steps
1. `npx create-next-app@latest consult-summary-next` (TypeScript, App Router, Tailwind, src/)
2. Install all dependencies
3. Copy `tailwind.config.ts` (update content paths to `src/`)
4. Copy all `src/components/ui/` shadcn primitives as-is
5. Set up `.env.local` with all keys, `.env.example` with empty values
6. Create `src/components/providers.tsx` (QueryClientProvider + TooltipProvider + Toaster)
7. Create root `src/app/layout.tsx` with Providers wrapper

**Verify**: `pnpm dev` starts clean, shadcn components render.

---

## Phase 2: Auth Migration (~4h)

### What changes
- **Delete**: `src/contexts/AuthContext.tsx` (React Context auth)
- **Replace with**: Middleware + Supabase SSR + Server Actions

### Steps
1. **Create Supabase client factories**:
   - `lib/supabase/client.ts`: `createBrowserClient()` using `NEXT_PUBLIC_*` env vars
   - `lib/supabase/server.ts`: `createServerClient()` with cookies from `next/headers`
   - `lib/supabase/service.ts`: Service role client with `import 'server-only'`

2. **Create middleware** (`src/middleware.ts`):
   - Refresh session on every request via Supabase SSR
   - Redirect unauthenticated users → `/auth` (for all routes except `/auth`, `/auth/callback`)
   - Redirect authenticated users on `/auth` → `/`

3. **Create auth server actions** (`modules/auth/actions/auth-actions.ts`):
   ```typescript
   'use server'
   export async function loginAction(email: string, password: string)
   export async function registerAction(email: string, password: string)
   export async function logoutAction()
   ```

4. **Create auth hook** (`modules/auth/hooks/use-auth.ts`):
   - Thin wrapper: `supabase.auth.onAuthStateChange` for client reactivity
   - Exposes `user`, `loading` only (login/register are server actions)

5. **Migrate Auth page**: `src/pages/Auth.tsx` → `src/app/auth/page.tsx` + `modules/auth/components/auth-form.tsx`
   - Replace `useNavigate` → `redirect()`
   - Replace `useAuth().login()` → `loginAction()`
   - Form uses Server Actions with progressive enhancement

6. **Create auth callback** (`src/app/auth/callback/route.ts`): Exchange code for session

**Verify**: Register → confirm email → login → dashboard; refresh persists session; logout clears; access / without auth → redirect to /auth.

---

## Phase 3: N8N → API Routes Conversion (~8h)

This is the most critical phase. The n8n "Med AI" workflow becomes API routes.

### Source: `workflows n8n para migrar/Med AI.json`

### Route 1: `POST /api/upload-audio`
Replaces client-side AssemblyAI upload (currently AudioRecorder.tsx with exposed API key).

```
Client sends FormData(audio blob)
→ Server uploads to AssemblyAI POST /v2/upload (server-side key)
→ Server also saves to Supabase Storage as backup
→ Returns { uploadUrl }
```

### Route 2: `POST /api/transcribe`
Replaces the entire n8n Med AI workflow.

```
Client sends { consultationId, assemblyUploadUrl }
→ Server validates auth + input (Zod)
→ Updates consultation status to "processing" in DB (triggers Realtime)
→ POST AssemblyAI /v2/transcript {
    audio_url, speech_model:"universal",
    speaker_labels:true, language_detection:true
  }
→ Poll GET /v2/transcript/{id} every 3s (max 60 attempts = 3 min)
→ On completed: extract utterances, format as "Speaker N:\n{text}"
→ Send to OpenAI GPT-4.1-nano (temperature=0) with SOAP system prompt
→ Parse structured JSON {
    Subjective, Objective, Assessment, Plan,
    DiagnosticoPresuntivo, Laboratorio
  }
→ Update consultation in DB: transcription + summary + status "completed"
→ On any error: status "failed" in DB
```

**Max duration**: `export const maxDuration = 300` (Vercel Pro) or `60` (Hobby)

### Route 3: `POST /api/medical-analytics`
Replaces n8n `lovable-bot` webhook (used by MedicalAnalyticsChat).

```
Client sends { question, patientId }
→ Server fetches patient + consultations from DB (don't trust client data)
→ Builds context (symptoms, diagnoses, monthly patterns)
→ Calls OpenAI GPT-4.1-nano with analytics prompt
→ Returns { response }
```

### Server-only modules to create

**`lib/ai/assemblyai.ts`** (with `import 'server-only'`):
- `createTranscript(audioUrl)` → returns transcript ID
- `pollTranscript(transcriptId)` → polls until completed/error
- `formatUtterances(utterances)` → formats as "Speaker N:\n{text}"
- `uploadAudio(blob)` → uploads to AssemblyAI, returns URL

**`lib/ai/openai.ts`** (with `import 'server-only'`):
- `generateSoapAnalysis(transcript, systemPrompt)` → returns parsed SOAP JSON
- `generateAnalyticsResponse(context, question)` → returns analytics text

**`lib/ai/prompts.ts`**:
- `SOAP_SYSTEM_PROMPT` — the exact Spanish medical prompt from the n8n workflow (copied verbatim from the Med AI.json LLM chain node)
- `ANALYTICS_SYSTEM_PROMPT` — for the medical analytics chat

### Supabase Realtime hook

**`modules/consultations/hooks/use-realtime-status.ts`**:
```typescript
'use client'
// Subscribe to postgres_changes on consultations table
// Filter by consultation ID
// On UPDATE: trigger callback with new status
// Client uses this to know when processing → completed/failed
```

### Client flow after migration
1. User records audio → stops
2. Client uploads to `POST /api/upload-audio` → gets `assemblyUploadUrl`
3. Client creates consultation via server action (status: "processing")
4. Client fires `POST /api/transcribe` (fire-and-forget, don't await response)
5. Client subscribes to Realtime for that consultation ID
6. When status → "completed": TanStack Query invalidation refetches data
7. When status → "failed": show error toast

**Verify**: Upload audio → full pipeline completes → SOAP appears; check Network tab for zero API keys.

---

## Phase 4: Data Layer Migration (~5h)

Convert all direct Supabase calls → Server Actions + TanStack Query.

### Server Actions

**`modules/consultations/actions/consultation-actions.ts`**:
```typescript
'use server'
// Each action: createServerSupabaseClient() → getUser() → validate(Zod) → execute → return
export async function getConsultationsAction()
export async function getConsultationByIdAction(id: string)
export async function getConsultationsByPatientAction(patientId: string)
export async function createConsultationAction(data: CreateConsultationInput)
export async function updateConsultationAction(id: string, data: UpdateConsultationInput)
export async function deleteConsultationAction(id: string)
```

**`modules/patients/actions/patient-actions.ts`**:
```typescript
'use server'
export async function getPatientsAction(startDate?: string, endDate?: string)
export async function getPatientByIdAction(id: string)
export async function searchPatientsAction(query: string)
export async function createPatientAction(data: CreatePatientInput)
export async function updatePatientAction(id: string, data: UpdatePatientInput)
export async function deletePatientAction(id: string)
```

**Key fix**: Current `getPatients()` in `src/lib/patients.ts:65-132` has N+1 queries (fetches each patient's first consultation separately). Fix with single query:
```sql
SELECT p.*,
  (SELECT date_time FROM consultations c WHERE c.patient_id = p.id ORDER BY date_time ASC LIMIT 1) as first_consultation_date
FROM patients p WHERE p.user_id = $1 ORDER BY p.name
```

### TanStack Query hooks (per module)
- `use-consultation-queries.ts`: `useConsultations()`, `useConsultationById(id)`, `useConsultationsByPatient(patientId)`
- `use-consultation-mutations.ts`: `useCreateConsultation()`, `useUpdateConsultation()`, `useDeleteConsultation()` — each invalidates relevant query keys in `onSuccess`
- `use-consultations.ts` (unified): combines queries + mutations + UI store. **Components only import the unified hook.**

Same pattern for patients module.

### Zustand stores (UI state ONLY)
- `consultation-ui-store.ts`: activeTab, selectedConsultationId, showNewConsultation
- `patient-ui-store.ts`: searchTerm, sortDirection, expandedPatientId

**Verify**: All CRUD works through server actions; cache invalidates after mutations; no direct Supabase calls from components.

---

## Phase 5: Component Migration (~10h)

### Key changes by component

| Component | Change |
|---|---|
| **AudioRecorder** (1017 lines) | **Major rewrite**: Remove `ASSEMBLY_API_KEY` constant, replace `uploadToAssemblyAI` with `/api/upload-audio`, replace webhook call with `/api/transcribe`, add Realtime subscription. Keep MediaRecorder/backup logic. |
| **Header** | Replace react-router `Link` → `next/link`, replace `useAuth()` context → `useAuth()` hook |
| **ConsultationsList** | Replace direct Supabase queries → unified hook |
| **ConsultationDetail** | Replace direct mutations → unified hook |
| **PatientsList** | Replace direct queries → unified hook |
| **PatientSelector** | Replace direct queries → unified hook |
| **MedicalAnalyticsChat** | Replace n8n webhook → `/api/medical-analytics`, remove localStorage webhook config |
| **PromptManager** | Replace direct Supabase calls → prompt server actions |
| **ConsultationTransformer** | Replace n8n webhook → server action |
| **Index.tsx → page.tsx** | Server Component shell, client tabs inside |
| **Auth.tsx → auth/page.tsx** | Server actions for login/register |
| **All SOAP display components** | Minimal changes — 6 can be Server Components, 5 stay 'use client' |

### Server Components (no 'use client' needed)
These render from props only: `MedicalSoapCards`, `LabTable`, `ClinicalHeader`, `AlertsPanel`, `KeyChips`, `PrintHeader`

**Verify**: Every page renders; all interactions work; no react-router imports remain.

---

## Phase 6: Security Hardening (~2h)

### Checklist
- [ ] `ASSEMBLYAI_API_KEY` only in `.env.local`, only used in `lib/ai/assemblyai.ts`
- [ ] `OPENAI_API_KEY` only in `.env.local`, only used in `lib/ai/openai.ts`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in `.env.local`, only used in `lib/supabase/service.ts`
- [ ] All 3 server-only modules have `import 'server-only'` at top
- [ ] `.env.local` in `.gitignore`
- [ ] `.env.example` committed with empty values
- [ ] No hardcoded URLs (Supabase, n8n) in any source file
- [ ] All server actions start with `getUser()` auth check
- [ ] All inputs validated with Zod schemas
- [ ] RLS active on all tables
- [ ] `next build` output contains zero API keys (grep check)

**Verify**: `grep -r "01dca411\|ASSEMBLY_API_KEY\|sk-\|service_role" .next/` returns nothing.

---

## Phase 7: Vercel Deployment (~1h)

1. Push to GitHub
2. Connect to Vercel
3. Set all env vars in Vercel dashboard
4. Configure in `next.config.ts`:
   ```typescript
   experimental: { serverActions: { bodySizeLimit: '50mb' } }
   ```
5. Add Vercel domain to Supabase Auth redirect URLs
6. Test full E2E on production URL

**Verify**: Auth flow, audio recording, transcription pipeline, Realtime updates, analytics chat — all work on production.

---

## Phase Dependencies

```
Phase 0 (Supabase) ──→ Phase 1 (Scaffold) ──→ Phase 2 (Auth) ──┬──→ Phase 4 (Data Layer)
                                                │                 │          │
                                                └──→ Phase 3 (API Routes) ──┘
                                                                             │
                                                                    Phase 5 (Components)
                                                                             │
                                                                    Phase 6 (Security)
                                                                             │
                                                                    Phase 7 (Deploy)
```

Phases 2 and 3 can partially overlap (both need Supabase client factories from Phase 1).

---

## Critical Source Files Reference

| Current file | Purpose | Migration notes |
|---|---|---|
| `src/components/AudioRecorder.tsx` | 1017-line recording component | Major rewrite (remove API keys, use API routes + Realtime) |
| `workflows n8n para migrar/Med AI.json` | n8n workflow definition | Convert to `/api/transcribe` + `/api/upload-audio` |
| `supabase/migrations/20250801184557_*.sql` | Full DB schema | Replay on new project + add status column |
| `src/types/soap.ts` | SOAP types + converter | Move to `modules/soap/types/soap.ts` |
| `src/lib/storage.ts` | Consultation CRUD | Convert to server actions |
| `src/lib/patients.ts` | Patient CRUD (has N+1 bug) | Convert to server actions, fix N+1 |
| `src/lib/api.ts` | Medical term corrections + prompt mgmt | Move to `lib/medical-terms.ts` + `lib/ai/prompts.ts` |
| `src/lib/webhooks.ts` | n8n webhook caller | Delete entirely (replaced by API routes) |
| `src/lib/medicalAnalytics.ts` | Analytics webhook caller | Replace with `/api/medical-analytics` |
| `src/contexts/AuthContext.tsx` | React Context auth | Delete (replaced by middleware + server actions) |
| `src/integrations/supabase/client.ts` | Hardcoded Supabase client | Replace with env-based `@supabase/ssr` clients |

## Total Estimated Effort: ~34h
