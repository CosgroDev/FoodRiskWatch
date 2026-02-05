# FoodRisk Watch MVP

A minimal Next.js (App Router) + Supabase scaffold for FoodRisk Watch. Focused on email-based subscriptions, preference storage, and an ingestion skeleton for public RASFF alerts.

## Prerequisites
- Node.js 18+
- npm
- Supabase project (URL, anon key, service role key)
- Vercel account (for hosting + cron)

## Setup
1) Install dependencies (first run will fetch packages):
```bash
npm install
```

2) Configure environment:
- Copy `.env.local` and fill values:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_DIGEST_SECRET=<run npm run generate:digest-secret>
INGEST_PAGE_LIMIT=2
```

3) Apply database schema in Supabase SQL editor (paste and run):
- File: `supabase/migrations/0001_init.sql` (full SQL included in this repo below).

4) Add the logo:
- Save the provided logo image as `public/logo.png` (48x48 or higher; current header uses 40px render size).

5) Run dev server:
```bash
npm run dev
```
Visit http://localhost:3000

6) Test the subscription flow:
- Home page form -> submit email.
- The JSON response shows a `verifyUrl`; open it to activate.
- You will be redirected to `/preferences?token=...`.
- Adjust hazards/categories/countries and save.
- To test unsubscribe: GET `/api/unsubscribe?token=...` using the same manage token.

7) Trigger the ingest job locally (fetches RASFF alerts):
```bash
npm run ingest:local
# Or manually:
curl -X POST http://localhost:3000/api/jobs/ingest \
  -H "X-CRON-DIGEST:$CRON_DIGEST_SECRET"
```
- For a quick parser demo without hitting the upstream API:
```bash
curl http://localhost:3000/api/jobs/ingest/debug
```

8) Trigger the digest job locally (sends weekly email digests):
```bash
npm run digest:local
# Or manually:
curl -X POST http://localhost:3000/api/jobs/digest \
  -H "X-CRON-DIGEST:$CRON_DIGEST_SECRET"
```

## Vercel deployment tips
- Add env vars in Vercel Project Settings → Environment Variables (same keys as above).
- Add `CRON_DIGEST_SECRET` (generate with `npm run generate:digest-secret`) and keep it secret; match it in any external caller.
- The `vercel.json` schedules two cron jobs:
  - **Ingest**: Daily at 4 AM UTC (`/api/jobs/ingest`) - fetches new RASFF alerts
  - **Digest**: Weekly on Mondays at 6 AM UTC (`/api/jobs/digest`) - sends email digests to subscribers

## Troubleshooting
- **Missing env vars:** API routes will throw if Supabase keys are absent. Double-check `.env.local` or Vercel env.
- **Token expired:** Verify tokens last 24h. Re-submit the form to get a new one.
- **RLS errors:** Service role bypasses RLS; if using anon key directly, ensure user is authenticated (policies require `auth.uid()` matches `user_id`).
- **Ingest API fails:** Check `CRON_DIGEST_SECRET` header (`X-CRON-DIGEST`) and network access to the RASFF endpoint. Adjust `INGEST_PAGE_LIMIT` to stay safe during tests.

## Architecture notes
- No auth UI; magic links via `email_tokens` tables simulate access for now.
- Ingestion is idempotent: raw alerts keyed by `source_id`, facts keyed by `raw_id + hazard` hash.
- Emails are **not** sent yet; API returns the verification/manage URLs for manual testing.

