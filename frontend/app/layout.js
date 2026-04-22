import { headers } from 'next/headers';
import './globals.css';
import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import TenantWrapper from '../components/TenantWrapper';
import { resolveTenant } from '../lib/tenant';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });

export const metadata = {
  title: 'BREEDZ Marketplace – Handel av unoterte aksjer',
  description: 'BREEDZ Marketplace — Norges markedsplass for kjøp og salg av unoterte aksjer.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png'
  },
  openGraph: {
    title: 'BREEDZ Marketplace – Handel av unoterte aksjer',
    description: 'Norges markedsplass for kjøp og salg av unoterte aksjer.',
    images: ['/breedz-logo.png']
  }
};

export default function RootLayout({ children }) {
  const h = headers();
  const tenant = resolveTenant({ host: h.get('host') });
  return (
    <html lang="no" data-tenant={tenant.id} className={`${jakarta.variable} ${playfair.variable}`}>
      <body>
        <TenantWrapper initialId={tenant.id}>{children}</TenantWrapper>
      </body>
    </html>
  );
}
