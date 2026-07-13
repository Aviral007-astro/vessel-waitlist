# Vessel — Waitlist

A standalone waitlist landing page for Vessel. Same visual identity as the
main app (bone/ink/oxblood palette, Fraunces + Cormorant Garamond) with a
hero seal generated live from the same deterministic rhythm math used in
the real product — not a mockup.

Pure static site — no backend, no database, no Vercel functions. Email
capture is handled entirely by [Formspark](https://formspark.io).

## Setup

1. Create a free Formspark account and a new form at formspark.io
2. Copy your form's action URL from its Setup section (looks like
   `https://submit-form.com/abcXYZ123`)
3. Open `src/App.tsx` and replace the placeholder at the top:
   ```ts
   const FORMSPARK_ACTION_URL = "https://submit-form.com/YOUR-FORM-ID";
   ```
   with your real URL
4. That's it — no `.env`, no database, no API to deploy

## Local development

```bash
npm install
npm run dev
```

## Deploying to Vercel

1. Push this project to a GitHub repo
2. Import it in Vercel — no environment variables needed
3. Deploy. `vercel.json` just points Vercel at the static build output.

Formspark itself handles storing submissions and notifying you (email or
Discord webhook, configurable in their dashboard) — check there to see
who's signed up.

## Where things live

- `src/App.tsx` — the whole page, including the Formspark submission logic
- `src/lib/signature.ts` — the same seal-generation math as the main app

## Known trade-off

There's no live "N people waiting" counter on this version — that would
need to read from a database Formspark doesn't expose to the frontend by
default. If you want that back, check your Formspark dashboard for a
submission count and update it manually, or ask me to wire up a small
serverless function that queries Formspark's API for a count (if their
plan supports it) instead of building a custom database again.
