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
  title: {
    default: "Bookified — Turn Any Book into an Interactive AI Voice Conversation",
    template: "%s | Bookified",
  },
  description:
    "Don't just read books — talk with them. Bookified transforms your PDFs into living, interactive AI reading companions with real-time voice synthesis, chapter intelligence, and instant conversational insights.",
  authors: [
    {
      name: "Nisarg Jayesh Delvadiya",
      url: "https://github.com/NisargDelvadiya",
    },
  ],
  creator: "Nisarg Jayesh Delvadiya",
  publisher: "Nisarg Jayesh Delvadiya",
  keywords: [
    "Bookified",
    "AI Book Companion",
    "Interactive Reading",
    "Voice AI",
    "Conversational AI",
    "PDF to Voice",
    "ElevenLabs",
    "Vapi AI",
    "Next.js 16",
    "Smart Library",
    "AI Study Assistant",
    "Real-time Voice Chat",
    "Audiobooks",
    "Nisarg Delvadiya",
    "Nisarg Jayesh Delvadiya",
  ],
  openGraph: {
    title: "Bookified — Turn Any Book into an Interactive AI Voice Conversation",
    description:
      "Don't just read books — talk with them. Transform your PDFs into real-time interactive voice conversations.",
    url: "https://bookified.vercel.app",
    siteName: "Bookified",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bookified — Turn Any Book into an Interactive AI Voice Conversation",
    description:
      "Don't just read books — talk with them. Transform your PDFs into real-time interactive voice conversations.",
    creator: "@NisargDelvadiya",
  },
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
    <ClerkProvider
      publishableKey={
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
        "pk_test_Y2xlcmsuYm9va2lmaWVkLmRldmVsJA"
      }
    >
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
