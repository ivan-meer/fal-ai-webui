import './globals.css'
import { Inter } from 'next/font/google'
import { NotificationProvider } from '@/components/common/NotificationContext'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FAL.AI Web UI',
  description: 'Web interface for FAL.AI image and video generation models',
}

export default function RootLayout({
  children,
  params: { locale = 'en' } = {},
}: {
  children: React.ReactNode,
  params?: { locale?: string }
}) {
  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NotificationProvider>
            <main className="min-h-screen">
              {children}
            </main>
        </NotificationProvider>
      </body>
    </html>
  )
}
