# NgocThanh Inventory

Mobile-first warehouse management app for NgocThanh automotive parts store.

## Features

- Barcode scanning (camera) for quick product lookup
- Role-based access: admin sees cost/buying price, staff sees selling price only
- Real-time inventory updates across all devices
- Full audit trail of every stock change
- Cross-compatibility matrix (which parts fit which car models)
- Receive stock with reason tracking
- Activity log with filter by product/user

## Tech Stack

- Single HTML file — no build step, no frameworks
- [Supabase](https://supabase.com) — PostgreSQL + Auth + Realtime
- ZXing — barcode scanning via CDN
- Deployed on [Vercel](https://vercel.com)

## Running Locally

1. Open `warehouse-app.html` in a browser
2. HTTPS is required for camera/barcode scanning (use a local HTTPS server or deploy)

## Deployment (Vercel)

Push to GitHub and connect the repo in Vercel. No environment variables needed — credentials are embedded in the HTML.

## Database Setup

Run `supabase-schema.sql` in the Supabase SQL Editor to create all tables, views, RLS policies, and triggers.

## User Roles

After creating users in Supabase Auth, run `set-user-roles.sql` to assign `admin` or `staff` roles. Users must log out and back in for role changes to take effect.

## Files

| File | Purpose |
|------|---------|
| `warehouse-app.html` | The entire app |
| `supabase-schema.sql` | Database schema (run once in Supabase) |
| `set-user-roles.sql` | Assign admin/staff roles to users |
| `vercel.json` | Vercel deployment config |
| `.env.example` | Template for local environment variables |
