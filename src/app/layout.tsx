import type { Metadata } from 'next';
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
      <head>
        {/* ✅ Add Tailwind CDN script */}
        <script src="https://cdn.tailwindcss.com"></script>

        {/* Optional: Tailwind config override */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      customBlue: '#1c61e7',
                    },
                  },
                },
              }
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
