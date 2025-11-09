import './global.css'

import { RootProvider } from 'fumadocs-ui/provider/next'
import type { Metadata } from 'next'
import { inter, jetbrainsMono } from '@/lib/fonts'

export const metadata: Metadata = {
  title: {
    default:
      'afetch - Type-Safe API Client with Schema Validation',
    template: '%s | afetch',
  },
  description:
    'Type-safe API client with schema validation using Standard Schema. Works with Zod, Valibot, ArkType, and more for building robust API clients.',
  keywords: [
    'api client',
    'fetch',
    'type-safe',
    'schema validation',
    'typescript',
    'javascript',
    'afetch',
    'standard schema',
    'zod',
    'valibot',
  ],
  authors: [
    {
      name: 'Khánh Hoàng',
      url: 'https://www.khanh.id',
    },
  ],
  creator: 'Khánh Hoàng',
  metadataBase: new URL('https://fetch.khanh.id'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fetch.khanh.id',
    title: 'afetch - Type-Safe API Client with Schema Validation',
    description:
      'Type-safe API client with schema validation using Standard Schema. Build robust API clients with full TypeScript support.',
    siteName: 'afetch',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'afetch - Type-Safe API Client',
    description:
      'Type-safe API client with schema validation using Standard Schema. Build robust API clients with full TypeScript support.',
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
