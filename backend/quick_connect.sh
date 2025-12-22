#!/bin/bash

# Quick database connection helper

echo "🔗 Quick Database Connection Setup"
echo ""
echo "Choose an option:"
echo "1. I have Supabase - help me get connection string"
echo "2. I have local PostgreSQL - configure it"
echo "3. I want to create a new Supabase project"
echo "4. Test current connection"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "📋 To get your Supabase connection string:"
        echo ""
        echo "1. Go to: https://supabase.com/dashboard"
        echo "2. Select your project"
        echo "3. Go to: Settings > Database"
        echo "4. Scroll to 'Connection string' section"
        echo "5. Copy the 'URI' (not the pooler)"
        echo ""
        echo "It looks like:"
        echo "postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
        echo ""
        read -p "Paste your connection string here: " conn_str
        
        if [ ! -z "$conn_str" ]; then
            # Convert to asyncpg format
            conn_str=$(echo "$conn_str" | sed 's|postgresql://|postgresql+asyncpg://|')
            
            # Update .env
            if grep -q "DATABASE_URL=" .env 2>/dev/null; then
                sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=$conn_str|" .env
            else
                echo "DATABASE_URL=$conn_str" >> .env
            fi
            
            echo "✅ Updated .env file!"
            echo ""
            echo "Testing connection..."
            python3 connect_database.py
        fi
        ;;
    2)
        python3 setup_database.py
        ;;
    3)
        echo ""
        echo "🌐 Create a new Supabase project:"
        echo "1. Go to: https://supabase.com"
        echo "2. Click 'Start your project'"
        echo "3. Sign up/login"
        echo "4. Create new project"
        echo "5. Wait for project to be ready"
        echo "6. Come back and run this script again (option 1)"
        echo ""
        open "https://supabase.com" 2>/dev/null || echo "Please open https://supabase.com in your browser"
        ;;
    4)
        python3 connect_database.py
        ;;
    *)
        echo "Invalid choice"
        ;;
esac

