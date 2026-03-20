# Harmonies Scoresheet

A mobile-first web app for recording scores during the tabletop game **Harmonies**. Built with Vite, React, and Supabase for easy deployment to Vercel.

## Features

- 🎮 Simple score tracking for multiple players
- 📱 Mobile-friendly responsive design
- 🔐 Secure authentication with Supabase
- 💾 Cloud database storage
- 🚀 Ready to deploy on Vercel free tier

## Tech Stack

- **Frontend**: Vite + React + JavaScript
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Hosting**: Vercel (free tier compatible)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- A [Supabase](https://supabase.com) account (free tier available)
- A [Vercel](https://vercel.com) account (for deployment)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd harmonies-scoresheet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Go to [supabase.com](https://supabase.com) and create a free account
   - Create a new project
   - In your project dashboard, go to **Settings > API**
   - Copy your `Project URL` and `Anon Key`

4. **Configure environment variables**
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Update `.env.local` with your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_project_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

5. **Create database tables**
   In your Supabase dashboard, go to the SQL Editor and run these queries:

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

   -- Game Players table (stores player data with resource scores and animal points)
   CREATE TABLE game_players (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     game_id UUID NOT NULL,
     player_name TEXT NOT NULL,
     resource_green INTEGER DEFAULT 0,
     resource_blue INTEGER DEFAULT 0,
     resource_yellow INTEGER DEFAULT 0,
     resource_red INTEGER DEFAULT 0,
     resource_grey INTEGER DEFAULT 0,
     animal_point_1 INTEGER DEFAULT 0,
     animal_point_2 INTEGER DEFAULT 0,
     animal_point_3 INTEGER DEFAULT 0,
     animal_point_4 INTEGER DEFAULT 0,
     animal_point_5 INTEGER DEFAULT 0,
     animal_point_6 INTEGER DEFAULT 0,
     animal_point_7 INTEGER DEFAULT 0,
     animal_point_8 INTEGER DEFAULT 0,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
   );

   -- Enable RLS (Row Level Security)
   ALTER TABLE games ENABLE ROW LEVEL SECURITY;
   ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

   -- Games policies
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

   -- Game Players policies
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

6. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## Development

### Project Structure
```
src/
├── pages/           # Page components
│   ├── Login.jsx
│   ├── SignUp.jsx
│   ├── Dashboard.jsx
│   ├── GameDetail.jsx
│   └── NewGame.jsx
├── context/         # React context (Auth)
│   └── AuthContext.jsx
├── lib/            # Utility libraries
│   └── supabase.js
├── styles/         # CSS files
│   ├── index.css
│   ├── auth.css
│   ├── dashboard.css
│   ├── game-detail.css
│   └── new-game.css
├── App.jsx         # Main app with routing
└── main.jsx        # Entry point
```

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## Deployment to Vercel

### Option 1: Deploy via Git (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set environment variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Add environment variables when prompted

## Usage

1. **Sign Up**: Create a new account
2. **Create a Game**: Click "New Game" to start tracking a game
3. **Add Players**: Add players to the game
4. **Track Scores**: Use the +/- buttons to adjust scores in real-time
5. **View History**: Go back to the dashboard to see all your games

## Mobile Optimization

- The app is fully responsive and optimized for mobile devices
- Font sizes are appropriately sized for touch (16px minimum)
- Forms prevent zoom on iOS
- Button states are clearly visible

## Free Tier Limits

### Supabase Free Tier
- 500 MB database storage
- 2 GB bandwidth
- 1 concurrent connection
- Unlimited API requests
- Real-time capabilities

### Vercel Free Tier
- Unlimited deployments
- Serverless functions (for future use)
- Built-in analytics
- Custom domains

These limits are more than sufficient for personal use!

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists with the correct Supabase credentials
- Restart the dev server after changing environment variables

### Auth not working
- Check that Supabase Auth is enabled in your project
- Verify email/password authentication is turned on in Supabase dashboard → Authentication → Providers

### Database connection errors
- Ensure all tables are created according to the SQL setup
- Check that Row Level Security (RLS) policies are in place
- Verify your Supabase anon key has proper permissions

## License

This project is open source and available under the MIT License.

## Feedback & Support

For issues or feature requests, please open an issue in the repository.
