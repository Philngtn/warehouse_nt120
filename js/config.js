// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
    SUPABASE_URL: 'https://ilygragflzkvgpegjwaa.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_UzW_f2jQbdLNbHf_P3GhLQ_6gt1x9vo',

    // Google Drive image source (optional).
    // Set DRIVE_FOLDER_ID to the root folder that contains SKU-named subfolders.
    // Restrict this API key to "Google Drive API" + your Vercel domain in Google Cloud Console.
    DRIVE_FOLDER_ID: '',   // e.g. '1A2B3C4D5E6F...'
    DRIVE_API_KEY:   '',   // e.g. 'AIzaSy...'
};

// ============================================================
// SUPABASE CLIENT
// ============================================================
let db = null;

function initSupabase() {
    if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
        return false;
    }
    db = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    return true;
}

// ============================================================
// APP STATE
// ============================================================
const state = {
    user: null,
    userRole: 'staff', // 'admin' or 'staff'
    currentScreen: 'dashboard',
    inventory: [],       // cached inventory
    categories: [],
    manufacturers: [],
    transactions: [],
    activityPage: 0,
    activityPageSize: 50,
    selectedProduct: null,
    compatSku: null,
    scannerActive: false,
    codeReader: null,
    searchDebounce: null,
    lowStockFilter: false,
    searchResults: [],
    // Cart
    cart: [],            // [{sku, name, qty, selling_price, subtotal}]
    salesPage: 0,
    salesPageSize: 20,
    // Local images (loaded from part_images/manifest.json)
    localImages: {},       // { sku: ['url', ...] }
    // Google Drive: SKU folder index fetched once at startup
    driveFolderIndex: {},  // { sku: folderId }
    // Google Drive: per-SKU image URL cache (populated lazily on modal open)
    driveImageCache: {},   // { sku: ['https://...', ...] }
};
