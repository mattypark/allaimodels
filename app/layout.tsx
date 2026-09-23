import type { Metadata } from 'next';
import { allFontVariables } from '@/lib/fonts/registry';
import SmoothScroll from '@/components/SmoothScroll';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import './globals.css';

const title = 'allaimodels — every model, and the source for every number';
const description =
  'A tracked index of every frontier AI lab and model: benchmarks, pricing, context windows and launch videos, with the source and date behind each figure.';

export const metadata: Metadata = {
  metadataBase: new URL('https://allaimodels.vercel.app'),
  title: { default: title, template: '%s — allaimodels' },
  description,
  openGraph: { title, description, type: 'website', siteName: 'allaimodels' },
  twitter: { card: 'summary_large_image', title, description },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={allFontVariables}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <SmoothScroll />
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
