"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingCart,
  Utensils,
  ChefHat,
  Settings,
  Menu,
  X,
  CircleDollarSign,
  Zap,
  BarChart3,
  Clock,
  Leaf
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const menuGroups = [
  {
    label: "Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/orders", label: "Pesanan", icon: ShoppingCart },
      { href: "/tables", label: "Meja", icon: Utensils },
      { href: "/kitchen", label: "Dapur", icon: ChefHat },
    ]
  },
  {
    label: "Analitik & Keuangan",
    items: [
      { href: "/insight", label: "Insight", icon: Zap },
      { href: "/profit-loss", label: "Laba Rugi", icon: BarChart3 },
      { href: "/revenue", label: "Pendapatan", icon: CircleDollarSign },
    ]
  },
  {
    label: "Operasional",
    items: [
      { href: "/shift", label: "Sistem Shift", icon: Clock },
    ]
  },
  {
    label: "Lainnya",
    items: [
      { href: "/settings", label: "Pengaturan", icon: Settings },
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white dark:bg-slate-900 border border-slate-200 shadow-sm rounded-xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5 text-[#00BA4A]" /> : <Menu className="h-5 w-5 text-[#00BA4A]" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-900 z-40 transition-transform duration-300 shadow-2xl lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full font-sans">

          {/* LOGO SECTION - KOTAK HITAM PEKAT, TEKS PUTIH */}
          <div className="p-6 pt-8">
            <div className="bg-[#1A1C1E] rounded-[1.8rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-3 -top-3 opacity-20 group-hover:scale-110 transition-transform duration-500">
                <Leaf className="h-14 w-14 text-[#00BA4A]" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-white tracking-tight leading-none relative z-10">
                Kasir<span className="text-[#00BA4A]">in</span>
              </h1>
              <p className="text-[9px] font-black text-white/60 mt-3 uppercase tracking-[0.3em] leading-none relative z-10">
                Sistem Kasir Harian
              </p>
            </div>
          </div>

          {/* Navigation with Groups */}
          <nav className="flex-1 p-6 space-y-10 overflow-y-auto custom-scrollbar pt-4 text-slate-900 dark:text-slate-100">
            {menuGroups.map((group, idx) => (
              <div key={idx} className="space-y-3">
                <p className="px-4 text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]">
                  {group.label}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                          isActive
                            ? "bg-[#00BA4A]/10 text-[#00BA4A]"
                            : "text-slate-600 dark:text-slate-400 hover:text-[#00BA4A] hover:bg-slate-50 dark:hover:bg-slate-900",
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 w-1 h-6 bg-[#00BA4A] rounded-r-full" />
                        )}
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0 transition-transform duration-300",
                          isActive ? "text-[#00BA4A]" : "text-slate-400 dark:text-slate-600 group-hover:text-[#00BA4A]"
                        )} />
                        <span className={cn(
                          "text-[13px] tracking-tight transition-colors",
                          isActive ? "font-serif text-lg font-bold italic text-[#00BA4A]" : "font-bold text-slate-700 dark:text-slate-300"
                        )}>
                          {item.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer Card - Shift Status (KOTAK HITAM PEKAT) */}
          <Link href="/shift" onClick={() => setIsOpen(false)}>
            <div className="p-6 border-t border-slate-50 dark:border-slate-900 hover:bg-[#F8FAF9] dark:hover:bg-slate-900 transition-all cursor-pointer group">
              <div className="bg-[#1A1C1E] rounded-[1.5rem] p-5 border border-white/5 group-hover:border-[#00BA4A]/50 transition-all shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 rounded-full bg-[#00BA4A] animate-pulse" />
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Shift Terdeteksi</p>
                </div>
                <p className="text-[11px] font-serif font-bold text-white text-center uppercase tracking-wider">
                  Siang <span className="text-[#00BA4A] mx-1">•</span> 08:00 - 16:00
                </p>
              </div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  )
}

// Menambahkan default export untuk mencegah error 'Element type is invalid'
export default Sidebar;