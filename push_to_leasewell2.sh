#!/bin/bash

# Script to push LeaseWell 2.0 to new repository

REPO_NAME="LeaseWell-2"
GITHUB_USER="pantherstar"

echo "🚀 Pushing LeaseWell 2.0 to new repository..."
echo ""

# Check if remote already exists
if git remote | grep -q origin; then
    echo "⚠️  Remote 'origin' already exists. Removing..."
    git remote remove origin
fi

# Add new remote
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
echo "📍 Connecting to: ${REPO_URL}"
git remote add origin "${REPO_URL}"

# Ensure we're on main branch
git branch -M main

# Push
echo ""
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Your code is now at:"
    echo "   https://github.com/${GITHUB_USER}/${REPO_NAME}"
else
    echo ""
    echo "❌ Push failed. Make sure the repository exists on GitHub."
    echo "   Go to: https://github.com/new"
    echo "   Create repository: ${REPO_NAME}"
fi

