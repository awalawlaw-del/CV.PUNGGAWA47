/* sw.js: versi tanpa cache.
   Aplikasi sekarang membutuhkan Supabase (online), jadi file tidak perlu disimpan offline.
   Service worker ini menghapus semua cache lama lalu memuat ulang halaman,
   supaya HP / browser yang masih memakai versi lama otomatis pindah ke versi terbaru. */
self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
    const wins = await self.clients.matchAll({ type: 'window' });
    wins.forEach(c => { try { c.navigate(c.url); } catch (e) {} });
  })());
});

/* Tidak ada handler 'fetch': semua permintaan langsung ke jaringan. */
