// ============================================================
// ADMIN: ADJUST INVENTORY
// ============================================================
function showAdjustModal(sku) {
    closeModal('product-modal');
    const product = state.inventory.find(p => p.sku === sku);
    if (!product) return;

    state.selectedProduct = product;
    $('adjust-current-qty').textContent = product.qty;
    $('adjust-new-qty').value = product.qty;
    $('adjust-reason').value = '';
    $('adjust-notes').value = '';
    $('adjust-modal').classList.add('active');
}

async function handleAdjust(e) {
    e.preventDefault();
    if (!db || !state.selectedProduct || state.userRole !== 'admin') return;

    const product = state.selectedProduct;
    const newQty = parseInt($('adjust-new-qty').value);
    const reason = $('adjust-reason').value;
    const notes = $('adjust-notes').value.trim();

    if (isNaN(newQty) || newQty < 0) {
        showToast('Enter a valid quantity', 'error');
        return;
    }

    if (!reason) {
        showToast('Please select a reason', 'error');
        return;
    }

    showLoading();

    try {
        const qtyBefore = product.qty;
        const quantityChange = newQty - qtyBefore;

        const { error: updateErr } = await db
            .from('inventory')
            .update({ qty: newQty })
            .eq('sku', product.sku);

        if (updateErr) throw updateErr;

        const { error: txnErr } = await db
            .from('transactions')
            .insert({
                type: 'adjusted',
                sku: product.sku,
                quantity_change: quantityChange,
                qty_before: qtyBefore,
                qty_after: newQty,
                user_email: state.user.email,
                user_action: 'manual_adjust',
                reason: reason,
                notes: notes || null,
            });

        if (txnErr) throw txnErr;

        // Update cache
        const idx = state.inventory.findIndex(p => p.sku === product.sku);
        if (idx >= 0) state.inventory[idx].qty = newQty;

        showToast(`Adjusted ${product.sku}: ${qtyBefore} → ${newQty}`, 'success');
        closeModal('adjust-modal');
        loadDashboardStats();
        loadRecentActivity();

    } catch (err) {
        console.error('Adjust error:', err);
        showToast('Failed to adjust inventory', 'error');
    }

    hideLoading();
}
