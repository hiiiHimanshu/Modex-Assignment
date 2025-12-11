# Deploying to Vercel

This guide will help you deploy the Ticket Booking System to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A PostgreSQL database (you can use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Neon](https://neon.tech), [Supabase](https://supabase.com), or any other PostgreSQL provider)
3. Vercel CLI installed (optional, for CLI deployment):
   ```bash
   npm i -g vercel
   ```

## Step 1: Set Up Database

1. **Choose a PostgreSQL provider** and create a database
2. **Get your connection string** - it should look like:
   ```
   postgresql://user:password@host:port/database
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Import Project in Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Vercel will auto-detect the project settings

3. **Configure Environment Variables**
   In the Vercel project settings, add these environment variables:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `NODE_ENV` - Set to `production`
   - (Optional) `BOOKING_EXPIRY_POLL_SECONDS` - Polling interval for expiry monitor (default: 30)

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

### Option B: Deploy via CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add DATABASE_URL
   # Paste your database connection string when prompted
   
   vercel env add NODE_ENV production
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## Step 3: Run Database Migrations

After deployment, you need to run database migrations. You have two options:

### Option A: Run migrations locally (pointing to production DB)

1. Set your production `DATABASE_URL` in your local environment
2. Run migrations:
   ```bash
   cd backend
   DATABASE_URL=your_production_db_url npm run db:migrate
   ```

### Option B: Use Vercel CLI to run migrations

1. Create a migration script in `backend/package.json`:
   ```json
   "vercel:migrate": "ts-node src/db/migrate.ts"
   ```

2. Run via Vercel CLI:
   ```bash
   vercel env pull .env.production
   cd backend
   source ../.env.production
   npm run db:migrate
   ```

### Option C: Use a one-time migration endpoint (Recommended for production)

You can create a temporary migration endpoint that runs once. Add this to your backend temporarily:

```typescript
// In backend/src/app.ts (temporary)
app.post("/api/migrate", async (_req, res) => {
  // Add migration logic here
  // Remove this endpoint after migration!
});
```

## Step 4: Seed Database (Optional)

If you want sample data:

```bash
cd backend
DATABASE_URL=your_production_db_url npm run db:seed
```

## Step 5: Verify Deployment

1. **Check Frontend**: Visit your Vercel deployment URL
2. **Check API Health**: Visit `https://your-app.vercel.app/api/health`
3. **Test API Endpoints**:
   - `GET /api/shows` - Should return list of shows
   - `GET /api/shows/:id` - Should return show details
   - `POST /api/shows/:id/bookings` - Should create bookings

## Important Notes

### Database Connection

- The app uses the `DATABASE_URL` environment variable
- Make sure your database allows connections from Vercel's IP addresses
- For Vercel Postgres, this is handled automatically
- For external databases, you may need to whitelist Vercel IPs

### Booking Expiry Monitor

- The booking expiry monitor (`startBookingExpiryMonitor`) is **disabled** in serverless environments
- In Vercel, this runs as serverless functions, so the interval-based monitor won't work
- Consider using:
  - **Vercel Cron Jobs** to periodically expire bookings
  - **Database triggers** to handle expiry
  - **External cron service** (e.g., cron-job.org)

### Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string

Optional environment variables:
- `NODE_ENV` - Set to `production`
- `BOOKING_EXPIRY_POLL_SECONDS` - Not used in serverless mode

### API Routes

- All API routes are accessible at `/api/*`
- Frontend automatically uses `/api` as the base URL in production
- Example: `GET /api/shows`, `POST /api/shows/:id/bookings`

## Troubleshooting

### Build Fails

- Check that all dependencies are listed in `package.json`
- Ensure TypeScript compiles without errors
- Check Vercel build logs for specific errors

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly in Vercel environment variables
- Check that your database allows external connections
- For Vercel Postgres, ensure the database is created and linked to your project

### API Routes Not Working

- Verify `vercel.json` configuration is correct
- Check that `/api/index.ts` exists and exports the Express app
- Review Vercel function logs in the dashboard

### Frontend Can't Connect to API

- Ensure `VITE_API_BASE_URL` is not set (it should use `/api` automatically in production)
- Check browser console for CORS errors
- Verify API routes are accessible at `/api/*`

## Setting Up Cron Jobs for Booking Expiry (Optional)

Since the interval-based monitor doesn't work in serverless, you can use Vercel Cron:

1. Create `vercel.json` cron configuration:
```json
{
  "crons": [{
    "path": "/api/cron/expire-bookings",
    "schedule": "*/2 * * * *"
  }]
}
```

2. Create an endpoint to handle expiry:
```typescript
// In backend/src/routes/bookings.ts or create new route
app.post("/cron/expire-bookings", async (_req, res) => {
  // Add authorization check (e.g., Vercel Cron Secret)
  const expired = await expireStalePendingBookings();
  res.json({ expired });
});
```

## Support

For issues specific to:
- **Vercel**: Check [Vercel Documentation](https://vercel.com/docs)
- **Project**: Check the main README.md

