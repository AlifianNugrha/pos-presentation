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
    RotateCcw,
    ShoppingBag,
    Utensils,
    Wallet
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

    const totalRevenue = revenueData.reduce((sum, item) => sum + (item.total_amount || 0), 0)
    const totalOrders = revenueData.length
    const averageTransaction = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return (
        <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-[#00BA4A]/20 pb-20">
            <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6">
                <div className="container mx-auto py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-[#00BA4A]" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-serif font-bold uppercase tracking-tight leading-none">Laporan <span className="text-[#00BA4A]">Pendapatan</span></h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                <CalendarDays className="h-3 w-3 text-[#00BA4A]" /> Rekapitulasi Terpusat
                            </p>
                        </div>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="rounded-full border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest px-6 h-10 transition-all">
                                <RotateCcw className="h-3.5 w-3.5 mr-2" /> Reset
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-serif text-2xl">Hapus Histori Penjualan?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 font-medium">
                                    Tindakan ini akan menghapus seluruh catatan pendapatan secara permanen dari basis data.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel className="rounded-2xl border-slate-100 font-bold uppercase text-[10px]">Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetRevenue} className="rounded-2xl bg-[#FF5700] hover:bg-red-700 font-bold uppercase text-[10px]">Konfirmasi Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </header>

            <main className="container mx-auto px-6 py-10 max-w-6xl space-y-10 relative z-10">
                {/* STATS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { label: "Total Pendapatan", value: `Rp ${totalRevenue.toLocaleString("id-ID")}`, icon: TrendingUp, color: "text-[#00BA4A]", bg: "bg-[#00BA4A]/10" },
                        { label: "Total Transaksi", value: `${totalOrders} Struk`, icon: Receipt, color: "text-indigo-600", bg: "bg-indigo-50" },
                        { label: "Rata-rata Bill", value: `Rp ${averageTransaction.toLocaleString("id-ID")}`, icon: ArrowUpRight, color: "text-[#FF5700]", bg: "bg-[#FF5700]/10" }
                    ].map((stat, i) => (
                        <Card key={i} className="p-8 border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center gap-6 transition-all hover:shadow-md">
                            <div className={`p-5 rounded-2xl ${stat.bg} ${stat.color}`}><stat.icon className="h-7 w-7" /></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                                <p className="text-2xl font-serif font-bold tracking-tight">{stat.value}</p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* TAB SELECTOR */}
                <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1.5 rounded-[2rem] w-fit border border-slate-100">
                    <button
                        onClick={() => setActiveTab('dine_in')}
                        className={`flex items-center gap-3 px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dine_in' ? 'bg-white dark:bg-slate-700 shadow-md text-[#00BA4A] scale-[1.02]' : 'text-slate-400'}`}
                    >
                        <Utensils className="h-4 w-4" /> Dine In
                    </button>
                    <button
                        onClick={() => setActiveTab('takeaway')}
                        className={`flex items-center gap-3 px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'takeaway' ? 'bg-white dark:bg-slate-700 shadow-md text-[#FF5700] scale-[1.02]' : 'text-slate-400'}`}
                    >
                        <ShoppingBag className="h-4 w-4" /> Takeaway
                    </button>
                </div>

                {/* TABLE SECTION */}
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden flex flex-col">
                    <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-[#1A1C1E] rounded-xl shadow-lg shadow-slate-200 dark:shadow-none"><Receipt className="h-5 w-5 text-[#00BA4A]" /></div>
                            <h2 className="font-serif font-bold text-xl uppercase tracking-tight">
                                Riwayat <span className="text-[#00BA4A]">{activeTab === 'dine_in' ? 'Dine In' : 'Takeaway'}</span>
                            </h2>
                        </div>
                        <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[10px] px-5 py-2 rounded-full uppercase tracking-widest">{filteredData.length} Baris</Badge>
                    </div>

                    <div className="overflow-x-auto px-5 pb-5">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-[0.25em] font-bold text-slate-300">
                                    <th className="px-10 py-8">Waktu Transaksi</th>
                                    <th className="px-10 py-8">Lokasi/Meja</th>
                                    <th className="px-10 py-8">Metode</th>
                                    <th className="px-10 py-8 text-right">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {loading ? (
                                    [...Array(3)].map((_, i) => (
                                        <tr key={i} className="animate-pulse"><td colSpan={4} className="px-10 py-10 bg-slate-50/10"></td></tr>
                                    ))
                                ) : filteredData.length === 0 ? (
                                    <tr><td colSpan={4} className="px-10 py-32 text-center text-[11px] font-bold text-slate-300 uppercase tracking-[0.3em]">Belum ada data tersedia</td></tr>
                                ) : (
                                    filteredData.map((item) => (
                                        <tr key={item.id} className="group hover:bg-[#F8FAF9] dark:hover:bg-slate-800/50 transition-all rounded-3xl">
                                            <td className="px-10 py-7">
                                                <p className="text-sm font-serif font-bold text-slate-800 dark:text-white">{new Date(item.created_at).toLocaleDateString("id-ID")}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1 italic">Pukul {new Date(item.created_at).toLocaleTimeString("id-ID")}</p>
                                            </td>
                                            <td className="px-10 py-7">
                                                {item.table_number === 0 ? (
                                                    <Badge className="bg-[#FF5700]/10 text-[#FF5700] border-none text-[9px] font-black uppercase px-4 py-1.5 rounded-full">🛍️ TAKEAWAY</Badge>
                                                ) : (
                                                    <Badge className="bg-[#00BA4A]/10 text-[#00BA4A] border-none text-[9px] font-black uppercase px-4 py-1.5 rounded-full">🪑 MEJA {item.table_number}</Badge>
                                                )}
                                            </td>
                                            <td className="px-10 py-7">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-slate-200" />
                                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{item.payment_method}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <span className="text-lg font-serif font-bold text-slate-900 dark:text-white group-hover:text-[#00BA4A] transition-colors tracking-tight">Rp {item.total_amount.toLocaleString("id-ID")}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* HIJAU MENYALA EXPORT BUTTON */}
                    <div className="p-10 border-t bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3 text-slate-400">
                            <Wallet className="h-4 w-4 text-[#00BA4A]" />
                            <p className="text-[10px] font-bold uppercase tracking-widest italic leading-none">Arsip Keuangan Digital Natadesa</p>
                        </div>
                        <Button
                            onClick={exportToCSV}
                            disabled={loading || filteredData.length === 0}
                            className="w-full sm:w-auto rounded-[1.8rem] bg-[#00BA4A] hover:bg-[#009e3f] text-white font-black uppercase tracking-[0.3em] text-[11px] h-16 px-12 transition-all active:scale-95 shadow-xl shadow-green-100 dark:shadow-none flex items-center gap-4"
                        >
                            <FileSpreadsheet className="h-5 w-5" />
                            Ekspor CSV {activeTab === 'dine_in' ? 'Dine In' : 'Takeaway'}
                        </Button>
                    </div>
                </Card>
            </main>
        </div>
    )
}