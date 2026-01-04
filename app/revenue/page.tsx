"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    TrendingUp,
    Receipt,
    ArrowLeft,
    CalendarDays,
    ArrowUpRight,
    FileSpreadsheet,
    ChevronRight,
    RotateCcw,
    ShoppingBag,
    Utensils
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function RevenuePage() {
    const [revenueData, setRevenueData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'dine_in' | 'takeaway'>('dine_in')

    useEffect(() => {
        fetchRevenue()
    }, [])

    const fetchRevenue = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('revenue')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setRevenueData(data || [])
        } catch (err: any) {
            toast.error("Gagal memuat laporan")
        } finally {
            setLoading(false)
        }
    }

    // Filter data berdasarkan Tab yang dipilih
    const filteredData = revenueData.filter(item => {
        if (activeTab === 'takeaway') return item.table_number === 0
        return item.table_number > 0
    })

    const exportToCSV = () => {
        if (filteredData.length === 0) {
            toast.error("Tidak ada data untuk diekspor")
            return
        }
        const headers = ["ID Transaksi,Tanggal,Waktu,Tipe/Meja,Metode Pembayaran,Total Amount\n"]
        const rows = filteredData.map(item => {
            const date = new Date(item.created_at).toLocaleDateString("id-ID")
            const time = new Date(item.created_at).toLocaleTimeString("id-ID")
            const tableInfo = item.table_number === 0 ? "Takeaway" : `Meja ${item.table_number}`
            return `${item.id},${date},${time},${tableInfo},${item.payment_method},${item.total_amount}`
        })
        const csvContent = headers.concat(rows).join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `Laporan_${activeTab}_${new Date().toLocaleDateString()}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`Laporan ${activeTab} berhasil diunduh!`)
    }

    const handleResetRevenue = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('revenue')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000')

            if (error) throw error
            setRevenueData([])
            toast.success("Penjualan telah di-reset.")
        } catch (err: any) {
            toast.error("Gagal reset: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    // Statistik tetap dihitung dari TOTAL (untuk dashboard-like feel)
    const totalRevenue = revenueData.reduce((sum, item) => sum + (item.total_amount || 0), 0)
    const totalOrders = revenueData.length
    const averageTransaction = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-background font-[family-name:var(--font-poppins)] pb-20">
            <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">Laporan Pendapatan</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                <CalendarDays className="h-3 w-3" /> Rekapitulasi Terintegrasi
                            </p>
                        </div>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="rounded-xl border-red-100 text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest">
                                <RotateCcw className="h-3.5 w-3.5 mr-2" /> Reset Data
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2rem]">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Semua Data?</AlertDialogTitle>
                                <AlertDialogDescription>Data yang dihapus akan hilang dari Dashboard Utama.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetRevenue} className="rounded-xl bg-red-600">Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 max-w-6xl space-y-8">
                {/* Stats Section - Total Keseluruhan */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "Total Pendapatan", value: `Rp ${totalRevenue.toLocaleString("id-ID")}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                        { label: "Total Transaksi", value: `${totalOrders} Pesanan`, icon: Receipt, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
                        { label: "Rata-rata Bill", value: `Rp ${averageTransaction.toLocaleString("id-ID")}`, icon: ArrowUpRight, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" }
                    ].map((stat, i) => (
                        <Card key={i} className="p-6 border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] flex items-center gap-5">
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}><stat.icon className="h-6 w-6" /></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-xl font-bold tracking-tight">{stat.value}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* TAB SELECTOR UNTUK DINE IN / TAKEAWAY */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.5rem] w-fit">
                    <button
                        onClick={() => setActiveTab('dine_in')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dine_in' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                    >
                        <Utensils className="h-3 w-3" /> Dine In
                    </button>
                    <button
                        onClick={() => setActiveTab('takeaway')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'takeaway' ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-500' : 'text-slate-400'}`}
                    >
                        <ShoppingBag className="h-3 w-3" /> Takeaway
                    </button>
                </div>

                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                        <h2 className="font-bold text-xs uppercase tracking-widest">
                            Riwayat {activeTab === 'dine_in' ? 'Makan di Tempat' : 'Bungkus / Takeaway'}
                        </h2>
                        <Badge variant="outline" className="text-[10px] font-black">{filteredData.length} Data</Badge>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                                    <th className="px-8 py-4">Waktu</th>
                                    <th className="px-8 py-4">Keterangan</th>
                                    <th className="px-8 py-4">Metode</th>
                                    <th className="px-8 py-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {loading ? (
                                    [...Array(3)].map((_, i) => (
                                        <tr key={i} className="animate-pulse"><td colSpan={4} className="px-8 py-6 bg-slate-50/10"></td></tr>
                                    ))
                                ) : filteredData.length === 0 ? (
                                    <tr><td colSpan={4} className="px-8 py-20 text-center text-xs font-bold text-slate-300 uppercase tracking-widest">Tidak ada data {activeTab}</td></tr>
                                ) : (
                                    filteredData.map((item) => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-8 py-5 text-xs font-bold">
                                                {new Date(item.created_at).toLocaleDateString("id-ID")}
                                                <div className="text-[10px] font-normal text-slate-400">Pukul {new Date(item.created_at).toLocaleTimeString("id-ID")}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                {item.table_number === 0 ? (
                                                    <Badge className="bg-orange-500 text-white border-none text-[9px] font-black uppercase px-2 py-0.5">TAKEAWAY</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase">MEJA {item.table_number}</Badge>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-[10px] font-bold uppercase text-slate-500">{item.payment_method}</td>
                                            <td className="px-8 py-5 text-right font-black text-indigo-600">Rp {item.total_amount.toLocaleString("id-ID")}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-slate-50/30 dark:bg-slate-800/30 border-t flex justify-center sm:justify-end">
                        <Button
                            onClick={exportToCSV}
                            disabled={loading || filteredData.length === 0}
                            className={`w-full sm:w-auto rounded-2xl text-[11px] font-black uppercase tracking-widest text-white shadow-xl py-6 px-8 transition-all flex items-center gap-3 ${activeTab === 'dine_in' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-500 hover:bg-orange-600'}`}
                        >
                            <FileSpreadsheet className="h-5 w-5" />
                            Unduh CSV {activeTab === 'dine_in' ? 'Dine In' : 'Takeaway'}
                        </Button>
                    </div>
                </Card>
            </main>
        </div>
    )
}