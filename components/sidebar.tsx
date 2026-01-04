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
  Clock
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
        className="fixed top-4 left-4 z-50 lg:hidden bg-card border border-border shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full font-[family-name:var(--font-poppins)]">

          {/* LOGO SECTION - NAMA DIUBAH MENJADI KASIRIN */}
          <div className="p-4 pt-6">
            <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-5 border border-blue-500 shadow-lg shadow-blue-500/20">
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                Kasirin
              </h1>
              <p className="text-[10px] font-bold text-blue-100 mt-2 uppercase tracking-[0.2em] leading-none">
                Kasir Harian
              </p>
            </div>
          </div>

          {/* Navigation with Groups */}
          <nav className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar pt-2">
            {menuGroups.map((group, idx) => (
              <div key={idx} className="space-y-2">
                <p className="px-4 text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-[0.2em]">
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
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
                          isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/40"
                        )} />
                        <span className="font-bold text-sm tracking-tight">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer Card */}
          <Link href="/shift" onClick={() => setIsOpen(false)}>
            <div className="p-4 border-t border-sidebar-border hover:bg-sidebar-accent/30 transition-colors cursor-pointer group">
              <div className="bg-sidebar-accent/50 rounded-2xl p-4 border border-sidebar-border/50 group-hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black text-sidebar-accent-foreground uppercase tracking-[0.2em]">Shift Aktif</p>
                </div>
                <p className="text-xs font-black text-sidebar-foreground/80 text-center uppercase">Siang (08:00 - 16:00)</p>
              </div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  )
} 