// ============================================================
// UTILITIES
// ============================================================
function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelectorAll(sel); }

function showLoading() { $('loading-overlay').classList.add('active'); }
function hideLoading() { $('loading-overlay').classList.remove('active'); }

function showToast(message, type = 'info', key = null) {
    const container = $('toast-container');
    // If a keyed toast already exists, update it in-place instead of stacking
    if (key) {
        const existing = container.querySelector(`[data-key="${key}"]`);
        if (existing) {
            existing.textContent = message;
            existing.className = `toast ${type}`;
            clearTimeout(existing._removeTimer);
            existing._removeTimer = setTimeout(() => existing.remove(), 3000);
            return;
        }
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    if (key) toast.dataset.key = key;
    container.appendChild(toast);
    toast._removeTimer = setTimeout(() => toast.remove(), 3000);
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(val) {
    if (val == null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function qtyClass(qty, reorderLevel) {
    if (qty <= 0) return 'qty-low';
    if (qty <= (reorderLevel || 5)) return 'qty-warn';
    return 'qty-ok';
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Strips Vietnamese (and other) diacritics so "ac quy" matches "Ắc Quy"
function removeDiacritics(str) {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function debounce(fn, ms) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.classList.remove('active');
    });
}
