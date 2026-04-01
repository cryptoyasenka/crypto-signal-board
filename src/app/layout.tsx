import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Crypto Signal Board — Verifiable AI Signals by OpenGradient',
  description:
    'AI-powered crypto trading signals verified in a Trusted Execution Environment. 6 technical indicators + macro risk analysis by OpenGradient.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <head>
        <script
          src="https://cdn.jsdelivr.net/gh/golldyck/opengradient-brand-skill@main/og-skill.js"
          defer
        />
      </head>
      <body className="min-h-screen bg-og-navy font-sans antialiased">{children}</body>
    </html>
  );
}
