import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster as SonnerToaster } from 'sonner'
import { OrganizationProvider } from '@/components/providers/organization-provider'
import './globals.css'

const _inter = Inter({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'AKAAI CORE - Engine of Excellence',
  description: 'O futuro não é algo que se espera. É algo que se instancia. A singularidade aplicada ao seu modelo de negócio.',
  generator: 'v0.app',
  keywords: ['AKAAI CORE', 'singularidade', 'IA', 'Fire Protection', 'AgroFlow', 'DanceFlow', 'tecnologia'],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body className="font-sans antialiased tracking-tight">
        <OrganizationProvider>
          {children}
          <SonnerToaster position="top-right" richColors />
        </OrganizationProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
