# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NgocThanh Inventory — mobile-first automotive parts warehouse management app for a small family store (3 staff, ~1000+ products). Single HTML file + Supabase backend.

## Tech Stack

- **Frontend**: Single `warehouse-app.html` file (vanilla JS, no frameworks)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time subscriptions)
- **Barcode**: ZXing library via CDN (`@ArishSultan/zxing-library`)
- **Images**: Google Drive links stored in DB
- **Deployment**: Vercel (static file)

## Running Locally

Open `warehouse-app.html` directly in a browser. Supabase credentials must be configured — either:
1. Set meta tags `<meta name="supabase-url">` / `<meta name="supabase-key">` in the HTML head
2. Define globals `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` before the script runs

HTTPS is required for camera/barcode scanning to work.

## Database Setup

Run `supabase-schema.sql` in the Supabase SQL Editor. This creates:
- 7 tables: `manufacturers`, `product_categories`, `inventory`, `transactions`, `cross_compatibility_matrix`, `label_print_queue`, `product_images`
- 2 views: `inventory_staff_view` (no cost column), `inventory_admin_view` (all columns)
- RLS policies (admin vs staff), triggers for `updated_at`, realtime publication

## Architecture

All code lives in `warehouse-app.html`:
- **CSS**: Dark mode, mobile-first (375px base), safe-area inset handling
- **HTML**: Auth screen + 5 main screens (Dashboard, Scan, Search, Receive, Activity) + 3 modals (Product Detail, Cross-Compatibility, Admin Adjust)
- **JS**: Config → Supabase client → App state → Utils → Auth → Navigation → Data loading → Render functions → Search → Product lookup (SKU → manufacturer code → name fallback) → Receive stock → Adjust → Barcode scanner → Realtime subscriptions → Event listeners

## Key Patterns

- **Role-based access**: User metadata `{ "role": "admin" }` or `{ "role": "staff" }`. Admin sees cost/buying price; staff sees selling price only. RLS enforced at DB level.
- **Realtime**: Subscribes to `inventory` and `transactions` changes. Other users' actions show as toast notifications.
- **Lookup fallback chain**: Exact SKU → manufacturer_code → ILIKE name search. If multiple matches, redirects to search screen.
- **Soft deletes**: `is_active` flag, never delete products.
- **Audit trail**: Every inventory change logged in `transactions` table with user email, qty before/after, reason.
- **State cache**: Inventory cached in `state.inventory[]`, updated via realtime. Search/filter operates on cache. Debounced at 300ms.

## Environment Variables (.env — never commit)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key
```

## Git Workflow

After making any file changes, automatically:
1. `git add` the changed files
2. `git commit` with a descriptive message
3. `git push origin main`

Do this without asking for confirmation unless the change is destructive or ambiguous.

## Constraints

- Single HTML file must stay under 200KB
- No frameworks (React, Vue, etc.) — vanilla JS only
- Touch targets minimum 44×44px
- All buttons disabled during async operations
- Supabase SDK and ZXing loaded from CDN
