// ============================================================
// EVENT LISTENERS
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Init Supabase
    const configured = initSupabase();
    if (configured) {
        checkSession();
    }

    populateYearFilter();
    applyI18n();
    // Highlight active language button
    document.querySelectorAll('.lang-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.lang === (localStorage.getItem('nt_lang') || 'en')));
    initLightbox();

    // Auth
    $('login-form').addEventListener('submit', handleLogin);
    $('forgot-form').addEventListener('submit', handleForgotPassword);
    $('show-forgot-btn').addEventListener('click', () => {
        $('login-form').style.display = 'none';
        $('forgot-form').style.display = '';
        $('forgot-email').value = $('login-email').value;
        $('forgot-msg').style.display = 'none';
    });
    $('back-to-login-btn').addEventListener('click', () => {
        $('forgot-form').style.display = 'none';
        $('login-form').style.display = '';
    });
    $('logout-btn').addEventListener('click', handleLogout);

    // Excel import/export
    $('excel-btn').addEventListener('click', () => {
        $('excel-modal').classList.add('active');
        $('import-file').value = '';
        $('import-preview').style.display = 'none';
        $('wipe-replace-row').style.display = 'none';
        $('wipe-replace-chk').checked = false;
        $('import-btn').style.display = 'none';
        $('import-msg').style.display = 'none';
        $('import-errors').style.display = 'none';
        $('export-msg').style.display = 'none';
    });

    // Excel modal tabs
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            $$('.tab-btn').forEach(b => {
                b.classList.toggle('active', b === btn);
                b.style.color = b === btn ? 'var(--accent)' : 'var(--text-secondary)';
                b.style.borderBottom = b === btn ? '2px solid var(--accent)' : 'none';
            });
            $$('.tab-content').forEach(content => {
                content.style.display = content.id === `tab-${tabName}` ? 'block' : 'none';
            });
        });
    });

    // Excel export
    $('export-btn').addEventListener('click', exportToExcel);

    // Excel import file picker and preview
    $('import-file').addEventListener('change', () => {
        const file = $('import-file').files[0];
        const msgEl = $('import-msg');
        $('import-preview').style.display = 'none';
        $('wipe-replace-row').style.display = 'none';
        $('wipe-replace-chk').checked = false;
        $('import-btn').style.display = 'none';
        msgEl.style.display = 'none';
        if (!file) return;

        // Validate filename format: NgocThanh_DD_MM_YYYY_IN.xlsx
        const validName = /^NgocThanh_\d{2}_\d{2}_\d{4}_IN\.xlsx$/i.test(file.name);
        if (!validName) {
            msgEl.textContent = `✗ Invalid filename. Expected: NgocThanh_DD_MM_YYYY_IN.xlsx`;
            msgEl.style.color = 'var(--danger)';
            msgEl.style.display = 'block';
            $('import-file').value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws).slice(0, 5);

                if (rows.length) {
                    const previewHtml = rows.map((row, idx) =>
                        `Row ${idx + 1}: ${JSON.stringify(row).substring(0, 100)}...`
                    ).join('<br>');

                    $('preview-content').innerHTML = previewHtml;
                    $('import-preview').style.display = 'block';
                    $('wipe-replace-row').style.display = 'flex';
                    $('import-btn').style.display = 'block';
                }
            } catch (err) {
                console.error('Preview failed:', err);
            }
        };
        reader.readAsArrayBuffer(file);
    });

    // Excel import
    $('import-btn').onclick = importFromExcel;

    // Navigation
    $$('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
    });

    // Dashboard search
    $('dashboard-search').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performDashboardSearch();
    });

    // View all activity link
    $('view-all-activity').addEventListener('click', (e) => {
        e.preventDefault();
        switchScreen('activity');
    });

    // Search
    const debouncedSearch = debounce(performSearch, 300);
    $('search-input').addEventListener('input', debouncedSearch);
    $('filter-category').addEventListener('change', performSearch);
    $('filter-manufacturer').addEventListener('change', performSearch);
    $('filter-year').addEventListener('change', performSearch);

    // Scan - manual lookup
    $('manual-lookup-btn').addEventListener('click', async () => {
        const query = $('manual-sku-input').value.trim();
        if (!query) return;
        showLoading();
        const product = await lookupProduct(query);
        hideLoading();
        if (product) {
            showScannedProduct(product);
        } else {
            showToast('Product not found', 'error');
        }
    });

    $('manual-sku-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') $('manual-lookup-btn').click();
    });

    // Receive
    $('receive-lookup-btn').addEventListener('click', () => {
        lookupForReceive($('receive-search').value.trim());
    });
    $('receive-search').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') $('receive-lookup-btn').click();
    });
    $('receive-form').addEventListener('submit', handleReceive);

    // Activity filters
    $('activity-filter-type').addEventListener('change', () => loadActivity(true));
    $('activity-filter-date').addEventListener('change', () => loadActivity(true));
    $('activity-load-more').addEventListener('click', () => {
        state.activityPage++;
        loadActivity(false);
    });

    // Adjust form
    $('adjust-form').addEventListener('submit', handleAdjust);

    // Sales history search + filter
    $('sales-search-input').addEventListener('input', debounce(() => loadSalesHistory(true), 400));
    $('sales-filter-date').addEventListener('change', () => loadSalesHistory(true));
    $('sales-load-more').addEventListener('click', () => {
        state.salesPage++;
        loadSalesHistory(false);
    });

    // Modal close on backdrop click
    ['product-modal', 'compat-modal', 'adjust-modal', 'cart-modal', 'receipt-modal'].forEach(id => {
        $(id).addEventListener('click', (e) => {
            if (e.target === $(id)) closeModal(id);
        });
    });

    // Initial search render (show all products)
    if (state.inventory.length) {
        performSearch();
    }
});
