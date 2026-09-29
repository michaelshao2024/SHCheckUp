import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { GdprBanner } from '@/components/gdpr-banner';
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Compare Medical Checkups in Shanghai`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Shanghai health checkup',
    'medical checkup Shanghai',
    'health screening Shanghai for foreigners',
    'expat health check Shanghai',
    'Shanghai hospital international department',
    'medical escort Shanghai',
    'compare checkup packages Shanghai',
    'English-speaking hospital Shanghai',
    'executive health screening China',
  ],
  category: 'healthcare',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Compare Medical Checkups in Shanghai`,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: `${SITE_NAME} — compare medical checkup packages at Shanghai hospitals` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Compare Medical Checkups in Shanghai`,
    description: SITE_DESCRIPTION,
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} ${playfair.variable} min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <GdprBanner />
      </body>
    </html>
  );
}