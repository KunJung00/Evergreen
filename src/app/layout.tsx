import type { Metadata } from 'next';
import { IBM_Plex_Sans_Thai } from 'next/font/google';

import { ThemeProvider } from '@/components/shared/theme-provider';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';
import './globals.css';

const fontSans = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: 'SaaS starter template with a Habit Tracker feature.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={cn(fontSans.variable, 'min-h-screen bg-background font-sans antialiased')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
