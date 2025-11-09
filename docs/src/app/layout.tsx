import './global.css'

import { RootProvider } from 'fumadocs-ui/provider/next'
import type { Metadata } from 'next'
import { inter, jetbrainsMono } from '@/lib/fonts'

export const metadata: Metadata = {
  title: {
    default:
      'fast-url - High-Performance URL Builder for JavaScript & TypeScript',
    template: '%s | fast-url',
  },
  description:
    'Build correct URLs easily with fast-url. A fast, type-safe, lightweight URL building library for JavaScript and TypeScript. Modern fork of urlcat with better performance.',
  keywords: [
    'url builder',
    'urlcat',
    'url',
    'query string',
    'typescript',
    'javascript',
    'fast-url',
    'url encoding',
    'path parameters',
  ],
  authors: [
    {
      name: 'Khánh Hoàng',
      url: 'https://www.khanh.id',
    },
  ],
  creator: 'Khánh Hoàng',
  metadataBase: new URL('https://fast-url.khanh.id'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fast-url.khanh.id',
    title: 'fast-url - High-Performance URL Builder',
    description:
      'Build correct URLs easily. Fast, type-safe, lightweight URL building library for JavaScript and TypeScript.',
    siteName: 'fast-url',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'fast-url - High-Performance URL Builder',
    description:
      'Build correct URLs easily. Fast, type-safe, lightweight URL building library for JavaScript and TypeScript.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      lang='en'
      suppressHydrationWarning
    >
      <body className='flex flex-col min-h-screen'>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
