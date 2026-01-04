"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Calendar,
    Download,
    ArrowRight,
    PieChart as PieIcon,
    RefreshCw,
    Wallet,
    FileSpreadsheet
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function ProfitLossPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        income: 0,
        expenses: 0,
        netProfit: 0,
        margin: 0
    })

    useEffect(() => {
        fetchFinancialData()

        const channelRev = supabase.channel('rev-update').on('postgres_changes',
            { event: '*', schema: 'public', table: 'revenue' }, () => fetchFinancialData()).subscribe()
        const channelExp = supabase.channel('exp-update').on('postgres_changes',
            { event: '*', schema: 'public', table: 'expenses' }, () => fetchFinancialData()).subscribe()

        return () => {
            supabase.removeChannel(channelRev)
            supabase.removeChannel(channelExp)
        }
    }, [])

    const fetchFinancialData = async () => {
        setLoading(true)
        try {
            const { data: revData } = await supabase.from('revenue').select('total_amount')
            const totalIncome = revData?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0

            const { data: expData } = await supabase.from('expenses').select('amount')
            const totalExpenses = expData?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

            const netProfit = totalIncome - totalExpenses
            const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

            setData({
                income: totalIncome,
                expenses: totalExpenses,
                netProfit: netProfit,
                margin: margin
            })
        } catch (err) {
            console.error("Error fetching financial data:", err)
        } finally {
            setLoading(false)
        }
    }

    // Fungsi Export ke CSV
    const exportToCSV = () => {
        const headers = ["Kategori", "Nilai (IDR)"];
        const rows = [
            ["Total Pendapatan", data.income],
            ["Total Pengeluaran", data.expenses],
            ["Laba Bersih", data.netProfit],
            ["Margin (%)", data.margin.toFixed(2)]
        ];

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Laporan_Keuangan_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="min-h-screen bg-background font-[family-name:var(--font-poppins)] pb-12">
            {/* Header - Tombol Export Dihapus dari Sini */}
            <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="rounded-xl border border-border h-10 w-10">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-foreground leading-none">Laba Rugi</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Financial Summary</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchFinancialData}
                        className="rounded-xl h-10 w-10 text-muted-foreground border border-border"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 max-w-5xl space-y-6">

                {/* Main Profit Card */}
                <Card className="p-8 border border-border bg-card rounded-3xl relative overflow-hidden shadow-sm">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Estimasi Laba Bersih</p>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                                Rp {data.netProfit.toLocaleString("id-ID")}
                            </h2>
                            <div className="flex items-center gap-3 pt-4">
                                <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 border-none rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                                    Margin {data.margin.toFixed(1)}%
                                </Badge>
                                {data.netProfit >= 0 ? (
                                    <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 uppercase tracking-widest">
                                        <TrendingUp className="h-3.5 w-3.5" /> Performa Bagus
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 uppercase tracking-widest">
                                        <TrendingDown className="h-3.5 w-3.5" /> Defisit Keuangan
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
                            <PieIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                </Card>

                {/* Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Income */}
                    <Card className="p-6 border border-border bg-card rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Pendapatan</p>
                                    <h3 className="text-lg font-bold text-foreground">Rp {data.income.toLocaleString("id-ID")}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
                        </div>
                    </Card>

                    {/* Expense */}
                    <Card className="p-6 border border-border bg-card rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600">
                                    <TrendingDown className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Pengeluaran</p>
                                    <h3 className="text-lg font-bold text-foreground">Rp {data.expenses.toLocaleString("id-ID")}</h3>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground">{data.income > 0 ? ((data.expenses / data.income) * 100).toFixed(0) : 0}% Rasio</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-rose-500"
                                style={{ width: `${Math.min((data.expenses / (data.income || 1)) * 100, 100)}%` }}
                            />
                        </div>
                    </Card>
                </div>

                {/* Detail Ledger */}
                <Card className="border border-border bg-card rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-foreground">Rincian Arus Kas</h3>
                        </div>
                    </div>

                    <div className="divide-y divide-border">
                        <div className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">IN</div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">Revenue Otomatis</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Sinkronisasi Tabel Revenue</p>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-emerald-600">+ Rp {data.income.toLocaleString("id-ID")}</p>
                        </div>

                        <div className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-xs">OUT</div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">Beban Pengeluaran</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Sinkronisasi Tabel Expenses</p>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-rose-600">- Rp {data.expenses.toLocaleString("id-ID")}</p>
                        </div>
                    </div>
                </Card>

                {/* AREA EXPORT - Ditempatkan di bawah agar lebih clean */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Wallet className="h-4 w-4" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Sistem Keuangan Terverifikasi</p>
                    </div>
                    <Button
                        onClick={exportToCSV}
                        className="w-full sm:w-auto rounded-2xl bg-foreground text-background hover:bg-foreground/90 gap-2 h-12 px-8 font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-foreground/10"
                    >
                        <FileSpreadsheet className="h-4 w-4" /> Export Laporan (.CSV)
                    </Button>
                </div>
            </main>
        </div>
    )
}