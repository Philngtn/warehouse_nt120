# NgocThanh Inventory

Mobile-first warehouse management app for NgocThanh automotive parts store. Built for 3 staff with ~1000+ products.

## Features

- **Barcode scanning** — camera scan for instant product lookup
- **Role-based access** — admin sees cost/buying price; staff sees selling price only
- **Cart & checkout** — add products to cart, print receipts with invoice numbers
- **Sales history** — search by customer name, phone, or date; view past receipts
- **Product images** — local folder (`part_images/{SKU}/`) or Google Drive, with lightbox viewer
- **Cross-compatibility** — track which parts fit which car models; tap to navigate between products
- **Receive stock** — log incoming stock with PO numbers and reason tracking
- **Admin adjust** — correct quantities with audit trail
- **Real-time updates** — inventory changes sync across all devices instantly
- **Excel import/export** — bulk update inventory via spreadsheet
- **Full audit trail** — every stock change logged with user, qty before/after, reason

## Tech Stack

- **Frontend**: `index.html` + `css/styles.css` + `js/*.js` — vanilla JS, no build step, no frameworks
- **Backend**: [Supabase](https://supabase.com) — PostgreSQL + Auth + Realtime subscriptions
- **Barcode**: ZXing via CDN
- **Deployment**: [Vercel](https://vercel.com) (static)

## Running Locally

1. Open `index.html` in a browser
2. HTTPS is required for camera/barcode scanning

## Deployment (Vercel)

Push to GitHub and connect the repo in Vercel. Supabase credentials are in `js/config.js` (the anon key is public by design — RLS policies protect data).

## Database Setup

Run `supabase-schema.sql` in the Supabase SQL Editor to create all tables, views, RLS policies, and triggers.

Also run the `sales_orders` section at the bottom of the file before using checkout.

## User Roles

Assign roles in Supabase Auth → users → user metadata: `{ "role": "admin" }` or `{ "role": "staff" }`.

## Product Images

**Local (testing):**
1. Place image files in `part_images/{SKU}/` (e.g. `part_images/NT-1200/front.jpg`)
2. Run `python3 generate-manifest.py` to update `part_images/manifest.json`

**Google Drive (production):**
1. Create a Drive folder with SKU-named subfolders; share as "Anyone with the link can view"
2. Set `DRIVE_FOLDER_ID` and `DRIVE_API_KEY` in `js/config.js`
3. Images load automatically — no script needed

## File Structure

| Path | Purpose |
|------|---------|
| `index.html` | App entry point (HTML structure only) |
| `css/styles.css` | All styles — dark mode, mobile-first, print |
| `js/config.js` | Supabase + Drive credentials, app state |
| `js/utils.js` | `$()`, toast, formatters, debounce |
| `js/auth.js` | Login, logout, session |
| `js/navigation.js` | Screen switching |
| `js/data.js` | Inventory load, dashboard stats, realtime, image manifest |
| `js/render.js` | Product/activity card renderers |
| `js/search.js` | Search + filter logic |
| `js/products.js` | Product detail, compatibility, image lightbox |
| `js/receive.js` | Receive stock flow |
| `js/adjust.js` | Admin quantity adjust |
| `js/scanner.js` | ZXing barcode scanner |
| `js/excel.js` | Excel import/export |
| `js/cart.js` | Cart state, checkout, receipt printing |
| `js/sales.js` | Sales history screen |
| `js/init.js` | DOMContentLoaded + all event listeners |
| `part_images/` | Local product images (`{SKU}/filename.jpg`) |
| `generate-manifest.py` | Scan `part_images/` and write `manifest.json` |
| `supabase-schema.sql` | Full database schema (run once in Supabase) |
