# Simple Setup Guide - Maintenance Agent System

Follow these steps in order. Each step should only take 1-2 minutes.

## Step 1: Apply the Database Migration (Required)

This adds the new tables and columns needed for the contractor agent.

### What to do:

1. **Open your Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/goatjyljwfapdvogwjdh
   - Make sure you're logged in

2. **Open the SQL Editor:**
   - Look at the left sidebar
   - Click on **"SQL Editor"** (it has a database icon)
   - Click the **"New Query"** button (top right)

3. **Copy the migration code:**
   - Open the file: `supabase/migrations/007_contractor_agent.sql` on your computer
   - Select ALL the text (Cmd+A on Mac, Ctrl+A on Windows)
   - Copy it (Cmd+C or Ctrl+C)

4. **Paste and run:**
   - Paste the code into the SQL Editor box
   - Click the **"Run"** button (or press Cmd+Enter / Ctrl+Enter)
   - Wait for the success message (should say "Success" in green)

5. **Verify it worked:**
   - Look at the left sidebar again
   - Click **"Table Editor"**
   - You should see a new table called **"contractor_quotes"**
   - If you see it, you're done with this step! ✅

---

## Step 2: Verify Edge Function is Deployed (Already Done!)

The edge function is already deployed, but let's verify:

1. **Check Edge Functions:**
   - In your Supabase Dashboard, click **"Edge Functions"** in the left sidebar
   - You should see **"shop-for-contractors"** in the list
   - If you see it, you're all set! ✅

---

## Step 3: Test the System

Now let's test if everything works!

### Test as a Tenant:

1. **Log in to your app** (or sign up if you don't have an account)
2. **Go to the Maintenance tab**
3. **Click "New Request"**
4. **Fill out the form:**
   - Select a property
   - Enter a title (e.g., "Leaky faucet")
   - Choose a category (e.g., "Plumbing")
   - Add a description
   - Click "Submit Request"
5. **You should see:** A success message and your request in the list ✅

### Test as a Landlord:

1. **Log in as a landlord** (or switch accounts if you have both)
2. **Go to the Maintenance tab**
3. **Find the request you just created**
4. **Change the status dropdown to "In Progress"**
   - The agent should automatically start!
   - You'll see a status badge showing "Shopping for contractors..."
5. **Wait 10-15 seconds** (the agent is collecting quotes)
6. **You should see:**
   - Status changes to "Quotes ready"
   - A new section below the request showing contractor quotes
   - 5 mock contractors with prices, ratings, and details
7. **Click "Select This Contractor"** on any quote
8. **You should see:** The contractor is now assigned! ✅

---

## Troubleshooting

### Problem: "No quotes appearing"

**Solution:**
- Wait a bit longer (up to 30 seconds)
- Refresh the page
- Check that the status shows "completed" (not "shopping")
- If still nothing, check the browser console (F12) for errors

### Problem: "Function not found" error

**Solution:**
- Go to Supabase Dashboard → Edge Functions
- Make sure "shop-for-contractors" is listed
- If not, the deployment might have failed - let me know!

### Problem: "Table doesn't exist" error

**Solution:**
- Make sure you ran Step 1 (the migration)
- Check that "contractor_quotes" table exists in Table Editor
- If not, run the migration again

### Problem: Status stuck on "shopping"

**Solution:**
- This usually means the edge function is still running
- Wait up to 1 minute
- If it's still stuck, check Edge Functions → shop-for-contractors → Logs
- You can also manually change the status back to "pending" and try again

---

## What You Should See When It Works

### As a Tenant:
- Your maintenance request appears in the list
- You can see the status (pending, in progress, completed)
- When landlord selects a contractor, you get a notification

### As a Landlord:
- You see all tenant requests
- When you change status to "In Progress", agent automatically starts
- You see a "Contractor Quotes" section with:
  - 5 contractor cards
  - Each showing: name, rating, price, address, phone
  - A "Select This Contractor" button
- After selecting, the request shows "Assigned: [Contractor Name]"

---

## Optional: Add Real API Keys (For Production)

Right now, the system uses **mock data** (fake contractors). This is perfect for testing!

If you want to use **real contractors** from Google Maps:

1. **Get a Google Places API Key:**
   - Go to: https://console.cloud.google.com/
   - Create a project
   - Enable "Places API"
   - Create an API key

2. **Add it to Supabase:**
   - Go to: Supabase Dashboard → Edge Functions → shop-for-contractors
   - Click "Settings" or "Secrets"
   - Add: `GOOGLE_PLACES_API_KEY` = your key
   - Save

3. **For AI negotiation messages:**
   - Get an OpenAI API key from: https://platform.openai.com/
   - Add it as: `OPENAI_API_KEY` = your key

**Note:** You don't need these to test! Mock data works perfectly.

---

## Quick Checklist

Before testing, make sure:
- [ ] Step 1: Migration applied (contractor_quotes table exists)
- [ ] Step 2: Edge function deployed (shop-for-contractors exists)
- [ ] You have at least one property in your account
- [ ] You're logged in

Then test:
- [ ] Submit a maintenance request as tenant
- [ ] Change status to "In Progress" as landlord
- [ ] See quotes appear
- [ ] Select a contractor

---

## Need Help?

If something doesn't work:
1. Check the troubleshooting section above
2. Look at browser console (F12 → Console tab) for errors
3. Check Supabase Dashboard → Edge Functions → Logs
4. Make sure you completed Step 1 (the migration is the most important!)

The system is designed to work with mock data, so you should be able to test everything right away!

