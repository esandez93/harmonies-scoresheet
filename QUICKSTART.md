# Quick Start Guide

## What You Have

A complete, mobile-ready web app for tracking Harmonies game scores with:
- ✅ User authentication (Supabase)
- ✅ Cloud database (PostgreSQL)
- ✅ Mobile-responsive UI
- ✅ Ready for Vercel deployment

## 5-Minute Setup

### 1. Create Supabase Project
- Go to https://supabase.com → Sign up (free)
- Create new project
- Go to Settings → API
- Copy "Project URL" and "Anon Key"

### 2. Configure App
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
VITE_SUPABASE_URL=paste_your_url_here
VITE_SUPABASE_ANON_KEY=paste_your_key_here
```

### 3. Create Database Tables
- In Supabase: SQL Editor → New Query
- Copy entire script from `.github/SUPABASE_SETUP.md`
- Run the query

### 4. Run Development Server
```bash
npm install  # (already done, but in case)
npm run dev
```

Open http://localhost:5173

### 5. Test It
- Sign up with an email
- Create a test game
- Add players and adjust scores
- Everything should work!

## Deploy to Vercel

When you're ready to share publicly:

```bash
# Push to GitHub
git init
git add .
git commit -m "Harmonies scoresheet"
git remote add origin https://github.com/YOUR_USER/harmonies-scoresheet
git push -u origin main
```

Then:
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repo
4. Add Supabase env vars
5. Click "Deploy"
6. Done! App is live at `https://your-project.vercel.app`

See `.github/VERCEL_DEPLOYMENT.md` for detailed instructions.

## File Structure

```
src/
├── pages/              # Login, SignUp, Dashboard, Game pages
├── context/            # Authentication logic
├── lib/               # Supabase client
├── styles/            # Mobile-friendly CSS
└── App.jsx            # Router & auth protection
```

## Key Features

- **Create Game**: Start tracking a new game
- **Add Players**: Add friends' names
- **Score Display**: Increment/decrement scores with buttons
- **Game History**: See all past games in dashboard
- **Mobile First**: Works great on phones
- **Secure**: Only see your own games and scores

## Environment

```
Available at: http://localhost:5173
Production: vercel.app (after deployment)
Database: Supabase (PostgreSQL)
Auth: Email/Password via Supabase
```

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Limits (Free Tier)

- Supabase: 500 MB storage, 2 GB bandwidth/month
- Vercel: Unlimited deployments, analytics
- **Plenty for hobby use!**

## Troubleshooting

**"Missing environment variables"**
- Add `.env.local` with Supabase credentials

**"Auth not working"**
- Check email provider enabled in Supabase
- Verify .env.local is correct

**"Can't create games"**
- Make sure database tables are created
- Check Supabase SQL script ran successfully

## Next Steps

1. ✅ Set up Supabase (see `.github/SUPABASE_SETUP.md`)
2. ✅ Run `npm run dev` (already running!)
3. ✅ Test locally
4. ✅ Deploy to Vercel (see `.github/VERCEL_DEPLOYMENT.md`)
5. ✅ Share with friends!

## Help

- **Supabase issues**: See `.github/SUPABASE_SETUP.md`
- **Deployment issues**: See `.github/VERCEL_DEPLOYMENT.md`
- **Feature requests**: Edit the code! It's React - easy to customize
- **Full docs**: See `README.md`

---

**Ready to score some Harmonies games!** 🎮
