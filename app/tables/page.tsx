"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
import {
  Users, Clock, Loader2,
  RefreshCw, ChevronLeft,
  ArrowRight, ShoppingBag, LayoutGrid,
  MapPin, Wallet
} from "lucide-react"

type TableStatus = "available" | "occupied" | "reserved"

type Table = {
  id: string
  number: number
  capacity: number
  status: TableStatus
  currentBill?: number
  duration?: string
  isTakeaway?: boolean
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [tableStats, setTableStats] = useState({
    total: 0,
    occupied: 0,
    available: 0,
    reserved: 0
  })

  const calculateDuration = (timestamp: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 60000)
    if (diff < 60) return `${diff}m`
    return `${Math.floor(diff / 60)}j ${diff % 60}m`
  }

  const fetchTableStatus = useCallback(async () => {
    try {
      setIsRefreshing(true)

      // Ambil user yang sedang login
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Fetch Tables MILIK USER SENDIRI
      const { data: dbTables, error: tableError } = await supabase
        .from('tables')
        .select('*')
        .eq('user_id', user.id) // Filter per user
        .order('number', { ascending: true })

      if (tableError) throw tableError

      // 2. Fetch Orders MILIK USER SENDIRI
      const { data: activeOrders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id) // Filter per user
        .in('status', ['pending', 'preparing', 'ready', 'served'])

      if (orderError) throw orderError

      const activeTakeaways = activeOrders?.filter(o => o.table_number === 0) || []

      const virtualTakeawayCards: Table[] = activeTakeaways.map(order => ({
        id: `takeaway-${order.id}`,
        number: 0,
        capacity: 0,
        status: "occupied",
        isTakeaway: true,
        currentBill: order.items?.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0) || 0,
        duration: calculateDuration(order.created_at)
      }))

      const updatedTables = (dbTables || []).map(table => {
        const orderForTable = activeOrders?.find(o => o.table_number === table.number)
        if (table.status === "occupied" && orderForTable) {
          const subtotalItems = orderForTable.items?.reduce((sum: number, item: any) =>
            sum + (Number(item.price) * Number(item.quantity)), 0) || 0;
          return {
            ...table,
            currentBill: subtotalItems,
            duration: calculateDuration(orderForTable.created_at)
          }
        }
        return table
      })

      setTables([...virtualTakeawayCards, ...updatedTables])

      setTableStats({
        total: dbTables?.length || 0,
        occupied: (dbTables?.filter(t => t.status === 'occupied').length || 0) + virtualTakeawayCards.length,
        available: dbTables?.filter(t => t.status === 'available').length || 0,
        reserved: dbTables?.filter(t => t.status === 'reserved').length || 0
      })
    } catch (err) {
      console.error("Fetch Error:", err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchTableStatus()

    // Realtime subscription yang aman (RLS di DB akan memfilter datanya)
    const channel = supabase
      .channel('table-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchTableStatus())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => fetchTableStatus())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchTableStatus])

  const toggleReserve = async (tableNumber: number, currentStatus: TableStatus) => {
    if (tableNumber === 0) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newStatus = currentStatus === "reserved" ? "available" : "reserved"
    try {
      await supabase
        .from('tables')
        .update({ status: newStatus })
        .eq('number', tableNumber)
        .eq('user_id', user.id) // Proteksi agar hanya mengubah data sendiri
    } catch (err) {
      console.error("Update Error:", err)
    }
  }

  if (!mounted || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9]">
      <Loader2 className="h-8 w-8 animate-spin text-[#00BA4A]" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-[#00BA4A]/20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-[#00BA4A]/5 rounded-full blur-[120px]" />
      </div>

      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6">
        <div className="container mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 transition-colors">
                <ChevronLeft className="h-5 w-5 text-[#00BA4A]" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-serif font-bold uppercase tracking-tight">Manajemen <span className="text-[#00BA4A]">Meja</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <MapPin className="h-3 w-3 text-[#00BA4A]" /> Area Restoran Live
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => fetchTableStatus()} className="rounded-full h-10 px-5 border-slate-200 bg-white dark:bg-slate-900 gap-2 hover:border-[#00BA4A] transition-all">
              <RefreshCw className={`h-3.5 w-3.5 text-[#00BA4A] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-wider">Update Status</span>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl group">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Kapasitas</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-serif font-bold">{tableStats.total}</p>
              <LayoutGrid className="h-5 w-5 text-slate-200 group-hover:text-[#00BA4A] transition-colors" />
            </div>
          </Card>
          <Card className="p-6 border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl group border-b-4 border-[#FF5700]/20">
            <p className="text-[10px] font-bold text-[#FF5700] uppercase tracking-widest mb-2">Meja Terisi</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-serif font-bold text-[#FF5700]">{tableStats.occupied}</p>
              <Users className="h-5 w-5 text-[#FF5700]/20" />
            </div>
          </Card>
          <Card className="p-6 border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl group border-b-4 border-[#00BA4A]/20">
            <p className="text-[10px] font-bold text-[#00BA4A] uppercase tracking-widest mb-2">Tersedia</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-serif font-bold text-[#00BA4A]">{tableStats.available}</p>
              <div className="w-2 h-2 rounded-full bg-[#00BA4A] animate-ping" />
            </div>
          </Card>
          <Card className="p-6 border-none shadow-sm bg-[#1A1C1E] rounded-3xl text-white">
            <p className="text-[10px] font-bold text-[#00BA4A] uppercase tracking-widest mb-2">Takeaway Aktif</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-serif font-bold">{tables.filter(t => t.isTakeaway).length}</p>
              <ShoppingBag className="h-5 w-5 text-[#00BA4A]" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {tables.map((table) => {
            const isAvailable = table.status === "available";
            const isOccupied = table.status === "occupied";
            const isReserved = table.status === "reserved";

            return (
              <Card
                key={table.id}
                className={`group relative overflow-hidden border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[2.5rem] bg-white dark:bg-slate-900 p-0`}
              >
                <div className={`h-2 w-full ${table.isTakeaway ? 'bg-[#FF5700]' : isAvailable ? 'bg-[#00BA4A]' : isOccupied ? 'bg-[#FF5700]' : 'bg-amber-400'}`} />

                <div className="p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className={`text-2xl font-serif font-bold tracking-tight ${table.isTakeaway ? 'text-[#FF5700]' : 'text-slate-800 dark:text-white'}`}>
                        {table.isTakeaway ? 'TAKEAWAY' : `Meja ${table.number}`}
                      </h3>
                      {!table.isTakeaway && (
                        <div className="flex items-center gap-2 mt-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                          <Users className="h-3 w-3" /> <span>{table.capacity} Kursi</span>
                        </div>
                      )}
                    </div>
                    <Badge className={`rounded-full px-4 py-1 text-[9px] font-black uppercase border-none shadow-sm ${table.isTakeaway ? 'bg-[#FF5700] text-white' : isAvailable ? 'bg-[#00BA4A]/10 text-[#00BA4A]' : isOccupied ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                      {table.isTakeaway ? 'Aktif' : table.status}
                    </Badge>
                  </div>

                  {isOccupied && (
                    <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl mb-8 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-[#00BA4A]" /> Durasi</div>
                        <span className="text-slate-900 dark:text-slate-200">{table.duration}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <Wallet className="h-3.5 w-3.5" /> Tagihan
                        </div>
                        <span className={`text-base font-serif font-bold ${table.isTakeaway ? 'text-[#FF5700]' : 'text-[#00BA4A]'}`}>
                          Rp {table.currentBill?.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {table.isTakeaway ? (
                      <Link href={`/payment?table=0`} className="w-full block">
                        <Button className="w-full bg-[#FF5700] hover:bg-[#e64e00] text-white h-14 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-orange-100 dark:shadow-none border-none transition-all">
                          Checkout Pesanan
                        </Button>
                      </Link>
                    ) : isAvailable ? (
                      <Link href={`/orders?table=${table.number}`} className="w-full block">
                        <Button className="w-full bg-[#00BA4A] hover:bg-[#009e3f] text-white h-14 rounded-2xl font-bold text-xs gap-3 border-none shadow-lg shadow-green-100 dark:shadow-none transition-all">
                          Buka Meja Baru <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : isOccupied ? (
                      <div className="grid grid-cols-1 gap-3">
                        <Link href={`/orders?table=${table.number}`} className="w-full">
                          <Button variant="outline" className="w-full h-12 rounded-2xl font-bold text-[10px] uppercase tracking-widest border-slate-200 hover:border-[#00BA4A] hover:text-[#00BA4A] transition-all">
                            Tambah Order
                          </Button>
                        </Link>
                        <Link href={`/payment?table=${table.number}`} className="w-full">
                          <Button className="w-full h-14 rounded-2xl font-bold text-xs bg-[#1A1C1E] hover:bg-black text-white border-none shadow-xl uppercase tracking-widest transition-all">
                            Selesaikan & Bayar
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-14 border-amber-200 text-amber-600 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-amber-50"
                        onClick={() => toggleReserve(table.number, table.status)}
                      >
                        Batalkan Reservasi
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  )
}