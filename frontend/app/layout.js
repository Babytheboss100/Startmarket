import './globals.css';
export const metadata = { title: 'StartMarket – Handel av unoterte aksjer', description: 'Norges markedsplass for kjøp og salg av unoterte aksjer' };
export default function RootLayout({ children }) {
  return <html lang="no"><body>{children}</body></html>;
}
