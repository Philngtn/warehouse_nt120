// ============================================================
// EXCEL IMPORT/EXPORT
// ============================================================
function _pad(n) { return String(n).padStart(2, '0'); }
function getDateStamp() {
    const d = new Date();
    return `${_pad(d.getDate())}_${_pad(d.getMonth() + 1)}_${d.getFullYear()}`;
}
function getDateTimeStamp() {
    const d = new Date();
    return `${getDateStamp()}_${_pad(d.getHours())}_${_pad(d.getMinutes())}`;
}

// Build workbook rows from product array (shared by export and backup)
function buildInventoryRows(products) {
    return products.map(p => ({
        'SKU': p.sku,
        'Name': p.name,
        'Manufacturer': p.manufacturer_name || '',
        'Manufacturer Code': p.manufacturer_code || '',
        'Category': p.category_name || '',
        'Qty': p.qty || 0,
        'Location': p.location || '',
        'Selling Price': p.selling_price || '',
        'Cost': p.cost || '',
        'Reorder Level': p.reorder_level || 5,
        'Reorder Qty': p.reorder_qty || 10,
        'Model Year Start': p.model_year_start || '',
        'Model Year End': p.model_year_end || '',
        'Description': p.description || '',
        'Discontinued': p.is_discontinued ? 'TRUE' : 'FALSE'
    }));
}

async function exportToExcel() {
    const btn = $('export-btn');
    const msgEl = $('export-msg');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Exporting...';
    msgEl.style.display = 'none';

    try {
        if (!db) throw new Error('Database not configured');

        // Query all active products
        const { data: products, error } = await db
            .from('inventory_admin_view')
            .select('*')
            .eq('is_active', true)
            .order('sku');

        if (error) throw error;
        if (!products || products.length === 0) {
            msgEl.textContent = 'No products to export';
            msgEl.style.color = 'var(--text-secondary)';
            msgEl.style.display = 'block';
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(buildInventoryRows(products));
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

        const fileName = `NgocThanh_${getDateTimeStamp()}_OUT.xlsx`;
        XLSX.writeFile(wb, fileName);

        msgEl.textContent = `✓ Downloaded ${products.length} products as ${fileName}`;
        msgEl.style.color = 'var(--success)';
        msgEl.style.display = 'block';
    } catch (err) {
        console.error('Export error:', err);
        msgEl.textContent = `✗ Export failed: ${err.message}`;
        msgEl.style.color = 'var(--danger)';
        msgEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '📥 Download Excel';
    }
}

async function importFromExcel() {
    const fileInput = $('import-file');
    const btn = $('import-btn');
    const msgEl = $('import-msg');
    const errorsEl = $('import-errors');

    if (!fileInput.files.length) {
        msgEl.textContent = 'Select a file first';
        msgEl.style.color = 'var(--danger)';
        msgEl.style.display = 'block';
        return;
    }

    const file = fileInput.files[0];
    if (!/^NgocThanh_\d{2}_\d{2}_\d{4}_IN\.xlsx$/i.test(file.name)) {
        msgEl.textContent = '✗ Invalid filename. Expected: NgocThanh_DD_MM_YYYY_IN.xlsx';
        msgEl.style.color = 'var(--danger)';
        msgEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving backup...';
    msgEl.style.display = 'none';
    errorsEl.style.display = 'none';
    errorsEl.innerHTML = '';

    try {
        if (!db) throw new Error('Database not configured');

        // Step 1: Export backup of current database before importing
        const { data: backupProducts, error: backupErr } = await db
            .from('inventory_admin_view')
            .select('*')
            .eq('is_active', true)
            .order('sku');
        if (backupErr) throw new Error(`Backup failed: ${backupErr.message}`);
        if (backupProducts && backupProducts.length > 0) {
            const bkWb = XLSX.utils.book_new();
            const bkWs = XLSX.utils.json_to_sheet(buildInventoryRows(backupProducts));
            XLSX.utils.book_append_sheet(bkWb, bkWs, 'Inventory');
            XLSX.writeFile(bkWb, `BackUp_NgocThanh_${getDateTimeStamp()}.xlsx`);
        }

        btn.innerHTML = '<span class="spinner"></span> Uploading...';

        const wb = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    resolve(workbook);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('File read failed'));
            reader.readAsArrayBuffer(file);
        });

        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);

        if (!rows.length) throw new Error('No data in spreadsheet');

        // Load reference data (manufacturers, categories)
        const { data: manufacturers } = await db.from('manufacturers').select('id, name');
        const { data: categories } = await db.from('product_categories').select('id, name');

        const mfgMap = new Map(manufacturers?.map(m => [m.name?.toLowerCase(), m.id]) || []);
        const catMap = new Map(categories?.map(c => [c.name?.toLowerCase(), c.id]) || []);

        const wipeMode = $('wipe-replace-chk').checked;

        // Pre-load all existing SKUs before clearing (needed for txn log)
        const { data: existingRows } = await db.from('inventory').select('sku, qty');
        const existingMap = new Map((existingRows || []).map(r => [r.sku, r.qty]));

        btn.innerHTML = '<span class="spinner"></span> Clearing old data...';
        if (wipeMode) {
            // Hard delete: permanently remove all existing inventory rows
            const { error: clearErr } = await db
                .from('inventory')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // match all rows
            if (clearErr) throw new Error(`Failed to wipe inventory: ${clearErr.message}`);
        } else {
            // Soft delete: deactivate all — Excel file is the new source of truth
            const { error: clearErr } = await db
                .from('inventory')
                .update({ is_active: false })
                .neq('id', '00000000-0000-0000-0000-000000000000'); // match all rows
            if (clearErr) throw new Error(`Failed to clear inventory: ${clearErr.message}`);
        }

        btn.innerHTML = '<span class="spinner"></span> Uploading...';
        const errors = [];
        const errorRows = [];
        let imported = 0, updated = 0, skipped = 0;
        const txnBatch = []; // Collect transactions; bulk-insert at end

        // Process each row
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // Header is row 1

            try {
                // Validate required fields
                const sku = String(row['SKU'] || '').trim();
                const name = String(row['Name'] || '').trim();

                if (!sku) {
                    errors.push(`Row ${rowNum}: SKU is required`);
                    errorRows.push({ ...row, 'Import Error': 'SKU is required' });
                    skipped++; continue;
                }
                if (!name) {
                    errors.push(`Row ${rowNum} (${sku}): Name is required`);
                    errorRows.push({ ...row, 'Import Error': 'Name is required' });
                    skipped++; continue;
                }

                // Look up or create manufacturer
                let manufacturerId = null;
                const mfgName = String(row['Manufacturer'] || '').trim();
                if (mfgName) {
                    const mfgKey = mfgName.toLowerCase();
                    if (mfgMap.has(mfgKey)) {
                        manufacturerId = mfgMap.get(mfgKey);
                    } else {
                        const { data: newMfg, error: mfgErr } = await db
                            .from('manufacturers').insert({ name: mfgName }).select();
                        if (mfgErr) {
                            const reason = `Failed to create manufacturer "${mfgName}"`;
                            errors.push(`Row ${rowNum} (${sku}): ${reason}`);
                            errorRows.push({ ...row, 'Import Error': reason });
                            skipped++; continue;
                        }
                        if (newMfg?.length) { manufacturerId = newMfg[0].id; mfgMap.set(mfgKey, manufacturerId); }
                    }
                }

                // Look up or create category (mirrors manufacturer pattern)
                let categoryId = null;
                const catName = String(row['Category'] || '').trim();
                if (catName) {
                    const catKey = catName.toLowerCase();
                    if (catMap.has(catKey)) {
                        categoryId = catMap.get(catKey);
                    } else {
                        const { data: newCat, error: catErr } = await db
                            .from('product_categories').insert({ name: catName }).select();
                        if (catErr) {
                            const reason = `Failed to create category "${catName}"`;
                            errors.push(`Row ${rowNum}: ${reason}`);
                            errorRows.push({ ...row, 'Import Error': reason });
                            skipped++;
                            continue;
                        }
                        if (newCat?.length) { categoryId = newCat[0].id; catMap.set(catKey, categoryId); }
                    }
                }

                const inventoryRow = {
                    sku,
                    name,
                    manufacturer_id: manufacturerId,
                    manufacturer_code: String(row['Manufacturer Code'] || '').trim() || null,
                    category_id: categoryId,
                    qty: parseInt(row['Qty']) || 0,
                    location: String(row['Location'] || '').trim() || null,
                    selling_price: parseFloat(row['Selling Price']) || null,
                    cost: parseFloat(row['Cost']) || null,
                    reorder_level: parseInt(row['Reorder Level']) || 5,
                    reorder_qty: parseInt(row['Reorder Qty']) || 10,
                    model_year_start: row['Model Year Start'] ? parseInt(row['Model Year Start']) : null,
                    model_year_end: row['Model Year End'] ? parseInt(row['Model Year End']) : null,
                    description: String(row['Description'] || '').trim() || null,
                    is_discontinued: String(row['Discontinued'] || '').toUpperCase() === 'TRUE',
                    is_active: true
                };

                const { error: upsertErr } = await db
                    .from('inventory').upsert(inventoryRow, { onConflict: 'sku' });
                if (upsertErr) {
                    errors.push(`Row ${rowNum} (${sku}): ${upsertErr.message}`);
                    errorRows.push({ ...row, 'Import Error': upsertErr.message });
                    skipped++; continue;
                }

                // Queue transaction log entry (bulk-inserted after the loop)
                if (existingMap.has(sku)) {
                    updated++;
                    const prevQty = existingMap.get(sku);
                    if (inventoryRow.qty !== prevQty) {
                        txnBatch.push({ type: 'updated', sku, quantity_change: inventoryRow.qty - prevQty,
                            qty_before: prevQty, qty_after: inventoryRow.qty,
                            user_email: state.user.email, user_action: 'excel_import', reason: 'Excel import' });
                    }
                } else {
                    imported++;
                    txnBatch.push({ type: 'created', sku, quantity_change: inventoryRow.qty,
                        qty_before: 0, qty_after: inventoryRow.qty,
                        user_email: state.user.email, user_action: 'excel_import', reason: 'Excel import' });
                }
            } catch (err) {
                errors.push(`Row ${rowNum}: ${err.message}`);
                errorRows.push({ ...row, 'Import Error': err.message });
                skipped++;
            }
        }

        // Bulk-insert all transaction logs in one round-trip
        if (txnBatch.length) {
            const { error: txnErr } = await db.from('transactions').insert(txnBatch);
            if (txnErr) console.warn('Transaction batch log failed:', txnErr);
        }

        // Export failed rows as Excel for easy correction and re-upload
        if (errorRows.length) {
            const errWb = XLSX.utils.book_new();
            const errWs = XLSX.utils.json_to_sheet(errorRows);
            XLSX.utils.book_append_sheet(errWb, errWs, 'Import Errors');
            XLSX.writeFile(errWb, `NgocThanh_ImportErrors_${getDateTimeStamp()}.xlsx`);
        }

        // Show results
        const totalProcessed = imported + updated;
        if (errors.length > 0) {
            errorsEl.innerHTML = errors.map(escapeHtml).join('<br>');
            errorsEl.style.display = 'block';
        }

        const skippedMsg = skipped > 0
            ? ` | <span style="color:var(--danger)">⚠ ${skipped} row(s) skipped — fix &amp; re-upload the error file</span>`
            : '';
        msgEl.innerHTML = wipeMode
            ? `✓ Wiped &amp; Imported: ${totalProcessed} products${skippedMsg}`
            : `✓ Imported: ${imported} | Updated: ${updated} | Total: ${totalProcessed}${skippedMsg}`;
        msgEl.style.color = 'var(--success)';
        msgEl.style.display = 'block';

        // Reload inventory cache
        if (totalProcessed > 0) {
            await loadInventory();
            showToast(`${totalProcessed} products processed`, 'success');
        }

        // Change button to "Upload Completed" — clicking closes the modal
        btn.disabled = false;
        btn.innerHTML = '✅ Upload Completed';
        btn.onclick = () => { closeAllModals(); btn.innerHTML = '⬆️ Upload to Database'; btn.onclick = null; };
    } catch (err) {
        console.error('Import error:', err);
        msgEl.textContent = `✗ Import failed: ${err.message}`;
        msgEl.style.color = 'var(--danger)';
        msgEl.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = '⬆️ Upload to Database';
    }
}
