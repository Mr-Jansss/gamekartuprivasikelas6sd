# 🎮 Boleh atau Jangan? - Game Edukasi Privasi Data

Game edukasi keamanan data pribadi untuk anak SD kelas 6. Anak-anak belajar membedakan informasi yang boleh dan tidak boleh dibagikan ke orang asing di internet sambil bermain dalam tim.

## 🌟 Fitur

- 🎯 10 kartu pertanyaan per ronde dengan timer 8 detik
- ❤️ Sistem nyawa (3 nyawa) dan combo bonus
- 👥 Sistem 4 kelompok/tim (Merah, Biru, Hijau, Oranye)
- 🏆 Gelar berdasarkan skor (Pemula Waspada, Penjaga Data, Agen Rahasia Super)
- 📊 Dashboard admin real-time dengan papan skor individual & tim
- 📺 Mode proyektor untuk tampilan layar besar
- 📈 Statistik pembelajaran untuk guru
- 💾 Offline mode - game tetap bisa dimainkan tanpa internet

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript vanilla (ES modules)
- **Backend**: Node.js + Express
- **Database**: MySQL 8

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```



Initialize database:

```bash
npm run init-db
```

### 3. Start Server

```bash
npm start
```

Server akan berjalan di:
- **Game**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **Simple Admin**: http://localhost:3000/simple-admin.html

## 🎮 Cara Pakai

### Untuk Guru (Admin)

1. **Login ke Dashboard**
   - Buka: http://localhost:3000/simple-admin.html (atau /admin)
   - Password: `admin123` (ubah di `.env`)

2. **Buat Sesi Game**
   - Input nama sesi (contoh: "Kelas 6A")
   - Klik "Buat Sesi"
   - Catat KODE 4 huruf yang muncul

3. **Bagikan Kode ke Siswa**
   - Tulis kode di papan/proyektor

4. **Monitor Real-time**
   - Klik "📊 Lihat" pada sesi
   - Tab "👤 Individual" - ranking per pemain
   - Tab "👥 Tim" - total skor per kelompok
   - Papan skor update otomatis tiap 3 detik

5. **Setelah Selesai**
   - Lihat statistik kartu yang paling sering salah
   - Export data ke CSV
   - Tutup sesi atau reset skor

### Untuk Siswa

1. **Buka Game**
   - http://localhost:3000

2. **Masukkan Kode Sesi**
   - Input kode 4 huruf dari guru

3. **Pilih Tim**
   - Merah, Biru, Hijau, atau Oranye

4. **Main!**
   - Jawab 10 kartu: BOLEH atau JANGAN
   - Benar: +10 poin
   - Combo 3x: +5 bonus
   - Combo 5x: +10 bonus
   - Salah: nyawa berkurang, muncul penjelasan

5. **Lihat Hasil**
   - Skor total dan gelar
   - Klik "📊 LIHAT PAPAN SKOR" untuk ranking

## 📊 Struktur Database

### Sessions
Menyimpan sesi game dengan kode unik 4 huruf

### Teams
4 tim per sesi (auto-created)

### Scores
Skor individual pemain per sesi & tim

### Card_stats
Statistik per kartu untuk analisis pembelajaran

## 🎨 Bank Soal

**BOLEH dibagikan (6 kartu):**
- Nama panggilan, Hobi favorit, Makanan favorit
- Warna favorit, Foto kucing peliharaan, Film kartun favorit

**JANGAN dibagikan (10 kartu):**
- Alamat rumah, Password, Nomor HP
- Foto seragam sekolah, Kode OTP, Lokasi live
- Nama lengkap + tanggal lahir, Nomor HP orang tua
- Foto kartu keluarga, Jadwal sekolah

Edit `public/js/cards.js` untuk menambah kartu baru.

## 🔒 Keamanan

- Password admin dengan timing-safe comparison
- Session token dengan HMAC signature
- HTTP-only, Secure cookies
- Rate limiting (20 request/menit per IP)
- Input validation & sanitization
- Prepared statements (SQL injection protection)
- XSS protection

## 📱 Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari

## 🛠️ Scripts

```bash
# Start server
npm start

# Development mode (auto-reload)
npm run dev

# Initialize/reset database
npm run init-db
```

## 📁 Struktur File

```
gameprivasi/
├── api/              # API endpoints
├── lib/              # Helper libraries (db, auth, validation)
├── public/
│   ├── css/          # Styles
│   ├── js/           # Game logic & client
│   ├── index.html    # Game page
│   ├── admin.html    # Full admin dashboard
│   └── simple-admin.html  # Simple admin (recommended)
├── scripts/          # Database init script
├── server.js         # Express server
└── package.json
```

## 🐛 Troubleshooting

### Server tidak bisa start
```bash
# Cek MySQL running
mysql -u root -pjans123

# Cek port 3000 available
# Ubah PORT di .env jika perlu
```

### Database error
```bash
# Reset database
npm run init-db
```

### Admin tidak bisa login
- Cek `ADMIN_PASSWORD` di `.env`
- Pastikan tidak ada spasi berlebih
- Default: `admin123`

### Tombol admin tidak berfungsi
- Gunakan **simple-admin.html** sebagai alternatif
- Hard refresh: Ctrl+Shift+R

## 💡 Tips

- Gunakan `simple-admin.html` untuk performa lebih stabil
- Buat sesi baru setiap kelas untuk data yang terpisah
- Export CSV untuk dokumentasi
- Lihat "Statistik Pembelajaran" untuk materi yang perlu diulang

## 📄 License

MIT License

---

Made with ❤️ for education
