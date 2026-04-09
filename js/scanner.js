// ============================================================
// BARCODE SCANNER
// ============================================================

// List video devices using native browser API (no ZXing dependency)
async function listVideoDevices() {
    // Briefly open a stream to trigger permission prompt and unlock device labels,
    // then immediately stop all tracks so ZXing can open the camera cleanly.
    let stream = null;
    try { stream = await navigator.mediaDevices.getUserMedia({ video: true }); } catch (e) { /* surfaces in caller */ }
    if (stream) stream.getTracks().forEach(t => t.stop());
    // Small delay to ensure camera is fully released before ZXing grabs it
    await new Promise(r => setTimeout(r, 300));
    const all = await navigator.mediaDevices.enumerateDevices();
    return all.filter(d => d.kind === 'videoinput');
}

async function startScanner() {
    if (state.scannerActive) return;

    const statusEl = $('scanner-status');
    statusEl.textContent = 'Initializing camera...';

    try {
        if (typeof ZXing === 'undefined') {
            statusEl.textContent = 'Scanner library not loaded';
            return;
        }

        if (!window.isSecureContext) {
            statusEl.textContent = 'Camera requires HTTPS. Open via Vercel, not file://';
            return;
        }

        // Pre-check permission state without triggering a prompt
        if (navigator.permissions) {
            const perm = await navigator.permissions.query({ name: 'camera' });
            if (perm.state === 'denied') {
                statusEl.textContent = 'Camera blocked — click the lock icon in the address bar to allow, then retry.';
                $('scanner-retry-btn').style.display = 'inline-flex';
                return;
            }
        }

        const devices = await listVideoDevices();

        if (devices.length === 0) {
            statusEl.textContent = 'No camera found. Use manual input.';
            return;
        }

        // Populate camera selector if multiple cameras
        const selectRow = $('camera-select-row');
        const selectEl = $('camera-select');
        selectEl.innerHTML = '';
        devices.forEach((d, i) => {
            const opt = document.createElement('option');
            opt.value = d.deviceId;
            opt.textContent = d.label || `Camera ${i + 1}`;
            selectEl.appendChild(opt);
        });

        // Prefer back/rear camera on mobile; fall back to first (webcam on laptop)
        const backCam = devices.find(d => /back|rear|environment/i.test(d.label));
        const deviceId = backCam ? backCam.deviceId : devices[0].deviceId;
        selectEl.value = deviceId;

        if (devices.length > 1) selectRow.classList.add('visible');

        await startDecoding(deviceId, $('scanner-video'), statusEl, !!backCam);

    } catch (err) {
        console.error('Scanner error:', err);
        const msg = err.name === 'NotAllowedError'
            ? 'Camera blocked — click the lock icon in the address bar to allow, then retry.'
            : err.name === 'NotFoundError'
            ? 'No camera found. Use manual input.'
            : err.name === 'NotReadableError'
            ? 'Camera in use by another app. Close it and retry.'
            : `Camera error: ${err.message}`;
        $('scanner-status').textContent = msg;
        $('scanner-retry-btn').style.display = 'inline-flex';
    }
}

async function startDecoding(deviceId, videoEl, statusEl, hasBackCam) {
    if (!statusEl) statusEl = $('scanner-status');
    if (!videoEl) videoEl = $('scanner-video');

    // Mobile: 150ms, no TRY_HARDER (phone camera + printed barcode = easy decode).
    // Laptop: 200ms + TRY_HARDER — webcam scanning a barcode shown on a phone screen
    // is much harder (screen glare, pixel grid, low contrast), so ZXing needs to work
    // harder per frame and attempt more frequently to catch a decodable frame.
    const interval = hasBackCam ? 150 : 200;
    const hints = new Map();
    if (!hasBackCam) hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

    state.codeReader = new ZXing.BrowserMultiFormatReader(hints.size ? hints : null, interval);

    const constraints = {
        video: hasBackCam
            ? { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { deviceId: { ideal: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
    };

    let scanCooldown = false;
    state._scanCooldownRelease = () => { scanCooldown = false; };

    state.codeReader.decodeFromConstraints(constraints, videoEl, async (result, err) => {
        if (!result || scanCooldown) return;
        scanCooldown = true;

        const code = result.getText().trim();
        statusEl.textContent = `Scanned: "${code}" — looking up...`;
        showLoading();
        const product = await lookupProduct(code);
        hideLoading();
        if (product) {
            showScannedProduct(product);
        } else {
            showToast(`No product found for: "${code}"`, 'error', 'scan-not-found');
            $('manual-sku-input').value = code;
            statusEl.textContent = hasBackCam ? 'Scanning... Point at barcode' : 'Scanning... Hold barcode up to webcam';
            setTimeout(() => { scanCooldown = false; }, 2500);
        }
    });

    state.scannerActive = true;
    statusEl.textContent = hasBackCam ? 'Scanning... Point at barcode' : 'Scanning... Hold barcode up to webcam';
}

async function switchCamera(deviceId) {
    if (state.codeReader) {
        state.codeReader.reset();
        state.scannerActive = false;
    }
    const devices = await listVideoDevices();
    const hasBackCam = devices.some(d => /back|rear|environment/i.test(d.label));
    await startDecoding(deviceId, null, null, hasBackCam);
}

function stopScanner() {
    if (state.codeReader) {
        state.codeReader.reset();
        state.scannerActive = false;
    }
    $('camera-select-row').classList.remove('visible');
}

function retryScanner() {
    $('scanner-retry-btn').style.display = 'none';
    $('scanner-status').textContent = 'Initializing camera...';
    state.scannerActive = false;
    if (state.codeReader) { state.codeReader.reset(); state.codeReader = null; }
    startScanner();
}

function clearScanResult() {
    $('scan-result').style.display = 'none';
    $('scan-empty').style.display = '';
    $('manual-sku-input').value = '';
    state.selectedProduct = null;
    // Resume scanning
    state._scanCooldownRelease && state._scanCooldownRelease();
}

function showScannedProduct(product) {
    state.selectedProduct = product;
    $('scan-empty').style.display = 'none';
    $('scan-result').style.display = '';

    const isAdmin = state.userRole === 'admin';
    const canAddToCart = product.selling_price != null && product.qty > 0;
    $('scan-detail-card').innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
            <button onclick="clearScanResult()" style="background:none;border:none;color:var(--text-muted);font-size:22px;line-height:1;cursor:pointer;padding:0 2px;" title="Clear result">×</button>
        </div>
        ${renderDetailHeader(product)}
        ${renderDetailGrid(product)}
        ${product.image_url ? `<div style="margin:12px 0;"><img src="${escapeHtml(product.image_url)}" style="width:100%;border-radius:var(--radius-sm);max-height:160px;object-fit:contain;background:var(--bg-input);" loading="lazy"></div>` : ''}
        <div class="detail-actions">
            <button class="btn btn-secondary btn-sm" onclick="showCompatibility('${escapeHtml(product.sku)}')">Cross-Check</button>
            <button class="btn btn-primary btn-sm" onclick="goReceive('${escapeHtml(product.sku)}')">Receive</button>
            ${isAdmin ? `<button class="btn btn-secondary btn-sm" onclick="showAdjustModal('${escapeHtml(product.sku)}')">Adjust</button>` : ''}
            ${canAddToCart ? `<button class="btn btn-primary btn-sm" onclick="addToCart('${escapeHtml(product.sku)}')">Add to Cart</button>` : ''}
        </div>
    `;
}
