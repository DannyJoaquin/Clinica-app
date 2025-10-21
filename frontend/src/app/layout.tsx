import './globals.css';
import type { Metadata } from 'next';
import AppShell from './_components/AppShell';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'Clínica Médica',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const t = localStorage.getItem('theme'); const d = t ? (t === 'dark') : window.matchMedia('(prefers-color-scheme: dark)').matches; const root = document.documentElement; if (d) root.classList.add('dark'); else root.classList.remove('dark'); } catch (e) {} })();`,
          }}
        />
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
