import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sistem Pergudangan Barang KDKMP Lubuk Ogung',
    short_name: 'Gudang KDKMP',
    description:
      'Aplikasi Web & PWA Manajemen Gudang KDKMP Lubuk Ogung (Sembako, Pupuk, Alat Pertanian, Hasil Tani)',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f0fdf4',
    theme_color: '#15803d',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
