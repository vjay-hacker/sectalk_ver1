import { Outfit } from 'next/font/google';
import '../styles/global.css';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata = {
  title: 'SecTalk | Secure Communication & Collaboration Platform',
  description: 'AI-enhanced secure messaging, calling, meetings, threat detection, and billing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
