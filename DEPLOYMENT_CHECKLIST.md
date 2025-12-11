# Vercel Deployment Checklist

## Pre-Deployment

- [ ] Ensure all code is committed and pushed to Git
- [ ] Set up a PostgreSQL database (Vercel Postgres, Neon, Supabase, etc.)
- [ ] Get your database connection string ready

## Deployment Steps

### 1. Initial Setup
- [ ] Sign up/Login to [vercel.com](https://vercel.com)
- [ ] Install Vercel CLI (optional): `npm i -g vercel`

### 2. Deploy via Dashboard
- [ ] Go to [vercel.com/new](https://vercel.com/new)
- [ ] Import your Git repository
- [ ] Vercel will auto-detect settings (should detect `vercel.json`)

### 3. Environment Variables
Add these in Vercel project settings → Environment Variables:
- [ ] `DATABASE_URL` = `postgresql://user:password@host:port/database`
- [ ] `NODE_ENV` = `production` (optional, but recommended)

### 4. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Note your deployment URL

### 5. Database Setup
- [ ] Run migrations (see VERCEL_DEPLOY.md for options)
- [ ] Optionally seed database with sample data

### 6. Verify
- [ ] Visit your deployment URL (frontend should load)
- [ ] Check `/api/health` endpoint
- [ ] Test `/api/shows` endpoint
- [ ] Test creating a booking

## Post-Deployment

### Optional: Set Up Cron for Booking Expiry
Since the interval-based monitor doesn't work in serverless:
- [ ] Consider setting up Vercel Cron Jobs (see VERCEL_DEPLOY.md)
- [ ] Or use external cron service
- [ ] Or implement database-level expiry

### Monitoring
- [ ] Check Vercel function logs for any errors
- [ ] Monitor database connections
- [ ] Set up error tracking (optional)

## Troubleshooting

If deployment fails:
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Ensure database is accessible from Vercel
4. Check that TypeScript compiles without errors

If API doesn't work:
1. Verify `DATABASE_URL` is correct
2. Check Vercel function logs
3. Test `/api/health` endpoint
4. Verify database migrations ran successfully

If frontend can't connect to API:
1. Check browser console for errors
2. Verify API routes are accessible at `/api/*`
3. Check CORS settings (should be enabled in backend)

## Quick Deploy Commands (CLI)

```bash
# Login
vercel login

# Deploy (first time)
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add NODE_ENV production

# Deploy to production
vercel --prod

# Run migrations locally (pointing to production DB)
cd backend
DATABASE_URL=your_prod_db_url npm run db:migrate
```

