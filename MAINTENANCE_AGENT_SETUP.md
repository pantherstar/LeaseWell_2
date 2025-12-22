# Maintenance Agent System Setup Guide

This guide will help you set up the automated contractor shopping agent for maintenance requests.

## Prerequisites

- Supabase project already set up (see `SUPABASE_SETUP.md`)
- All previous migrations (001-006) have been run

## Step 1: Run the Database Migration

You need to add the new tables and columns for the contractor agent system.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `supabase/migrations/007_contractor_agent.sql`
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Wait for success message

### Option B: Using Supabase CLI

```bash
# If you haven't already, install Supabase CLI
npm install -g supabase

# Login and link your project (if not already done)
supabase login
supabase link --project-ref your-project-id

# Push the migration
supabase db push
```

### Verify Migration

1. Go to **Table Editor** in Supabase dashboard
2. You should see a new table: `contractor_quotes`
3. Check the `maintenance_requests` table - it should have new columns:
   - `agent_status`
   - `agent_started_at`
   - `agent_completed_at`

## Step 2: Deploy the Edge Function

The `shop-for-contractors` edge function needs to be deployed to Supabase.

### Option A: Using Supabase Dashboard

1. Go to **Edge Functions** in the Supabase dashboard
2. Click **Create a new function**
3. Name it: `shop-for-contractors`
4. Copy the contents of `supabase/functions/shop-for-contractors/index.ts`
5. Paste into the function editor
6. Click **Deploy**

### Option B: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project root directory
cd /Users/hassan/Documents/LeaseWell

# Deploy the function
supabase functions deploy shop-for-contractors
```

### Verify Deployment

1. Go to **Edge Functions** in Supabase dashboard
2. You should see `shop-for-contractors` in the list
3. Click on it to see the function details

## Step 3: Configure Environment Variables (Optional but Recommended)

The agent works with **mock data** without API keys, but for production use, you'll want to configure:

### For Google Places API (Finding Contractors)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API**
4. Create credentials (API Key)
5. Restrict the API key to only the Places API (for security)
6. Copy your API key

### For AI Negotiation (OpenAI or Anthropic)

**Option 1: OpenAI**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account and get an API key
3. Add credits to your account

**Option 2: Anthropic (Claude)**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account and get an API key

### Add Secrets to Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **shop-for-contractors**
3. Click on **Settings** or **Secrets**
4. Add the following environment variables:

```
GOOGLE_PLACES_API_KEY=your-google-places-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
# OR
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

**Note:** You only need one AI API key (OpenAI OR Anthropic, not both)

## Step 4: Test the System

### Without API Keys (Mock Mode)

The system will work with mock data automatically:

1. **As a Tenant:**
   - Submit a maintenance request
   - You'll see it in your requests list

2. **As a Landlord:**
   - Go to the Maintenance tab
   - You'll see the tenant's request
   - Change status to "In Progress" - the agent will automatically deploy
   - OR click "Deploy Agent" button if status is still "Pending"
   - Wait a few seconds for the agent to collect quotes
   - You'll see mock contractor quotes appear
   - Select a contractor to assign them to the job

### With API Keys (Production Mode)

1. Follow the same steps as above
2. The agent will use real Google Places API to find contractors
3. AI will generate personalized negotiation messages
4. Quotes will be collected (simulated, as most contractor services don't have public APIs)

## How It Works

### Flow:

1. **Tenant submits request** → Creates maintenance request with `agent_status: 'pending'`
2. **Landlord approves** → Changes status to "In Progress" → Agent automatically deploys
3. **Agent runs** → 
   - Searches for local contractors (Google Places API or mock)
   - Generates negotiation messages (AI or mock)
   - Collects quotes (simulated)
   - Stores quotes in database
4. **Landlord views quotes** → Sees all collected quotes with contractor details
5. **Landlord selects contractor** → Updates maintenance request with assigned contractor and estimated cost

### Agent Statuses:

- `pending` - Ready to deploy
- `shopping` - Currently searching for contractors
- `completed` - Finished collecting quotes
- `failed` - Encountered an error

## Troubleshooting

### Issue: "Function not found" error

**Solution:**
- Make sure you deployed the edge function correctly
- Check that the function name is exactly `shop-for-contractors`
- Verify the function appears in Supabase dashboard → Edge Functions

### Issue: Agent status stuck on "shopping"

**Solution:**
- Check the edge function logs in Supabase dashboard
- The agent may be waiting for API responses
- Try refreshing the page - the status should update automatically
- If it's stuck for more than 2 minutes, check function logs for errors

### Issue: No quotes appearing

**Solution:**
- Check that the migration ran successfully
- Verify the `contractor_quotes` table exists
- Check edge function logs for errors
- In mock mode, quotes should always appear (5 mock contractors)

### Issue: "Missing authorization token" error

**Solution:**
- Make sure you're logged in
- Check that your Supabase client is configured correctly
- Verify your `.env.local` file has the correct keys

### Issue: Google Places API errors

**Solution:**
- Verify your API key is correct
- Check that Places API is enabled in Google Cloud Console
- Verify API key restrictions allow the Places API
- Check your Google Cloud billing is set up (Places API requires billing)

### Issue: AI API errors

**Solution:**
- Verify your API key is correct
- Check that you have credits/balance in your OpenAI/Anthropic account
- Verify the API key has the correct permissions
- The system will fall back to mock messages if AI fails

## Development vs Production

### Development (No API Keys)
- Uses mock contractors (5 per category)
- Uses mock negotiation messages
- Simulates quote collection
- **Works immediately** - no setup required

### Production (With API Keys)
- Uses real Google Places API to find contractors
- Uses AI to generate personalized messages
- Still simulates quote collection (contractor APIs don't exist)
- Requires API key setup and billing

## Next Steps

Once everything is working:

1. ✅ Test the full flow: tenant submission → landlord approval → agent → quotes → selection
2. ✅ Configure API keys for production use
3. ✅ Set up billing for Google Places API (if using real contractors)
4. ✅ Monitor edge function usage in Supabase dashboard
5. ✅ Consider adding email notifications when quotes are ready

## Cost Considerations

### Free Tier (Mock Mode)
- **Cost:** $0
- Uses mock data only
- Perfect for development and testing

### With API Keys
- **Google Places API:** ~$0.017 per request (first $200/month free)
- **OpenAI API:** ~$0.15 per 1M tokens (gpt-4o-mini)
- **Anthropic API:** ~$3 per 1M tokens (claude-3-5-sonnet)

For a typical maintenance request:
- 1 Google Places search: ~$0.017
- 5 AI messages (one per contractor): ~$0.001
- **Total per request: ~$0.02**

## Support

If you encounter issues:
1. Check the Supabase Edge Function logs
2. Verify all migrations are applied
3. Check browser console for frontend errors
4. Review the troubleshooting section above

