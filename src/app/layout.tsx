import { Inter } from 'next/font/google'
import './globals.css'
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BeautyPOS | Makeup Shop Management',
  description: 'Production-ready POS and Inventory system for makeup shops.',
}

import { Toaster } from 'sonner'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </LanguageProvider>
      </body>
    </html>
  )
}
