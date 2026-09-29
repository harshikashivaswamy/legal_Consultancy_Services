# What was fixed (security + correctness pass)

| Area | Problem found | Fix |
| --- | --- | --- |
| OTP verify (`src/routes/api/verify-otp.ts`) | Returned `valid: true` for **any** code when the DB lookup failed (it always failed: `send-otp` inserted a `phone` column that did not exist). | Rewritten to fail closed. Logic lives in `src/lib/otp.server.ts`. |
| OTP send (`src/routes/api/send-otp.ts`) | Client could supply its own `code`; codes stored/logged in plain text; no rate limit; table readable by the public key. | Server-generated random code, HMAC-hashed, 5-min expiry, single-use, 5 attempts, resend cooldown + hourly cap, never logged. Table is service-role only. |
| Admin sign-up | Anyone could register as `admin` (role came from editable metadata and was copied to the DB). | Admins are invitation-only via `public.admin_allowlist`; DB trigger assigns roles; roles cannot be changed from the browser. |
| Login (`src/lib/auth.tsx`) | Any Supabase error (e.g. wrong password) silently created a demo session for any role. | No demo fallback when Supabase is configured / in production builds. Role read from `profiles`. |
| Portals (`DashboardShell.tsx`, `AuthForm.tsx`) | Any signed-in user could open any portal. | Guard checks role == portal; login from the wrong portal is refused. |
| Database (`supabase/schema.sql`) | Destructive `drop table` script; wide-open RLS policies; missing insert policies (lawyer registration, profile sync, reviews) so writes failed. | Non-destructive, re-runnable schema with least-privilege RLS, protected role/verification fields, private storage buckets. |
| Data source | Admin approvals lived in the admin's own browser only. | Approvals + dashboard counts read from the database when configured. |
| Misc | Hard-coded Supabase URL; `localhost:5000` calls from the browser; fake hard-coded notifications; legacy Express server exposed unauthenticated writes and treated unsigned payments as verified. | Removed / fail-closed; Express server marked dev-only. |

New files: `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `DEPLOYMENT_AWS.md`, `src/lib/otp.server.ts`,
`src/routes/api/health.ts`. Updated: `.env.example`, `supabase/schema.sql`.

**Not verified by running:** the change set was written without being able to install dependencies, so it has
been syntax-checked only. Run `npm ci && npm run build` and fix/report anything the type-checker flags.
