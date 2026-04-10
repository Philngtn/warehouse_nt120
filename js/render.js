// ============================================================
// RENDER FUNCTIONS
// ============================================================

function populateCategoryFilter() {
    const opts = [`<option value="">${t('all_categories')}</option>`];
    state.categories.forEach(cat => opts.push(`<option value="${cat.id}">${escapeHtml(cat.name)}</option>`));
    $('filter-category').innerHTML = opts.join('');
}

function populateManufacturerFilter() {
    const opts = state.manufacturers.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`);
    $('filter-manufacturer').innerHTML = `<option value="">${t('all_manufacturers')}</option>` + opts.join('');
    $('receive-manufacturer-select').innerHTML = `<option value="">${t('no_change')}</option>` + opts.join('');
}

function populateYearFilter() {
    const currentYear = new Date().getFullYear();
    const opts = [`<option value="">${t('all_years')}</option>`];
    for (let y = currentYear; y >= 1990; y--) opts.push(`<option value="${y}">${y}</option>`);
    $('filter-year').innerHTML = opts.join('');
}

function renderProductItem(product) {
    const qtyClz = qtyClass(product.qty, product.reorder_level);
    const catIcon = product.category_icon || '📦';

    const imgHtml = product.image_url
        ? `<img src="${escapeHtml(product.image_url)}" alt="" loading="lazy">`
        : catIcon;

    const canAddToCart = product.selling_price != null && product.qty > 0;

    const priceRow = product.selling_price != null ? `
        <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
            <span style="font-size:12px;color:var(--accent);font-weight:600;">${formatCurrency(product.selling_price)}</span>
            ${canAddToCart ? `<button class="btn btn-primary btn-sm"
                style="padding:2px 10px;font-size:11px;min-height:24px;white-space:nowrap;"
                onclick="event.stopPropagation();addToCart('${escapeHtml(product.sku)}')">+ Cart</button>` : ''}
        </div>` : '';

    return `
        <div class="product-item" data-sku="${escapeHtml(product.sku)}" onclick="openProductDetail('${escapeHtml(product.sku)}')">
            <div class="product-img">${imgHtml}</div>
            <div class="product-info">
                <div class="product-name">${escapeHtml(product.name)}</div>
                <div class="product-meta">
                    ${escapeHtml(product.sku)}
                    ${product.manufacturer_name ? ' · ' + escapeHtml(product.manufacturer_name) : ''}
                    ${product.location ? ' · ' + escapeHtml(product.location) : ''}
                </div>
                ${priceRow}
            </div>
            <div class="product-qty">
                <div class="qty-num ${qtyClz}">${product.qty}</div>
                <div class="qty-label">${t('in_stock')}</div>
            </div>
        </div>
    `;
}

function renderActivityItem(txn) {
    const typeClass = `type-${txn.type}`;
    const qtyChange = txn.quantity_change > 0 ? `+${txn.quantity_change}` : txn.quantity_change;
    const product = state.inventory.find(p => p.sku === txn.sku);
    const productName = product ? escapeHtml(product.name) : '';
    const manufacturerName = product ? escapeHtml(product.manufacturer_name || '') : '';

    return `
        <div class="activity-item" onclick="this.classList.toggle('expanded')">
            <div class="activity-header">
                <span class="activity-type ${typeClass}">${txn.type}</span>
                <span class="activity-time">${formatDate(txn.created_at)}</span>
            </div>
            <div class="activity-body">
                <span class="sku-ref">${escapeHtml(txn.sku)}</span>
                ${txn.quantity_change != null ? ` — ${t('qty_label')} ${qtyChange} (${txn.qty_before} → ${txn.qty_after})` : ''}
            </div>
            ${productName || manufacturerName ? `
            <div style="font-size:12px;color:var(--text-secondary);margin-top:3px;padding-left:2px;">
                ${productName}${productName && manufacturerName ? ' · ' : ''}${manufacturerName}
            </div>` : ''}
            <div class="activity-detail">
                <div>${t('user_label')} ${escapeHtml(txn.user_email)}</div>
                ${txn.reason ? `<div>${t('reason_label')} ${escapeHtml(txn.reason)}</div>` : ''}
                ${txn.notes ? `<div>${t('notes_label')} ${escapeHtml(txn.notes)}</div>` : ''}
                ${txn.manufacturer_changed_from ? `<div>${t('mfr_changed')} ${escapeHtml(txn.manufacturer_changed_from)} → ${escapeHtml(txn.manufacturer_changed_to)}</div>` : ''}
                ${txn.po_number ? `<div>${t('po_label')} ${escapeHtml(txn.po_number)}</div>` : ''}
                ${txn.invoice_number ? `<div>${t('invoice_label')} ${escapeHtml(txn.invoice_number)}</div>` : ''}
            </div>
        </div>
    `;
}

function renderActivityList(items, containerId) {
    const container = $(containerId);
    if (!items.length) {
        container.innerHTML = `<div class="empty-state"><p>${t('no_activity')}</p></div>`;
        return;
    }
    container.innerHTML += items.map(renderActivityItem).join('');
}

// ============================================================
// CAROUSEL INIT (call after inserting carousel HTML into DOM)
// ============================================================
function initCarousels(container) {
    container.querySelectorAll('.img-carousel').forEach(el => {
        const inner = el.querySelector('.img-carousel-inner');
        const dots = el.querySelectorAll('.carousel-dot');
        let startX = 0;

        el.addEventListener('touchstart', e => {
            startX = e.touches[0].clientX;
            e.stopPropagation();
        }, { passive: true });

        el.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) < 20) return;
            const imgs = inner.querySelectorAll('img');
            let idx = parseInt(el.dataset.idx) || 0;
            if (dx < 0 && idx < imgs.length - 1) idx++;
            else if (dx > 0 && idx > 0) idx--;
            el.dataset.idx = idx;
            inner.style.transform = `translateX(-${idx * 100}%)`;
            dots.forEach((d, i) => d.classList.toggle('active', i === idx));
            e.stopPropagation();
        }, { passive: true });
    });
}

// ============================================================
// SHARED PRODUCT DETAIL HELPERS
// ============================================================
function renderDetailHeader(product) {
    return `
        <div class="detail-header">
            <div style="flex:1;min-width:0;">
                <div class="detail-sku">${escapeHtml(product.sku)}</div>
                <div class="detail-name">${escapeHtml(product.name)}</div>
                <div class="detail-manufacturer">${escapeHtml(product.manufacturer_name || t('unknown_mfr'))}</div>
            </div>
            <div class="product-qty">
                <div class="qty-num ${qtyClass(product.qty, product.reorder_level)}">${product.qty}</div>
                <div class="qty-label">${t('in_stock')}</div>
            </div>
        </div>`;
}

function renderDetailGrid(product) {
    const isAdmin = state.userRole === 'admin';
    const yearRange = (product.model_year_start || product.model_year_end)
        ? `${product.model_year_start || '?'} - ${product.model_year_end || '?'}`
        : 'N/A';
    return `
        <div class="detail-grid">
            <div class="detail-row">
                <div class="detail-field">
                    <label>${t('category')}</label>
                    <div class="field-value">${product.category_icon || ''} ${escapeHtml(product.category_name || 'N/A')}</div>
                </div>
                <div class="detail-field">
                    <label>${t('location')}</label>
                    <div class="field-value">${escapeHtml(product.location || 'N/A')}</div>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-field">
                    <label>${t('selling_price')}</label>
                    <div class="field-value">${formatCurrency(product.selling_price)}</div>
                </div>
                ${isAdmin ? `
                <div class="detail-field buying-price-field" data-price="${formatCurrency(product.cost)}" onclick="toggleBuyingPrice(this)">
                    <label>${t('buying_price')}</label>
                    <div class="price-masked" data-visible="0">••••••</div>
                    <div class="price-reveal">${t('tap_reveal')}</div>
                </div>` : `
                <div class="detail-field">
                    <label>${t('reorder_level')}</label>
                    <div class="field-value">${product.reorder_level || 'N/A'}</div>
                </div>`}
            </div>
            <div class="detail-row">
                <div class="detail-field">
                    <label>${t('model_years')}</label>
                    <div class="field-value">${yearRange}</div>
                </div>
                <div class="detail-field">
                    <label>${t('mfr_code')}</label>
                    <div class="field-value">${escapeHtml(product.manufacturer_code || 'N/A')}</div>
                </div>
            </div>
        </div>`;
}
