import type React from "react"
import type { Metadata } from "next"
// 1. Import Poppins dari Google Fonts
import { Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
// Import Toaster untuk notifikasi keren
import { Toaster } from "sonner"

// 2. Konfigurasi Poppins
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
})

// Metadata diperbarui: Menghapus semua referensi icons dan apple-icon
export const metadata: Metadata = {
  title: "POS Core - Sistem Kasir Modern",
  description: "Sistem Point of Sale lengkap untuk restoran dan cafe",
  generator: "v0.app",
  icons: {
    icon: [], // Mengosongkan ikon untuk menghilangkan logo v0/lainnya
    apple: [], // Mengosongkan ikon perangkat Apple
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      {/* 3. Terapkan class poppins di body */}
      <body className={`${poppins.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Konfigurasi Toaster */}
          <Toaster
            position="top-center"
            richColors
            expand={false}
            closeButton
            theme="system"
          />

          <Sidebar />
          <div className="lg:pl-64 transition-all duration-300">
            {children}
          </div>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}