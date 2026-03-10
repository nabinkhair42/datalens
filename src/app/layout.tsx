import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/components/providers/auth-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';

import './globals.css';
import { APP_DESCRIPTION, APP_NAME } from '@/config/constants';

const geistSans = Poppins({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: APP_DESCRIPTION,
  },
  description: 'The web-native, collaborative database IDE. Figma for your database.',
  keywords: ['database', 'sql', 'postgresql', 'mysql', 'visualization', 'ide'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
