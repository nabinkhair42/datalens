import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/providers/auth-provider';
import { HotkeysProvider } from '@/components/providers/hotkeys-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import './globals.css';
import { Outfit } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

import { APP_DESCRIPTION, APP_NAME } from '@/config/constants';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: APP_DESCRIPTION,
  },
  description: 'The web-native, collaborative database IDE. Figma for your database.',
  keywords: ['database', 'sql', 'postgresql', 'mysql', 'visualization', 'ide'],
  openGraph: {
    title: APP_NAME,
    description: 'The web-native, collaborative database IDE. Figma for your database.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'DataLens' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: 'The web-native, collaborative database IDE. Figma for your database.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${outfit.variable}`}>
        <ThemeProvider>
          <QueryProvider>
            <HotkeysProvider>
              <AuthProvider>{children}</AuthProvider>
            </HotkeysProvider>
          </QueryProvider>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
