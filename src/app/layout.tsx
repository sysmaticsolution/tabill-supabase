import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/components/auth-provider';
import PwaInstaller from '@/components/pwa-installer';

export const metadata: Metadata = {
  title: 'Tabill',
  description: 'A streamlined restaurant management system for menus, tables, and billing.',
  icons: {
    icon: [
      { url: '/icons/icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png?v=2', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192.png?v=2' },
    ],
  },
  themeColor: '#0f172a',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png?v=2" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Tabill" />
      </head>
      <body className={cn('font-body antialiased min-h-screen')}>
        <AuthProvider>
          {children}
          <Toaster />
          <PwaInstaller />
        </AuthProvider>
      </body>
    </html>
  );
}
