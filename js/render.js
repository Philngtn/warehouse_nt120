// ============================================================
// RENDER FUNCTIONS
// ============================================================

function populateCategoryFilter() {
    const opts = ['<option value="">All Categories</option>'];
    state.categories.forEach(cat => opts.push(`<option value="${cat.id}">${escapeHtml(cat.name)}</option>`));
    $('filter-category').innerHTML = opts.join('');
}

function populateManufacturerFilter() {
    const opts = state.manufacturers.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`);
    $('filter-manufacturer').innerHTML = '<option value="">All Manufacturers</option>' + opts.join('');
    $('receive-manufacturer-select').innerHTML = '<option value="">No change</option>' + opts.join('');
}

function populateYearFilter() {
    const currentYear = new Date().getFullYear();
    const opts = ['<option value="">All Years</option>'];
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
    const cartBtn = canAddToCart
        ? `<button class="btn btn-primary btn-sm"
                style="padding:4px 10px;font-size:12px;min-height:28px;margin-top:4px;white-space:nowrap;"
                onclick="event.stopPropagation();addToCart('${escapeHtml(product.sku)}')">
                + Cart
           </button>`
        : '';

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
                ${product.selling_price != null ? `<div style="font-size:12px;color:var(--accent);font-weight:600;margin-top:2px;">${formatCurrency(product.selling_price)}</div>` : ''}
            </div>
            <div class="product-qty" style="display:flex;flex-direction:column;align-items:flex-end;">
                <div class="qty-num ${qtyClz}">${product.qty}</div>
                <div class="qty-label">in stock</div>
                ${cartBtn}
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
                ${txn.quantity_change != null ? ` — Qty: ${qtyChange} (${txn.qty_before} → ${txn.qty_after})` : ''}
            </div>
            ${productName || manufacturerName ? `
            <div style="font-size:12px;color:var(--text-secondary);margin-top:3px;padding-left:2px;">
                ${productName}${productName && manufacturerName ? ' · ' : ''}${manufacturerName}
            </div>` : ''}
            <div class="activity-detail">
                <div>User: ${escapeHtml(txn.user_email)}</div>
                ${txn.reason ? `<div>Reason: ${escapeHtml(txn.reason)}</div>` : ''}
                ${txn.notes ? `<div>Notes: ${escapeHtml(txn.notes)}</div>` : ''}
                ${txn.manufacturer_changed_from ? `<div>Manufacturer changed: ${escapeHtml(txn.manufacturer_changed_from)} → ${escapeHtml(txn.manufacturer_changed_to)}</div>` : ''}
                ${txn.po_number ? `<div>PO: ${escapeHtml(txn.po_number)}</div>` : ''}
                ${txn.invoice_number ? `<div>Invoice: ${escapeHtml(txn.invoice_number)}</div>` : ''}
            </div>
        </div>
    `;
}

function renderActivityList(items, containerId) {
    const container = $(containerId);
    if (!items.length) {
        container.innerHTML = '<div class="empty-state"><p>No activity yet</p></div>';
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
                <div class="detail-manufacturer">${escapeHtml(product.manufacturer_name || 'Unknown manufacturer')}</div>
            </div>
            <div class="product-qty">
                <div class="qty-num ${qtyClass(product.qty, product.reorder_level)}">${product.qty}</div>
                <div class="qty-label">in stock</div>
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
                    <label>Category</label>
                    <div class="field-value">${product.category_icon || ''} ${escapeHtml(product.category_name || 'N/A')}</div>
                </div>
                <div class="detail-field">
                    <label>Location</label>
                    <div class="field-value">${escapeHtml(product.location || 'N/A')}</div>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-field">
                    <label>Selling Price</label>
                    <div class="field-value">${formatCurrency(product.selling_price)}</div>
                </div>
                ${isAdmin ? `
                <div class="detail-field buying-price-field" data-price="${formatCurrency(product.cost)}" onclick="toggleBuyingPrice(this)">
                    <label>Buying Price</label>
                    <div class="price-masked" data-visible="0">••••••</div>
                    <div class="price-reveal">Tap to reveal</div>
                </div>` : `
                <div class="detail-field">
                    <label>Reorder Level</label>
                    <div class="field-value">${product.reorder_level || 'N/A'}</div>
                </div>`}
            </div>
            <div class="detail-row">
                <div class="detail-field">
                    <label>Model Years</label>
                    <div class="field-value">${yearRange}</div>
                </div>
                <div class="detail-field">
                    <label>Mfr Code</label>
                    <div class="field-value">${escapeHtml(product.manufacturer_code || 'N/A')}</div>
                </div>
            </div>
        </div>`;
}
