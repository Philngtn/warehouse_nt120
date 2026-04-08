#!/bin/bash
# Generates config.js from environment variables (used by Vercel build)
cat > config.js <<EOF
const VITE_SUPABASE_URL = '${VITE_SUPABASE_URL}';
const VITE_SUPABASE_ANON_KEY = '${VITE_SUPABASE_ANON_KEY}';
EOF
echo "config.js generated"
