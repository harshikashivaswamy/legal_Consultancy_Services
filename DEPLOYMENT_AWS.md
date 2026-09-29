# Deploying Legal Consultancy Service on AWS

**Architecture**

```
Browser ──HTTPS──> AWS Application Load Balancer ──> ECS Fargate task (this Docker image)
                                                        │  website (SSR) + /api/* on one Node process
                                                        ▼
                                          Supabase (managed PostgreSQL + Auth)
```

* **Compute:** Amazon ECS on Fargate using **ECS Express Mode** (AWS App Runner is closed to new customers, so
  Express Mode is AWS's recommended replacement). It creates the load balancer, security groups, logs and
  auto-scaling for you from one container image.
* **Database:** Supabase Postgres (`supabase/schema.sql`). Choose an AWS region for the project
  (e.g. Mumbai `ap-south-1` for Indian users). The app already stores users, lawyers, bookings, payments,
  documents and notifications there.
* **Not used in production:** `server/index.js` (legacy dev-only Express server). Everything the website
  needs is served by the same Node process as the site.

> Moving the database itself into Amazon RDS is possible but is a separate, larger change: the app uses
> Supabase for login, row-level security and data access from the browser, all of which would need a new
> backend. Ask for that as a follow-up if you need it.

---

## Part A — Database (Supabase) — do this first

1. Create a project at <https://supabase.com/dashboard> (pick an AWS region; save the DB password).
2. **SQL Editor → New query →** paste the whole of `supabase/schema.sql` → **Run**.
   It is safe to run again later; it never deletes data.
3. Create your first administrator (separate query, your own email, lower-case):
   ```sql
   insert into public.admin_allowlist (email) values ('you@example.com') on conflict do nothing;
   ```
   Then register at `/auth/admin/register` with exactly that email. Anyone else who tries gets
   "Administrator accounts are created by invitation only".
   (If the account already exists: `update public.profiles set role = 'admin' where email = 'you@example.com';`)
4. **Authentication → Providers → Email:** turn **"Confirm email" OFF**. The app sends its own 6-digit code and
   creates the session right after sign-up; with Supabase confirmation ON, sign-up returns no session.
   (Trade-off: see "Known limitations".)
5. **Project Settings → API:** copy the **Project URL**, the **anon** key and the **service_role** key.
   The service_role key is a secret: it must only ever live in AWS Secrets Manager / your `.env`.
6. After the AWS service exists (Part C), add its URL under **Authentication → URL Configuration**
   (Site URL and Redirect URLs).

## Part B — Run it locally first

```bash
cp .env.example .env        # fill in the Supabase values, OTP_HMAC_SECRET, Gmail or SMTP
npm ci
npm run dev                 # http://localhost:8080
```
No email configured yet? Add `OTP_DEV_LOG=true` to `.env`: the 6-digit code is then printed in the terminal
(development only; it is ignored in production).

Test the production container the same way it will run on AWS:

```bash
docker compose up --build   # http://localhost:8080  ,  health: http://localhost:8080/api/health
```
Health check with a database ping: `/api/health?deep=1`.

## Part C — AWS

Prerequisites: an AWS account, the AWS CLI v2 (`aws configure`), and Docker. Replace `ap-south-1` and
`<ACCOUNT_ID>` with your region/account. **Apple-silicon Macs: keep `--platform linux/amd64`.**

### 1. Container registry (ECR) and image
```bash
aws ecr create-repository --repository-name legal-consultancy --region ap-south-1

aws ecr get-login-password --region ap-south-1 \
  | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com

docker build --platform linux/amd64 \
  --build-arg VITE_SUPABASE_URL="https://xxxx.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="eyJ..." \
  -t legal-consultancy:1 .

docker tag  legal-consultancy:1 <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/legal-consultancy:1
docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/legal-consultancy:1
```
The two `VITE_*` values are public (URL + anon key). They are baked into the browser bundle at build time,
so changing them means rebuilding the image.

### 2. Secrets (AWS Secrets Manager)
```bash
aws secretsmanager create-secret --region ap-south-1 --name legal/prod --secret-string '{
  "SUPABASE_SERVICE_ROLE_KEY": "eyJ...",
  "OTP_HMAC_SECRET": "<output of: openssl rand -hex 32>",
  "GMAIL_APP_PASS": "abcdefghijklmnop",
  "GROQ_API_KEY": "gsk_..."
}'
```
Note the secret's ARN from the output (it ends with a random 6-character suffix).

### 3. IAM roles
ECS Express Mode needs two roles:
* **Task execution role** – managed policy `AmazonECSTaskExecutionRolePolicy`, plus permission to read your
  secret: `secretsmanager:GetSecretValue` on the secret ARN from step 2.
* **Infrastructure role** – lets ECS create the load balancer/security groups on your behalf.

The easiest route is the **ECS console → create a service using Express Mode**; check whether the wizard
offers to create both roles for you (AWS's docs describe the roles). Either way, add the Secrets Manager
permission to the execution role in IAM.

### 4. Create the service
Console: fill in the image URI, container port **8080**, health check path **/api/health**, the environment
variables and secrets from the table below. Or with the CLI:

```bash
aws ecs create-express-gateway-service --region ap-south-1 \
  --service-name legal-consultancy \
  --execution-role-arn arn:aws:iam::<ACCOUNT_ID>:role/<execution-role> \
  --infrastructure-role-arn arn:aws:iam::<ACCOUNT_ID>:role/<infrastructure-role> \
  --health-check-path /api/health \
  --cpu 512 --memory 1024 \
  --primary-container '{
    "image": "<ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/legal-consultancy:1",
    "containerPort": 8080,
    "environment": [
      {"name": "NODE_ENV",          "value": "production"},
      {"name": "SUPABASE_URL",      "value": "https://xxxx.supabase.co"},
      {"name": "SUPABASE_ANON_KEY", "value": "eyJ..."},
      {"name": "GMAIL_USER",        "value": "you@gmail.com"},
      {"name": "GROQ_MODEL",        "value": "llama-3.3-70b-versatile"}
    ],
    "secrets": [
      {"name": "SUPABASE_SERVICE_ROLE_KEY", "valueFrom": "<SECRET_ARN>:SUPABASE_SERVICE_ROLE_KEY::"},
      {"name": "OTP_HMAC_SECRET",           "valueFrom": "<SECRET_ARN>:OTP_HMAC_SECRET::"},
      {"name": "GMAIL_APP_PASS",            "valueFrom": "<SECRET_ARN>:GMAIL_APP_PASS::"},
      {"name": "GROQ_API_KEY",              "valueFrom": "<SECRET_ARN>:GROQ_API_KEY::"}
    ]
  }'
```
The service page shows the public URL once tasks are healthy (a few minutes).

### 5. Environment variables at a glance

| Name | Where | Secret? |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID` | Docker **build args** (bundled in the browser) | No |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | container **environment** (server reads these) | No |
| `SUPABASE_SERVICE_ROLE_KEY`, `OTP_HMAC_SECRET` | container **secrets** | **Yes** |
| `GMAIL_USER` + `GMAIL_APP_PASS` *or* `SMTP_HOST/PORT/USER/PASS` | environment / secrets | password: **Yes** |
| `GROQ_API_KEY` | secret | **Yes** |

Without `SUPABASE_SERVICE_ROLE_KEY` the server refuses to send or check one-time codes in production
(by design) and admin registration is blocked.

### 6. Update / redeploy
Build and push a new tag, then:
```bash
aws ecs update-express-gateway-service --region ap-south-1 --service-arn <SERVICE_ARN> \
  --primary-container '{"image": "<ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/legal-consultancy:2", "containerPort": 8080}'
```
To be safe, include the `environment` and `secrets` again in `--primary-container` when you update the image.
Logs are in CloudWatch Logs (log group for the service). Running costs come from Fargate tasks plus the load
balancer; delete the service from the ECS console when you are done testing.

### 7. Point Supabase at it
Add the service URL to Supabase **Authentication → URL Configuration** (Site URL + Redirect URLs).

## Verify the deployment

1. `https://<your-url>/api/health` → `{"status":"ok",...}`; `…/api/health?deep=1` → `"database":"ok"`.
2. Register a client at `/auth/client/register` → the 6-digit email arrives → account created.
3. Try a **wrong** code → rejected. Try a **wrong password** at login → rejected.
4. As an existing client, open `/admin` → redirected to the login page (role guard).
5. Register your allow-listed email at `/auth/admin/register` → lands in the admin dashboard.
6. Register a lawyer → the application appears under **Admin → Advocate Approvals** (on another browser too).
   Approve it → it appears in the client directory.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Docker build stops with "expected .output/server/index.mjs" | Confirm the Docker build sets `NITRO_PRESET=node-server` and rebuild. The Vite config forwards this setting to Nitro; this target has been verified with the production build and `/api/health`. |
| Login page says "authentication service is not configured" | The image was built without `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` build args. Rebuild. |
| "Verification service is not configured" (503) | `SUPABASE_SERVICE_ROLE_KEY` (and `OTP_HMAC_SECRET`) missing from the container secrets. |
| "Email OTP is not configured" (503) | Set `GMAIL_USER` + `GMAIL_APP_PASS` (or SMTP settings). Gmail needs an App Password. |
| "Administrator accounts are created by invitation only" | Your email is not in `public.admin_allowlist` (lower-case). |
| Task keeps restarting | Check the CloudWatch logs; confirm the health check path is `/api/health` and port `8080`. |

## Known limitations (be aware before going live)

* **The OTP screen is a UI step, not an API lock.** Someone with your public Supabase anon key can call
  Supabase sign-in directly and skip it. Real two-factor enforcement needs Supabase MFA or a server-issued
  session. The server-side OTP is now solid for what it does (email ownership check at sign-up, extra step at login).
* **Payments are client-side.** The booking flow marks a payment successful in the browser with a Razorpay
  *test* key; there is no server-side order creation or signature verification in the live routes.
  Do not take real money until that is built.
* Bookings, documents and payments are still written to browser storage first and mirrored to the database.
  Approvals, the directory and dashboard counts now read from the database; other screens still show their
  own device's data first.
* Uploaded documents are stored as data in the database/browser, not in S3.
