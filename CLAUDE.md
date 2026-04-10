# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NgocThanh Inventory — mobile-first automotive parts warehouse management app for a small family store (3 staff, ~1000+ products). `index.html` is the entry point; CSS and JS are split into separate files.

## Tech Stack

- **Frontend**: `index.html` (entry point) + `css/styles.css` + `js/*.js` — vanilla JS, no frameworks, no build step
- **Backend**: Supabase (PostgreSQL + Auth + Realtime subscriptions + Storage)
- **Barcode**: ZXing library via CDN (`@ArishSultan/zxing-library`)
- **Images**: Supabase Storage (`product-images` bucket) for camera uploads; Google Drive (optional, configured in `js/config.js`)
- **Deployment**: Vercel (static — `index.html` is auto-detected, no `vercel.json` needed)

## Running Locally

Open `index.html` directly in a browser. HTTPS is required for camera and barcode scanning.

Credentials are in `js/config.js` — set `SUPABASE_URL` and `SUPABASE_ANON_KEY` there.

## Database Setup

Run `supabase-schema.sql` in the Supabase SQL Editor. This creates:
- 7 tables: `manufacturers`, `product_categories`, `inventory`, `transactions`, `cross_compatibility_matrix`, `label_print_queue`, `product_images`
- 2 views: `inventory_staff_view` (no cost column), `inventory_admin_view` (all columns)
- RLS policies (admin vs staff), triggers for `updated_at`, realtime publication

Also create a **Supabase Storage** bucket named `product-images` (public) with an authenticated INSERT policy.

## Architecture

- **`index.html`**: HTML structure only — Auth screen + 6 main screens (Dashboard, Scan, Search, Receive, Activity, Sales History) + 5 modals (Product Detail, Cross-Compatibility, Admin Adjust, Cart, Receipt) + Image Lightbox
- **`css/styles.css`**: All styles — dark mode, mobile-first (375px base), safe-area inset handling, print styles
- **`js/` load order** (globals, no ES modules — order matters):
  - `config.js` — CONFIG, `db`, `initSupabase()`, `state`
  - `utils.js` — `$`, `$$`, toast, formatters, `debounce`, `closeAllModals`
  - `auth.js` — login, logout, session check
  - `navigation.js` — `enterApp`, `switchScreen`
  - `data.js` — inventory load, dashboard stats, activity, realtime, Drive folder index
  - `render.js` — product/activity card renderers, filter populators
  - `search.js` — `performSearch`, `performDashboardSearch`
  - `products.js` — product detail, compatibility, image gallery, lightbox, camera upload
  - `receive.js` — stock receive flow
  - `adjust.js` — admin adjust flow
  - `scanner.js` — ZXing barcode scanner
  - `excel.js` — Excel import/export with auto-backup
  - `cart.js` — cart state, checkout, receipt (`sales_orders` + `transactions`)
  - `sales.js` — sales history screen (`loadSalesHistory`, `viewSaleDetail`)
  - `init.js` — `DOMContentLoaded` + all event listeners

## Key Patterns

- **Role-based access**: User metadata `{ "role": "admin" }` or `{ "role": "staff" }`. Admin sees cost/buying price; staff sees selling price only. RLS enforced at DB level.
- **Realtime**: Subscribes to `inventory` and `transactions` changes. Other users' actions show as toast notifications.
- **Lookup fallback chain**: Exact SKU → manufacturer_code → ILIKE name search. If multiple matches, redirects to search screen.
- **Soft deletes**: `is_active` flag, never delete products.
- **Audit trail**: Every inventory change logged in `transactions` table with user email, qty before/after, reason.
- **State cache**: Inventory cached in `state.inventory[]`, updated via realtime. Search/filter operates on cache. Debounced at 300ms.
- **Image sources**: Supabase Storage (uploaded via camera) + Google Drive (optional, lazy-loaded per SKU with 1hr localStorage cache). Combined in `loadProductImages()`.
- **Image upload**: Client-side resize to max 1200px JPEG at 82% quality before uploading to Supabase Storage.

## Git Workflow

After making any file changes, use the `/commit` skill to stage, commit, and push. This handles the full git add → commit → push flow automatically.

Do this without asking for confirmation unless the change is destructive or ambiguous.

## Constraints

- Keep individual files lean; `index.html` is the entry point
- No frameworks (React, Vue, etc.) — vanilla JS only
- Touch targets minimum 44×44px
- All buttons disabled during async operations
- Supabase SDK and ZXing loaded from CDN
