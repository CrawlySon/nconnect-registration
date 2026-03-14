# nConnect26 Registration System

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Supabase (PostgreSQL)
- Nodemailer (SMTP email)
- Tailwind CSS
- Deployed on Vercel

## Key Patterns
- Server-side Supabase client: use `createServerClient()` from `@/lib/supabase/server`
- Admin auth: JWT in HTTP-only cookies, verified by `src/middleware.ts`
- Email: SMTP via Nodemailer (not Resend), table-based buttons for compatibility
- Attendee identity: URL query parameter `?attendee=<id>`

## Security Instructions
When the user mentions deploying, pushing to production, or going live (e.g. "pushni to", "ideme nasadiť", "daj to do produkcie", "deploy"), proactively ask:
> "Chceš, aby som pred deployom spravil bezpečnostnú revíziu (`/security-review`)?"

This gives the user the option to run a security audit before each deploy. Always respect their answer - if they say no, proceed without it.
