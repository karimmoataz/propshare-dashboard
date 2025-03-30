import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '../components/auth/AuthProvider';


export const metadata: Metadata = {
  title: 'Propshare Admin Portal',
  description: 'Admin portal for PropShare',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}