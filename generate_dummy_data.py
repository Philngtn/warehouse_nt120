"""
Generate a dummy inventory Excel file with 20 Vietnamese automotive parts.
Output file is named NgocThanh_DD_MM_YYYY_IN.xlsx so it can be imported
directly via the Import tab in the app.

Usage:
    python3 generate_dummy_data.py

Requires:
    pip install openpyxl
"""

import openpyxl
from datetime import date

PRODUCTS = [
    # SKU, Name, Manufacturer, Mfr Code, Category, Qty, Location,
    # Selling Price, Cost, Reorder Level, Reorder Qty,
    # Model Year Start, Model Year End, Description, Discontinued
    (
        "NT-001", "Lọc Dầu Động Cơ", "Denso", "DO-1001",
        "Lọc", 45, "A1",
        35000, 22000, 5, 10,
        2010, 2023,
        "Lọc dầu động cơ tiêu chuẩn, phù hợp nhiều dòng xe Toyota và Vios",
        False
    ),
    (
        "NT-002", "Lọc Gió Động Cơ", "Denso", "DO-1002",
        "Lọc", 38, "A2",
        55000, 34000, 5, 10,
        2012, 2023,
        "Lọc gió động cơ hiệu suất cao, giúp động cơ hoạt động ổn định",
        False
    ),
    (
        "NT-003", "Lọc Nhiên Liệu", "Bosch", "BO-F301",
        "Lọc", 22, "A3",
        85000, 52000, 4, 8,
        2008, 2020,
        "Lọc nhiên liệu Bosch, loại bỏ tạp chất bảo vệ kim phun",
        False
    ),
    (
        "NT-004", "Bugi Iridium", "NGK", "NGK-IR4",
        "Điện", 60, "B1",
        120000, 75000, 8, 16,
        2010, 2024,
        "Bugi iridium NGK, tuổi thọ cao, khởi động tốt trong thời tiết ẩm",
        False
    ),
    (
        "NT-005", "Dây Curoa Cam", "Gates", "GT-C500",
        "Dây Đai", 15, "C1",
        320000, 195000, 3, 6,
        2008, 2018,
        "Dây curoa cam Gates, nên thay mỗi 60.000 km",
        False
    ),
    (
        "NT-006", "Má Phanh Trước", "Brembo", "BR-F210",
        "Phanh", 28, "D1",
        280000, 170000, 4, 8,
        2012, 2023,
        "Má phanh đĩa trước Brembo, chất liệu ceramic giảm bụi và tiếng kêu",
        False
    ),
    (
        "NT-007", "Má Phanh Sau", "Brembo", "BR-R210",
        "Phanh", 24, "D2",
        250000, 150000, 4, 8,
        2012, 2023,
        "Má phanh đĩa sau Brembo phù hợp với Vios, Altis, Camry",
        False
    ),
    (
        "NT-008", "Đĩa Phanh Trước", "Toyota", "TY-8001",
        "Phanh", 12, "D3",
        850000, 520000, 2, 4,
        2014, 2023,
        "Đĩa phanh trước chính hãng Toyota, tản nhiệt tốt",
        False
    ),
    (
        "NT-009", "Bố Thắng Trống Sau", "Akebono", "AK-S500",
        "Phanh", 18, "D4",
        180000, 108000, 4, 8,
        2008, 2019,
        "Bố thắng trống sau Akebono, dùng cho xe có phanh tang trống phía sau",
        False
    ),
    (
        "NT-010", "Ắc Quy 45Ah", "GS Yuasa", "GS-45B24",
        "Điện", 8, "E1",
        1350000, 850000, 2, 4,
        2010, 2024,
        "Ắc quy GS Yuasa 12V 45Ah, bảo hành 12 tháng",
        False
    ),
    (
        "NT-011", "Bơm Nước Làm Mát", "Aisin", "AI-WP03",
        "Làm Mát", 10, "F1",
        650000, 400000, 2, 4,
        2008, 2020,
        "Bơm nước làm mát Aisin, nên thay cùng dây curoa cam",
        False
    ),
    (
        "NT-012", "Két Nước Làm Mát", "Denso", "DO-RAD02",
        "Làm Mát", 5, "F2",
        1800000, 1100000, 1, 2,
        2012, 2022,
        "Két nước nhôm Denso, hiệu quả làm mát cao",
        False
    ),
    (
        "NT-013", "Ron Nắp Máy", "Fel-Pro", "FP-HG01",
        "Động Cơ", 7, "G1",
        420000, 260000, 2, 4,
        2008, 2020,
        "Gioăng nắp máy Fel-Pro, chịu nhiệt cao, không rò rỉ",
        False
    ),
    (
        "NT-014", "Bạc Đạn Bánh Xe Trước", "NSK", "NSK-WB01",
        "Hệ Thống Treo", 14, "H1",
        380000, 230000, 3, 6,
        2010, 2023,
        "Bạc đạn bánh xe trước NSK, chống nước và bụi tốt",
        False
    ),
    (
        "NT-015", "Giảm Xóc Trước", "KYB", "KYB-F330",
        "Hệ Thống Treo", 8, "H2",
        1200000, 750000, 2, 4,
        2012, 2023,
        "Giảm xóc trước KYB dạng ống khí, êm ái và bền bỉ",
        False
    ),
    (
        "NT-016", "Giảm Xóc Sau", "KYB", "KYB-R330",
        "Hệ Thống Treo", 8, "H3",
        1100000, 680000, 2, 4,
        2012, 2023,
        "Giảm xóc sau KYB phù hợp Vios, Yaris, Altis",
        False
    ),
    (
        "NT-017", "Thanh Ổn Định Trước", "Toyota", "TY-ARB01",
        "Hệ Thống Treo", 6, "H4",
        450000, 280000, 2, 4,
        2014, 2022,
        "Cao su thanh ổn định trước, giảm lắc ngang khi vào cua",
        False
    ),
    (
        "NT-018", "Dầu Phanh DOT4", "Bosch", "BO-BF04",
        "Phanh", 30, "D5",
        65000, 38000, 6, 12,
        2000, 2024,
        "Dầu phanh Bosch DOT4, điểm sôi cao, thay mỗi 2 năm hoặc 40.000 km",
        False
    ),
    (
        "NT-019", "Dầu Hộp Số Tự Động ATF", "Toyota", "TY-ATF04",
        "Dầu & Nhớt", 20, "I1",
        185000, 112000, 4, 8,
        2010, 2024,
        "Dầu hộp số tự động Toyota WS, chuyên dùng cho hộp số Toyota",
        False
    ),
    (
        "NT-020", "Nến Sấy Diesel", "Bosch", "BO-GP01",
        "Điện", 16, "B2",
        220000, 135000, 4, 8,
        2010, 2022,
        "Nến sấy Bosch cho động cơ diesel, giúp khởi động dễ khi trời lạnh",
        False
    ),
]

COLUMNS = [
    "SKU", "Name", "Manufacturer", "Manufacturer Code", "Category",
    "Qty", "Location", "Selling Price", "Cost",
    "Reorder Level", "Reorder Qty",
    "Model Year Start", "Model Year End",
    "Description", "Discontinued"
]

def main():
    today = date.today()
    filename = f"NgocThanh_{today.day:02d}_{today.month:02d}_{today.year}_IN.xlsx"

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Inventory"

    # Header row
    ws.append(COLUMNS)

    # Data rows
    for p in PRODUCTS:
        row = list(p)
        row[-1] = "TRUE" if row[-1] else "FALSE"   # Discontinued → string
        ws.append(row)

    # Auto-width columns
    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        ws.column_dimensions[col[0].column_letter].width = min(max_len + 4, 50)

    wb.save(filename)
    print(f"✓ Generated {filename}  ({len(PRODUCTS)} products)")
    print(f"  Import via: Settings → Excel icon → Import tab")

if __name__ == "__main__":
    main()
