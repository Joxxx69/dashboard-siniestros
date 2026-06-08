import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AppProviders } from '@/providers/app-providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Siniestros Agropecuarios',
  description: 'Dashboard de seguimiento de siniestros agropecuarios',
}

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
