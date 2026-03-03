# INCUXAI Secure Live Exam Platform

## Local Development Setup

### 1. Backend (Cloudflare Workers)
- Navigate to `backend`
- Run `npm install`
- First time: Init the local D1 database: `npm run db:init`
- Run local worker: `npm run dev`

### 2. Frontend (React Vite)
- Navigate to `frontend`
- Run `npm install`
- Start dev server: `npm run dev`

Open `http://localhost:3000` to access the App. 
You can join as a student with a random code, or as Admin.

## Deployment Guide

### Cloudflare Backend
1. Authenticate with Wrangler: `npx wrangler login`
2. Create D1 database: `npx wrangler d1 create incuxai-db`
3. Copy the `database_id` into `backend/wrangler.toml`
4. Run remote migrations: `npm run db:init:remote`
5. Deploy worker: `npm run deploy`
6. Copy the deployed worker URL and update `frontend/src/lib/socket.ts` host reference.

### Vercel / Cloudflare Pages Frontend
1. Set the root directory to `frontend`
2. Framework Preset: `Vite`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Deploy.
