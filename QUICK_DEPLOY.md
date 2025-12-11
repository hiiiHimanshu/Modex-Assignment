# Quick Vercel Deployment Guide

## Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to**: https://vercel.com/new

2. **Import Repository**:
   - Click "Import Git Repository"
   - Select `hiiiHimanshu/Modex-Assignment`
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `cd backend && npm install && npm run build && cd ../frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: Leave empty (handled in build command)

4. **Environment Variables**:
   Click "Environment Variables" and add:
   - `DATABASE_URL` = `postgresql://user:password@host:port/database`
   - `NODE_ENV` = `production` (optional)

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

## Option 2: Deploy via CLI

### Step 1: Login
```bash
vercel login
# Follow the prompts to authenticate
```

### Step 2: Deploy
```bash
cd /Users/himanshugupta/Desktop/modex
vercel
```

### Step 3: Set Environment Variables
```bash
vercel env add DATABASE_URL
# Paste your PostgreSQL connection string when prompted
# Select: Production, Preview, and Development

vercel env add NODE_ENV production
# Select: Production, Preview, and Development
```

### Step 4: Deploy to Production
```bash
vercel --prod
```

## After Deployment

1. **Get your deployment URL** from Vercel dashboard
2. **Run database migrations**:
   ```bash
   cd backend
   DATABASE_URL=your_production_db_url npm run db:migrate
   ```
3. **Test your deployment**:
   - Frontend: `https://your-app.vercel.app`
   - API Health: `https://your-app.vercel.app/api/health`
   - API Shows: `https://your-app.vercel.app/api/shows`

## Database Setup Options

### Option A: Vercel Postgres (Recommended)
1. In Vercel dashboard, go to Storage
2. Create a Postgres database
3. Copy the connection string
4. Use it as `DATABASE_URL`

### Option B: Neon (Free Tier Available)
1. Go to https://neon.tech
2. Create a free account
3. Create a new project
4. Copy the connection string
5. Use it as `DATABASE_URL`

### Option C: Supabase (Free Tier Available)
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Use it as `DATABASE_URL`

## Troubleshooting

- **Build fails**: Check build logs in Vercel dashboard
- **API not working**: Verify `DATABASE_URL` is set correctly
- **Frontend can't connect**: Check that API routes are at `/api/*`

