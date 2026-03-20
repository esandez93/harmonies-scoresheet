# Vercel Deployment Guide

This guide will help you deploy the Harmonies Scoresheet app to Vercel.

## Prerequisites

- GitHub account with your code pushed
- Supabase project set up with environment variables ready
- Vercel account (free at https://vercel.com)

## Deployment Steps

### Step 1: Push Code to GitHub

If not already done:
```bash
git init
git add .
git commit -m "Initial commit: Harmonies scoresheet app"
git remote add origin https://github.com/YOUR_USERNAME/harmonies-scoresheet.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Click "Import Git Repository"
4. Paste your repository URL
5. Click "Import"

### Step 3: Configure Environment Variables

1. After importing, you'll see the "Configure Project" screen
2. Scroll to "Environment Variables"
3. Add two variables:
   - **Name**: `VITE_SUPABASE_URL` → **Value**: Your Supabase Project URL
   - **Name**: `VITE_SUPABASE_ANON_KEY` → **Value**: Your Supabase Anon Key
4. Click "Deploy"

### Step 4: Wait for Deployment

Vercel will:
1. Install dependencies
2. Build the project
3. Deploy to a live URL

You'll see:
- ✓ Build successful
- ✓ Deployed: `https://harmonies-scoresheet.vercel.app`

## Post-Deployment

### Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### Environment Variables in Production

If you need to update environment variables:
1. Go to your project in Vercel
2. Settings → Environment Variables
3. Update and redeploy

To redeploy:
- Push new code to GitHub (auto-deploy)
- Or click "Redeploy" in the Deployments tab

## Troubleshooting

### Build Failed
Check the build logs in Vercel:
1. Go to Deployments tab
2. Click failed deployment
3. Check "Build logs" for errors
4. Common issues:
   - Missing environment variables
   - Node version mismatch
   - npm package conflicts

### App loads but Auth doesn't work
- Verify environment variables are set in Vercel
- Check Supabase credentials are correct
- Ensure Supabase project is still active

### Database connection errors
- Verify Supabase is still running
- Check RLS policies allow your app to access data
- Verify you've created the database tables

## Vercel Free Tier

Your app is completely free on Vercel's free tier:
- ✓ Unlimited deployments
- ✓ Custom domains
- ✓ Serverless functions (for future use)
- ✓ Built-in analytics
- ✓ GitHub integrations

## Monitoring

Vercel provides:
- **Analytics**: View traffic and performance
- **Functions**: Monitor API calls
- **Error tracking**: See runtime errors
- **Logs**: View deployment and function logs

Visit the Analytics tab to track your app's usage.

## Continuous Deployment

Your app auto-deploys when you push to GitHub:
1. Make local changes
2. `git push origin main`
3. Vercel automatically builds and deploys
4. Live update in ~2 minutes

## Rollback

If something breaks:
1. Go to Deployments tab in Vercel
2. Find a previous successful deployment
3. Click the 3-dots menu
4. Click "Promote to Production"

## Next Steps

After successful deployment:
- Share your app link with friends
- Track score games online
- Add more features as needed


