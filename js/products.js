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

const DRIVE_IMG_CACHE_PREFIX = 'nt_drive_imgs_';

async function fetchDriveImages(sku) {
    // 1. In-memory cache (fastest — within same session)
    if (state.driveImageCache[sku] !== undefined) return state.driveImageCache[sku];

    // 2. localStorage cache (survives page reload, same TTL as folder index)
    try {
        const cached = JSON.parse(localStorage.getItem(DRIVE_IMG_CACHE_PREFIX + sku) || 'null');
        if (cached && (Date.now() - cached.ts) < DRIVE_CACHE_TTL) {
            state.driveImageCache[sku] = cached.imgs;
            return cached.imgs;
        }
    } catch (_) {}

    const folderId = state.driveFolderIndex && state.driveFolderIndex[sku];
    if (!folderId || !CONFIG.DRIVE_API_KEY) {
        state.driveImageCache[sku] = [];
        return [];
    }

    // 3. Fetch from Drive API
    try {
        const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
        const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType)&pageSize=100&key=${CONFIG.DRIVE_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) { state.driveImageCache[sku] = []; return []; }
        const { files } = await res.json();
        const imgs = files
            .filter(f => IMAGE_MIMES.includes(f.mimeType))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(f => ({ image_url: `https://drive.google.com/uc?export=view&id=${f.id}`, image_title: f.name }));
        state.driveImageCache[sku] = imgs;
        localStorage.setItem(DRIVE_IMG_CACHE_PREFIX + sku, JSON.stringify({ ts: Date.now(), imgs }));
        return imgs;
    } catch (err) {
        console.warn('Drive image fetch failed:', err.message);
        state.driveImageCache[sku] = [];
        return [];
    }
}

async function loadProductImages(sku, containerId = 'modal-images') {
    // 1. Google Drive images (live, auto-updates when Drive folder changes)
    const driveImgs = await fetchDriveImages(sku);

    // 2. Supabase product_images table
    let dbImgs = [];
    if (db) {
        const { data } = await db
            .from('product_images')
            .select('*')
            .eq('sku', sku)
            .order('is_primary', { ascending: false });
        dbImgs = data || [];
    }

    const allImgs = [...driveImgs, ...dbImgs];

    const refreshBtn = CONFIG.DRIVE_FOLDER_ID
        ? `<button onclick="refreshDriveImages('${escapeHtml(sku)}')"
               style="background:none;border:none;color:var(--text-muted);font-size:12px;cursor:pointer;padding:0;margin-left:8px;">
               ↻ Refresh
           </button>`
        : '';

    const cameraTile = `<label class="img-thumb img-thumb--add" title="Take / upload photo">
        <span>📷</span><input type="file" accept="image/*" capture="environment" style="display:none;"
                 onchange="uploadProductImage(event,'${escapeHtml(sku)}','${escapeHtml(containerId)}')">
    </label>`;

    const container = $(containerId);
    let html = `<div style="margin-top:16px;">
        <div style="display:flex;align-items:center;gap:4px;">
            <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;">Images</label>
            ${refreshBtn}
        </div>
        <div class="image-gallery">`;
    allImgs.forEach((img, i) => {
        html += `<div class="img-thumb" style="cursor:zoom-in;" onclick='openLightbox(${JSON.stringify(allImgs)},${i})'>
            <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.image_title || '')}" loading="lazy">
        </div>`;
    });
    html += cameraTile;
    html += '</div></div>';
    container.innerHTML = html;
}

async function refreshDriveImages(sku) {
    // Clear both caches for this SKU so fetchDriveImages hits the API
    delete state.driveImageCache[sku];
    try { localStorage.removeItem(DRIVE_IMG_CACHE_PREFIX + sku); } catch (_) {}
    await loadProductImages(sku);
}

// Resize an image File to fit within maxPx on the longest side, returning a JPEG Blob
function resizeImage(file, maxPx = 1200) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
                'image/jpeg', 0.82);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
        img.src = url;
    });
}

async function uploadProductImage(event, sku, containerId) {
    const file = event.target.files[0];
    if (!file || !db) return;

    // Reset input so the same file can be selected again if needed
    event.target.value = '';

    showToast('Resizing image...', 'info');

    let blob;
    try {
        blob = await resizeImage(file);
    } catch (err) {
        console.warn('Resize failed, using original:', err);
        blob = file;
    }

    const filename = `${sku}/${Date.now()}.jpg`;

    showToast('Uploading image...', 'info');

    try {
        // Upload to Supabase Storage bucket "product-images"
        const { error: upErr } = await db.storage
            .from('product-images')
            .upload(filename, blob, { upsert: false, contentType: 'image/jpeg' });

        if (upErr) throw upErr;

        // Get public URL
        const { data: urlData } = db.storage
            .from('product-images')
            .getPublicUrl(filename);

        const publicUrl = urlData.publicUrl;

        // Save to product_images table
        const { error: insErr } = await db
            .from('product_images')
            .insert({ sku, image_url: publicUrl, image_title: file.name.replace(/\.[^.]+$/, '.jpg'), uploaded_by: state.user.email });

        if (insErr) throw insErr;

        showToast('Image uploaded', 'success');
        // Reload images section to show the new photo
        await loadProductImages(sku, containerId);

    } catch (err) {
        console.error('Upload failed:', err);
        showToast('Upload failed: ' + err.message, 'error');
    }
}

// ============================================================
// LIGHTBOX
// ============================================================
let _lbImgs = [];
let _lbIdx  = 0;

function initLightbox() {
    let startX = 0;
    const onStart = e => { startX = (e.touches ? e.touches[0] : e).clientX; };
    const onEnd   = e => {
        const dx = (e.changedTouches ? e.changedTouches[0] : e).clientX - startX;
        if (Math.abs(dx) > 40) lightboxGo(dx < 0 ? 1 : -1);
    };
    $('lightbox-close').onclick = closeLightbox;
    $('lightbox-prev').onclick  = () => lightboxGo(-1);
    $('lightbox-next').onclick  = () => lightboxGo(1);
    $('lightbox').addEventListener('touchstart', onStart, { passive: true });
    $('lightbox').addEventListener('touchend',   onEnd,   { passive: true });
    $('lightbox').addEventListener('mousedown',  onStart);
    $('lightbox').addEventListener('mouseup',    onEnd);
}

function openLightbox(imgs, startIdx) {
    _lbImgs = imgs;
    _lbIdx  = startIdx;
    _lbRender();
    $('lightbox').classList.add('active');
    document.addEventListener('keydown', _lbKeydown);
}

function closeLightbox() {
    $('lightbox').classList.remove('active');
    document.removeEventListener('keydown', _lbKeydown);
}

function lightboxGo(delta) {
    const next = _lbIdx + delta;
    if (next < 0 || next >= _lbImgs.length) return;
    _lbIdx = next;
    _lbRender();
}

function _lbRender() {
    const img  = $('lightbox-img');
    const prev = $('lightbox-prev');
    const next = $('lightbox-next');
    const dots = $('lightbox-dots');

    img.src = _lbImgs[_lbIdx].image_url;
    img.alt = _lbImgs[_lbIdx].image_title || '';
    $('lightbox-caption').textContent = _lbImgs[_lbIdx].image_title || '';
    prev.disabled = _lbIdx === 0;
    next.disabled = _lbIdx === _lbImgs.length - 1;
    prev.style.display = _lbImgs.length > 1 ? '' : 'none';
    next.style.display = _lbImgs.length > 1 ? '' : 'none';
    dots.innerHTML = _lbImgs.length > 1
        ? _lbImgs.map((_, i) => `<span class="carousel-dot${i === _lbIdx ? ' active' : ''}"></span>`).join('')
        : '';
}

function _lbKeydown(e) {
    if (e.key === 'ArrowLeft')  lightboxGo(-1);
    if (e.key === 'ArrowRight') lightboxGo(1);
    if (e.key === 'Escape')     closeLightbox();
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
            <div class="compat-item" style="cursor:pointer;" onclick="closeModal('compat-modal');openProductDetail('${escapeHtml(otherSku)}')">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong style="color:var(--accent);">${escapeHtml(otherSku)} →</strong>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="compat-level ${levelClass}">${item.compatibility_level}</span>
                        ${isAdmin ? `<button onclick="event.stopPropagation();deleteCompat('${item.id}')" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:2px 4px;font-size:18px;line-height:1;" title="Remove">×</button>` : ''}
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
