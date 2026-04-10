# NgocThanh Inventory

Mobile-first warehouse management app for NgocThanh automotive parts store. Built for 3 staff with ~1000+ products.

## Features

- **Barcode scanning** — camera scan for instant product lookup
- **Role-based access** — admin sees cost/buying price; staff sees selling price only
- **Cart & checkout** — add products to cart, print receipts with invoice numbers
- **Sales history** — search by customer name, phone, or date; view past receipts
- **Product images** — upload photos via camera; optional Google Drive integration; horizontal scroll gallery with lightbox zoom
- **Cross-compatibility** — track which parts fit which car models; tap to navigate between products
- **Receive stock** — log incoming stock with PO numbers and reason tracking
- **Admin adjust** — correct quantities with audit trail
- **Real-time updates** — inventory changes sync across all devices instantly
- **Excel import/export** — bulk update inventory via spreadsheet; auto-creates new categories/manufacturers; error rows exported as separate file
- **Full audit trail** — every stock change logged with user, qty before/after, reason

## Tech Stack

- **Frontend**: `index.html` + `css/styles.css` + `js/*.js` — vanilla JS, no build step, no frameworks
- **Backend**: [Supabase](https://supabase.com) — PostgreSQL + Auth + Realtime + Storage
- **Barcode**: ZXing via CDN
- **Deployment**: [Vercel](https://vercel.com) (static — `index.html` auto-detected)

## Running Locally

1. Open `index.html` in a browser
2. HTTPS is required for camera/barcode scanning

## Deployment (Vercel)

Push to GitHub and connect the repo in Vercel. Supabase credentials are in `js/config.js` (the anon key is public by design — RLS policies protect data).

## Database Setup

Run `supabase-schema.sql` in the Supabase SQL Editor to create all tables, views, RLS policies, and triggers.

## Supabase Storage Setup

1. Storage → **New bucket** → name: `product-images` → Public: **ON**
2. Storage → Policies → add:
```sql
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');
```

## User Roles

Assign roles in Supabase Auth → users → user metadata: `{ "role": "admin" }` or `{ "role": "staff" }`.

## Product Images

**Camera upload (built-in):**
- Tap the 📷 tile in any product's image gallery to take or upload a photo
- Images are resized to max 1200px JPEG before upload to keep storage small
- Stored in Supabase Storage `product-images` bucket

**Google Drive (optional):**
1. Create a Drive folder with SKU-named subfolders; share as "Anyone with the link can view"
2. Set `DRIVE_FOLDER_ID` and `DRIVE_API_KEY` in `js/config.js`
3. Images load automatically with 1hr cache; tap ↻ Refresh to force reload

## File Structure

| Path | Purpose |
|------|---------|
| `index.html` | App entry point (HTML structure only) |
| `css/styles.css` | All styles — dark mode, mobile-first, print |
| `js/config.js` | Supabase + Drive credentials, app state |
| `js/utils.js` | `$()`, toast, formatters, debounce |
| `js/auth.js` | Login, logout, session |
| `js/navigation.js` | Screen switching |
| `js/data.js` | Inventory load, dashboard stats, realtime, Drive folder index |
| `js/render.js` | Product/activity card renderers |
| `js/search.js` | Search + filter logic |
| `js/products.js` | Product detail, compatibility, image gallery, lightbox, camera upload |
| `js/receive.js` | Receive stock flow |
| `js/adjust.js` | Admin quantity adjust |
| `js/scanner.js` | ZXing barcode scanner |
| `js/excel.js` | Excel import/export |
| `js/cart.js` | Cart state, checkout, receipt printing |
| `js/sales.js` | Sales history screen |
| `js/init.js` | DOMContentLoaded + all event listeners |
| `supabase-schema.sql` | Full database schema (run once in Supabase) |
