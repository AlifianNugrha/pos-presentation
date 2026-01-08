"use client" // Tambahkan ini karena kita menggunakan usePathname

import type React from "react"
import { Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { usePathname } from "next/navigation" // Import usePathname

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  // Tentukan route mana saja yang tidak membutuhkan Sidebar
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/"

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${poppins.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster
            position="top-center"
            richColors
            expand={false}
            closeButton
            theme="system"
          />

          {/* Tampilkan Sidebar hanya jika bukan halaman Auth */}
          {!isAuthPage && <Sidebar />}

          {/* Gunakan class kondisional: 
            Jika halaman Auth, padding kiri (lg:pl-64) dihapus agar konten ke tengah 
          */}
          <div className={`${!isAuthPage ? "lg:pl-64" : ""} transition-all duration-300`}>
            {children}
          </div>

          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}