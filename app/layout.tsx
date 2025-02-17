import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Daily Brief',
  description: 'Created by Saeedreza',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
      <Analytics />
    </html>
  )
}
