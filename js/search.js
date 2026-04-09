// ============================================================
// SEARCH
// ============================================================
async function performSearch() {
    const term = $('search-input').value.trim().toLowerCase();
    const categoryId = $('filter-category').value;
    const manufacturerId = $('filter-manufacturer').value;
    const yearFilter = $('filter-year').value;

    // Sync low-stock chip visual state
    $('filter-low-stock-btn').classList.toggle('active', state.lowStockFilter);

    let results = state.inventory;

    if (term) {
        results = results.filter(p =>
            (p.sku && p.sku.toLowerCase().includes(term)) ||
            (p.name && p.name.toLowerCase().includes(term)) ||
            (p.manufacturer_code && p.manufacturer_code.toLowerCase().includes(term)) ||
            (p.manufacturer_name && p.manufacturer_name.toLowerCase().includes(term))
        );
    }

    if (categoryId) {
        results = results.filter(p => p.category_id === categoryId);
    }

    if (manufacturerId) {
        results = results.filter(p => p.manufacturer_id === manufacturerId);
    }

    if (yearFilter) {
        const y = parseInt(yearFilter);
        results = results.filter(p =>
            (!p.model_year_start || p.model_year_start <= y) &&
            (!p.model_year_end || p.model_year_end >= y)
        );
    }

    if (state.lowStockFilter) {
        results = results.filter(p => p.qty <= (p.reorder_level || 5));
    }

    state.searchResults = results;

    const container = $('search-results');
    const empty = $('search-empty');
    const bar = $('search-results-bar');
    const countEl = $('search-results-count');

    if (!results.length) {
        container.innerHTML = '';
        empty.style.display = '';
        bar.style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    bar.style.display = 'flex';
    countEl.textContent = `${results.length} product${results.length !== 1 ? 's' : ''}`;
    container.innerHTML = results.map(renderProductItem).join('');
}

function toggleLowStockFilter() {
    state.lowStockFilter = !state.lowStockFilter;
    performSearch();
}

function showLowStockList() {
    state.lowStockFilter = true;
    $('search-input').value = '';
    $('filter-category').value = '';
    $('filter-manufacturer').value = '';
    $('filter-year').value = '';
    switchScreen('search');
    performSearch();
}

function exportSearchResults() {
    const products = state.searchResults;
    if (!products || !products.length) {
        showToast('No products to export', 'error');
        return;
    }
    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(buildInventoryRows(products));
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
        const term = $('search-input').value.trim();
        const label = state.lowStockFilter ? 'LowStock' : (term ? 'Search' : 'Filtered');
        XLSX.writeFile(wb, `NgocThanh_${label}_${getDateTimeStamp()}.xlsx`);
        showToast(`Exported ${products.length} products`, 'success');
    } catch (err) {
        showToast('Export failed: ' + err.message, 'error');
    }
}

// Dashboard quick search
async function performDashboardSearch() {
    const term = $('dashboard-search').value.trim().toLowerCase();
    if (!term) return;

    // Navigate to search screen with the term
    $('search-input').value = term;
    switchScreen('search');
    performSearch();
}
