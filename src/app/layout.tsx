import './globals.css'
import type { Metadata } from 'next'
import { Outfit, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ['latin'], variable: '--font-heading-loaded', display: 'swap' });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body-loaded', display: 'swap' });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-numbers-loaded', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://do-ratings.com'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={cn(outfit.variable, plusJakartaSans.variable, ibmPlexMono.variable, "h-full antialiased")} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ratings-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        <link rel="icon" type="image/png" sizes="48x48" href="/ko/icon" />
        <link rel="apple-touch-icon" sizes="180x180" href="/ko/apple-icon" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B35" />
      </head>
      <body className="bg-background text-foreground min-h-screen font-sans">
        {children}
      </body>
    </html>
  )
}
