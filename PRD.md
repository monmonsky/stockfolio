# Product Requirements Document (PRD)
# Aplikasi Tracking Saham & Dividen

## 1. Ringkasan Produk

### 1.1 Nama Produk
**Stock Portfolio Tracker**

### 1.2 Tujuan
Aplikasi untuk melacak portofolio saham pribadi, menghitung keuntungan/kerugian (profit/loss), serta mencatat dan menampilkan informasi dividen yang diterima.

### 1.3 Target Pengguna
Investor retail yang ingin memantau performa investasi saham mereka secara sederhana dan terorganisir.

---

## 2. Fitur Utama

### 2.1 Manajemen Portofolio Saham

| Fitur | Deskripsi |
|-------|-----------|
| Tambah Saham | Input kode saham, jumlah lot, harga beli, tanggal beli |
| Edit Transaksi | Ubah data transaksi yang sudah ada |
| Hapus Transaksi | Hapus transaksi dari portofolio |
| Lihat Portofolio | Tampilkan semua saham yang dimiliki |

**Data yang disimpan per transaksi:**
- Kode saham (contoh: BBCA, TLKM, ASII)
- Nama emiten
- Jumlah lot (1 lot = 100 lembar)
- Harga beli per lembar
- Tanggal pembelian
- Biaya transaksi (fee broker)

### 2.2 Tracking Profit/Loss

| Metrik | Perhitungan |
|--------|-------------|
| Harga Beli Total | (Harga beli x Jumlah lembar) + Fee |
| Nilai Saat Ini | Harga saat ini x Jumlah lembar |
| Profit/Loss (Rp) | Nilai Saat Ini - Harga Beli Total |
| Profit/Loss (%) | ((Nilai Saat Ini - Harga Beli Total) / Harga Beli Total) x 100% |

**Tampilan:**
- Warna hijau untuk profit
- Warna merah untuk loss
- Summary total portofolio

### 2.3 Tracking Dividen

| Fitur | Deskripsi |
|-------|-----------|
| Input Dividen | Catat dividen yang diterima |
| Histori Dividen | Lihat semua dividen per saham |
| Kalender Dividen | Tampilan dividen per bulan |
| Total Dividen | Jumlah total dividen yang diterima |

**Data dividen yang disimpan:**
- Kode saham
- Jumlah dividen per lembar
- Total dividen diterima
- Tanggal cum date
- Tanggal payment
- Bulan/tahun penerimaan

---

## 3. User Stories

### 3.1 Sebagai Investor, saya ingin:

1. **Menambah saham baru ke portofolio**
   > "Saya membeli 10 lot BBCA di harga Rp 9.500 pada tanggal 15 Januari 2025"

2. **Melihat apakah saham saya untung atau rugi**
   > "Berapa profit/loss saya untuk saham BBCA yang saya beli?"

3. **Mencatat dividen yang saya terima**
   > "Saya menerima dividen BBCA sebesar Rp 250 per lembar pada bulan April 2025"

4. **Melihat total dividen per bulan**
   > "Berapa total dividen yang saya terima di bulan April 2025?"

5. **Melihat ringkasan portofolio**
   > "Berapa total nilai portofolio saya dan berapa total profit/loss?"

---

## 4. Data Model

### 4.1 Tabel: `stocks` (Transaksi Saham)

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| id | INTEGER | Primary key |
| stock_code | VARCHAR(10) | Kode saham (BBCA, TLKM) |
| stock_name | VARCHAR(100) | Nama emiten |
| lot_quantity | INTEGER | Jumlah lot |
| buy_price | DECIMAL | Harga beli per lembar |
| buy_date | DATE | Tanggal pembelian |
| broker_fee | DECIMAL | Biaya broker |
| current_price | DECIMAL | Harga saat ini (update manual/API) |
| created_at | TIMESTAMP | Waktu dibuat |
| updated_at | TIMESTAMP | Waktu diupdate |

### 4.2 Tabel: `dividends` (Dividen)

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| id | INTEGER | Primary key |
| stock_id | INTEGER | Foreign key ke stocks |
| stock_code | VARCHAR(10) | Kode saham |
| dividend_per_share | DECIMAL | Dividen per lembar |
| total_shares | INTEGER | Jumlah lembar saat itu |
| total_dividend | DECIMAL | Total dividen diterima |
| cum_date | DATE | Cum date |
| payment_date | DATE | Tanggal pembayaran |
| payment_month | INTEGER | Bulan pembayaran (1-12) |
| payment_year | INTEGER | Tahun pembayaran |
| created_at | TIMESTAMP | Waktu dibuat |

---

## 5. Wireframe / UI Layout

### 5.1 Halaman Dashboard
```
┌─────────────────────────────────────────────────────┐
│                 STOCK PORTFOLIO TRACKER             │
├─────────────────────────────────────────────────────┤
│  Total Nilai Portofolio: Rp 150.000.000            │
│  Total Modal: Rp 120.000.000                        │
│  Total Profit/Loss: Rp +30.000.000 (+25%)  [HIJAU] │
│  Total Dividen Diterima: Rp 5.000.000              │
├─────────────────────────────────────────────────────┤
│  [+ Tambah Saham]  [+ Tambah Dividen]              │
└─────────────────────────────────────────────────────┘
```

### 5.2 Halaman Daftar Portofolio
```
┌──────────────────────────────────────────────────────────────────┐
│ PORTOFOLIO SAYA                                                  │
├────────┬───────┬──────────┬────────────┬────────────┬───────────┤
│ Kode   │ Lot   │ Avg Buy  │ Nilai Skrg │ Profit/Loss│ Action    │
├────────┼───────┼──────────┼────────────┼────────────┼───────────┤
│ BBCA   │ 10    │ 9.500    │ 10.200     │ +7.37%     │ [Edit][X] │
│ TLKM   │ 20    │ 3.800    │ 3.500      │ -7.89%     │ [Edit][X] │
│ ASII   │ 15    │ 5.200    │ 5.500      │ +5.77%     │ [Edit][X] │
└────────┴───────┴──────────┴────────────┴────────────┴───────────┘
```

### 5.3 Halaman Dividen
```
┌──────────────────────────────────────────────────────────────────┐
│ DIVIDEN SAYA                                                     │
├──────────────────────────────────────────────────────────────────┤
│ Filter: [2025 ▼] [Semua Bulan ▼]                                │
├────────┬────────────┬───────────┬────────────┬──────────────────┤
│ Kode   │ Div/Lembar │ Jml Lembar│ Total      │ Bulan Terima     │
├────────┼────────────┼───────────┼────────────┼──────────────────┤
│ BBCA   │ Rp 250     │ 1.000     │ Rp 250.000 │ April 2025       │
│ TLKM   │ Rp 150     │ 2.000     │ Rp 300.000 │ Mei 2025         │
│ ASII   │ Rp 200     │ 1.500     │ Rp 300.000 │ Juni 2025        │
├────────┴────────────┴───────────┼────────────┼──────────────────┤
│                          TOTAL: │ Rp 850.000 │                  │
└─────────────────────────────────┴────────────┴──────────────────┘

RINGKASAN DIVIDEN PER BULAN:
┌─────────────┬────────────┐
│ Bulan       │ Total      │
├─────────────┼────────────┤
│ April 2025  │ Rp 250.000 │
│ Mei 2025    │ Rp 300.000 │
│ Juni 2025   │ Rp 300.000 │
└─────────────┴────────────┘
```

---

## 6. Teknologi yang Direkomendasikan

### 6.1 Opsi 1: Web App (Sederhana)
| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript (atau React/Vue) |
| Backend | Node.js / Python Flask |
| Database | SQLite / PostgreSQL |
| Hosting | Vercel / Railway / Local |

### 6.2 Opsi 2: Desktop App
| Layer | Teknologi |
|-------|-----------|
| Framework | Electron / Tauri |
| Frontend | React / Vue |
| Database | SQLite (local) |

### 6.3 Opsi 3: Spreadsheet Based
| Tool | Keterangan |
|------|------------|
| Google Sheets | Dengan Google Apps Script untuk automasi |
| Excel | Dengan VBA macro |

---

## 7. MVP (Minimum Viable Product)

Fitur yang harus ada di versi pertama:

- [x] Input transaksi beli saham
- [x] Lihat daftar portofolio
- [x] Update harga saham saat ini (manual)
- [x] Hitung profit/loss per saham
- [x] Hitung total profit/loss portofolio
- [x] Input dividen yang diterima
- [x] Lihat histori dividen
- [x] Filter dividen per bulan/tahun
- [x] Total dividen per bulan

---

## 8. Fitur Tambahan (Future Enhancement)

| Prioritas | Fitur |
|-----------|-------|
| Medium | Integrasi API harga saham real-time (IDX) |
| Medium | Export laporan ke PDF/Excel |
| Medium | Grafik performa portofolio |
| Low | Notifikasi jadwal dividen |
| Low | Perbandingan dengan IHSG |
| Low | Multi-currency support |

---

## 9. Success Metrics

| Metrik | Target |
|--------|--------|
| User dapat input saham | < 1 menit per transaksi |
| User dapat melihat P/L | Real-time setelah update harga |
| User dapat input dividen | < 30 detik per entry |
| Data tersimpan dengan aman | 100% data integrity |

---

## 10. Timeline Pengembangan (Fase)

### Fase 1: Core Features
- Setup project dan database
- CRUD transaksi saham
- Perhitungan profit/loss

### Fase 2: Dividend Tracking
- CRUD dividen
- Filter dan summary dividen
- Laporan bulanan dividen

### Fase 3: Enhancement
- Dashboard dengan visualisasi
- Export data
- Optimisasi UI/UX

---

## 11. Risiko dan Mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Harga saham tidak akurat | Update manual atau integrasi API |
| Data hilang | Backup berkala, cloud storage |
| Perhitungan salah | Unit testing, validasi formula |

---

## Catatan

Dokumen ini adalah versi awal PRD. Dapat direvisi sesuai kebutuhan dan feedback dari user.

**Dibuat:** 28 Desember 2025
**Versi:** 1.0
