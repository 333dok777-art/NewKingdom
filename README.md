# NewKingdom

## Local setup

1. Copy `.env.example` to `.env` and fill in local PostgreSQL and Resend values.
2. Create the database, then run `npm run migrate`.
3. Run `npm run dev` to start Vite on port 5173 and the Express API on port 3001.
4. Open `http://localhost:5173/register`.

`RESEND_API_KEY` and `EMAIL_FROM` are required to send verification messages. The API returns a clear configuration error if they are missing; it never fakes successful email delivery.

## Commands

- `npm run dev` — Vite and Express together
- `npm run migrate` — apply PostgreSQL migrations
- `npm test` — verification security tests
- `npm run build` — production frontend build

## Railway deployment outline

Create a Railway PostgreSQL service and copy its connection string into `DATABASE_URL`. Create one Railway Node service from this repository with the same environment variables as `.env.example`, set the build command to `npm run build`, and set the start command to `npm start`. Express serves the built Vite app and `/api` from the same origin in production. Run `npm run migrate` once through a Railway shell after setting the database variable.

For Resend, verify a sender domain, add its DNS records, create a sending-access API key, then set `EMAIL_FROM` to an address on that domain and set `RESEND_API_KEY` only in Railway's environment settings.
