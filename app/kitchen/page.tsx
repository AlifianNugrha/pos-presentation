"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle, ChefHat, Loader2, Flame,
  Clock, Hash, ChevronRight, AlertCircle,
  Users, ShoppingBag, UtensilsCrossed
} from "lucide-react"

export default function KitchenPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const [tableStats, setTableStats] = useState({
    total: 12,
    occupied: 0,
    available: 12,
    reserved: 0
  })

  const fetchTableStatus = useCallback(async () => {
    try {
      const { data: tablesData } = await supabase
        .from('tables')
        .select('status')

      if (tablesData) {
        setTableStats({
          total: 12,
          occupied: tablesData.filter(t => t.status === 'occupied').length,
          available: tablesData.filter(t => t.status === 'available').length,
          reserved: tablesData.filter(t => t.status === 'reserved').length
        })
      }
    } catch (err) {
      console.error("Table Stats Error:", err)
    }
  }, [])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: true })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchOrders()
    fetchTableStatus()

    const channel = supabase
      .channel('kitchen-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
        fetchTableStatus()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
        fetchTableStatus()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchTableStatus])

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      fetchOrders()
    } catch (err: any) {
      console.error("Update error:", err.message)
    }
  }

  if (!mounted || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAF9]">
      <Loader2 className="animate-spin h-8 w-8 text-[#00BA4A]" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-[#00BA4A]/20">
      {/* Background Ornament */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#00BA4A]/5 rounded-full blur-[120px]" />
      </div>

      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-[#00BA4A] rounded-2xl shadow-lg shadow-green-100 dark:shadow-none">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold tracking-tight uppercase">Monitor <span className="text-[#00BA4A]">Dapur</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00BA4A] animate-pulse" /> Live Order Stream
              </p>
            </div>
          </div>
          <Badge className="bg-[#1A1C1E] text-white border-none font-bold px-5 py-2 text-[10px] tracking-widest rounded-full uppercase">
            {orders.length} Pesanan Aktif
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 relative z-10">
        {/* STATS SUMMARY */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl border-b-4 border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status Meja</p>
            <p className="text-3xl font-serif font-bold text-slate-900 dark:text-white">{tableStats.occupied}/{tableStats.total}</p>
          </Card>
          <Card className="p-6 border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl border-b-4 border-[#FF5700]/20">
            <p className="text-[10px] font-bold text-[#FF5700] uppercase tracking-widest mb-1">Sedang Antre</p>
            <p className="text-3xl font-serif font-bold text-[#FF5700]">{orders.filter(o => o.status === 'pending').length}</p>
          </Card>
          <Card className="p-6 border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl border-b-4 border-indigo-500/20">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Dimasak</p>
            <p className="text-3xl font-serif font-bold text-indigo-600">{orders.filter(o => o.status === 'preparing').length}</p>
          </Card>
          <Card className="p-6 border-none shadow-sm bg-white dark:bg-slate-900 rounded-3xl border-b-4 border-[#00BA4A]/20">
            <p className="text-[10px] font-bold text-[#00BA4A] uppercase tracking-widest mb-1">Siap Antar</p>
            <p className="text-3xl font-serif font-bold text-[#00BA4A]">{orders.filter(o => o.status === 'ready').length}</p>
          </Card>
        </div>

        {/* ORDER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {orders.map((order) => {
            const isPreparing = order.status === 'preparing';
            const isReady = order.status === 'ready';
            const isNew = order.status === 'pending';
            const isTakeaway = order.table_number === 0;

            return (
              <Card key={order.id} className={`flex flex-col border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 group ${isPreparing ? 'ring-2 ring-indigo-500' : ''}`}>
                <div className={`h-2 w-full ${isNew ? 'bg-[#FF5700]' : isPreparing ? 'bg-indigo-500' : 'bg-[#00BA4A]'}`} />

                <div className="p-8 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 text-slate-300 mb-2">
                        <Hash className="h-3 w-3" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">ID: {order.id.slice(0, 5)}</span>
                      </div>
                      <h2 className={`text-2xl font-serif font-bold tracking-tight flex items-center gap-3 ${isTakeaway ? 'text-[#FF5700]' : 'text-slate-800 dark:text-white'}`}>
                        {isTakeaway ? <ShoppingBag className="h-6 w-6" /> : <UtensilsCrossed className="h-6 w-6" />}
                        {isTakeaway ? 'TAKEAWAY' : `MEJA ${order.table_number}`}
                      </h2>
                    </div>
                    <Badge className={`rounded-full px-4 py-1 text-[9px] font-black uppercase border-none ${isPreparing ? 'bg-indigo-50 text-indigo-600' :
                      isReady ? 'bg-[#00BA4A]/10 text-[#00BA4A]' : 'bg-[#FF5700]/10 text-[#FF5700]'
                      }`}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="space-y-4 flex-1 mb-8">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 p-5 rounded-[1.8rem] bg-[#F8FAF9] dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                        <div className="h-10 w-10 shrink-0 rounded-2xl bg-[#1A1C1E] flex items-center justify-center shadow-lg">
                          <span className="font-bold text-white text-base">{item.quantity}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-serif font-bold text-slate-800 dark:text-slate-100 uppercase leading-tight">{item.name}</p>
                          {item.notes && item.notes !== "-" && (
                            <div className="flex items-center gap-2 mt-2 text-[#FF5700] bg-[#FF5700]/5 px-3 py-1 rounded-full w-fit border border-[#FF5700]/10">
                              <AlertCircle className="h-3 w-3" />
                              <p className="text-[9px] font-black uppercase tracking-widest">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    {order.status === 'pending' && (
                      <Button
                        className="w-full bg-[#FF5700] hover:bg-[#e64e00] text-white font-bold uppercase text-[11px] tracking-[0.2em] h-14 rounded-2xl transition-all shadow-lg shadow-orange-100 dark:shadow-none border-none"
                        onClick={() => updateStatus(order.id, 'preparing')}
                      >
                        <Flame className="h-4 w-4 mr-2 animate-pulse" /> Mulai Masak
                      </Button>
                    )}

                    {order.status === 'preparing' && (
                      <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-[11px] tracking-[0.2em] h-14 rounded-2xl transition-all shadow-lg shadow-indigo-100 dark:shadow-none border-none"
                        onClick={() => updateStatus(order.id, 'ready')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Tandai Selesai
                      </Button>
                    )}

                    {order.status === 'ready' && (
                      <Button
                        className="w-full bg-[#00BA4A] hover:bg-[#009e3f] text-white font-bold uppercase text-[11px] tracking-[0.2em] h-14 rounded-2xl transition-all shadow-lg shadow-green-100 border-none"
                        onClick={() => updateStatus(order.id, 'served')}
                      >
                        {isTakeaway ? 'Siap Diambil' : 'Sajikan Meja'} <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* EMPTY STATE */}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 animate-in fade-in zoom-in duration-700">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[#00BA4A]/10 blur-[50px] rounded-full" />
              <div className="relative p-12 bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm">
                <ChefHat className="h-20 w-20 text-[#00BA4A] opacity-20" />
              </div>
            </div>
            <h3 className="text-slate-900 dark:text-white font-serif font-bold text-3xl tracking-tight uppercase">Dapur <span className="text-[#00BA4A]">Selesai</span></h3>
            <p className="text-slate-400 text-sm font-medium mt-3 tracking-widest uppercase text-[10px]">Semua pesanan telah diproses dengan sempurna</p>
          </div>
        )}
      </main>
    </div>
  )
}