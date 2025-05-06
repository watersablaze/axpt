import './styles/globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AXPT',
  description: 'Next-gen fintech + sacred technology',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* No SessionProvider here */}
        {children}
      </body>
    </html>
  );
}