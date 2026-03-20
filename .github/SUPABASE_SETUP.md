# Supabase Setup Guide

This guide will help you set up Supabase for the Harmonies Scoresheet app.

## Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Sign Up"
3. Choose "Sign up with GitHub" or use your email
4. Create a new organization

## Step 2: Create a New Project

1. Click "New Project"
2. Give it a name (e.g., "harmonies-scoresheet")
3. Choose a region closest to you
4. Create a secure password and save it
5. Wait for the project to be created

## Step 3: Get Your Credentials

1. Go to **Settings → API** in your project
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Key** → `VITE_SUPABASE_ANON_KEY`

## Step 4: Create Database Tables

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New query"
3. Copy and paste the entire SQL script from this file
4. Click "Run"

### Database SQL Script

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Game Players table (stores player data with resource scores)
CREATE TABLE game_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID NOT NULL,
  player_name TEXT NOT NULL,
  resource_green INTEGER DEFAULT 0,
  resource_white INTEGER DEFAULT 0,
  resource_blue INTEGER DEFAULT 0,
  resource_yellow INTEGER DEFAULT 0,
  resource_red INTEGER DEFAULT 0,
  resource_cyan INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Games RLS Policies
CREATE POLICY "Users can view their own games"
  ON games FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own games"
  ON games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own games"
  ON games FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own games"
  ON games FOR DELETE
  USING (auth.uid() = user_id);

-- Game Players RLS Policies
CREATE POLICY "Users can view players from their games"
  ON game_players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_players.game_id
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert players to their games"
  ON game_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_players.game_id
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update players in their games"
  ON game_players FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_players.game_id
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete players from their games"
  ON game_players FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_players.game_id
      AND games.user_id = auth.uid()
    )
  );
```

## Step 5: Enable Email Authentication

1. Go to **Authentication → Providers**
2. Make sure "Email" is enabled (it should be by default)
3. Click on "Email" to see configuration
4. Verify it's set to allow sign-ups

## Step 6: Add Environment Variables Locally

1. In your project root, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 7: Test the Setup

Run the development server:
```bash
npm install
npm run dev
```

1. Go to http://localhost:5173
2. Click "Sign up"
3. Create a test account
4. Create a test game
5. Verify it appears in the dashboard

## Troubleshooting

### "Auth not working"
- Check Email provider is enabled in Supabase
- Verify credentials in `.env.local` are correct
- Check browser console for error messages

### "Can't see tables in Supabase"
- Go to **Table Editor** to verify tables exist
- If missing, run the SQL creation script again

### "RLS policies blocking access"
- Go to **Authentication → Policies**
- Verify all policies are created correctly
- Try disabling RLS temporarily to test (go to **Table Editor** → gear icon)

## Free Tier Limits

- 500 MB database storage
- 2 GB bandwidth per month
- Sufficient for personal/hobby use

## Next Steps

Once tested locally, deploy to Vercel following the instructions in README.md
