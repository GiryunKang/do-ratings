import './globals.css'
import { Outfit, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-mono', display: 'swap' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html className={cn(outfit.variable, plusJakartaSans.variable, ibmPlexMono.variable, "h-full antialiased")} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="48x48" href="/ko/icon" />
        <link rel="apple-touch-icon" sizes="180x180" href="/ko/apple-icon" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B35" />
      </head>
      <body className="bg-background text-foreground min-h-screen overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  )
}
