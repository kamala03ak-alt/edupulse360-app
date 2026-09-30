# EduPulse 360 technical foundation

This document describes the foundation implemented on top of the existing Next.js 16 App Router starter. The product modules in `docs/IMPLEMENTATION_BLUEPRINT.md` remain intentionally unimplemented.

## Environment variables

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable/anon key. This is the only Supabase credential used in browser-safe code.
- `SUPABASE_SERVICE_ROLE_KEY`: reserved for future server-only jobs. It is not used by the current UI and must never be prefixed with `NEXT_PUBLIC_`.
- `GEMINI_API_KEY`: reserved for the later read-only assistant phase. It must remain server-only.

Do not commit `.env.local` or any real credential.

## Supabase setup

1. Create or select a Supabase project.
2. Copy its URL and publishable key into `.env.local`.
3. Run `supabase/migrations/0001_foundation.sql` in the Supabase SQL editor, or apply it with the Supabase CLI migration workflow.
4. Create users with Supabase Auth (email/password). The `on_auth_user_created` trigger creates a Student profile by default.
5. Promote the first trusted operator to `Admin` through a controlled SQL/admin workflow. Role changes are not exposed through browser UI.

The migration creates `organizations`, `user_profiles`, and `audit_logs`. It enables RLS and includes policies for self-profile access, administrator access, and protected audit access.

## Authentication and authorization

- `lib/supabase/client.ts` creates the browser client with publishable credentials only.
- `lib/supabase/server.ts` creates the request-aware server client and persists auth cookies.
- `proxy.ts` refreshes sessions and redirects unauthenticated `/app` requests to `/login`.
- `lib/auth/server.ts` resolves the Supabase user and active `user_profiles` row server-side.
- `lib/auth/roles.ts` centralizes role names, permissions, and reusable checks.
- Protected layouts call `requireAuth()`. Future server actions and route handlers should call `requireRole()` or `requirePermission()` before mutations or sensitive reads.

The browser never supplies an authoritative role. Supabase RLS remains the database-level defense-in-depth boundary.

## Local development

```bash
npm ci
cp .env.example .env.local
# Edit .env.local with Supabase settings
npm run dev
```

Validation commands:

```bash
npm run typecheck
npm run lint
npm run build
```

## Current routes

- `/login`: Supabase email/password login.
- `/app`: authenticated foundation home.
- `/app/settings/profile`: server-resolved profile and role view.
- `/app/crm`, `/app/training`, `/app/finance`, `/app/actions`: protected placeholders for later modules.

This phase deliberately does not implement CRM, LMS, finance, Action Engine, Lifecycle 360, Batch Health, Money Trail, Command Center analytics, or Gemini Assistant business logic.
