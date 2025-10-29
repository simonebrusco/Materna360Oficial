import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Materna360',
  description: 'Materna360',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-white text-black">{children}</body>
    </html>
  );
}
