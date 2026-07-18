# SecTalk Vercel Deployment Guide

This document describes how to deploy the SecTalk pnpm monorepo onto the Vercel hosting platform.

## 1. Import Repository
1. Log into your Vercel Dashboard.
2. Select **Add New...** ➡️ **Project**.
3. Import the `sectalk` repository folder.

## 2. Monorepo Root Directory Configuration
To build the workspace packages successfully:
1. In the **Project Settings**, find **Root Directory**.
2. Set the Root Directory to `apps/web`.
3. Ensure **Include files outside of the Root Directory in the Build Step** is checked (this allows Vercel to fetch the dependencies in `@sectalk/*` packages).

## 3. Build & Development Settings
- **Framework Preset**: Next.js
- **Build Command**: `pnpm --filter web build` (pnpm is natively supported in Vercel. If needed, toggle the package manager configuration override to pnpm).
- **Install Command**: `pnpm install`

## 4. Environment Variables
Configure the following secrets in **Settings ➡️ Environment Variables**:

| Variable Name | Description | Default/Sandbox Value |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public endpoint domain | `https://sectalk.vercel.app` |
| `DATABASE_URL` | Postgres Database Connection URI | Vercel Postgres integration |
| `JWT_SECRET_KEY` | Hex token key to encrypt session profiles | `32-char-random-hex-string` |
| `ENCRYPTION_PASSCODE` | Default workspace encrypter fallback passphrase | `corp-cryptography-override` |

## 5. Database Integration
1. Navigate to **Storage** in the Vercel dashboard.
2. Click **Create Database** ➡️ select **Postgres**.
3. Link the database to your SecTalk project.
4. Run migrations using the script `pnpm db:migrate` in the root workspace during local CI builds.

## 6. WebRTC & Real-Time Considerations
- **Signaling Serverless Functions**: Standard Next.js serverless functions (like `api/calls/route.ts`) have a default 15s execution timeout. For Enterprise applications with high concurrent signaling loads, you can upgrade function timeouts in `vercel.json` to 60s as configured.
- **WebSocket/Presence Fallbacks**: Since Serverless functions are stateless, persistent socket connections (e.g. typing indicators) should be offloaded to third-party services like Pusher or Ably. The client-side dashboard includes fully working fallback models to run locally without external dependencies.
