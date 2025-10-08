import CadaClientPage from './CadaClientPage';

export const metadata = {
  title: 'CADA Token — AXPT.io',
  description: 'Unlock sacred access to the 2025 Miami Art Basel gathering.',
  openGraph: {
    title: 'CADA Token — AXPT.io',
    description: 'Unlock sacred access to the 2025 Miami Art Basel gathering.',
    url: 'https://axpt.io/cada',
    siteName: 'AXPT.io',
    images: [
      {
        url: 'https://axpt.io/images/heros/cada-hero.jpg',
        width: 1200,
        height: 600,
        alt: 'CADA Token Preview',
      },
    ],
    type: 'website',
  },
};

export default function CadaPage() {
  return <CadaClientPage />;
}