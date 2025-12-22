#!/bin/bash
# Auto-push script for LeaseWell
# This script automatically commits and pushes all changes

cd "$(dirname "$0")"

echo "🔄 Auto-pushing to GitHub..."

# Check if there are any changes
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No changes to commit"
    exit 0
fi

# Add all changes
git add -A

# Commit with timestamp
git commit -m "Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')"

# Push to current branch
CURRENT_BRANCH=$(git branch --show-current)
git push origin "$CURRENT_BRANCH"

echo "✅ Pushed to GitHub: $CURRENT_BRANCH"

