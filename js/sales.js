// ============================================================
// SALES HISTORY
// ============================================================

async function loadSalesHistory(reset = false) {
    if (reset) state.salesPage = 0;

    const from = state.salesPage * state.salesPageSize;
    const to = from + state.salesPageSize - 1;

    const term = $('sales-search-input').value.trim();
    const dateFilter = $('sales-filter-date').value;

    let query = db
        .from('sales_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

    if (term) {
        // Phone: digit-only input; name: fuzzy text
        const isPhone = /^[\d\s\-\+\(\)]+$/.test(term);
        if (isPhone) {
            query = query.ilike('customer_phone', `${term}%`);
        } else {
            query = query.ilike('customer_name', `%${term}%`);
        }
    }

    if (dateFilter) {
        // dateFilter is "YYYY-MM-DD" — build range without timezone shift
        query = query
            .gte('created_at', `${dateFilter}T00:00:00.000`)
            .lte('created_at', `${dateFilter}T23:59:59.999`);
    }

    const { data, error } = await query;
    if (error) { showToast('Error loading sales', 'error'); return; }

    if (reset) $('sales-results').innerHTML = '';

    if (data && data.length) {
        renderSalesOrders(data);
        $('sales-empty').style.display = 'none';
    } else if (reset) {
        $('sales-empty').style.display = '';
    }

    $('sales-load-more').style.display =
        (data && data.length === state.salesPageSize) ? '' : 'none';
}

function renderSalesOrders(orders) {
    const container = $('sales-results');
    container.innerHTML += orders.map(order => `
        <div class="activity-item" onclick="viewSaleDetail('${escapeHtml(order.invoice_number)}')">
            <div class="activity-header">
                <span class="activity-type type-sold">sold</span>
                <span class="activity-time">${formatDate(order.created_at)}</span>
            </div>
            <div class="activity-body">
                <strong>${escapeHtml(order.invoice_number)}</strong>
                — ${formatCurrency(order.total_amount)} · ${order.item_count} item${order.item_count !== 1 ? 's' : ''}
            </div>
            ${order.customer_name || order.customer_phone ? `
            <div style="font-size:12px;color:var(--text-secondary);margin-top:3px;">
                ${order.customer_name ? escapeHtml(order.customer_name) : ''}
                ${order.customer_phone ? ' · ' + escapeHtml(order.customer_phone) : ''}
            </div>` : ''}
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
                Sold by ${escapeHtml(order.sold_by)}
            </div>
        </div>
    `).join('');
}

async function viewSaleDetail(invoiceNumber) {
    showLoading();
    const { data: txns, error } = await db
        .from('transactions')
        .select('*')
        .eq('invoice_number', invoiceNumber)
        .eq('type', 'sold')
        .order('created_at');
    hideLoading();

    if (error || !txns) { showToast('Could not load sale details', 'error'); return; }

    // Reconstruct order items from transaction rows
    const items = txns.map(txn => {
        const product = state.inventory.find(p => p.sku === txn.sku);
        const sellingPrice = product ? product.selling_price : null;
        const qty = Math.abs(txn.quantity_change);
        return {
            sku: txn.sku,
            name: product ? product.name : txn.sku,
            qty,
            selling_price: sellingPrice,
            subtotal: sellingPrice ? sellingPrice * qty : null
        };
    });

    // Pull order header from sales_orders
    const { data: soData } = await db
        .from('sales_orders')
        .select('*')
        .eq('invoice_number', invoiceNumber)
        .single();

    showReceipt({
        invoiceNumber,
        items,
        totalAmount: soData ? soData.total_amount : items.reduce((s, i) => s + (i.subtotal || 0), 0),
        customerName: soData ? soData.customer_name : null,
        customerPhone: soData ? soData.customer_phone : null,
        soldBy: txns[0] ? txns[0].user_email : '',
        createdAt: soData ? soData.created_at : (txns[0] ? txns[0].created_at : new Date().toISOString()),
    });
}
