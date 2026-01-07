"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts'
import {
    ArrowLeft, Zap, Trophy, Clock,
    ChevronRight, Calendar,
    RefreshCw, BarChart3
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function InsightPage() {
    const [loading, setLoading] = useState(true)
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [chartData, setChartData] = useState<any[]>([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('revenue')
                .select('*')
                .order('created_at', { ascending: true })

            if (error) throw error
            if (data) processData(data)
        } catch (err) {
            console.error("Error:", err)
        } finally {
            setLoading(false)
        }
    }

    const processData = (data: any[]) => {
        const counts: any = {}
        const dailyData: any = {}

        data.forEach(record => {
            const date = new Date(record.created_at).toLocaleDateString('id-ID', { weekday: 'short' })
            dailyData[date] = (dailyData[date] || 0) + (record.total_amount || 0)

            const items = Array.isArray(record.items) ? record.items : []
            items.forEach((item: any) => {
                const name = item.name || item.title
                if (name) counts[name] = (counts[name] || 0) + (item.quantity || 1)
            })
        })

        const formattedChart = Object.entries(dailyData).map(([name, total]) => ({ name, total }))
        setChartData(formattedChart)

        const sorted = Object.entries(counts)
            .sort(([, a]: any, [, b]: any) => b - a)
            .slice(0, 5)
        setTopProducts(sorted)
    }

    return (
        <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-[#00BA4A]/20 pb-12">
            <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6">
                <div className="container mx-auto py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-[#00BA4A]" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-serif font-bold uppercase tracking-tight leading-none">Data <span className="text-[#00BA4A]">Insight</span></h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Analitik Bisnis Terukur</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchData}
                            className="rounded-full h-10 px-4 hover:bg-slate-100 gap-2 transition-all"
                        >
                            <RefreshCw className={cn("h-4 w-4 text-[#00BA4A]", loading && "animate-spin")} />
                            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Sync Data</span>
                        </Button>
                        <Badge className="bg-[#00BA4A]/10 text-[#00BA4A] border-none rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest">
                            <Zap className="h-3 w-3 mr-2 fill-[#00BA4A]" /> Live Analytics
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-10 max-w-6xl space-y-10 relative z-10 font-sans">

                <Card className="p-10 border-none shadow-2xl bg-[#1A1C1E] rounded-[2.5rem] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                        style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }} />

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
                            <div>
                                <h2 className="font-serif font-bold text-2xl text-white tracking-tight leading-none">Trend <span className="text-[#00BA4A]">Pendapatan</span></h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-3">Aktivitas mingguan secara real-time</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                                <Calendar className="h-5 w-5 text-[#00BA4A]" />
                            </div>
                        </div>

                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00BA4A" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00BA4A" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" opacity={0.05} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                        dy={15}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1A1C1E',
                                            borderRadius: '20px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                                            fontFamily: 'serif',
                                            fontSize: '14px',
                                            color: '#fff'
                                        }}
                                        itemStyle={{ color: '#00BA4A', fontWeight: 'bold' }}
                                        cursor={{ stroke: '#00BA4A', strokeWidth: 2, strokeDasharray: '4 4' }}
                                        formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#00BA4A"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorTotal)"
                                        animationDuration={2000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="p-10 border-none bg-white dark:bg-slate-900 rounded-[2.5rem] relative overflow-hidden group shadow-sm transition-all hover:shadow-xl hover:shadow-[#00BA4A]/5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00BA4A]/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                        <div className="relative z-10">
                            <div className="h-14 w-14 rounded-2xl bg-[#00BA4A]/10 flex items-center justify-center mb-6">
                                <Trophy className="h-7 w-7 text-[#00BA4A]" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Produk Terlaris</p>
                            <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-white tracking-tight italic">
                                "{topProducts[0] ? topProducts[0][0] : "Memuat..."}"
                            </h2>
                        </div>
                    </Card>

                    <Card className="p-10 border-none bg-white dark:bg-slate-900 rounded-[2.5rem] relative overflow-hidden group shadow-sm transition-all hover:shadow-xl hover:shadow-[#FF5700]/5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5700]/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                        <div className="relative z-10">
                            <div className="h-14 w-14 rounded-2xl bg-[#FF5700]/10 flex items-center justify-center mb-6">
                                <Clock className="h-7 w-7 text-[#FF5700]" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Jam Sibuk Restoran</p>
                            <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-white tracking-tight leading-none">
                                14:00 <span className="text-sm font-sans text-slate-400 mx-2 font-normal italic">s/d</span> 16:00
                            </h2>
                        </div>
                    </Card>
                </div>

                <Card className="border-none bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-sm">
                    <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-[#1A1C1E] rounded-xl shadow-lg"><BarChart3 className="h-5 w-5 text-[#00BA4A]" /></div>
                            <h3 className="font-serif font-bold text-xl text-slate-800 dark:text-white italic uppercase tracking-tight">Ranking <span className="text-[#00BA4A]">Menu Utama</span></h3>
                        </div>
                        <Badge className="bg-slate-50 dark:bg-slate-800 text-slate-400 border-none rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-widest">
                            Top 5 Performance
                        </Badge>
                    </div>

                    <div className="px-5 pb-5">
                        <div className="divide-y divide-slate-50 dark:divide-slate-800">
                            {topProducts.map(([name, count]: any, index) => (
                                <div key={index} className="flex items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all rounded-[2rem] group cursor-default">
                                    <div className="flex items-center gap-8">
                                        <span className="text-3xl font-serif font-bold text-slate-100 dark:text-slate-800 group-hover:text-[#00BA4A]/20 transition-colors w-10">
                                            {index + 1}
                                        </span>
                                        <div className="space-y-3">
                                            <p className="font-serif font-bold text-lg text-slate-800 dark:text-white leading-none italic">{name}</p>
                                            {/* PERBAIKAN: Menggunakan div alih-alih p untuk menghindari nesting div di dalam p */}
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-[#00BA4A]" />
                                                {count} Transaksi Berhasil
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10">
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Market Share</span>
                                            <div className="h-1.5 w-32 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className="h-full bg-[#00BA4A] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,186,74,0.3)]"
                                                    style={{ width: `${(count / (topProducts[0][1] || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="h-12 w-12 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:bg-[#1A1C1E] group-hover:text-white transition-all duration-300 shadow-sm">
                                            <ChevronRight className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    )
}