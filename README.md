# Telegram ↔ WhatsApp Bridge (TeleBridge Pro)

A fully functional, real-time bridge bot connecting Telegram to WhatsApp, written using Node.js, Next.js, Telegraf, and Baileys.

## Fitur Utama
1. **Penerusan Pesan Real-time**: Dari Telegram ke WhatsApp dan sebaliknya.
2. **Support Media Lengkap**: Teks, Gambar, Video, Voice Note, Audio, Dokumen, dan Stiker.
3. **Immersive Dashboard UI**: Memantau status koneksi, scan QR login, log engine, dan mengatur daftar mapping dari satu tempat.
4. **Auto-Download Media**: Mengunduh dan mengonversi format media jika diperlukan.
5. **Balasan (Replies) Sederhana**: Menyertakan konteks balasan asal.
6. **Error Handling & Logs**: Pencatatan aktivitas engine dan penanganan error gracefully.
7. **Mapping Chat**: Menyambungkan Chat ID Telegram tertentu dengan nomor WhatsApp menggunakan data mentah JSON (`mappings.json`).

## Prasyarat
- Node.js versi 18 atau ke atas
- Token Bot Telegram (Dapatkan dari [@BotFather](https://t.me/BotFather))
- Nomor Akun WhatsApp Aktif (Disarankan nomor sekunder)

## Cara Instalasi & Menjalankan

1. Clone repositori ini.
2. Jalankan `npm install`
3. Siapkan file `.env` berdasarkan `.env.example` dan isi token bot Anda.
   ```env
   TELEGRAM_BOT_TOKEN="TOKEN_DARI_BOTFATHER"
   ```
4. Jalankan aplikasi:
   ```bash
   npm run dev
   ```
5. Buka dashboard di browser: `http://localhost:3000`

## Menghubungkan WhatsApp
Dapatkan pengalaman langsung dengan membuka Dashboard berbasis UI Web dan scan QR Code WhatsApp Web yang muncul dari halaman utama.

## Mengatur Mapping Telegram ↔ WhatsApp
Anda bisa menggunakan command Bot Telegram secara manual atau menambahkannya langsung dari form di web dashboard UI:
- Di Web Dashboard: Masukkan Telegram Chat ID dan WhatsApp Target di panel form yang disediakan.
- Di Telegram: Ketik command `/connect 62812xxxxxx` dari grup atau chat yang ingin disambungkan.

---
**Catatan Penting**: 
Project ini menggunakan `@whiskeysockets/baileys` yang merupakan library WhatsApp Web API tidak resmi. Terdapat risiko nomor WhatsApp log out secara terpaksa jika penggunaan tidak wajar. Gunakan dengan bijak!
