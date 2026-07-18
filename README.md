# NewKingdom

## Local setup

1. Copy `.env.example` to `.env` and fill in local PostgreSQL and Resend values.
2. Create the database, then run `npm run migrate`.
3. Run `npm run dev` to start Vite on port 5173 and the Express API on port 3001.
4. Open `http://localhost:5173/register`.

`RESEND_API_KEY` and `EMAIL_FROM` are required to send verification messages. The API returns a clear configuration error if they are missing; it never fakes successful email delivery.

`VERIFICATION_CODE_PEPPER` is required and must be a random value of at least 32 characters. The production server refuses to start without it, because changing or generating this secret at runtime would invalidate verification-code hashes.

## Commands

- `npm run dev` — Vite and Express together
- `npm run migrate` — apply PostgreSQL migrations
- `npm test` — verification security tests
- `npm run build` — production frontend build

## Railway deployment outline

Create a Railway PostgreSQL service and copy its connection string into `DATABASE_URL`. Create one Railway Node service from this repository with the same environment variables as `.env.example`, set the build command to `npm run build`, and set the start command to `npm start`. Express serves the built Vite app and `/api` from the same origin in production. The API runs idempotent, transactionally tracked migrations automatically before it accepts traffic; `npm run migrate` remains available for manual checks.

For Resend, verify a sender domain, add its DNS records, create a sending-access API key, then set `EMAIL_FROM` to an address on that domain and set `RESEND_API_KEY` only in Railway's environment settings.

## Local frontend with Railway API

When Vite runs locally but the API runs on Railway, create `.env.local` with the public Railway service origin (no trailing `/api`):

```ini
VITE_API_BASE_URL=https://your-backend.up.railway.app
```

Restart Vite after changing this variable. On Railway, set `APP_ORIGIN=http://localhost:5173` for this local testing scenario. The API allows that exact origin and accepts credentialed requests so the verification cookie can be sent on the follow-up requests. Do not set `VITE_API_BASE_URL` on the combined production deployment, where Express serves both the built frontend and `/api` from the same origin.
