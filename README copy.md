# StockFolio

Aplikasi manajemen portofolio saham Indonesia yang lengkap dan modern. Pantau investasi, dividen, dan analisis pasar dalam satu platform.

![StockFolio Dashboard](./screenshots/dashboard.png)

## Fitur Utama

### Dashboard
- **Ringkasan Portofolio** - Total saham, modal, nilai saat ini, dan profit/loss
- **Performa Visual** - Ring chart animasi untuk return dan nilai aset
- **Grafik Dividen Bulanan** - Bar chart interaktif dengan tooltip

![Dashboard](./screenshots/dashboard-full.png)

### Portofolio
- **Manajemen Saham** - Tambah, edit, dan hapus kepemilikan saham
- **Harga Real-time** - Integrasi dengan GoAPI untuk data harga terkini
- **Kalkulasi Otomatis** - Average price, profit/loss per saham
- **Logo Emiten** - Tampilan visual dengan logo perusahaan

![Portfolio](./screenshots/portfolio.png)

### Dividen
- **Catat Dividen** - Input dividen yang diterima per saham
- **Filter per Tahun** - Lihat riwayat dividen tahunan
- **Ringkasan Bulanan** - Total dividen per bulan
- **Statistik** - Total dividen sepanjang masa dan tahun berjalan

![Dividends](./screenshots/dividends.png)

### Transaksi
- **Riwayat Lengkap** - Semua transaksi beli dan jual
- **Filter & Pencarian** - Filter berdasarkan saham, tipe, dan tahun
- **Ringkasan** - Total pembelian, penjualan, dan net cash flow
- **Preview Otomatis** - Lihat detail saham saat input transaksi

![Transactions](./screenshots/transactions.png)

### Watchlist
- **Pantau Saham** - Tambahkan saham yang diminati
- **Target Harga** - Set target harga untuk notifikasi
- **Catatan** - Tulis alasan atau analisis singkat
- **Perbandingan** - Lihat selisih harga saat ini dengan target

![Watchlist](./screenshots/watchlist.png)

### Market
- **Data Pasar** - Informasi saham dari Bursa Efek Indonesia
- **Pencarian** - Cari saham berdasarkan kode atau nama
- **Filter Sektor** - Filter berdasarkan sektor industri
- **Detail Saham** - Harga, perubahan, volume, dan kapitalisasi pasar

![Market](./screenshots/market.png)

### Dark Mode
- **Tema Otomatis** - Mengikuti preferensi sistem
- **Toggle Manual** - Pilih tema terang atau gelap
- **Desain Konsisten** - Semua halaman mendukung dark mode

![Dark Mode](./screenshots/dark-mode.png)

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) dengan App Router
- **Runtime**: [Bun](https://bun.sh/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) dengan [Prisma ORM](https://www.prisma.io/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Language**: TypeScript
- **API Data**: [GoAPI](https://goapi.io/) untuk data saham Indonesia

## Instalasi

### Prasyarat

- [Bun](https://bun.sh/) >= 1.0
- [PostgreSQL](https://www.postgresql.org/) >= 14
- [GoAPI Key](https://goapi.io/) untuk data saham (gratis)

### Langkah-langkah

1. **Clone repository**
   ```bash
   git clone https://github.com/username/stockfolio.git
   cd stockfolio
   ```

2. **Install dependencies**
   ```bash
   cd app
   bun install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit file `.env` dan isi dengan konfigurasi Anda:
   ```env
   # Database PostgreSQL
   DATABASE_URL="postgresql://user:password@localhost:5432/stockfolio?schema=public"

   # GoAPI Key (dapatkan di https://goapi.io/)
   GOAPI_KEY="your_goapi_key_here"
   ```

4. **Setup database**
   ```bash
   bunx prisma generate
   bunx prisma db push
   ```

5. **Jalankan aplikasi**
   ```bash
   bun run dev
   ```

6. **Buka browser**

   Akses aplikasi di [http://localhost:3000](http://localhost:3000)

## Struktur Folder

```
stockfolio/
├── app/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/           # API routes
│   │   │   ├── dividends/     # Halaman dividen
│   │   │   ├── market/        # Halaman market
│   │   │   ├── portfolio/     # Halaman portofolio
│   │   │   ├── transactions/  # Halaman transaksi
│   │   │   ├── watchlist/     # Halaman watchlist
│   │   │   ├── layout.tsx     # Root layout
│   │   │   └── page.tsx       # Dashboard
│   │   ├── components/        # Reusable components
│   │   └── lib/               # Utilities & helpers
│   ├── .env.example           # Template environment
│   └── package.json
├── screenshots/               # Screenshot aplikasi
└── README.md
```

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/dashboard` | Data ringkasan dashboard |
| GET | `/api/portfolio` | Daftar portofolio |
| POST | `/api/portfolio` | Tambah saham ke portofolio |
| PUT | `/api/portfolio/[id]` | Update data saham |
| DELETE | `/api/portfolio/[id]` | Hapus saham dari portofolio |
| GET | `/api/dividends` | Daftar dividen |
| POST | `/api/dividends` | Tambah dividen |
| DELETE | `/api/dividends/[id]` | Hapus dividen |
| GET | `/api/transactions` | Riwayat transaksi |
| POST | `/api/transactions` | Tambah transaksi |
| DELETE | `/api/transactions/[id]` | Hapus transaksi |
| GET | `/api/watchlist` | Daftar watchlist |
| POST | `/api/watchlist` | Tambah ke watchlist |
| PUT | `/api/watchlist/[id]` | Update watchlist |
| DELETE | `/api/watchlist/[id]` | Hapus dari watchlist |
| GET | `/api/market` | Data pasar saham |
| GET | `/api/stock/[symbol]` | Detail saham |

## Screenshots

> **Note**: Tambahkan screenshot ke folder `screenshots/` dengan nama file sesuai yang disebutkan di atas.

Untuk menambahkan screenshot:
1. Buat folder `screenshots` di root project
2. Ambil screenshot dari aplikasi
3. Simpan dengan nama:
   - `dashboard.png` - Header screenshot
   - `dashboard-full.png` - Dashboard lengkap
   - `portfolio.png` - Halaman portofolio
   - `dividends.png` - Halaman dividen
   - `transactions.png` - Halaman transaksi
   - `watchlist.png` - Halaman watchlist
   - `market.png` - Halaman market
   - `dark-mode.png` - Tampilan dark mode

## Mendapatkan GoAPI Key

1. Kunjungi [GoAPI.io](https://goapi.io/)
2. Daftar akun gratis
3. Buka menu API Keys
4. Copy API key Anda
5. Paste ke file `.env`

GoAPI menyediakan data saham Indonesia secara gratis dengan batasan request per hari.

## Contributing

Kontribusi sangat diterima! Silakan:

1. Fork repository ini
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Kontak

Jika ada pertanyaan atau saran, silakan buat [Issue](https://github.com/username/stockfolio/issues) di repository ini.

---

**StockFolio** - Kelola portofolio sahammu dengan mudah dan modern.
