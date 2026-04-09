// ============================================================
// PRODUCT LOOKUP (used by scan + manual)
// ============================================================
async function lookupProduct(query) {
    if (!query) return null;

    const q = query.trim().toLowerCase();

    // Search local cache first (same data source as manual search)
    const inv = state.inventory || [];

    // 1. Exact SKU (case-insensitive)
    let match = inv.find(p => p.sku && p.sku.toLowerCase() === q);
    if (match) return match;

    // 2. Exact manufacturer code (case-insensitive)
    match = inv.find(p => p.manufacturer_code && p.manufacturer_code.toLowerCase() === q);
    if (match) return match;

    // 3. Name contains
    const nameMatches = inv.filter(p => p.name && p.name.toLowerCase().includes(q));
    if (nameMatches.length === 1) return nameMatches[0];
    if (nameMatches.length > 1) {
        $('search-input').value = query.trim();
        switchScreen('search');
        performSearch();
        return null;
    }

    // 4. Fallback: hit DB directly (in case cache is stale)
    if (!db) return null;
    const viewName = state.userRole === 'admin' ? 'inventory_admin_view' : 'inventory_staff_view';
    const { data } = await db
        .from(viewName)
        .select('*')
        .ilike('sku', query.trim())
        .eq('is_active', true)
        .limit(1);
    if (data && data.length) return data[0];

    return null;
}

// ============================================================
// PRODUCT DETAIL MODAL
// ============================================================
async function openProductDetail(sku) {
    const product = state.inventory.find(p => p.sku === sku);
    if (!product) return;

    state.selectedProduct = product;
    const isAdmin = state.userRole === 'admin';
    const canAddToCart = product.selling_price != null && product.qty > 0;

    let html = `<div class="detail-card">
        ${renderDetailHeader(product)}
        ${renderDetailGrid(product)}
        ${product.description ? `<p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">${escapeHtml(product.description)}</p>` : ''}
        ${product.is_discontinued ? '<p style="color:var(--danger);font-size:13px;font-weight:600;">⚠ This product is discontinued</p>' : ''}`;

    if (product.image_url) {
        html += `<div style="margin:12px 0;"><img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" style="width:100%;border-radius:var(--radius-sm);max-height:200px;object-fit:contain;background:var(--bg-input);" loading="lazy"></div>`;
    }

    html += `<div class="detail-actions">
        <button class="btn btn-secondary btn-sm" onclick="showCompatibility('${escapeHtml(product.sku)}')">Cross-Check</button>
        <button class="btn btn-secondary btn-sm" onclick="goReceive('${escapeHtml(product.sku)}')">Receive</button>
        ${isAdmin ? `<button class="btn btn-secondary btn-sm" onclick="showAdjustModal('${escapeHtml(product.sku)}')">Adjust</button>` : ''}
        ${canAddToCart ? `<button class="btn btn-primary btn-sm" onclick="addToCart('${escapeHtml(product.sku)}');closeModal('product-modal')">Add to Cart</button>` : ''}
    </div>
    <div id="modal-images"></div></div>`;

    $('modal-content').innerHTML = html;
    $('product-modal').classList.add('active');
    loadProductImages(product.sku);
}

async function loadProductImages(sku) {
    const localFiles = (state.localImages && state.localImages[sku]) || [];
    const localImgs = localFiles.map(f => ({
        image_url: `part_images/${encodeURIComponent(sku)}/${encodeURIComponent(f)}`,
        image_title: f
    }));

    let dbImgs = [];
    if (db) {
        const { data } = await db
            .from('product_images')
            .select('*')
            .eq('sku', sku)
            .order('is_primary', { ascending: false });
        dbImgs = data || [];
    }

    const allImgs = [...localImgs, ...dbImgs];
    if (!allImgs.length) return;

    const container = $('modal-images');
    let html = '<div style="margin-top:16px;"><label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;">Images</label><div class="image-gallery">';
    allImgs.forEach(img => {
        html += `<div class="img-thumb"><img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.image_title || '')}" loading="lazy"></div>`;
    });
    html += '</div></div>';
    container.innerHTML = html;
}

function closeModal(id) {
    $(id).classList.remove('active');
}

// ============================================================
// CROSS-COMPATIBILITY
// ============================================================
async function showCompatibility(sku) {
    closeModal('product-modal');

    if (!db) return;
    showLoading();

    const { data, error } = await db
        .from('cross_compatibility_matrix')
        .select('*')
        .or(`primary_sku.eq.${sku},compatible_sku.eq.${sku}`);

    hideLoading();

    // Store for add form
    state.compatSku = sku;

    // Show Add button for admin
    const addBtn = $('add-compat-btn');
    addBtn.style.display = state.userRole === 'admin' ? '' : 'none';
    $('add-compat-form').style.display = 'none';
    $('compat-other-sku').value = '';
    $('compat-note').value = '';
    $('compat-form-msg').style.display = 'none';

    if (error || !data || !data.length) {
        $('compat-content').innerHTML = '<div class="empty-state"><p>No cross-compatibility data yet.</p></div>';
        $('compat-modal').classList.add('active');
        return;
    }

    const isAdmin = state.userRole === 'admin';
    let html = '<div class="compat-list">';
    data.forEach(item => {
        const otherSku = item.primary_sku === sku ? item.compatible_sku : item.primary_sku;
        const levelClass = item.compatibility_level === 'FULL' ? 'compat-full'
            : item.compatibility_level === 'PARTIAL' ? 'compat-partial' : 'compat-mod';

        html += `
            <div class="compat-item">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong style="color:var(--accent);">${escapeHtml(otherSku)}</strong>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="compat-level ${levelClass}">${item.compatibility_level}</span>
                        ${isAdmin ? `<button onclick="deleteCompat('${item.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:2px 4px;font-size:18px;line-height:1;" title="Remove">×</button>` : ''}
                    </div>
                </div>
                <div style="font-size:13px;margin-top:8px;color:var(--text-secondary);">
                    ${item.car_brand_from ? `${escapeHtml(item.car_brand_from)} ${escapeHtml(item.model_from || '')}` : ''}
                    ${item.car_brand_to ? ` → ${escapeHtml(item.car_brand_to)} ${escapeHtml(item.model_to || '')}` : ''}
                    ${item.year_from ? `<br>Years: ${item.year_from} - ${item.year_to || '?'}` : ''}
                </div>
                ${item.compatibility_note ? `<div style="font-size:12px;margin-top:4px;color:var(--text-muted);">${escapeHtml(item.compatibility_note)}</div>` : ''}
                ${item.verified_by_user ? `<div style="font-size:11px;margin-top:4px;color:var(--text-muted);">Verified by ${escapeHtml(item.verified_by_user)}</div>` : ''}
            </div>
        `;
    });
    html += '</div>';

    $('compat-content').innerHTML = html;
    $('compat-modal').classList.add('active');
}

let _compatPreviewTimer = null;
function previewCompatSku(value) {
    const preview = $('compat-preview');
    clearTimeout(_compatPreviewTimer);
    if (!value.trim()) { preview.style.display = 'none'; return; }
    _compatPreviewTimer = setTimeout(() => {
        const q = value.trim().toLowerCase();
        const product = (state.inventory || []).find(p =>
            (p.sku && p.sku.toLowerCase() === q) ||
            (p.manufacturer_code && p.manufacturer_code.toLowerCase() === q)
        );
        if (product) {
            preview.style.display = 'block';
            preview.innerHTML = `
                <div style="font-size:11px;color:var(--accent);font-weight:600;letter-spacing:0.5px;margin-bottom:2px;">${escapeHtml(product.sku)}</div>
                <div style="font-size:14px;font-weight:700;margin-bottom:2px;">${escapeHtml(product.name)}</div>
                <div style="font-size:12px;color:var(--text-secondary);">${escapeHtml(product.manufacturer_name || '')}${product.category_name ? ' · ' + (product.category_icon || '') + ' ' + escapeHtml(product.category_name) : ''}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${product.location ? 'Location: ' + escapeHtml(product.location) : ''}</div>
            `;
        } else {
            preview.style.display = 'block';
            preview.innerHTML = `<div style="font-size:13px;color:var(--danger);">No product found for "${escapeHtml(value.trim())}"</div>`;
        }
    }, 300);
}

function toggleAddCompatForm() {
    const form = $('add-compat-form');
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
    $('add-compat-btn').textContent = isHidden ? '✕ Cancel' : '+ Add';
    if (!isHidden) {
        $('compat-other-sku').value = '';
        $('compat-preview').style.display = 'none';
    }
}

async function deleteCompat(id) {
    if (!confirm('Remove this compatibility entry?')) return;
    showLoading();
    const { error } = await db.from('cross_compatibility_matrix').delete().eq('id', id);
    hideLoading();
    if (error) {
        showToast('Failed to remove: ' + error.message, 'error');
    } else {
        showToast('Removed', 'success');
        await showCompatibility(state.compatSku);
    }
}

async function saveCompatibility() {
    const otherSku = $('compat-other-sku').value.trim().toUpperCase();
    const level = $('compat-level').value;
    const note = $('compat-note').value.trim();
    const msgEl = $('compat-form-msg');
    const btn = $('save-compat-btn');

    if (!otherSku) {
        msgEl.textContent = 'Compatible SKU is required';
        msgEl.style.color = 'var(--danger)';
        msgEl.style.display = 'block';
        return;
    }
    if (otherSku === state.compatSku.toUpperCase()) {
        msgEl.textContent = 'SKU cannot be compatible with itself';
        msgEl.style.color = 'var(--danger)';
        msgEl.style.display = 'block';
        return;
    }

    // Block duplicates — check both directions
    const { data: existing } = await db
        .from('cross_compatibility_matrix')
        .select('id')
        .or(`and(primary_sku.eq.${state.compatSku},compatible_sku.eq.${otherSku}),and(primary_sku.eq.${otherSku},compatible_sku.eq.${state.compatSku})`)
        .limit(1);
    if (existing && existing.length) {
        msgEl.textContent = `${otherSku} is already linked to ${state.compatSku}`;
        msgEl.style.color = 'var(--danger)';
        msgEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    const { error } = await db.from('cross_compatibility_matrix').insert({
        primary_sku: state.compatSku,
        compatible_sku: otherSku,
        compatibility_level: level,
        compatibility_note: note || null,
        verified_by_user: state.user.email,
        verified_at: new Date().toISOString()
    });

    btn.disabled = false;
    btn.textContent = 'Save';

    if (error) {
        msgEl.textContent = `✗ ${error.message}`;
        msgEl.style.color = 'var(--danger)';
    } else {
        msgEl.textContent = '✓ Saved';
        msgEl.style.color = 'var(--success)';
        $('compat-other-sku').value = '';
        $('compat-note').value = '';
        // Refresh the list
        await showCompatibility(state.compatSku);
    }
    msgEl.style.display = 'block';
}
