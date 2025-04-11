import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'pwaudio',
        id: "pwaudio",
        short_name: 'pwaudio',
        description: 'Progressive Web Audio',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: '/pwaudio/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/pwaudio/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}