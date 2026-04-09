// ============================================================
// DATA LOADING
// ============================================================
async function loadImageManifest() {
    try {
        const res = await fetch('part_images/manifest.json');
        if (res.ok) state.localImages = await res.json();
    } catch (_) {}
}

// Fetch the list of SKU-named subfolders from Google Drive once at startup.
// Stores { sku: folderId } in state.driveFolderIndex.
// Per-SKU image lists are fetched lazily when a product modal opens.
async function loadDriveFolderIndex() {
    if (!CONFIG.DRIVE_FOLDER_ID || !CONFIG.DRIVE_API_KEY) return;
    try {
        const q = encodeURIComponent(`'${CONFIG.DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
        const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1000&key=${CONFIG.DRIVE_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const { files } = await res.json();
        state.driveFolderIndex = {};
        files.forEach(f => { state.driveFolderIndex[f.name] = f.id; });
        console.log(`Drive folder index loaded: ${files.length} SKU folder(s)`);
    } catch (err) {
        console.warn('Drive folder index failed:', err.message);
    }
}

async function loadInitialData() {
    if (!db) return;
    showLoading();
    try {
        // Inventory must load first so loadDashboardStats can derive counts from cache
        await Promise.all([loadCategories(), loadManufacturers(), loadInventory(), loadImageManifest(), loadDriveFolderIndex()]);
        await Promise.all([loadDashboardStats(), loadRecentActivity()]);
    } catch (err) {
        console.error('Error loading data:', err);
        showToast('Error loading data', 'error');
    }
    hideLoading();
}

async function loadCategories() {
    const { data, error } = await db
        .from('product_categories')
        .select('*')
        .order('name');
    if (error) throw error;
    state.categories = data || [];
    populateCategoryFilter();
}

async function loadManufacturers() {
    const { data, error } = await db
        .from('manufacturers')
        .select('*')
        .order('name');
    if (error) throw error;
    state.manufacturers = data || [];
    populateManufacturerFilter();
}

async function loadInventory() {
    // Use view based on role
    const viewName = state.userRole === 'admin' ? 'inventory_admin_view' : 'inventory_staff_view';
    const { data, error } = await db
        .from(viewName)
        .select('*')
        .order('name');
    if (!error) {
        state.inventory = data || [];
    }
}

async function loadDashboardStats() {
    // Derive counts from local cache (already loaded by loadInventory)
    const active = state.inventory.filter(p => p.is_active !== false);
    const totalSkus = active.length;
    // Use each product's own reorder_level (not a hardcoded 5)
    const lowStock = active.filter(p => p.qty <= (p.reorder_level || 5)).length;
    const totalItems = active.reduce((sum, p) => sum + (p.qty || 0), 0);

    // Only today's transaction count requires a DB query
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayTxns } = await db
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

    $('stat-total-skus').textContent = totalSkus;
    $('stat-low-stock').textContent = lowStock;
    $('stat-today-txns').textContent = todayTxns || 0;
    $('stat-total-value').textContent = totalItems.toLocaleString();
}

async function loadRecentActivity() {
    const { data, error } = await db
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
    if (!error) {
        renderActivityList(data || [], 'dashboard-activity');
    }
}

async function loadActivity(reset = false) {
    if (reset) state.activityPage = 0;

    const from = state.activityPage * state.activityPageSize;
    const to = from + state.activityPageSize - 1;

    let query = db
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

    const typeFilter = $('activity-filter-type').value;
    if (typeFilter) query = query.eq('type', typeFilter);

    const dateFilter = $('activity-filter-date').value;
    if (dateFilter) {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
    }

    const { data, error } = await query;
    if (error) {
        showToast('Error loading activity', 'error');
        return;
    }

    if (reset) {
        $('activity-list').innerHTML = '';
    }

    renderActivityList(data || [], 'activity-list');
    $('activity-load-more').style.display = (data && data.length === state.activityPageSize) ? '' : 'none';
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================
function setupRealtime() {
    if (!db) return;

    // Inventory changes
    db
        .channel('inventory-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => {
            handleInventoryChange(payload);
        })
        .subscribe();

    // Transaction changes (for activity feed)
    db
        .channel('transaction-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
            handleNewTransaction(payload.new);
        })
        .subscribe();
}

function handleInventoryChange(payload) {
    const { eventType, new: newRow } = payload;

    if (eventType === 'UPDATE' && newRow) {
        // Reload the single row from the view to preserve joined columns
        // (manufacturer_name, category_name etc. are absent in raw table payloads)
        const viewName = state.userRole === 'admin' ? 'inventory_admin_view' : 'inventory_staff_view';
        db.from(viewName).select('*').eq('id', newRow.id).single().then(({ data }) => {
            if (!data) return;
            const idx = state.inventory.findIndex(p => p.id === newRow.id);
            if (idx >= 0) state.inventory[idx] = data;
            else state.inventory.push(data);
            if (state.selectedProduct && state.selectedProduct.id === newRow.id) {
                state.selectedProduct = data;
            }
        });
        loadDashboardStats();
    } else if (eventType === 'INSERT' && newRow) {
        loadInventory();
        loadDashboardStats();
    }
}

function handleNewTransaction(txn) {
    // Prepend to dashboard activity
    const container = $('dashboard-activity');
    const html = renderActivityItem(txn);
    container.insertAdjacentHTML('afterbegin', html);

    // Remove excess items (keep 20)
    while (container.children.length > 20) {
        container.removeChild(container.lastChild);
    }

    // Also prepend to activity screen if active
    if (state.currentScreen === 'activity') {
        const actContainer = $('activity-list');
        actContainer.insertAdjacentHTML('afterbegin', html);
    }

    // Show toast if from another user
    if (txn.user_email !== state.user?.email) {
        showToast(`${txn.user_email} ${txn.type} ${txn.sku} (${txn.quantity_change > 0 ? '+' : ''}${txn.quantity_change})`, 'info');
    }
}
