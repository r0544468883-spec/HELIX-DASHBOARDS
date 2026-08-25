import type { Metadata } from 'next';
import './globals.css';
import HelixCommandBar from '@/components/HelixCommandBar';

export const metadata: Metadata = {
  title: 'HELIX DASHBOARDS',
  description: 'פלטפורמת דשבורדים אוניברסלית לעסק — עברית-first',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        {children}
        <HelixCommandBar />
      </body>
    </html>
  );
}
