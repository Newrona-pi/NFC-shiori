# NFC Audio Service

A secure audio delivery platform using NTAG 424 DNA NFC tags and Supabase.

## Features

- **Tap-to-Listen**: Secure access to audio content via NFC tap (SDM Verification).
- **Studio Dashboard**: Creators can upload audio files and manage tags.
- **Replay Protection**: Prevents URL sharing using NFC counters and SDM CMAC.
- **Secure Storage**: Audio files are private and served via short-lived signed URLs.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend / DB**: Supabase (Auth, Storage, Database)
- **Security**: AES-CMAC verification for NTAG 424 DNA

## Setup

1. **Clone & Install**
   ```bash
   cd web
   npm install
   ```

2. **Supabase Setup**
   - Create a generic Supabase project.
   - Run the migration SQL in `supabase/migrations/20240203000000_init.sql` via SQL Editor.
   - Create a Storage bucket named `audios` and ensure it is Private. (Migration includes `insert into storage.buckets`).

3. **Environment Variables**
   Copy `.env.example` to `.env.local` and fill in:
   - Supabase URL & Keys
   - `JWT_SECRET` (generate a random string)
   - `SDM_META_READ_KEY_HEX`: Your NFC tag key (e.g., Key 1).
   - `SDM_FILE_READ_KEY_HEX`: Your NFC tag key (e.g., Key 2).

4. **Run Locally**
   ```bash
   npm run dev
   ```
   Access Studio at `http://localhost:3000/studio`.

5. **NFC Tag Configuration**
   - Configure your NTAG 424 DNA tag to SDM Mirroring.
   - URL: `https://YOUR_DOMAIN/tap?tid=<Your_Internal_Tag_UUID>&e=000000&c=00000000`
   - Set SDM privileges to Read/Write for Key 1 or 2 as per your `.env`.

## Dev Mode (Testing without Tags)
- Use `/dev/tap?tid=<YOUR_TAG_UUID>` to simulate a tap locally (check `app/api/tap/route.ts` implementation for bypass logic if enabled).

## Verification
- Run unit tests for crypto logic:
  ```bash
  npx vitest run
  ```
