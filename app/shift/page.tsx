"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    ArrowLeft, Calculator, RefreshCw,
    Clock, User, CheckCircle2,
    AlertTriangle, Wallet, TrendingUp, Loader2, Trash2
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function ShiftPage() {
    const [loading, setLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isRefreshingHistory, setIsRefreshingHistory] = useState(false)
    const [currentShift, setCurrentShift] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])
    const [actualCash, setActualCash] = useState("")

    const [staffList, setStaffList] = useState<any[]>([])
    const [selectedStaff, setSelectedStaff] = useState("")
    const [openingCash, setOpeningCash] = useState("")
    const [realtimeSales, setRealtimeSales] = useState(0)

    useEffect(() => {
        initData()
        const orderSubscription = supabase
            .channel('shift-revenue-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchActiveShift()
            })
            .subscribe()
        return () => { supabase.removeChannel(orderSubscription) }
    }, [])

    const initData = async () => {
        setLoading(true)
        await Promise.all([
            fetchActiveShift(),
            fetchShiftHistory(),
            loadStaffData()
        ])
        setLoading(false)
    }

    const loadStaffData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('user_id', user.id) // Filter per user
            .order('name', { ascending: true })

        if (error) toast.error("Gagal memuat staff")
        else setStaffList(data || [])
    }

    const fetchActiveShift = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: shift } = await supabase
            .from('shifts')
            .select('*')
            .eq('user_id', user.id) // Filter per user
            .eq('status', 'active')
            .maybeSingle()

        if (shift) {
            const { data: orders } = await supabase
                .from('orders')
                .select('total_amount')
                .eq('user_id', user.id) // Filter per user
                .gte('created_at', shift.start_time)
                .in('status', ['paid', 'completed', 'success'])

            const totalSales = orders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0
            setRealtimeSales(totalSales)
            setCurrentShift(shift)
        } else {
            setCurrentShift(null)
        }
    }

    const fetchShiftHistory = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('shifts')
            .select('*')
            .eq('user_id', user.id) // Filter per user
            .eq('status', 'closed')
            .order('end_time', { ascending: false })
            .limit(5)
        if (data) setHistory(data)
    }

    const handleRefreshHistory = async () => {
        setIsRefreshingHistory(true)
        await fetchShiftHistory()
        setTimeout(() => setIsRefreshingHistory(false), 500)
        toast.success("Histori diperbarui")
    }

    const handleDeleteHistory = async (id: string) => {
        if (!confirm("Hapus catatan histori ini?")) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('shifts')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id) // Proteksi keamanan

            if (error) throw error

            setHistory(history.filter(item => item.id !== id))
            toast.success("Histori berhasil dihapus")
        } catch (error) {
            toast.error("Gagal menghapus histori")
        }
    }

    const handleStartShift = async () => {
        if (!selectedStaff || !openingCash) return toast.error("Pilih staff & isi modal!")
        setIsProcessing(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('shifts')
                .insert([{
                    user_id: user.id, // Label pemilik data
                    pic_name: selectedStaff,
                    starting_cash: Number(openingCash),
                    shift_name: new Date().getHours() < 15 ? "PAGI" : "SORE",
                    status: 'active',
                    start_time: new Date().toISOString()
                }])
                .select().single()

            if (error) throw error
            setCurrentShift(data)
            setRealtimeSales(0)
            toast.success("Shift dimulai")
        } catch (error: any) {
            toast.error("Gagal memulai shift")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleEndShift = async () => {
        if (!actualCash) return toast.error("Masukkan uang fisik!")
        setIsProcessing(true)
        const expected = (currentShift?.starting_cash || 0) + realtimeSales
        const variance = Number(actualCash) - expected

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from('shifts')
                .update({
                    actual_cash: Number(actualCash),
                    expected_revenue: realtimeSales,
                    end_time: new Date().toISOString(),
                    status: 'closed',
                    notes: variance === 0 ? "BALANCE" : `SELISIH: ${variance}`
                })
                .eq('id', currentShift.id)
                .eq('user_id', user.id) // Pastikan update milik sendiri

            if (error) throw error
            toast.success("Shift berhasil ditutup")
            setCurrentShift(null)
            setActualCash("")
            fetchShiftHistory()
        } catch (error: any) {
            toast.error("Gagal menutup shift")
        } finally {
            setIsProcessing(false)
        }
    }

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#09090b]">
            <Loader2 className="animate-spin text-emerald-500 h-6 w-6" />
        </div>
    )

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 font-[family-name:var(--font-poppins)] pb-12">
            <header className="border-b border-zinc-900 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-40">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="rounded-xl border border-zinc-800 h-10 w-10 text-zinc-400 hover:bg-zinc-900">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white leading-none">Shift Manager</h1>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Sesi Kasir Aktif</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 max-w-5xl space-y-6">
                {!currentShift ? (
                    <Card className="max-w-xl mx-auto border border-zinc-900 bg-zinc-900/40 rounded-[2.5rem] p-10 shadow-2xl">
                        <div className="text-center space-y-3 mb-10">
                            <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
                                <Clock className="h-8 w-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Buka Shift</h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Siapkan Modal Awal</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Petugas</label>
                                <select
                                    className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-2xl px-5 text-sm font-bold text-zinc-300 focus:border-emerald-500/50 outline-none transition-all appearance-none"
                                    value={selectedStaff}
                                    onChange={(e) => setSelectedStaff(e.target.value)}
                                >
                                    <option value="">Pilih Staff...</option>
                                    {staffList.map((user, i) => (
                                        <option key={i} value={user.name}>{user.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Modal Awal</label>
                                <input
                                    type="number" placeholder="0"
                                    className="w-full h-14 bg-zinc-950 border border-zinc-800 rounded-2xl px-5 text-lg font-bold text-white focus:border-emerald-500/50 outline-none transition-all"
                                    value={openingCash}
                                    onChange={(e) => setOpeningCash(e.target.value)}
                                />
                            </div>

                            <Button onClick={handleStartShift} disabled={isProcessing} className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-95 shadow-lg shadow-emerald-900/10">
                                {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : "Mulai Sesi Sekarang"}
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-8 border border-zinc-900 bg-zinc-900/40 rounded-[2rem] flex items-center gap-6 shadow-xl">
                                <div className="h-14 w-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-500">
                                    <User className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Kasir Bertugas</p>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">{currentShift.pic_name}</h2>
                                    <Badge className="mt-1 bg-emerald-500/20 text-emerald-400 border-none font-bold text-[8px] tracking-[0.2em] py-0.5 px-2">ACTIVE</Badge>
                                </div>
                            </Card>

                            <Card className="p-8 border border-zinc-900 bg-zinc-900/40 rounded-[2rem] flex items-center gap-6 shadow-xl">
                                <div className="h-14 w-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-500">
                                    <TrendingUp className="h-7 w-7" />
                                </div>
                                <div className="w-full">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Saldo Sistem</p>
                                    <p className="text-3xl font-black text-white tracking-tighter">Rp {(Number(currentShift.starting_cash) + realtimeSales).toLocaleString()}</p>
                                </div>
                            </Card>
                        </div>

                        <Card className="p-10 border border-zinc-800 bg-[#121214] rounded-[3rem] space-y-8 shadow-2xl ring-1 ring-white/5">
                            <div className="space-y-4">
                                <div className="text-center md:text-left">
                                    <label className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-500 flex items-center justify-center md:justify-start gap-3">
                                        <Calculator className="h-4 w-4" /> Masukkan Total Uang Fisik
                                    </label>
                                    <p className="text-[10px] text-zinc-500 mt-1">Hitung semua uang tunai di laci saat ini</p>
                                </div>

                                <div className="bg-black/80 border-2 border-zinc-800 p-10 rounded-[2.5rem] focus-within:border-emerald-500/40 transition-all shadow-inner">
                                    <div className="flex items-center justify-center">
                                        <span className="text-3xl font-bold text-zinc-800 mr-6">Rp</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full text-7xl font-black bg-transparent border-none focus:ring-0 outline-none text-emerald-400 placeholder:text-zinc-900 tracking-tighter"
                                            value={actualCash}
                                            onChange={(e) => setActualCash(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleEndShift}
                                disabled={isProcessing}
                                className="w-full h-16 rounded-2xl bg-emerald-600 text-white font-black text-[12px] uppercase tracking-[0.3em] hover:bg-emerald-500 shadow-2xl shadow-emerald-900/20 transition-all active:scale-95"
                            >
                                {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : "Konfirmasi & Tutup Shift"}
                            </Button>
                        </Card>
                    </div>
                )}

                <div className="mt-12 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-600 flex items-center gap-2">
                            <Wallet className="h-3 w-3" /> Histori 5 Shift Terakhir
                        </h3>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRefreshHistory}
                            disabled={isRefreshingHistory}
                            className="h-7 w-7 rounded-lg border border-zinc-900 text-zinc-500 hover:text-emerald-500 hover:bg-zinc-900"
                        >
                            <RefreshCw className={cn("h-3 w-3", isRefreshingHistory && "animate-spin")} />
                        </Button>
                    </div>

                    <Card className="border border-zinc-900 bg-zinc-900/20 rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="divide-y divide-zinc-900/50">
                            {history.length > 0 ? history.map((item) => {
                                const expected = Number(item.starting_cash) + Number(item.expected_revenue)
                                const variance = Number(item.actual_cash) - expected
                                return (
                                    <div key={item.id} className="p-6 flex items-center justify-between hover:bg-zinc-900/40 transition-colors group">
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center border",
                                                variance === 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                            )}>
                                                {variance === 0 ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm tracking-tight">{item.pic_name}</p>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                                    {new Date(item.end_time).toLocaleDateString('id-ID')} • {item.shift_name}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="font-bold text-white text-sm">Rp {Number(item.actual_cash).toLocaleString()}</p>
                                                <p className={cn(
                                                    "text-[9px] font-bold uppercase tracking-widest",
                                                    variance < 0 ? "text-rose-500" : "text-emerald-500"
                                                )}>
                                                    {variance === 0 ? "STABIL" : `SELISIH: ${variance.toLocaleString()}`}
                                                </p>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteHistory(item.id)}
                                                className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            }) : (
                                <div className="p-10 text-center text-zinc-700 text-[10px] font-bold uppercase tracking-[0.2em]">Belum ada catatan shift</div>
                            )}
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    )
}