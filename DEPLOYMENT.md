> **Deploying to AWS instead of Vercel?** See [`DEPLOYMENT_AWS.md`](./DEPLOYMENT_AWS.md) (ECS Express Mode + Supabase). Security/fix notes: [`CHANGES.md`](./CHANGES.md).

# 🚀 Legal Consultancy Service — Deployment Guide

This guide walks you through deploying **Legal Consultancy Service** to production on **Vercel** with **Supabase Database**, **Groq AI**, **Gmail SMTP OTP**, and **SMS Gateway OTP**.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:
1. **Vercel Account**: [vercel.com](https://vercel.com)
2. **Supabase Project**: [supabase.com](https://supabase.com)
3. **Groq API Key (for TekoraAI)**: [console.groq.com/keys](https://console.groq.com/keys)
4. **Gmail SMTP / App Password** (for Email OTP): Google Account → Security → 2-Step Verification → App Passwords
5. *(Optional)* **SMS Gateway API Key** (Fast2SMS, Twilio, MSG91, Textlocal) for live mobile SMS OTP delivery

---

## 🗄️ Step 1: Set up Supabase Database

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) and click **"New Project"**.
2. Give your project a name (e.g. `legal-consultancy-service`) and set a strong database password.
3. Once created, go to the **SQL Editor** tab in Supabase.
4. Open [`supabase/schema.sql`](./supabase/schema.sql) from this project, copy its entire contents, paste it into the Supabase SQL editor, and click **Run**.
5. Go to **Project Settings** → **API** to copy:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon / public key** (`eyJ...`)

---

## ⚡ Step 2: Deploy to Vercel

You can deploy directly using the **Vercel CLI**:

```bash
# Navigate to the app folder
cd "Legal Consultancy Service"

# Deploy directly to Production
npx --yes vercel --prod
```

---

## 🔐 Step 3: Configure Environment Variables

In your **Vercel Dashboard** → Select your Project → **Settings** → **Environment Variables**, add the following:

### 1. Database & AI Settings
| Variable Name | Description | Example / Source |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon/Public Key | `eyJhbGciOi...` |
| `GROQ_API_KEY` | Groq API Key for TekoraAI | `gsk_...` (from console.groq.com) |
| `GROQ_MODEL` | AI Model Name | `llama-3.3-70b-versatile` |
| `NITRO_PRESET` | Nitro deployment preset | `vercel` |

### 2. Email Verification OTP (Gmail SMTP)
| Variable Name | Description | Example |
| :--- | :--- | :--- |
| `GMAIL_USER` | Sender Gmail address | `your-email@gmail.com` |
| `GMAIL_APP_PASS` | 16-character Google App Password | `abcd efgh ijkl mnop` |

### 3. Mobile SMS OTP Gateway (Optional - Choose Any 1)
| Gateway Provider | Environment Variables Required | Notes |
| :--- | :--- | :--- |
| **Fast2SMS (India)** | `FAST2SMS_API_KEY` | Popular in India, instant OTP route, free trial credits on sign-up ([fast2sms.com](https://fast2sms.com)) |
| **Twilio (Global)** | `TWILIO_ACCOUNT_SID`<br/>`TWILIO_AUTH_TOKEN`<br/>`TWILIO_PHONE_NUMBER` | Global SMS delivery ([twilio.com](https://twilio.com)) |
| **MSG91 (India)** | `MSG91_AUTH_KEY`<br/>`MSG91_TEMPLATE_ID` | Enterprise Indian DLT OTP gateway ([msg91.com](https://msg91.com)) |
| **Textlocal (India)** | `TEXTLOCAL_API_KEY` | India/UK SMS gateway ([textlocal.in](https://textlocal.in)) |

> *Note: If no SMS provider key is set, the system automatically runs with live Gmail SMTP Email OTP and safe simulation logging for SMS, ensuring registration is always smooth and never blocked.*

---

## 🧪 Step 4: Verification & Live Testing

1. **Visit your live Vercel URL**: `https://legal-consultancy-service.vercel.app`
2. **Test Client Registration**:
   - Go to `/auth/client/register`
   - Enter Full Name, Mobile Number, Email, and Password
   - Click **"Send OTP"** → 6-digit code is dispatched to Email & Mobile SMS
   - Enter the code on the verification screen → Instant verification & auto-login to Client Portal!
