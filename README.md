# EduPulse 360

EduPulse 360 is an action-first business operations and training intelligence platform. This repository currently contains the secure technical foundation for future CRM, training, finance, and action modules.

## Foundation included

- Next.js 16 App Router with TypeScript and Tailwind CSS.
- Supabase browser/server clients using environment variables.
- Supabase Auth login, logout, session-aware routing, and protected `/app` routes.
- Server-side profile resolution with centralized Admin, Manager, Sales, Trainer, Finance, and Student roles.
- Reusable permission helpers for future server actions and route handlers.
- Reproducible Supabase migration for organizations, user profiles, audit logs, triggers, and RLS.
- Responsive authenticated application shell with future module placeholders.
- Loading and error boundaries.

Read [the foundation setup guide](docs/FOUNDATION_SETUP.md) for environment variables, migration steps, authentication behavior, and validation commands. The product architecture and later module scope remain in [the implementation blueprint](docs/IMPLEMENTATION_BLUEPRINT.md).

## Quick start

```bash
npm ci
cp .env.example .env.local
# Configure Supabase values in .env.local
npm run dev
```
