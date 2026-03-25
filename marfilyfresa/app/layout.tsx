import type { Metadata } from 'next'
import { DM_Serif_Display, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ShopProvider } from '@/context/shop-context'
import './globals.css'

const dmSerifDisplay = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'MarfilYFresa 🍓 | Joyería colorida y divertida',
  description: 'Joyería colorida y única para chicas jóvenes. Anillos, collares, pulseras y pendientes que te hacen sonreír.',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${dmSans.variable} ${dmSerifDisplay.variable} font-sans antialiased`}>
        <ShopProvider>
          {children}
        </ShopProvider>
        <Analytics />
      </body>
    </html>
  )
}
