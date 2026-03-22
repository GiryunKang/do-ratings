import './globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="icon" type="image/png" sizes="48x48" href="/ko/icon" />
        <link rel="apple-touch-icon" sizes="180x180" href="/ko/apple-icon" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className="bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}
