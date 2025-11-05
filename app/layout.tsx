import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Materna360',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-[linear-gradient(180deg,#ffe9f0_0%,#ffffff_80%)] text-slate-800 antialiased">
        <div className="mx-auto max-w-screen-md px-3 pt-4 pb-24">
          {children}
        </div>
      </body>
    </html>
  );
}
