# Sokcho Smart City Intelligence Platform

An AI-powered civic information platform for Sokcho City, South Korea.
Built as a Final Year Project for Smart Computing — Kyungdong University (KDU Global).

## Developer
Francis Natus Mugisha | ML & AI Engineer | github.com/francisnatusm

## Features
- **City Pulse** — Real-time local news and weather
- **Opportunities Board** — Jobs, internships, and scholarships
- **Tourism & Economy Map** — Interactive Sokcho map with attraction data
- **International Navigator** — Multilingual guide for international students
- **AI Chatbot** — Claude-powered civic assistant in English and Korean
- **Research Feedback System** — In-app micro-feedback for academic data collection

## Tech Stack
React + Vite, Tailwind CSS, Node.js + Express, Firebase Firestore,
Claude API, MapLibre GL JS, Recharts, Vercel

## Setup
1. Clone the repo
2. Copy `.env.example` to `.env` and fill in all API keys (see API Keys section)
3. `cd server && npm install && npm run dev`
4. `cd client && npm install && npm run dev`
5. Open http://localhost:5173

Without API keys, the platform still runs using safe mock data for news, weather, jobs, tourism, and navigator content. Claude chat and Firestore feedback persistence require real keys.

## Optional Firebase scripts
```bash
cd server
npm run test:firebase
npm run seed:navigator
```

## Deploy (Vercel)
1. Push this repo to GitHub and import it in Vercel (root = `sokcho-platform`).
2. Set environment variables from `.env.example` in Vercel Project Settings.
3. **Important for production:**
   - Leave `VITE_API_BASE_URL` **empty** (frontend calls same-origin `/api/...`)
   - Set `ALLOW_INSECURE_TLS` empty/false (never `true` on Vercel)
   - Set `CLIENT_ORIGIN` to your live site URL (e.g. `https://sokcho-platform.vercel.app`)
   - For `FIREBASE_PRIVATE_KEY`: paste the key as one line with `\n` escapes, **without** wrapping quotes in the Vercel UI
4. Deploy. Cron hits `/api/refresh/ensure` daily at 21:00 UTC.
5. If `/api/health` returns 500, open Vercel → Project → Logs (or the failed deployment → Functions) and check for missing modules or Firebase key errors.

Root `vercel.json` builds the Vite client and routes `/api/*` to the Express serverless function.

## Live Demo
https://sokcho-platform.vercel.app
