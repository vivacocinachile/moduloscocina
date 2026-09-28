import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Módulos VivaCocina',
  description: 'Biblioteca, catálogo y cocinas a medida',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
