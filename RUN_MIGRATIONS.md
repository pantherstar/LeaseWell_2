# 📋 Run Database Migrations

Your database is connected! Now you need to create the tables.

## Quick Steps

### Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   - Open: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor:**
   - Click **"SQL Editor"** in left sidebar
   - Click **"New Query"** button

3. **Run First Migration:**
   - In your project, open: `supabase/migrations/001_initial_schema.sql`
   - Copy **ALL** the content (Cmd/Ctrl + A, then Cmd/Ctrl + C)
   - Paste into SQL Editor
   - Click **"Run"** button (or press Cmd/Ctrl + Enter)
   - Wait for "Success" message

4. **Run Other Migrations:**
   Repeat step 3 for:
   - `002_row_level_security.sql`
   - `003_storage_setup.sql`
   - `004_tenant_invites.sql`
   - `005_stripe_connect.sql`
   - `006_tenant_properties.sql`
   - `007_contractor_agent.sql`

5. **Verify:**
   ```bash
   cd backend
   python3 connect_database.py
   ```
   
   You should now see tables listed!

## Migration Files Order

Run them in this order:
1. `001_initial_schema.sql` - Creates all main tables
2. `002_row_level_security.sql` - Sets up security
3. `003_storage_setup.sql` - File storage setup
4. `004_tenant_invites.sql` - Tenant invite system
5. `005_stripe_connect.sql` - Payment integration
6. `006_tenant_properties.sql` - Tenant property links
7. `007_contractor_agent.sql` - Maintenance contractor system

## After Migrations

Once all migrations are done:
- ✅ Your database will have all tables
- ✅ You can start using the app
- ✅ Register users, create properties, etc.

## Troubleshooting

**"Table already exists" error:**
- That's okay! The table was already created
- Continue with next migration

**"Permission denied" error:**
- Make sure you're using the correct database user
- Check Supabase project settings

**"Syntax error":**
- Make sure you copied the entire file
- Check for any missing semicolons

