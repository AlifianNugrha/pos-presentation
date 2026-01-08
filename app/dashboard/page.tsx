"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import {
  Settings, RefreshCw, UtensilsCrossed,
  ClipboardList, ChevronRight,
  ArrowUpRight, Target
} from "lucide-react"

export default function DashboardPage() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hourlyData, setHourlyData] = useState<{ hour: string; total: number; percentage: number }[]>([])

  const [stats, setStats] = useState({
    restaurantName: "Memuat...",
    revenue: 0,
    transactions: 0,
    avgBill: 0,
    lastSync: "--:--"
  })

  // FUNGSI BARU: Ambil Nama Restoran dari Metadata Auth
  const fetchUserMetadata = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.user_metadata?.restaurant_name) {
      return user.user_metadata.restaurant_name
    }
    return "Warung Berkah" // Fallback
  }

  const fetchStats = async () => {
    setIsSyncing(true)
    try {
      const dynamicName = await fetchUserMetadata()

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
        restaurantName: dynamicName,
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
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-[#00BA4A]/30 font-sans">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-[#00BA4A]/5 rounded-full blur-3xl" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-[#FF5700]/5 rounded-full blur-3xl" />
      </div>

      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#1A1C1E] p-2.5 rounded-xl shadow-xl shadow-slate-200 dark:shadow-none">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold tracking-tight text-slate-900 dark:text-white uppercase">Kasir<span className="text-[#00BA4A]">in</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stats.restaurantName} • Live</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={fetchStats} disabled={isSyncing} className="rounded-full hover:bg-slate-100">
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : "text-[#00BA4A]"}`} />
            </Button>
            <ModeToggle />
            <Link href="/settings">
              <Button size="sm" className="bg-[#1A1C1E] hover:bg-black text-white rounded-full px-6 transition-all hover:shadow-[0_10px_20px_-5px_rgba(26,28,30,0.4)] dark:shadow-none">
                <Settings className="h-4 w-4 mr-2 text-[#00BA4A]" /> Pengaturan
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-8 border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2.5rem] relative overflow-hidden group transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00BA4A]/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-[#00BA4A]/10 px-3 py-1 rounded-full mb-4">
                <span className="w-2 h-2 rounded-full bg-[#00BA4A] animate-pulse" />
                <p className="text-[10px] font-bold text-[#00BA4A] uppercase tracking-widest">Pendapatan Hari Ini</p>
              </div>
              <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                Rp {stats.revenue.toLocaleString("id-ID")}
              </h2>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2.5rem] relative overflow-hidden group transition-all">
            <div className="relative">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Total Pesanan</p>
              <h2 className="text-4xl font-serif font-bold text-slate-900 dark:text-white uppercase leading-none">
                {stats.transactions} <span className="text-lg font-sans font-medium text-slate-400">Struk</span>
              </h2>
              <div className="mt-4 flex items-center text-[#FF5700] text-[10px] font-bold bg-[#FF5700]/10 w-fit px-3 py-1 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-1" /> AKTIVITAS TINGGI
              </div>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2.5rem]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Rata-rata Transaksi</p>
            <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-slate-200 leading-tight">
              Rp {Math.round(stats.avgBill).toLocaleString("id-ID")}
            </h2>
            <div className="mt-4 flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <Target className="h-3 w-3 text-[#00BA4A]" /> Sinkron: {stats.lastSync}
            </div>
          </Card>
        </div>

        {/* Analytics Section */}
        <Card className="relative p-10 border-none shadow-2xl bg-[#1A1C1E] dark:bg-slate-900 rounded-[3rem] overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }} />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-2xl text-white tracking-tight uppercase">
                  Analitik <span className="text-[#00BA4A]">Performa</span>
                </h3>
                <p className="text-sm text-slate-400 font-medium">Data transaksi real-time berdasarkan waktu operasional</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/10">
                <span className="text-[10px] font-bold text-[#00BA4A] uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00BA4A] animate-ping" /> Sistem Terkoneksi
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between h-64 gap-3 sm:gap-6 px-2">
              {hourlyData.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end">
                  <div className="relative w-full flex flex-col justify-end h-full max-w-[60px]">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#00BA4A] text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10 font-bold whitespace-nowrap shadow-lg">
                      Rp {data.total.toLocaleString("id-ID")}
                    </div>
                    <div className="w-full bg-white/5 rounded-t-2xl overflow-hidden relative h-full transition-all group-hover:bg-white/10">
                      <div
                        className="absolute bottom-0 w-full bg-[#00BA4A] transition-all duration-1000 ease-in-out group-hover:brightness-125"
                        style={{ height: `${data.percentage}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    {data.hour}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Quick Links Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
          <Link href="/orders" className="block group">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm hover:shadow-[0_10px_40px_-10px_rgba(0,186,74,0.4)] hover:-translate-y-1 transition-all border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="h-16 w-16 bg-[#00BA4A] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-100 dark:shadow-none transition-transform group-hover:scale-105">
                  <UtensilsCrossed className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 dark:text-white text-xl uppercase tracking-tight">Mulai Pesanan</h3>
                  <p className="text-sm text-slate-400 mt-1">Buka panel kasir / POS harian</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-[#FF5700] group-hover:text-white transition-all shadow-inner">
                <ChevronRight className="h-6 w-6" />
              </div>
            </div>
          </Link>

          <Link href="/kitchen" className="block group">
            <div className="bg-[#1A1C1E] p-8 rounded-[2.5rem] shadow-xl hover:shadow-[0_10px_40px_-10px_rgba(255,87,0,0.3)] hover:-translate-y-1 transition-all border-none flex items-center justify-between text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
              <div className="flex items-center gap-8 relative z-10">
                <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-[#00BA4A] border border-white/10 transition-transform group-hover:scale-105">
                  <ClipboardList className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-white text-xl uppercase tracking-tight">Monitor Dapur</h3>
                  <p className="text-sm text-slate-400 mt-1">Lihat antrean pesanan masuk</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-[#FF5700] group-hover:text-white transition-all border border-white/5 relative z-10">
                <ChevronRight className="h-6 w-6" />
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}