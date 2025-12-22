import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Waves } from '@/components/waves';

export const metadata: Metadata = {
  title: 'AgroLens AI',
  description: 'Professional, high-end React web application for farmers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <Waves />
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
