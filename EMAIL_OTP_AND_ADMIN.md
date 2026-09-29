# Email OTP, Login Terms & Admin Lawyer Editing

> **Update:** OTP codes are now generated, hashed and verified entirely on the server (see `src/lib/otp.server.ts`).
> The service-role key and `OTP_HMAC_SECRET` are required in production; for local development without email
> set `OTP_DEV_LOG=true` to print the code in the server console. Admin accounts are invitation-only
> (`public.admin_allowlist`). See `DEPLOYMENT_AWS.md`.

## Real email OTP
The app now refuses to claim an OTP was sent unless the backend successfully sends the email through SMTP/Gmail.

Set these in `.env`:
- `GMAIL_USER`
- `GMAIL_APP_PASS`

or:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

Then run the backend:
`npm run dev:server`

Run the frontend separately:
`npm run dev`

A successful OTP request means the SMTP server accepted the message. The user must enter the received six-digit code, so the mailbox is effectively verified by possession of the OTP.

## Login Terms
The login form opens Terms & Conditions before the login OTP is sent. The user must check the agreement and choose `Accept & Continue`.

## Admin lawyer editing
Admin navigation now includes `Manage Lawyers` at `/admin/lawyers`. Admins can edit name, email, phone, city, specialization, experience, fee, Bar Council ID, State Bar Council and bio. Changes are stored locally and synchronized to the Supabase `lawyers` table when Supabase is configured.

## Security
Do not commit `.env`. Rotate any API keys/passwords that were previously exposed in a shared ZIP or repository.
