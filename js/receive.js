// ============================================================
// RECEIVE STOCK
// ============================================================
function goReceive(sku) {
    closeModal('product-modal');
    state.receiveFromSku = sku || null;
    state.receiveFromScreen = state.currentScreen || 'scan';
    $('receive-search').value = sku;
    switchScreen('receive');
    lookupForReceive(sku);
}

function receiveBack() {
    const returnScreen = state.receiveFromScreen || 'scan';
    const returnSku = state.receiveFromSku;
    switchScreen(returnScreen);
    if (returnSku) openProductDetail(returnSku);
}

async function lookupForReceive(query) {
    if (!query) return;

    showLoading();
    const product = await lookupProduct(query);
    hideLoading();

    if (!product) {
        showToast('Product not found', 'error');
        $('receive-product-info').style.display = 'none';
        $('receive-empty').style.display = '';
        return;
    }

    state.selectedProduct = product;
    $('receive-sku').textContent = product.sku;
    $('receive-name').textContent = product.name;
    $('receive-manufacturer').textContent = product.manufacturer_name || 'Unknown manufacturer';
    $('receive-current-qty').textContent = product.qty;
    $('receive-qty').value = '';
    $('receive-notes').value = '';
    $('receive-manufacturer-select').value = '';
    $('receive-product-info').style.display = '';
    $('receive-empty').style.display = 'none';
}

async function handleReceive(e) {
    e.preventDefault();
    if (!db || !state.selectedProduct) return;

    const product = state.selectedProduct;
    const receivedQty = parseInt($('receive-qty').value);
    const newManufacturerId = $('receive-manufacturer-select').value;
    const notes = $('receive-notes').value.trim();

    if (!receivedQty || receivedQty < 1) {
        showToast('Enter a valid quantity', 'error');
        return;
    }

    const btn = $('receive-confirm-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    const qtyBefore = product.qty;
    const qtyAfter = qtyBefore + receivedQty;

    try {
        // Update inventory qty
        const updateData = { qty: qtyAfter };
        if (newManufacturerId) {
            updateData.manufacturer_id = newManufacturerId;
        }

        const { error: updateErr } = await db
            .from('inventory')
            .update(updateData)
            .eq('sku', product.sku);

        if (updateErr) throw updateErr;

        // Determine manufacturer change info
        let mfrChangedFrom = null;
        let mfrChangedTo = null;
        if (newManufacturerId && newManufacturerId !== product.manufacturer_id) {
            mfrChangedFrom = product.manufacturer_name || product.manufacturer_id;
            const newMfr = state.manufacturers.find(m => m.id === newManufacturerId);
            mfrChangedTo = newMfr ? newMfr.name : newManufacturerId;
        }

        // Log transaction
        const { error: txnErr } = await db
            .from('transactions')
            .insert({
                type: 'received',
                sku: product.sku,
                quantity_change: receivedQty,
                qty_before: qtyBefore,
                qty_after: qtyAfter,
                user_email: state.user.email,
                user_action: 'receive_stock',
                notes: notes || null,
                manufacturer_changed_from: mfrChangedFrom,
                manufacturer_changed_to: mfrChangedTo,
            });

        if (txnErr) throw txnErr;

        // Update local cache
        const idx = state.inventory.findIndex(p => p.sku === product.sku);
        if (idx >= 0) {
            state.inventory[idx].qty = qtyAfter;
            if (newManufacturerId) {
                state.inventory[idx].manufacturer_id = newManufacturerId;
            }
        }

        showToast(`Received ${receivedQty} × ${product.sku}. Stock: ${qtyAfter}`, 'success');

        // Update UI
        $('receive-current-qty').textContent = qtyAfter;
        state.selectedProduct.qty = qtyAfter;
        $('receive-qty').value = '';
        $('receive-notes').value = '';

        // Refresh dashboard stats
        loadDashboardStats();
        loadRecentActivity();

    } catch (err) {
        console.error('Receive error:', err);
        showToast('Failed to receive stock. Try again.', 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Confirm Receive';
}
