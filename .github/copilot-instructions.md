# Harmonies Scoresheet - Custom Instructions

This workspace contains a Vite + React web app for scoring the Harmonies tabletop game.

## Quick Setup

### 1. Configure Supabase
- Create a free account at https://supabase.com
- Create a new project
- Copy your Project URL and Anon Key
- Update `.env.local` with these credentials

### 2. Create Database Tables
In Supabase SQL Editor, run the SQL setup from the README.md file

### 3. Run Development Server
```bash
npm install
npm run dev
```

## Architecture
- **Frontend**: Vite + React (JavaScript)
- **Auth**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Hosting**: Vercel

## Key Features Implemented
- User authentication (sign up/login)
- Create and manage games
- Add/remove players
- Real-time score tracking
- Mobile-responsive UI

## Deployment
See README.md for detailed Vercel deployment instructions.
