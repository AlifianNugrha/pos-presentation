"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import {
  TrendingUp, DollarSign, ShoppingBag,
  Settings, RefreshCw, UtensilsCrossed,
  ClipboardList, Calendar, ChevronRight,
  ArrowUpRight, Zap
} from "lucide-react"

export default function DashboardPage() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hourlyData, setHourlyData] = useState<{ hour: string; total: number; percentage: number }[]>([])

  const [stats, setStats] = useState({
    restaurantName: "Warung Berkah",
    revenue: 0,
    transactions: 0,
    avgBill: 0,
    lastSync: "--:--"
  })

  const fetchStats = async () => {
    setIsSyncing(true)
    try {
      const savedSettings = JSON.parse(localStorage.getItem("pos_settings") || "{}")
      const restaurantName = savedSettings.restaurantName || "Warung Berkah"

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('revenue')
        .select('total_amount, created_at')
        .gte('created_at', today.toISOString())

      if (error) throw error

      const totalRev = data?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0
      const totalTrans = data?.length || 0

      const hours = ["08", "10", "12", "14", "16", "18", "20"]
      const grouped = hours.map(h => {
        const total = data
          ?.filter(d => new Date(d.created_at).getHours().toString().padStart(2, '0') === h)
          .reduce((acc, curr) => acc + curr.total_amount, 0) || 0
        return { hour: h, total }
      })

      const maxTotal = Math.max(...grouped.map(g => g.total), 1)
      const formattedHourly = grouped.map(g => ({
        hour: `${g.hour}:00`,
        total: g.total,
        percentage: (g.total / maxTotal) * 100
      }))

      setHourlyData(formattedHourly)
      setStats({
        restaurantName: restaurantName,
        revenue: totalRev,
        transactions: totalTrans,
        avgBill: totalTrans > 0 ? totalRev / totalTrans : 0,
        lastSync: new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })
      })
    } catch (err) {
      console.error("Kesalahan Sinkronisasi:", err)
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchStats()

    const channel = supabase
      .channel('revenue-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'revenue' }, () => fetchStats())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-[family-name:var(--font-poppins)]">
      <header className="border-b bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Panel Utama</h1>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{stats.restaurantName} • Sistem Live</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={fetchStats} disabled={isSyncing} className="hidden md:flex rounded-xl h-10 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
              <RefreshCw className={`h-4 w-4 mr-2 text-indigo-500 ${isSyncing ? "animate-spin" : ""}`} />
              <span className="text-xs font-bold">Sinkron</span>
            </Button>
            <ModeToggle />
            <Link href="/settings">
              <Button size="sm" className="bg-slate-900 dark:bg-white dark:text-slate-900 hover:scale-105 transition-transform text-white rounded-xl h-10 font-bold text-xs px-4 border-none">
                <Settings className="h-4 w-4 mr-2" /> Pengaturan
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* GRID METRIK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative p-6 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign className="h-16 w-16" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Pendapatan Hari Ini</p>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Rp {stats.revenue.toLocaleString("id-ID")}</h2>
              <div className="mt-4 flex items-center text-indigo-600 text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 w-fit px-3 py-1 rounded-lg">
                < Zap className="h-3 w-3 mr-1 fill-indigo-600" /> UPDATE LANGSUNG
              </div>
            </div>
          </Card>

          <Card className="relative p-6 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden group border-b-4 border-emerald-500">
            <div className="absolute -bottom-2 -right-2 p-4 opacity-5">
              <ShoppingBag className="h-20 w-20" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Pesanan</p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase">{stats.transactions} <span className="text-xs font-bold text-slate-400 ml-1">Struk</span></h2>
            <div className="mt-4 flex items-center text-emerald-600 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/30 w-fit px-3 py-1 rounded-lg">
              <ArrowUpRight className="h-3 w-3 mr-1" /> BERHASIL
            </div>
          </Card>

          <Card className="relative p-6 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-amber-600">Rata-rata Meja</p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Rp {Math.round(stats.avgBill).toLocaleString("id-ID")}</h2>
            <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Rata-rata Transaksi</p>
          </Card>

          <Card className="relative p-6 border-none shadow-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[2rem] overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-20 rotate-12">
              <RefreshCw className="h-24 w-24" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80">Sinkron Terakhir</p>
            <h2 className="text-3xl font-black tracking-tighter">{stats.lastSync}</h2>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Sistem Terhubung</span>
            </div>
          </Card>
        </div>

        {/* SEKSI ANALITIK */}
        <Card className="relative p-8 border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: `radial-gradient(#4f46e5 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight uppercase">Analitik Penjualan</h3>
                </div>
                <p className="text-sm text-slate-500 font-medium">Pelacakan performa pendapatan per jam</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Data Real-time</span>
              </div>
            </div>

            <div className="flex items-end justify-between h-72 gap-4 sm:gap-8 px-2">
              {hourlyData.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-5 group h-full justify-end">
                  <div className="relative w-full flex flex-col justify-end h-full">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-indigo-600 text-white text-[10px] px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-2 whitespace-nowrap z-10 font-black shadow-xl">
                      Rp {data.total.toLocaleString("id-ID")}
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800/40 rounded-2xl overflow-hidden relative h-full">
                      <div
                        className="absolute bottom-0 w-full bg-indigo-600 transition-all duration-1000 ease-out rounded-t-xl"
                        style={{ height: `${data.percentage}%` }}
                      >
                        <div className="w-full h-full opacity-10 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:10px_10px]" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-center font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                    {data.hour}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* AKSI CEPAT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/orders">
            <div className="group bg-white dark:bg-slate-900 p-2 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border border-slate-100 dark:border-slate-800">
              <div className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="h-20 w-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 dark:shadow-none transition-transform">
                    <UtensilsCrossed className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xl uppercase">Point of Sale</h3>
                    <p className="text-sm text-slate-500 font-medium">Buat pesanan & tagihan baru</p>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-all">
                  <ChevronRight className="h-6 w-6" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/kitchen">
            <div className="group bg-white dark:bg-slate-900 p-2 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all border border-slate-100 dark:border-slate-800">
              <div className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="h-20 w-20 bg-rose-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-rose-200 dark:shadow-none transition-transform">
                    <ClipboardList className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xl uppercase">Dapur</h3>
                    <p className="text-sm text-slate-500 font-medium">Monitor dapur waktu-nyata</p>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-all">
                  <ChevronRight className="h-6 w-6" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}