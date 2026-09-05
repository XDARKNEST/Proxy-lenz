# LenzStream API Proxy

Serverless function di Vercel yang menyembunyikan URL API asli
(`https://www.sankavollerei.web.id/anime/animasu`) di belakang domain Anda
sendiri. Browser pengunjung hanya akan melihat URL proxy Anda, bukan API
aslinya.

## Cara kerja

Setiap request ke:

```
https://<domain-vercel-anda>/api/anime/animasu/<endpoint>
```

diteruskan (di sisi server, tidak terlihat oleh browser) ke:

```
https://www.sankavollerei.web.id/anime/animasu/<endpoint>
```

lalu hasilnya dikembalikan apa adanya ke pengunjung.

## Deploy

1. Upload folder ini ke GitHub (repo baru), atau jalankan `vercel` langsung
   dari folder ini via Vercel CLI.
2. Di dashboard Vercel: **Import Project** → pilih repo ini → Deploy.
   Tidak perlu framework preset khusus — cukup "Other".
3. (Opsional) Hubungkan domain kustom Anda, misalnya `api.lenzstream.my.id`,
   di tab **Domains** pada project Vercel.

## Yang perlu Anda sesuaikan sebelum deploy

Buka `api/anime/animasu/[...path].js` dan edit bagian `ALLOWED_ORIGINS`:

```js
const ALLOWED_ORIGINS = [
  "https://lenzstream.my.id",
  "https://www.lenzstream.my.id",
];
```

Tambahkan domain blogspot Anda di sini juga jika template masih di-hosting
di `*.blogspot.com`, contoh: `"https://namablog-anda.blogspot.com"`.
Domain yang tidak ada di daftar ini akan tetap bisa memanggil proxy secara
langsung (mis. lewat curl), tapi browser akan memblokir pemanggilan
lintas-origin dari domain yang tidak diizinkan berkat header CORS.

## Update di template Blogger

Di file template Anda, ubah baris:

```js
API_BASE: "https://www.sankavollerei.web.id/anime/animasu",
```

menjadi:

```js
API_BASE: "https://<domain-vercel-anda>/api/anime/animasu",
```

Karena struktur path proxy ini (`/api/anime/animasu/...`) sengaja dibuat
sama persis dengan struktur endpoint asli, seluruh kode `fetchAPI()` yang
sudah ada di template (memanggil `/popular`, `/ongoing`, `/detail/...`,
`/episode/...`, dsb.) akan tetap berfungsi tanpa perlu diubah sama sekali —
cukup ganti nilai `API_BASE` di atas.

## Catatan tentang proteksi

- Proxy ini **menyembunyikan** URL API asli dari kode client-side (view-source
  browser tidak akan menampilkannya lagi) dan membatasi domain mana saja
  yang boleh memanggilnya lewat CORS.
- Proxy ini **belum** membatasi jumlah request (rate limiting). Jika ke
  depan API asli mulai dibebani scraping/abuse lewat proxy ini, opsi
  selanjutnya: tambahkan rate limiting berbasis IP menggunakan Vercel Edge
  Config atau Upstash Redis (gratis untuk trafik kecil–menengah).
- Caching (`s-maxage=300, stale-while-revalidate=3600`) sudah aktif secara
  default untuk mengurangi beban ke API asli dan mempercepat respons.
