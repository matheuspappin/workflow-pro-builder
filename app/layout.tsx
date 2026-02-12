import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from '@/components/ui/toaster'
import { OrganizationProvider } from '@/components/providers/organization-provider'
import './globals.css'

const _inter = Inter({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Workflow AI Builder - Plataforma White-Label',
  description: 'Crie seu próprio software SaaS em minutos. Plataforma modular white-label para agências e empreendedores.',
  generator: 'v0.app',
  keywords: ['saas builder', 'white label', 'no code', 'gestao', 'AI', 'inteligencia artificial'],
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
  themeColor: '#9333ea',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <OrganizationProvider>
          {children}
          <Toaster />
        </OrganizationProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
