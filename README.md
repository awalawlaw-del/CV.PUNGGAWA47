# CV.PUNGGAWA 47

Aplikasi manajemen servis AC: order, absensi, invoice, reminder WhatsApp, keuangan, dan kinerja.
Satu file (`index.html`), tanpa server dan tanpa instalasi.

## Demo

Buka halaman demo, lalu klik salah satu peran (Admin, Internal, atau Teknisi). Tidak perlu kata sandi.
Semua data adalah contoh dan hanya tersimpan di browser pengunjung.

## Pasang di GitHub Pages

1. Buat repository baru, lalu unggah `index.html` dan `README.md`.
2. Buka **Settings > Pages**.
3. Pada **Build and deployment**, pilih **Deploy from a branch**, branch `main`, folder `/ (root)`, lalu **Save**.
4. Tunggu 1 sampai 2 menit. Alamat demo: `https://NAMA-AKUN.github.io/NAMA-REPO/`
5. Tempel alamat itu di bagian **About** repository dan di bawah judul README ini.

## Akun (jika masuk manual)

| Peran | Pengguna | Kata sandi |
|---|---|---|
| Admin | admin | admin123 |
| Internal | internal | internal123 |
| Teknisi | budi, agus, dedi | teknisi123 |

## Untuk pemakaian sungguhan

- Ubah `const DEMO_OPEN=true;` menjadi `false` di `index.html` agar tombol masuk 1 klik hilang.
- Login di versi ini hanya membatasi tampilan di browser, bukan keamanan sebenarnya.
  Data pelanggan dan keuangan sungguhan perlu server dan database.
- Data tersimpan per browser dan tidak tersinkron antar perangkat.
