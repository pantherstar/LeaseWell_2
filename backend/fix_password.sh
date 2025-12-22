#!/bin/bash

echo "🔧 Fix Database Password"
echo ""
echo "Your connection string has [YOUR-PASSWORD] placeholder."
echo "We need to replace it with your actual Supabase password."
echo ""
read -p "Enter your Supabase database password: " -s password
echo ""

if [ -z "$password" ]; then
    echo "❌ Password cannot be empty!"
    exit 1
fi

# Update .env file
if [ -f ".env" ]; then
    # Escape special characters in password for sed
    escaped_password=$(printf '%s\n' "$password" | sed 's/[[\.*^$()+?{|]/\\&/g')
    
    # Replace [YOUR-PASSWORD] with actual password
    sed -i.bak "s/\[YOUR-PASSWORD\]/$escaped_password/g" .env
    
    echo "✅ Password updated in .env file!"
    echo ""
    echo "Testing connection..."
    echo ""
    python3 connect_database.py
else
    echo "❌ .env file not found!"
    exit 1
fi

