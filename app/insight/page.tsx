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
    TrendingUp, ChevronRight, Calendar,
    RefreshCw
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
        <div className="min-h-screen bg-background font-[family-name:var(--font-poppins)] pb-12">
            {/* HEADER - Konsisten dengan Laba Rugi */}
            <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="rounded-xl border border-border h-10 w-10">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-foreground leading-none">Insight</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Business Analytics</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={fetchData}
                            className="rounded-xl h-10 w-10 text-muted-foreground"
                        >
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </Button>
                        <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 border-none rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                            <Zap className="h-3 w-3 mr-1.5 fill-indigo-500" /> Auto-Sync
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 max-w-5xl space-y-6">

                {/* CHART SECTION */}
                <Card className="p-8 border border-border bg-card rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="font-bold text-lg text-foreground leading-none">Trend Pendapatan</h2>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Aktivitas 7 Hari Terakhir</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)',
                                        fontFamily: 'var(--font-poppins)',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* TOP CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-8 border-none bg-indigo-600 text-white rounded-3xl relative overflow-hidden group shadow-lg shadow-indigo-500/20">
                        <div className="relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-md">
                                <Trophy className="h-6 w-6 text-white" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Produk Terlaris</p>
                            <h2 className="text-2xl font-bold mt-1 tracking-tight">
                                {topProducts[0] ? topProducts[0][0] : "--"}
                            </h2>
                        </div>
                        <TrendingUp className="absolute right-[-2%] bottom-[-5%] h-32 w-32 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                    </Card>

                    <Card className="p-8 border border-border bg-card rounded-3xl shadow-sm">
                        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                            <Clock className="h-6 w-6 text-amber-500" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Jam Sibuk</p>
                        <h2 className="text-2xl font-bold text-foreground mt-1 tracking-tight">14:00 - 16:00</h2>
                    </Card>
                </div>

                {/* RANKING LIST */}
                <Card className="border border-border bg-card rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-foreground">Ranking Menu Terlaris</h3>
                        </div>
                        <Badge variant="outline" className="rounded-lg text-[10px] px-3 font-bold border-border">TOP 5 ITEM</Badge>
                    </div>

                    <div className="divide-y divide-border">
                        {topProducts.map(([name, count]: any, index) => (
                            <div key={index} className="flex items-center justify-between p-5 hover:bg-muted/30 transition-all group cursor-default">
                                <div className="flex items-center gap-5">
                                    <span className="text-xl font-black text-muted-foreground/20 italic group-hover:text-indigo-500/40 transition-colors w-6">
                                        0{index + 1}
                                    </span>
                                    <div>
                                        <p className="font-bold text-sm text-foreground">{name}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">
                                            {count} Transaksi Berhasil
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full"
                                                style={{ width: `${(count / (topProducts[0][1] || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </main>
        </div>
    )
}