// ============================================================
// CART
// ============================================================

function addToCart(sku) {
    const product = state.inventory.find(p => p.sku === sku);
    if (!product) return;
    if (!product.selling_price) {
        showToast('No selling price set for this product', 'error');
        return;
    }

    const existing = state.cart.find(item => item.sku === sku);
    if (existing) {
        if (existing.qty >= product.qty) {
            showToast(`Only ${product.qty} in stock`, 'error');
            return;
        }
        existing.qty++;
        existing.subtotal = existing.qty * existing.selling_price;
    } else {
        if (product.qty <= 0) {
            showToast('Out of stock', 'error');
            return;
        }
        state.cart.push({
            sku: product.sku,
            name: product.name,
            qty: 1,
            selling_price: product.selling_price,
            subtotal: product.selling_price
        });
    }

    updateCartBadge();
    showToast(`${product.name} added to cart`, 'success');
}

function removeFromCart(sku) {
    state.cart = state.cart.filter(item => item.sku !== sku);
    updateCartBadge();
    renderCartItems();
}

function updateCartItemQty(sku, delta) {
    const item = state.cart.find(i => i.sku === sku);
    if (!item) return;
    const product = state.inventory.find(p => p.sku === sku);
    const maxQty = product ? product.qty : 9999;

    item.qty = Math.max(1, Math.min(item.qty + delta, maxQty));
    item.subtotal = item.qty * item.selling_price;
    updateCartBadge();
    renderCartItems();
}

function clearCart() {
    state.cart = [];
    $('cart-customer-name').value = '';
    $('cart-customer-phone').value = '';
    $('cart-order-notes').value = '';
    updateCartBadge();
    renderCartItems();
}

function updateCartBadge() {
    const count = state.cart.reduce((sum, i) => sum + i.qty, 0);
    const fab = $('cart-fab');
    const badge = $('cart-count-badge');
    if (count > 0) {
        fab.style.display = 'flex';
        badge.textContent = count > 99 ? '99+' : count;
    } else {
        fab.style.display = 'none';
    }
}

function openCartModal() {
    renderCartItems();
    $('cart-modal').classList.add('active');
}

function renderCartItems() {
    const list = $('cart-items-list');
    const empty = $('cart-empty');
    const totals = $('cart-totals');

    if (!state.cart.length) {
        list.innerHTML = '';
        empty.style.display = '';
        totals.style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    totals.style.display = '';

    const total = state.cart.reduce((sum, i) => sum + i.subtotal, 0);
    $('cart-total-amount').textContent = formatCurrency(total);

    list.innerHTML = state.cart.map(item => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
            <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    ${escapeHtml(item.name)}
                </div>
                <div style="font-size:12px;color:var(--text-secondary);">
                    ${escapeHtml(item.sku)} · ${formatCurrency(item.selling_price)} each
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                <button onclick="updateCartItemQty('${escapeHtml(item.sku)}', -1)"
                    style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border);
                           background:var(--bg-input);color:var(--text-primary);font-size:18px;
                           cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
                <span style="width:28px;text-align:center;font-weight:700;">${item.qty}</span>
                <button onclick="updateCartItemQty('${escapeHtml(item.sku)}', 1)"
                    style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border);
                           background:var(--bg-input);color:var(--text-primary);font-size:18px;
                           cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>
            </div>
            <div style="text-align:right;flex-shrink:0;min-width:64px;">
                <div style="font-weight:700;color:var(--accent);">${formatCurrency(item.subtotal)}</div>
                <button onclick="removeFromCart('${escapeHtml(item.sku)}')"
                    style="background:none;border:none;color:var(--danger);font-size:11px;cursor:pointer;padding:2px 0;">Remove</button>
            </div>
        </div>
    `).join('');
}

function generateInvoiceNumber() {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timePart = String(now.getTime()).slice(-6);
    return `INV-${datePart}-${timePart}`;
}

async function handleCheckout() {
    if (!state.cart.length) return;

    const btn = $('checkout-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    const customerName = $('cart-customer-name').value.trim();
    const customerPhone = $('cart-customer-phone').value.trim();
    const orderNotes = $('cart-order-notes').value.trim();
    const invoiceNumber = generateInvoiceNumber();
    const soldBy = state.user.email;

    // Stock pre-check
    for (const item of state.cart) {
        const live = state.inventory.find(p => p.sku === item.sku);
        if (!live || live.qty < item.qty) {
            showToast(`Insufficient stock for ${item.sku}`, 'error');
            btn.disabled = false;
            btn.textContent = 'Checkout';
            return;
        }
    }

    try {
        // Decrement inventory + insert transactions for each line item
        for (const item of state.cart) {
            const product = state.inventory.find(p => p.sku === item.sku);
            const qtyBefore = product.qty;
            const qtyAfter = qtyBefore - item.qty;

            const { error: invErr } = await db
                .from('inventory')
                .update({ qty: qtyAfter })
                .eq('sku', item.sku);
            if (invErr) throw invErr;

            const { error: txnErr } = await db.from('transactions').insert({
                type: 'sold',
                sku: item.sku,
                quantity_change: -item.qty,
                qty_before: qtyBefore,
                qty_after: qtyAfter,
                user_email: soldBy,
                user_action: 'checkout',
                invoice_number: invoiceNumber,
                notes: customerName
                    ? `Customer: ${customerName}${customerPhone ? ' / ' + customerPhone : ''}`
                    : null,
            });
            if (txnErr) throw txnErr;

            // Update local cache
            const idx = state.inventory.findIndex(p => p.sku === item.sku);
            if (idx >= 0) state.inventory[idx].qty = qtyAfter;
        }

        // Insert sales_order record
        const totalAmount = state.cart.reduce((s, i) => s + i.subtotal, 0);
        const itemCount = state.cart.reduce((s, i) => s + i.qty, 0);

        const { error: soErr } = await db.from('sales_orders').insert({
            invoice_number: invoiceNumber,
            customer_name: customerName || null,
            customer_phone: customerPhone || null,
            total_amount: totalAmount,
            item_count: itemCount,
            sold_by: soldBy,
            notes: orderNotes || null,
        });
        if (soErr) throw soErr;

        // Show receipt then clear cart
        const completedCart = [...state.cart];
        showReceipt({
            invoiceNumber,
            items: completedCart,
            totalAmount,
            customerName,
            customerPhone,
            soldBy,
            createdAt: new Date().toISOString(),
        });

        clearCart();
        closeModal('cart-modal');
        loadDashboardStats();

    } catch (err) {
        console.error('Checkout error:', err);
        showToast('Checkout failed: ' + err.message, 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Checkout';
}

// ============================================================
// RECEIPT
// ============================================================

function showReceipt(order) {
    const itemRows = order.items.map(item => `
        <tr>
            <td style="padding:6px 0;border-bottom:1px solid #eee;">
                ${escapeHtml(item.name)}<br>
                <span style="font-size:11px;color:#666;">${escapeHtml(item.sku)}</span>
            </td>
            <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
            <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.selling_price)}</td>
            <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700;">${formatCurrency(item.subtotal)}</td>
        </tr>
    `).join('');

    const dateStr = new Date(order.createdAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    $('receipt-content').innerHTML = `
        <div id="printable-receipt" style="font-family:monospace;font-size:13px;line-height:1.6;">
            <div style="text-align:center;margin-bottom:12px;">
                <div style="font-size:18px;font-weight:700;">NgocThanh Auto Parts</div>
                <div style="font-size:12px;color:var(--text-secondary);">${dateStr}</div>
                <div style="font-size:12px;margin-top:4px;">Invoice: <strong>${escapeHtml(order.invoiceNumber)}</strong></div>
                ${order.customerName ? `<div style="font-size:12px;">Customer: ${escapeHtml(order.customerName)}</div>` : ''}
                ${order.customerPhone ? `<div style="font-size:12px;">Phone: ${escapeHtml(order.customerPhone)}</div>` : ''}
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                    <tr style="font-size:11px;color:var(--text-muted);">
                        <th style="text-align:left;padding-bottom:6px;border-bottom:2px solid var(--border);">Item</th>
                        <th style="text-align:center;padding-bottom:6px;border-bottom:2px solid var(--border);">Qty</th>
                        <th style="text-align:right;padding-bottom:6px;border-bottom:2px solid var(--border);">Price</th>
                        <th style="text-align:right;padding-bottom:6px;border-bottom:2px solid var(--border);">Total</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>
            <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;
                        padding:12px 0;border-top:2px solid var(--border);margin-top:8px;">
                <span>TOTAL</span>
                <span style="color:var(--accent);">${formatCurrency(order.totalAmount)}</span>
            </div>
            <div style="font-size:11px;color:var(--text-secondary);text-align:center;margin-top:8px;">
                Sold by: ${escapeHtml(order.soldBy)}<br>
                Thank you for your business!
            </div>
        </div>
    `;
    $('receipt-modal').classList.add('active');
}

function printReceipt() {
    const content = $('printable-receipt');
    if (!content) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`
        <!DOCTYPE html><html><head>
        <title>Receipt</title>
        <style>
            body { font-family: monospace; font-size: 13px; padding: 16px; color: #000; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 5px 0; }
            th { border-bottom: 2px solid #000; font-size: 11px; }
            td { border-bottom: 1px solid #ddd; }
            @media print { body { padding: 0; } }
        </style>
        </head><body>
        ${content.innerHTML}
        </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
}
