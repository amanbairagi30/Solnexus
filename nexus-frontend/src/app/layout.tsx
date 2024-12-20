import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Solana AI Nexus',
  description: 'A decentralized AI agent marketplace on Solana',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>
          <div className="min-h-screen bg-gray-900 text-white">
            <nav className="bg-gray-800 p-4">
              <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-xl font-bold">
                  Nexus AI
                </Link>
                <div className="space-x-4">
                  <Link href="/dashboard" className="hover:text-gray-300">
                    Dashboard
                  </Link>
                  <Link href="/test" className="hover:text-gray-300">
                    Test Features
                  </Link>
                </div>
              </div>
            </nav>
            {children}
          </div>
        </ClientLayout>
      </body>
    </html>
  );
}
