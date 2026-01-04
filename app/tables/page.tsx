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
  CalendarCheck, RefreshCw,
  ChevronLeft, ArrowRight, ShoppingBag
} from "lucide-react"

type TableStatus = "available" | "occupied" | "reserved"

type Table = {
  id: string
  number: number
  capacity: number
  status: TableStatus
  currentBill?: number
  duration?: string
  isTakeaway?: boolean // Field tambahan untuk identifikasi kartu takeaway
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [tableStats, setTableStats] = useState({
    total: 12,
    occupied: 0,
    available: 12,
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

      // 1. Ambil data asli meja
      const { data: dbTables, error: tableError } = await supabase
        .from('tables')
        .select('*')
        .order('number', { ascending: true })

      if (tableError) throw tableError

      // 2. Ambil pesanan aktif (Termasuk table_number 0)
      const { data: activeOrders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'preparing', 'ready', 'served'])

      if (orderError) throw orderError

      // 3. Buat Kartu Virtual Takeaway jika ada order table 0
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

      // 4. Gabungkan data meja asli dengan info pesanan
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

      // Gabungkan Takeaway di awal grid
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

    const channel = supabase
      .channel('table-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchTableStatus())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => fetchTableStatus())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchTableStatus])

  const toggleReserve = async (tableNumber: number, currentStatus: TableStatus) => {
    if (tableNumber === 0) return // Takeaway tidak bisa di-reserve
    const newStatus = currentStatus === "reserved" ? "available" : "reserved"
    try {
      await supabase.from('tables').update({ status: newStatus }).eq('number', tableNumber)
    } catch (err) {
      console.error("Update Error:", err)
    }
  }

  if (!mounted || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background font-[family-name:var(--font-poppins)]">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full"><ChevronLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">Meja & Area</h1>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1">Status Lapangan</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => fetchTableStatus()} className="rounded-lg h-9 bg-white dark:bg-slate-900 gap-2">
              <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline text-xs font-bold">Refresh</span>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* STATS SUMMARY */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Meja</p>
            <p className="text-2xl font-bold">{tableStats.total}</p>
          </Card>
          <Card className="p-4 border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Meja Terisi</p>
            <p className="text-2xl font-bold text-rose-600">{tableStats.occupied}</p>
          </Card>
          <Card className="p-4 border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Meja Tersedia</p>
            <p className="text-2xl font-bold text-emerald-600">{tableStats.available}</p>
          </Card>
          <Card className="p-4 border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl text-orange-600">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Antrean Takeaway</p>
            <p className="text-2xl font-bold">{tables.filter(t => t.isTakeaway).length}</p>
          </Card>
        </div>

        {/* GRID MEJA & TAKEAWAY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => {
            const isAvailable = table.status === "available";
            const isOccupied = table.status === "occupied";
            const isReserved = table.status === "reserved";

            return (
              <Card
                key={table.id}
                className={`group relative overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 p-0 rounded-2xl ${table.isTakeaway ? 'bg-orange-50/50 dark:bg-orange-950/10 ring-1 ring-orange-200' : 'bg-white dark:bg-slate-900'}`}
              >
                <div className={`h-1.5 w-full ${table.isTakeaway ? 'bg-orange-500' : isAvailable ? 'bg-emerald-500' : isOccupied ? 'bg-rose-500' : 'bg-amber-500'}`} />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className={`text-2xl font-bold tracking-tight Poppins flex items-center gap-2 ${table.isTakeaway ? 'text-orange-600' : 'text-slate-900 dark:text-white'}`}>
                        {table.isTakeaway ? <><ShoppingBag className="h-5 w-5" /> TAKEAWAY</> : `MEJA ${table.number}`}
                      </h3>
                      {!table.isTakeaway && (
                        <div className="flex items-center gap-1.5 mt-1 text-slate-500 font-medium text-xs">
                          <Users className="h-3.5 w-3.5" /> <span>{table.capacity} Kursi</span>
                        </div>
                      )}
                    </div>
                    <Badge className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase border-none ${table.isTakeaway ? 'bg-orange-500 text-white' : isAvailable ? 'bg-emerald-50 text-emerald-600' : isOccupied ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                      {table.isTakeaway ? 'AKTIF' : table.status}
                    </Badge>
                  </div>

                  {isOccupied && (
                    <div className="space-y-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl mb-6 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> DURASI</div>
                        <span className="text-slate-900 dark:text-slate-200">{table.duration}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Tagihan</span>
                        <span className={`text-sm font-bold ${table.isTakeaway ? 'text-orange-600' : 'text-indigo-600'}`}>Rp {table.currentBill?.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {table.isTakeaway ? (
                      <Link href={`/payment?table=0`} className="w-full block">
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-orange-100 border-none">
                          Bayar Takeaway
                        </Button>
                      </Link>
                    ) : isAvailable ? (
                      <Link href={`/orders?table=${table.number}`} className="w-full block">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 rounded-xl font-bold text-xs gap-2 border-none">
                          Buka Meja <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    ) : isOccupied ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Link href={`/orders?table=${table.number}`} className="w-full">
                          <Button variant="outline" className="w-full h-11 rounded-xl font-bold text-[10px] uppercase">Add Order</Button>
                        </Link>
                        <Link href={`/payment?table=${table.number}`} className="w-full">
                          <Button className="w-full h-11 rounded-xl font-bold text-[10px] bg-rose-600 hover:bg-rose-700 text-white border-none shadow-lg shadow-rose-100 uppercase">Checkout</Button>
                        </Link>
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full h-11 border-amber-200 text-amber-600 rounded-xl font-bold uppercase text-[10px]" onClick={() => toggleReserve(table.number, table.status)}>Batalkan Reservasi</Button>
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