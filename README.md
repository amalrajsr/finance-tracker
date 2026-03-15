# fn-tracker

A privacy-first expense tracker. You upload bank statement PDFs; the app extracts transactions in your browser and stores only the transaction data. No bank links, no raw PDFs stored.

## What it does

- Sign up and sign in with email and password
- Upload password-protected bank statement PDFs
- Parse PDFs in the browser (client-side only)
- Preview transactions, then save them to your account
- View and filter transactions on a dashboard

The server never sees your PDF or its password. Only the structured transaction rows you confirm are saved.

## Tech

- Next.js (App Router), React, TypeScript
- PostgreSQL with Prisma
- NextAuth for auth
- pdfjs-dist for client-side PDF parsing
- Tailwind CSS

## Setup

1. Clone the repo and install dependencies:
  ```bash
   npm install
  ```
2. Use a PostgreSQL database and set environment variables. Create a `.env` file in the project root with:
  - `DATABASE_URL` – your PostgreSQL connection string
  - `AUTH_SECRET` – a random string for session encryption (e.g. `openssl rand -base64 32`)
  - `AUTH_URL` – in development, `http://localhost:3000`
3. Run migrations:
  ```bash
   npx prisma migrate dev
  ```
4. Start the dev server:
  ```bash
   npm run dev
  ```

Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to login or the dashboard if already signed in.

## Scripts

- `npm run dev` – development server
- `npm run build` – production build
- `npm run start` – run production build
- `npm run lint` – run ESLint

## Project outline

- `src/app` – routes (login, signup, dashboard, upload, transactions)
- `src/components` – upload flow, transaction list, layout
- `src/lib` – auth, DB client, PDF parsing (including bank-specific parsers)
- `prisma` – schema and migrations

