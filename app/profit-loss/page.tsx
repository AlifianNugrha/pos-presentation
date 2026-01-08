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
    RefreshCw,
    Wallet,
    FileSpreadsheet,
    PieChart as PieIcon,
    ArrowUpRight
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

        // Realtime subscription yang aman (RLS di DB akan memfilter datanya)
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
            // 1. Ambil User ID yang sedang aktif
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 2. Fetch Revenue MILIK USER SENDIRI
            const { data: revData } = await supabase
                .from('revenue')
                .select('total_amount')
                .eq('user_id', user.id) // Filter per user

            const totalIncome = revData?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0

            // 3. Fetch Expenses MILIK USER SENDIRI
            const { data: expData } = await supabase
                .from('expenses')
                .select('amount')
                .eq('user_id', user.id) // Filter per user

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
                            <h1 className="text-xl font-serif font-bold uppercase tracking-tight text-slate-900 dark:text-white leading-none">Laba <span className="text-[#00BA4A]">Rugi</span></h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Laporan Finansial Konsolidasian</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchFinancialData}
                        className="rounded-full h-10 w-10 text-[#00BA4A] hover:bg-green-50 border border-slate-100 dark:border-slate-800 transition-all"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-10 max-w-5xl space-y-8 relative z-10 font-sans">

                {/* Main Profit Card */}
                <Card className="p-10 border-none bg-[#1A1C1E] rounded-[2.5rem] relative overflow-hidden shadow-2xl group transition-all duration-500 hover:shadow-[#00BA4A]/10">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }} />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-[#00BA4A] animate-pulse" />
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Net Profit Margin</p>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-white italic">
                                Rp {data.netProfit.toLocaleString("id-ID")}
                            </h2>
                            <div className="flex items-center gap-4 pt-4">
                                <Badge className="bg-[#00BA4A] text-white border-none rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-900/40">
                                    Margin {data.margin.toFixed(1)}%
                                </Badge>
                                {data.netProfit >= 0 ? (
                                    <span className="text-[10px] font-bold text-[#00BA4A] flex items-center gap-2 uppercase tracking-widest">
                                        <ArrowUpRight className="h-4 w-4" /> Performa Positif
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-[#FF5700] flex items-center gap-2 uppercase tracking-widest">
                                        <TrendingDown className="h-4 w-4" /> Defisit Anggaran
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="h-24 w-24 rounded-[2.2rem] bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-all duration-500">
                            <PieIcon className="h-10 w-10 text-[#00BA4A]" />
                        </div>
                    </div>
                </Card>

                {/* Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="p-8 border-none bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-[#00BA4A]/10 flex items-center justify-center text-[#00BA4A]">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pendapatan</p>
                                    <h3 className="text-2xl font-serif font-bold text-slate-800 dark:text-white italic">Rp {data.income.toLocaleString("id-ID")}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-[#00BA4A] rounded-full" style={{ width: '100%' }} />
                        </div>
                    </Card>

                    <Card className="p-8 border-none bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-[#FF5700]/10 flex items-center justify-center text-[#FF5700]">
                                    <TrendingDown className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pengeluaran</p>
                                    <h3 className="text-2xl font-serif font-bold text-slate-800 dark:text-white italic">Rp {data.expenses.toLocaleString("id-ID")}</h3>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black border-slate-100 text-slate-400 rounded-full px-4 py-1 uppercase">
                                {data.income > 0 ? ((data.expenses / data.income) * 100).toFixed(0) : 0}% Rasio
                            </Badge>
                        </div>
                        <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#FF5700] rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min((data.expenses / (data.income || 1)) * 100, 100)}%` }}
                            />
                        </div>
                    </Card>
                </div>

                {/* Ledger Table Section */}
                <Card className="border-none bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-sm">
                    <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-[#1A1C1E] rounded-2xl shadow-lg"><Calendar className="h-5 w-5 text-[#00BA4A]" /></div>
                            <h3 className="font-serif font-bold text-xl text-slate-800 dark:text-white uppercase tracking-tight">Log <span className="text-[#00BA4A]">Finansial</span></h3>
                        </div>
                        <Badge className="bg-slate-50 dark:bg-slate-800 text-slate-400 border-none rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-widest">Sinkronisasi Real-time</Badge>
                    </div>

                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        <div className="flex items-center justify-between p-10 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group cursor-default">
                            <div className="flex items-center gap-8">
                                <div className="h-14 w-14 rounded-[1.5rem] bg-[#00BA4A]/5 text-[#00BA4A] flex items-center justify-center font-serif font-bold text-sm border border-[#00BA4A]/10 group-hover:bg-[#00BA4A] group-hover:text-white transition-all duration-300 shadow-sm">IN</div>
                                <div>
                                    <p className="font-serif font-bold text-lg text-slate-800 dark:text-white leading-none">Revenue Penjualan</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">Total Pendapatan Terverifikasi</p>
                                </div>
                            </div>
                            <p className="text-xl font-serif font-bold text-[#00BA4A] group-hover:translate-x-[-10px] transition-transform">+ Rp {data.income.toLocaleString("id-ID")}</p>
                        </div>

                        <div className="flex items-center justify-between p-10 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group cursor-default">
                            <div className="flex items-center gap-8">
                                <div className="h-14 w-14 rounded-[1.5rem] bg-[#FF5700]/5 text-[#FF5700] flex items-center justify-center font-serif font-bold text-sm border border-[#FF5700]/10 group-hover:bg-[#FF5700] group-hover:text-white transition-all duration-300 shadow-sm">OUT</div>
                                <div>
                                    <p className="font-serif font-bold text-lg text-slate-800 dark:text-white leading-none">Beban Operasional</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">Pengeluaran & Belanja Bahan</p>
                                </div>
                            </div>
                            <p className="text-xl font-serif font-bold text-[#FF5700] group-hover:translate-x-[-10px] transition-transform">- Rp {data.expenses.toLocaleString("id-ID")}</p>
                        </div>
                    </div>
                </Card>

                <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4 text-slate-400 group cursor-default">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 group-hover:border-[#00BA4A] transition-colors"><Wallet className="h-5 w-5 text-[#00BA4A]" /></div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Sistem Verifikasi Natadesa</p>
                            <p className="text-[9px] font-medium text-slate-300 dark:text-slate-600 mt-1 uppercase">Laporan ini dibuat secara otomatis oleh sistem</p>
                        </div>
                    </div>
                    <Button
                        onClick={exportToCSV}
                        className="w-full sm:w-auto rounded-[1.8rem] bg-[#00BA4A] hover:bg-[#009e3f] text-white gap-4 h-16 px-12 font-bold text-[11px] uppercase tracking-[0.3em] shadow-[0_20px_40px_-15px_rgba(0,186,74,0.3)] transition-all active:scale-95 flex items-center justify-center"
                    >
                        <FileSpreadsheet className="h-5 w-5 text-white" />
                        Export Laporan (.CSV)
                    </Button>
                </div>
            </main>
        </div>
    )
}