// ============================================================
// BUYING PRICE TOGGLE
// ============================================================
function toggleBuyingPrice(el) {
    const masked = el.querySelector('.price-masked');
    const hint = el.querySelector('.price-reveal');
    const actual = el.dataset.price;
    if (masked.dataset.visible === '1') {
        masked.textContent = '••••••';
        masked.dataset.visible = '0';
        if (hint) hint.textContent = 'Tap to reveal';
    } else {
        masked.textContent = actual;
        masked.dataset.visible = '1';
        if (hint) hint.textContent = 'Tap to hide';
    }
}

// ============================================================
// APP ENTRY
// ============================================================
function enterApp() {
    $('auth-screen').style.display = 'none';
    $('main-app').style.display = 'flex';

    // Update role badge
    const badge = $('user-role-badge');
    badge.textContent = state.userRole === 'admin' ? 'Admin' : 'Staff';
    badge.className = `role-badge ${state.userRole === 'admin' ? '' : 'staff'}`;

    // Show Excel button for admin only
    $('excel-btn').style.display = state.userRole === 'admin' ? '' : 'none';

    // Populate settings screen
    $('settings-email').textContent = state.user?.email || '';
    $('settings-role-badge').textContent = state.userRole === 'admin' ? 'Admin' : 'Staff';
    $('settings-role-badge').className = `role-badge ${state.userRole === 'admin' ? '' : 'staff'}`;

    // Toggle cost visibility
    document.querySelectorAll('.admin-only').forEach(el => {
        el.classList.toggle('cost-hidden', state.userRole !== 'admin');
    });

    loadInitialData();
    setupRealtime();
    switchScreen('dashboard');
}

// ============================================================
// NAVIGATION
// ============================================================
function switchScreen(name) {
    // Clear low-stock filter when leaving search screen
    if (state.currentScreen === 'search' && name !== 'search') {
        state.lowStockFilter = false;
    }

    state.currentScreen = name;

    // Update nav buttons
    $$('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.screen === name);
    });

    // Update screens
    $$('.screen').forEach(s => s.classList.remove('active'));
    $(`screen-${name}`).classList.add('active');

    // Screen-specific actions
    if (name === 'scan') {
        startScanner();
    } else {
        stopScanner();
    }

    if (name === 'activity') {
        loadActivity(true);
    }

    if (name === 'sales') {
        const dateInput = $('sales-filter-date');
        if (!dateInput.value) {
            // Default to today in Vietnam time (UTC+7)
            const now = new Date(Date.now() + 7 * 3600 * 1000);
            dateInput.value = now.toISOString().slice(0, 10);
        }
        loadSalesHistory(true);
    }
}
