// ============================================================
// INTERNATIONALISATION  (English / Vietnamese)
// ============================================================

const TRANSLATIONS = {
    en: {
        // Auth
        subtitle:               'Warehouse Inventory',
        email_ph:               'Email',
        password_ph:            'Password',
        sign_in:                'Sign In',
        forgot_password:        'Forgot password?',
        reset_hint:             "Enter your email and we'll send a reset link.",
        send_reset:             'Send Reset Link',
        back_to_signin:         'Back to Sign In',

        // Top bar / roles
        role_admin:             'Admin',
        role_staff:             'Staff',

        // Dashboard
        stat_total_skus:        'Total SKUs',
        stat_low_stock:         'Low Stock',
        stat_today_txns:        "Today's Txns",
        stat_total_items:       'Total Items',
        recent_activity:        'Recent Activity',
        view_all:               'View All',
        dashboard_search_ph:    'Quick search SKU, name, or manufacturer code...',

        // Scan
        init_camera:            'Initializing camera...',
        retry:                  '↺ Retry',
        manual_sku_ph:          'Type SKU or manufacturer code...',
        look_up:                'Look Up',
        scan_empty:             'Scan a barcode or type a SKU to look up a product',

        // Search
        search_ph:              'Search SKU, name, manufacturer code...',
        all_categories:         'All Categories',
        all_manufacturers:      'All Manufacturers',
        all_years:              'All Years',
        low_stock_filter:       '⚠️ Low Stock',
        export_btn:             '📥 Export',
        no_products:            'No products found',

        // Receive
        back:                   'Back',
        receive_stock:          'Receive Stock',
        receive_search_ph:      'Scan or type SKU...',
        find:                   'Find',
        current_stock:          'Current Stock',
        qty_received:           'Quantity Received',
        enter_qty_ph:           'Enter quantity',
        manufacturer_if_changed:'Manufacturer (if changed)',
        no_change:              'No change',
        notes_optional:         'Notes (optional)',
        shipment_notes_ph:      'Any notes about this shipment...',
        confirm_receive:        'Confirm Receive',
        receive_empty:          'Search for a product to receive stock',

        // Activity
        activity_log:           'Activity Log',
        all_types:              'All Types',
        type_received:          'Received',
        type_adjusted:          'Adjusted',
        type_sold:              'Sold',
        type_returned:          'Returned',
        type_created:           'Created',
        type_updated:           'Updated',
        load_more:              'Load More',
        no_activity:            'No activity yet',

        // Sales
        sales_history:          'Sales History',
        sales_search_ph:        'Search by customer name or phone...',
        no_sales:               'No sales found',

        // Settings
        settings:               'Settings',
        account:                'Account',
        sign_out:               'Sign Out',
        activity_section:       'Activity',
        view_activity_log:      'View Activity Log',
        activity_desc:          'Full history of stock changes',
        sales_desc:             'Browse past orders by customer',
        receive_desc:           'Manually add incoming stock',
        app_section:            'App',
        app_name_label:         'App Name',
        version_label:          'Version',
        language_label:         'Language',

        // Nav
        nav_dashboard:          'Dashboard',
        nav_scan:               'Scan',
        nav_search:             'Search',
        nav_settings:           'Settings',

        // Cart
        cart:                   'Cart',
        cart_empty:             'Cart is empty',
        total:                  'Total',
        customer_name_ph:       'Customer name (optional)',
        phone_ph:               'Phone number (optional)',
        order_notes_ph:         'Order notes (optional)',
        clear:                  'Clear',
        checkout:               'Checkout',

        // Receipt
        receipt:                'Receipt',
        close:                  'Close',
        print:                  'Print',

        // Compat modal
        cross_compat:           'Cross-Compatibility',
        add:                    '+ Add',
        add_compat_title:       'Add Cross-Compatible SKU',
        compat_sku_ph:          'Compatible SKU (e.g. NT-1023)',
        compat_full:            'FULL — Direct replacement',
        compat_partial:         'PARTIAL — Works with limitations',
        compat_mod:             'WITH MODIFICATION — Needs changes',
        compat_note_ph:         'Note (optional)',
        save:                   'Save',

        // Adjust modal
        adjust_inventory:       'Adjust Inventory',
        new_qty:                'New Quantity',
        reason:                 'Reason',
        select_reason:          'Select reason...',
        reason_count:           'Physical count correction',
        reason_damaged:         'Damaged goods',
        reason_return:          'Customer return',
        reason_error:           'Data entry error',
        reason_other:           'Other',
        additional_details_ph:  'Additional details...',
        confirm_adjustment:     'Confirm Adjustment',

        // Excel modal
        import_export:          'Import / Export',
        export_tab:             'Export',
        import_tab:             'Import',
        columns_included:       'Columns included:',
        download_excel:         '📥 Download Excel',
        select_file:            'Select import file:',
        expected_format:        'Expected format:',
        preview_label:          'Preview (first 5 rows):',
        upload_db:              '⬆️ Upload to Database',

        // Product detail (render.js)
        category:               'Category',
        location:               'Location',
        selling_price:          'Selling Price',
        buying_price:           'Buying Price',
        reorder_level:          'Reorder Level',
        model_years:            'Model Years',
        mfr_code:               'Mfr Code',
        tap_reveal:             'Tap to reveal',
        in_stock:               'in stock',
        unknown_mfr:            'Unknown manufacturer',
        user_label:             'User:',
        reason_label:           'Reason:',
        notes_label:            'Notes:',
        mfr_changed:            'Manufacturer changed:',
        po_label:               'PO:',
        invoice_label:          'Invoice:',

        // Dynamic JS
        no_price_set:           'No selling price set for this product',
        out_of_stock:           'Out of stock',
        added_to_cart:          'added to cart',
        images_label:           'Images',
        refresh:                '↻ Refresh',
        qty_label:              'Qty:',
        sold_by:                'Sold by',
        items_label:            'item',
        items_label_pl:         'items',
    },

    vi: {
        // Auth
        subtitle:               'Quản Lý Kho Hàng',
        email_ph:               'Email',
        password_ph:            'Mật khẩu',
        sign_in:                'Đăng Nhập',
        forgot_password:        'Quên mật khẩu?',
        reset_hint:             'Nhập email, chúng tôi sẽ gửi link đặt lại mật khẩu.',
        send_reset:             'Gửi Link Đặt Lại',
        back_to_signin:         'Quay Lại Đăng Nhập',

        // Top bar / roles
        role_admin:             'Quản Lý',
        role_staff:             'Nhân Viên',

        // Dashboard
        stat_total_skus:        'Tổng Mã',
        stat_low_stock:         'Sắp Hết',
        stat_today_txns:        'GD Hôm Nay',
        stat_total_items:       'Tổng Tồn',
        recent_activity:        'Hoạt Động Gần Đây',
        view_all:               'Xem Tất Cả',
        dashboard_search_ph:    'Tìm nhanh SKU, tên, mã nhà sản xuất...',

        // Scan
        init_camera:            'Đang khởi động camera...',
        retry:                  '↺ Thử Lại',
        manual_sku_ph:          'Nhập SKU hoặc mã nhà sản xuất...',
        look_up:                'Tra Cứu',
        scan_empty:             'Quét mã vạch hoặc nhập SKU để tra cứu sản phẩm',

        // Search
        search_ph:              'Tìm SKU, tên, mã nhà sản xuất...',
        all_categories:         'Tất Cả Danh Mục',
        all_manufacturers:      'Tất Cả Nhà SX',
        all_years:              'Tất Cả Năm',
        low_stock_filter:       '⚠️ Sắp Hết',
        export_btn:             '📥 Xuất',
        no_products:            'Không tìm thấy sản phẩm',

        // Receive
        back:                   'Quay Lại',
        receive_stock:          'Nhập Hàng',
        receive_search_ph:      'Quét hoặc nhập SKU...',
        find:                   'Tìm',
        current_stock:          'Tồn Kho Hiện Tại',
        qty_received:           'Số Lượng Nhập',
        enter_qty_ph:           'Nhập số lượng',
        manufacturer_if_changed:'Nhà Sản Xuất (nếu thay đổi)',
        no_change:              'Không thay đổi',
        notes_optional:         'Ghi Chú (tùy chọn)',
        shipment_notes_ph:      'Ghi chú về lô hàng này...',
        confirm_receive:        'Xác Nhận Nhập Hàng',
        receive_empty:          'Tìm sản phẩm để nhập hàng',

        // Activity
        activity_log:           'Nhật Ký Hoạt Động',
        all_types:              'Tất Cả Loại',
        type_received:          'Nhập Hàng',
        type_adjusted:          'Điều Chỉnh',
        type_sold:              'Đã Bán',
        type_returned:          'Trả Hàng',
        type_created:           'Tạo Mới',
        type_updated:           'Cập Nhật',
        load_more:              'Tải Thêm',
        no_activity:            'Chưa có hoạt động',

        // Sales
        sales_history:          'Lịch Sử Bán Hàng',
        sales_search_ph:        'Tìm theo tên hoặc số điện thoại...',
        no_sales:               'Không có đơn hàng',

        // Settings
        settings:               'Cài Đặt',
        account:                'Tài Khoản',
        sign_out:               'Đăng Xuất',
        activity_section:       'Hoạt Động',
        view_activity_log:      'Xem Nhật Ký Hoạt Động',
        activity_desc:          'Lịch sử thay đổi tồn kho',
        sales_desc:             'Xem đơn hàng theo khách hàng',
        receive_desc:           'Nhập hàng thủ công',
        app_section:            'Ứng Dụng',
        app_name_label:         'Tên Ứng Dụng',
        version_label:          'Phiên Bản',
        language_label:         'Ngôn Ngữ',

        // Nav
        nav_dashboard:          'Tổng Quan',
        nav_scan:               'Quét',
        nav_search:             'Tìm',
        nav_settings:           'Cài Đặt',

        // Cart
        cart:                   'Giỏ Hàng',
        cart_empty:             'Giỏ hàng trống',
        total:                  'Tổng Cộng',
        customer_name_ph:       'Tên khách hàng (tùy chọn)',
        phone_ph:               'Số điện thoại (tùy chọn)',
        order_notes_ph:         'Ghi chú đơn hàng (tùy chọn)',
        clear:                  'Xóa',
        checkout:               'Thanh Toán',

        // Receipt
        receipt:                'Hóa Đơn',
        close:                  'Đóng',
        print:                  'In',

        // Compat modal
        cross_compat:           'Tương Thích Chéo',
        add:                    '+ Thêm',
        add_compat_title:       'Thêm SKU Tương Thích',
        compat_sku_ph:          'SKU tương thích (vd. NT-1023)',
        compat_full:            'HOÀN TOÀN — Thay thế trực tiếp',
        compat_partial:         'MỘT PHẦN — Dùng có giới hạn',
        compat_mod:             'CẦN CHỈNH SỬA — Phải thay đổi',
        compat_note_ph:         'Ghi chú (tùy chọn)',
        save:                   'Lưu',

        // Adjust modal
        adjust_inventory:       'Điều Chỉnh Tồn Kho',
        new_qty:                'Số Lượng Mới',
        reason:                 'Lý Do',
        select_reason:          'Chọn lý do...',
        reason_count:           'Kiểm kê thực tế',
        reason_damaged:         'Hàng hỏng',
        reason_return:          'Khách trả hàng',
        reason_error:           'Lỗi nhập liệu',
        reason_other:           'Khác',
        additional_details_ph:  'Chi tiết thêm...',
        confirm_adjustment:     'Xác Nhận Điều Chỉnh',

        // Excel modal
        import_export:          'Nhập / Xuất',
        export_tab:             'Xuất',
        import_tab:             'Nhập',
        columns_included:       'Các cột:',
        download_excel:         '📥 Tải Excel',
        select_file:            'Chọn file nhập:',
        expected_format:        'Định dạng:',
        preview_label:          'Xem trước (5 dòng đầu):',
        upload_db:              '⬆️ Tải Lên CSDL',

        // Product detail (render.js)
        category:               'Danh Mục',
        location:               'Vị Trí',
        selling_price:          'Giá Bán',
        buying_price:           'Giá Nhập',
        reorder_level:          'Mức Đặt Hàng',
        model_years:            'Năm Xe',
        mfr_code:               'Mã NSX',
        tap_reveal:             'Nhấn để xem',
        in_stock:               'tồn kho',
        unknown_mfr:            'Chưa có NSX',
        user_label:             'Người dùng:',
        reason_label:           'Lý do:',
        notes_label:            'Ghi chú:',
        mfr_changed:            'NSX thay đổi:',
        po_label:               'PO:',
        invoice_label:          'Hóa đơn:',

        // Dynamic JS
        no_price_set:           'Sản phẩm chưa có giá bán',
        out_of_stock:           'Hết hàng',
        added_to_cart:          'đã thêm vào giỏ',
        images_label:           'Hình Ảnh',
        refresh:                '↻ Làm Mới',
        qty_label:              'SL:',
        sold_by:                'Bán bởi',
        items_label:            'mặt hàng',
        items_label_pl:         'mặt hàng',
    }
};

// Current language — persisted in localStorage
let _lang = localStorage.getItem('nt_lang') || 'vi';

function t(key) {
    return (TRANSLATIONS[_lang] && TRANSLATIONS[_lang][key]) ||
           (TRANSLATIONS['en'][key]) || key;
}

function setLanguage(lang) {
    _lang = lang;
    localStorage.setItem('nt_lang', lang);
    applyI18n();
    // Refresh dynamic render areas
    if (typeof populateCategoryFilter === 'function') populateCategoryFilter();
    if (typeof populateManufacturerFilter === 'function') populateManufacturerFilter();
    if (typeof populateYearFilter === 'function') populateYearFilter();
    if (typeof renderCartItems === 'function') renderCartItems();
    // Highlight active lang button
    document.querySelectorAll('.lang-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.lang === lang));
}

function applyI18n() {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    // Placeholder attributes
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPh);
    });
}
