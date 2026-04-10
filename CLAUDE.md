# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

---

## Commands

```bash
npm run dev       # Dev server with Turbopack
npm run build     # Production build (validates types & routes)
npm run seed      # Seed database via prisma/seed.ts
```

No test runner is configured. Use `npm run build` to validate TypeScript correctness.

---

## Stack

- **Next.js** (App Router) — read `node_modules/next/dist/docs/` before assuming API shape
- **Prisma 7** + `@prisma/adapter-mariadb` — uses Driver Adapter, NOT the default Rust engine
- **NextAuth.js** — Credentials provider, JWT strategy, 1-day session
- **TanStack Query v5** — all client-side data via hooks wrapping Server Actions
- **shadcn/ui** + **Tailwind CSS** + **Framer Motion**
- **Recharts** — performance charts on the Parent portal
- **FullCalendar** — admin calendar view (`dynamic` imported, `ssr: false`)

---

## Architecture

### Route Groups & Portals

```
src/app/
  (admin)/dashboard/   → Admin portal (ADMIN role only)
  (parent)/parent/     → Parent portal (PARENT + ADMIN)
  page.tsx             → Public landing page (server component, fetches public events)
  login/               → Auth entry point
```

### Data Flow (Server Actions → TanStack Query → Client)

All data fetching uses **Next.js Server Actions**, never API routes (except `/api/auth` for NextAuth and `/api/report/pdf`). The pattern is:

```
src/actions/*.ts      → Server Actions ("use server", auth-guarded)
src/hooks/use-*.ts    → TanStack Query wrappers ("use client")
src/app/**/page.tsx   → Consumes hooks
```

Every mutating action uses a Prisma `$transaction` that also calls `createAuditLog(tx, ...)` from `src/actions/audit.ts`.

### Auth — Three-Layer Guard

1. **Middleware** (`src/middleware.ts`) — redirects unauthenticated/wrong-role requests at the edge
2. **Layout** (`src/app/(admin)/layout.tsx`) — `getServerSession` + `redirect()` for server-side flash prevention
3. **Client** (`src/components/providers/auth-guard.tsx`) — `useSession` + `router.replace()` as final fallback

Server Actions use `requireAdmin()` from `src/lib/server-auth.ts` — this is the authoritative server-side check.

### Date Handling (WIB / Jakarta)

All dates are stored as **midnight Jakarta time** using explicit offset `+07:00` — never trust `new Date()` or `setHours()` for timezone math. Always use functions from `src/lib/date-utils.ts`:

- `toJakartaDate(input)` — normalize any input to midnight Jakarta (`Date` at `00:00:00+07:00`)
- `getJakartaToday()` — today's midnight in Jakarta, consistent across server timezones
- `toYYYYMMDD(date)` — safe `YYYY-MM-DD` string in Jakarta for date-only comparisons
- `combineDateAndTime(date, "HH:mm")` — produces ISO string with explicit `+07:00`

### Prisma

Singleton in `src/lib/prisma.ts`. Uses `PrismaMariaDb` adapter — no `.env` DATABASE_URL falls back gracefully in dev, throws in production.

Schema uses lowercase model names (`player`, `user`, `event`) — Prisma maps these to PascalCase in client. Soft delete on `player` via `isDeleted: boolean`. Always filter `isDeleted: false` in player queries.

### Type Registry

Shared types live in `src/types/dashboard.ts` (`Player`, `ScheduleEvent`, `AttendanceStatus`, `UserRole`). NextAuth session type augmentation is in `src/types/next-auth.d.ts`.

### Config-Driven Features

Event types are config objects in `src/lib/config/events.ts` — `EVENT_TYPES` record with `id`, `label`, `color`, `icon`. Use `getEventConfig(type)` instead of switch statements. Add new event types here, not scattered in components.

---

## Code Style Directives

- **Lean over verbose** — prefer declarative expressions, `map/filter/reduce`, and config objects over imperative `for` loops and `if/else` chains.
- **No hardcoded strings** — event types, roles, statuses live in config/types. Reference the constant, never the raw string.
- **No magic numbers** — extract to named constants if used more than once.
- **Functional data transforms** — pipeline `Object.entries().map()` etc. over mutating accumulators.
- **Server Actions are thin** — validate auth with `requireAdmin()`, do the DB work, `revalidatePath`, return data. Keep business logic out of components.
- **TanStack Query hooks are thin** — just wrap the action, set `staleTime`, done. No logic inside hooks.
- Mutations always go through `prisma.$transaction` so the audit log is atomic with the change.
