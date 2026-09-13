import type { Metadata } from "next";
import { IBM_Plex_Serif, Mona_Sans} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import Navbar from "@/components/Navbar";
import "./globals.css";
import {Toaster} from "@/components/ui/sonner";

const ibmPlexSerif = IBM_Plex_Serif({
    variable: "--font-ibm-plex-serif",
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    display: 'swap'
});

const monaSans = Mona_Sans({
    variable: '--font-mona-sans',
    subsets: ['latin'],
    display: 'swap'
})

export const metadata: Metadata = {
  title: "Bookified",
  description: "Transform your books into interactive AI conversations. Upload PDFs, and chat with your books using voice.",
  icons: {
    icon: [
      { url: "/favicon/favicon-96x96.png?v=20260913", sizes: "96x96", type: "image/png" },
      { url: "/favicon/favicon.svg?v=20260913", type: "image/svg+xml" },
    ],
    shortcut: "/favicon/favicon.ico?v=20260913",
    apple: [
      { url: "/favicon/apple-touch-icon.png?v=20260913", sizes: "180x180" },
    ],
  },
  manifest: "/favicon/site.webmanifest?v=20260913",
  appleWebApp: {
    title: "Bookified",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
        <html lang="en">
          <head>
            <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png?v=20260913" sizes="96x96" />
            <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg?v=20260913" />
            <link rel="shortcut icon" href="/favicon/favicon.ico?v=20260913" />
            <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png?v=20260913" />
            <meta name="apple-mobile-web-app-title" content="Bookified" />
            <link rel="manifest" href="/favicon/site.webmanifest?v=20260913" />
          </head>
          <body
            className={`${ibmPlexSerif.variable} ${monaSans.variable} relative font-sans antialiased`}
          >
            <Navbar />
            {children}
            <Toaster />
          </body>
        </html>
    </ClerkProvider>
  );
}
