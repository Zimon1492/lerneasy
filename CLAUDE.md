# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server on localhost:3000

# Database
npm run db:push      # Push Prisma schema changes to SQLite DB (no migration)
npm run db:seed      # Seed the database (runs prisma/seed.cjs)
npm run db:studio    # Open Prisma Studio GUI

# Build & Lint
npm run build        # Production build
npx eslint .         # Lint (no dedicated npm script)
```

There is no test suite configured.

## Environment Variables

Copy and configure a `.env` file with:
- `ADMIN_KEY` — password for the admin area
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — nodemailer email config
- `FROM_EMAIL` — sender address for outgoing emails
- `NEXT_PUBLIC_BASE_URL` — public base URL (default: `http://localhost:3000`)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — for next-auth (if used)

## Architecture

This is a **Next.js 16 App Router** application (TypeScript + Tailwind CSS) for a tutoring marketplace ("Lernapp") targeting Austrian school students.

### Database

**Prisma + SQLite** (`prisma/dev.db`). The singleton client is at `app/lib/prisma.ts`.

Key models and their relationships:
- `Teacher` — tutors with subjects, password reset flow, `mustChangePassword` flag
- `User` — students with Austrian school attributes (`SchoolTrack`, `SchoolForm`, `SchoolLevel`, grade)
- `TeachingOffer` — a teacher's offer for a specific subject/school form/grade range
- `Availability` — teacher time slots, optionally linked to a `TeachingOffer`
- `Booking` — links student + teacher + availability; includes Stripe payment fields
- `Chat` / `ChatMessage` — messaging between student and teacher, optionally tied to a booking
- `TeacherApplication` — stores incoming teacher job applications with optional PDF upload
- `PasswordResetToken` — one-time tokens for the teacher set-password flow

### Route Structure

**Public pages:**
- `/` — landing page with teacher grid and teacher application form
- `/apply-test` — test page for the application form
- `/auth/error` — NextAuth error page

**Teacher area:**
- `/teacher` — teacher dashboard (reads from `localStorage`)
- `/teacher/set-password` — password setup via token link (sent by admin email)

**Admin area** (protected by `admin_auth` cookie or `x-admin-key` header):
- `/admin/login` — sets the `admin_auth` cookie (24h)
- `/admin/teachers` — admin teacher management UI

**API routes (`app/api/`):**
- `POST /api/admin/login` — validates `ADMIN_KEY`, sets cookie
- `POST /api/admin/logout` — clears cookie
- `POST /api/admin/teachers` — creates a teacher (requires admin auth)
- `POST /api/teachers/apply` — handles teacher application form + PDF upload + sends two emails
- `POST /api/teacher/set-password` — validates reset token, hashes and saves new password
- `GET /api/_email-test` — internal email smoke-test route

### Auth Model

- **Admin**: Simple `ADMIN_KEY` env var checked in API routes. Auth state is an `admin_auth` HttpOnly cookie.
- **Teachers**: Custom login stored in `localStorage` (no session cookie). Password reset via one-time token emailed by admin.
- **Students/next-auth**: `next-auth` is installed but not fully wired in yet.

### Key Conventions

- All API routes that need Node.js APIs (env, file system) must declare `export const runtime = "nodejs"`.
- PDF uploads from teacher applications are saved to `public/uploads/` with a timestamp-prefixed filename.
- The `Teacher` model has a legacy `subject: String` field (free text) alongside the normalized `TeachingOffer` relation — both coexist during transition.
- There are two component directories: `app/components/` (App Router components) and `src/components/` (legacy location). Prefer `app/components/` for new work.
- Shared types are centralized in `app/lib/types.ts` — import the `Teacher` type from there.
