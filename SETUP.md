# Vehicle Hire & Session Tracking System — Setup Guide

> INSY 492 Senior Project — Gerison Kimathi Muriungi (SMURGE2311)

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | https://nodejs.org |
| pnpm | ≥ 8 | `npm i -g pnpm` |
| Convex CLI | latest | bundled via `npx convex` |

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd VehicleHire
pnpm install
```

---

## 2. Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in each section as described below.

### 2a. Convex

```bash
npx convex dev
```

This will:
- Prompt you to log in to Convex (first time)
- Create a project and populate `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` in `.env.local` automatically

### 2b. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable **"Google Identity Services"** API
4. Navigate to **Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorised JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://your-production-domain.com` (production)
7. Authorised redirect URIs:
   - `http://localhost:5173/oauth-success`
8. Copy the **Client ID** and set it in `.env.local`:
   ```
   VITE_GOOGLE_CLIENT_ID=1234567890-abc...googleusercontent.com
   ```

### 2c. Paystack

1. Sign up at [Paystack Dashboard](https://dashboard.paystack.com/)
2. Go to **Settings → API Keys & Webhooks**
3. Copy the **Test Public Key** (starts with `pk_test_`)
4. Set it in `.env.local`:
   ```
   VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxx
   ```
5. **For production**, replace with your live key (`pk_live_...`) after completing the Paystack KYC process

### 2d. Nodemailer / SMTP (Email Notifications)

Email notifications are sent from a **Convex Node.js action** (server-side). These credentials must be set in the **Convex Dashboard**, not in `.env.local`.

1. Go to your [Convex Dashboard](https://dashboard.convex.dev/)
2. Select your project → **Settings → Environment Variables**
3. Add the following variables:

| Variable | Example | Description |
|----------|---------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | `465` | SMTP port (465 for SSL, 587 for TLS) |
| `SMTP_SECURE` | `true` | `true` for port 465, `false` for 587 |
| `SMTP_USER` | `you@gmail.com` | Your email / SMTP username |
| `SMTP_PASS` | `abcd efgh ijkl mnop` | App password (not your main password) |
| `EMAIL_FROM` | `"VehicleHire <noreply@yourdomain.com>"` | Sender display name and address |

#### Gmail Setup (Recommended for Development)

1. Go to your Google Account → Security → 2-Step Verification (must be ON)
2. Go to **App passwords** → Create a new App Password for "Mail"
3. Use the generated 16-character password as `SMTP_PASS`
4. Use `smtp.gmail.com`, port `465`, `SMTP_SECURE=true`

#### SendGrid (Recommended for Production)

1. Create a [SendGrid](https://sendgrid.com/) account
2. Go to **Settings → API Keys → Create API Key** (full access)
3. Set `SMTP_USER=apikey` and `SMTP_PASS=<your-api-key>`
4. Host: `smtp.sendgrid.net`, port `587`, `SMTP_SECURE=false`

---

## 3. Create the First Admin User

The platform ships with no admin user. To bootstrap:

1. Start the app and register a regular **Client** account
2. Open the [Convex Dashboard](https://dashboard.convex.dev/) → your project → **Data** tab → `users` table
3. Find the user you just created
4. Click the row → edit → change `role` from `"client"` to `"admin"`
5. Log out and log back in — you'll now have admin access

---

## 4. Running in Development

Open two terminals:

**Terminal 1 — Convex backend:**
```bash
npx convex dev
```

**Terminal 2 — Vite frontend:**
```bash
pnpm dev
```

Open `http://localhost:5173` in your browser.

---

## 5. Production Build

```bash
pnpm build
```

Deploy the `dist/` directory to any static hosting (Vercel, Netlify, Cloudflare Pages, etc.).

For the Convex backend, run:
```bash
npx convex deploy
```

---

## 6. System Architecture

```
Browser (React + TanStack Router)
  ↕ Convex React Client (real-time subscriptions)
Convex Cloud
  ├── Queries & Mutations (TypeScript, edge runtime)
  ├── Node.js Actions (Nodemailer email)
  └── File Storage (vehicle photos)
External Services
  ├── Google Identity Services (OAuth sign-in)
  ├── Paystack (M-Pesa, Airtel Money, card payments)
  └── SMTP provider (transactional email)
```

---

## 7. User Roles & Workflows

| Role | Access | Notes |
|------|--------|-------|
| **Admin** | Agent approvals, user management, platform analytics | First admin must be set manually in Convex dashboard |
| **Agent** | Vehicle listing, booking management, live session monitoring | Requires admin approval before any agent features |
| **Client** | Browse vehicles, book, live session view, payments, reviews | Auto-approved on registration |

### Full Hire Lifecycle

```
Agent registers → Admin approves → Agent lists vehicle
  ↓
Client browses → Client books → Booking: Pending
  ↓
Agent sees booking → Agent starts session → Session: In Progress
  ↓
Timer + GPS streaming starts
  ↓
Agent ends session → Session: Completed → Invoice generated
  ↓
Client pays via Paystack → Payment confirmed → Receipt email sent
  ↓
Client leaves review → Rating updated on vehicle listing
```

---

## 8. Key Files

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema (8 tables) |
| `convex/sessions.ts` | Session lifecycle + GPS |
| `convex/emails.ts` | Nodemailer email action |
| `src/hooks/useAuth.tsx` | Auth context (email/password + Google) |
| `src/hooks/usePaystack.ts` | Paystack popup hook |
| `src/hooks/useGeolocation.ts` | GPS streaming hook |
| `src/routes/session.$sessionId.tsx` | Live session view (client) |
| `src/routes/active-sessions.tsx` | Fleet map (agent) |
