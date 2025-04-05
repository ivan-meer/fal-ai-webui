import './globals.css'
import { Inter } from 'next/font/google'
import { NotificationProvider } from '@/components/common/NotificationContext'
import { ThemeProvider } from '@/context/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

/**
 * Основной layout приложения.
 * Обеспечивает:
 * - Глобальные стили и шрифты
 * - Провайдеры тем и уведомлений
 * - Адаптивную цветовую схему
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <ThemeProvider>
          <NotificationProvider>
            {/* Основной контент с динамическими классами темы */}
            <main className="min-h-screen transition-colors duration-300 dark:bg-gray-900 dark:text-white light:bg-white light:text-gray-900">
              {children}
            </main>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
