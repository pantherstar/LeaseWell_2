# Supabase Setup Guide for LeaseWell

This guide will walk you through setting up Supabase for your LeaseWell application.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Sign in with GitHub (recommended) or email
4. Create a new organization if you don't have one
5. Click "New Project"
6. Fill in the project details:
   - **Project name**: LeaseWell
   - **Database Password**: Choose a strong password (save this securely!)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Start with Free tier (can upgrade later)
7. Click "Create new project"
8. Wait 1-2 minutes for your project to be provisioned

## Step 2: Get Your API Keys

1. Once your project is ready, go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the left menu
3. You'll see two important values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (long string)
4. Copy these values - you'll need them in the next step

## Step 3: Update Environment Variables

1. Open `/Users/hassan/LeaseWell/.env.local`
2. Replace the placeholder values with your actual Supabase credentials:

```env
# Replace these with your actual Supabase values
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file
4. **IMPORTANT**: Never commit `.env.local` to git (it's already in .gitignore)

## Step 4: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended for Beginners)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `/Users/hassan/LeaseWell/supabase/migrations/001_initial_schema.sql`
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Wait for success message
9. Repeat steps 3-8 for:
   - `002_row_level_security.sql`
   - `003_storage_setup.sql`
   - `004_tenant_invites.sql`

### Option B: Using Supabase CLI (Advanced)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-id
```

4. Run migrations:
```bash
supabase db push
```

## Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. **Email** provider should be enabled by default
3. Optional: Enable **Google OAuth**:
   - Toggle "Google" to enabled
   - Follow instructions to set up Google OAuth credentials
   - Add authorized redirect URL: `https://your-project-id.supabase.co/auth/v1/callback`

4. Configure **Email Templates** (optional but recommended):
   - Go to **Authentication** → **Email Templates**
   - Customize the email templates for:
     - Confirm signup
     - Reset password
     - Magic link
     - Change email address

## Step 6: Verify Database Setup

1. Go to **Table Editor** in the Supabase dashboard
2. You should see the following tables:
   - profiles
   - properties
   - leases
   - maintenance_requests
   - payments
   - documents
   - messages
   - notifications
   - tenant_screenings
   - transactions
   - tenant_invites

3. Click on each table to verify the structure

## Step 7: Verify Storage Buckets

1. Go to **Storage** in the Supabase dashboard
2. You should see three buckets:
   - `documents` (private)
   - `maintenance-photos` (private)
   - `avatars` (public)

3. If buckets weren't created by the migration, create them manually:
   - Click "New bucket"
   - Enter the bucket name
   - Set public/private as specified above
   - Set file size limits:
     - documents: 50MB
     - maintenance-photos: 10MB
     - avatars: 2MB

## Step 8: Test the Connection

1. Restart your development server:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

2. Open your browser to `http://localhost:3001`
3. Try to sign up with a new account:
   - Click "Create one" on the login page
   - Fill in email, password, and choose a role
   - If successful, you should see the dashboard

4. Check Supabase dashboard → **Authentication** → **Users**
   - Your new user should appear in the list

5. Check Supabase dashboard → **Table Editor** → **profiles**
   - Your profile should be created automatically

## Step 9: Seed Sample Data (Optional)

If you want to start with some sample data for testing:

1. Go to **SQL Editor** in Supabase dashboard
2. Create a new query with this sample data:

```sql
-- Insert sample properties (replace USER_ID with your actual user ID from auth.users)
INSERT INTO properties (landlord_id, address, city, state, zip_code, property_type, bedrooms, bathrooms, square_feet)
VALUES
  ('YOUR_USER_ID', '742 Evergreen Terrace, Unit A', 'Springfield', 'IL', '62701', 'house', 3, 2.0, 1200),
  ('YOUR_USER_ID', '1428 Elm Street, Apt 3B', 'Springfield', 'IL', '62702', 'apartment', 2, 1.0, 850);

-- Note: Replace 'YOUR_USER_ID' with your actual UUID from auth.users table
```

3. Run the query

## Troubleshooting

### Issue: "Invalid API key" error
**Solution**: Double-check that you copied the correct anon key from Supabase dashboard and pasted it into `.env.local`

### Issue: "relation does not exist" error
**Solution**: Make sure you ran all three migration files in order (001, 002, 003)

### Issue: Can't insert data
**Solution**: Check that Row Level Security policies are set up correctly. Go to **Authentication** → **Policies** to verify

### Issue: File uploads not working
**Solution**: Verify storage buckets exist and have the correct policies. Go to **Storage** → **Policies**

### Issue: "Failed to fetch" or connection errors
**Solution**:
- Check that your `.env.local` file has the correct values
- Restart your development server after changing environment variables
- Verify your Supabase project is in "Healthy" status in the dashboard

## Next Steps

Once Supabase is set up and working:

1. ✅ Test user authentication (sign up, sign in, sign out)
2. ✅ Test creating properties (landlords only)
3. ✅ Test uploading documents
4. Move on to Phase 3: Stripe Payment Integration

## Stripe Payments

To enable Stripe payments:

1. Create a Stripe account and get your API keys
2. Add Supabase Edge Function secrets:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
3. Deploy the Edge Functions:
   - `create-payment-intent`
   - `stripe-webhook`
4. Add the Stripe publishable key to your app:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

The payment flow uses Stripe Payment Intents and writes records to the `payments` table.

## Stripe Connect (Landlord Payouts)

This app uses Stripe Connect Express so each landlord receives their own payouts.

1. Run the migration `005_stripe_connect.sql` to add `stripe_account_id` to profiles.
2. Deploy the Edge Function `create-connect-account`.
3. Ensure `STRIPE_SECRET_KEY` is set in Supabase Edge Function secrets (live or test).
4. In the app, landlords click **Connect Stripe** to complete onboarding.
5. Tenants can only pay rent after the landlord connects a Stripe account.

## Offline Payments (Zelle/Check/Cash)

Tenants can record offline payments, which landlords can later mark as paid.

1. Deploy the Edge Function `record-offline-payment`.
2. Tenants use **Record Zelle/Cash** in the Payments tab.
3. Landlords use **Mark Paid** to confirm the payment.

## Email Invites (Resend)

To enable tenant invite emails:

1. Create a Resend account and verify your sender domain
2. In the Supabase dashboard, open **Edge Functions** → **Environment Variables**
3. Add the following variables:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` (e.g. `LeaseWell <noreply@yourdomain.com>`)
4. Deploy the edge function `send-tenant-invite`

Once configured, landlords can send email invites from the Properties tab.

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Use different projects** for development and production
3. **Rotate keys** if they're ever exposed
4. **Enable 2FA** on your Supabase account
5. **Review RLS policies** regularly to ensure data security
6. **Monitor usage** in Supabase dashboard to stay within free tier limits

## Supabase Free Tier Limits

- **Database**: 500 MB
- **Storage**: 1 GB
- **Bandwidth**: 2 GB/month
- **Monthly Active Users**: Unlimited
- **Edge Functions**: 500,000 invocations/month

These limits are generous for development and small-scale production use. You can upgrade to Pro ($25/month) when needed.

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- LeaseWell Issues: https://github.com/pantherstar/LeaseWell/issues
