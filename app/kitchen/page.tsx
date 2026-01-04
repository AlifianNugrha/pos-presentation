"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle, ChefHat, Loader2, Flame,
  Clock, Hash, ChevronRight, AlertCircle,
  Users, ShoppingBag
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

  const updateStatus = async (id: string, newStatus: string, tableNumber?: number) => {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-background font-[family-name:var(--font-poppins)]">
      <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background font-[family-name:var(--font-poppins)]">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none tracking-tight">Kitchen Display</h1>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1">Real-time Order Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 text-indigo-600 font-bold px-3 py-1 text-[10px] tracking-wider">
              {orders.length} ACTIVE ORDERS
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Meja</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{tableStats.total}</p>
          </Card>
          <Card className="p-4 border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Terisi</p>
            <p className="text-2xl font-bold text-rose-600">{tableStats.occupied}</p>
          </Card>
          <Card className="p-4 border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Tersedia</p>
            <p className="text-2xl font-bold text-emerald-600">{tableStats.available}</p>
          </Card>
          <Card className="p-4 border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Reserved</p>
            <p className="text-2xl font-bold text-amber-600">{tableStats.reserved}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order) => {
            const isPreparing = order.status === 'preparing';
            const isReady = order.status === 'ready';
            const isNew = order.status === 'pending';
            const isTakeaway = order.table_number === 0;

            return (
              <Card key={order.id} className={`flex flex-col border-none shadow-sm transition-all duration-300 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 group ${isPreparing ? 'ring-2 ring-indigo-500 shadow-indigo-100' : ''}`}>
                <div className={`h-1.5 w-full ${isNew ? 'bg-orange-500' : isPreparing ? 'bg-indigo-500' : 'bg-emerald-500'}`} />

                <div className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Hash className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Ref: {order.id.slice(0, 5)}</span>
                      </div>
                      <h2 className={`text-2xl font-bold tracking-tight Poppins flex items-center gap-2 ${isTakeaway ? 'text-orange-600' : 'text-slate-900 dark:text-white'}`}>
                        {isTakeaway ? (
                          <>
                            <ShoppingBag className="h-6 w-6" /> TAKEAWAY
                          </>
                        ) : (
                          `MEJA ${order.table_number}`
                        )}
                      </h2>
                    </div>
                    <Badge className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase border-none ${isPreparing ? 'bg-indigo-50 text-indigo-600' :
                      isReady ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="space-y-3 flex-1 mb-6">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="h-8 w-8 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-100 dark:shadow-none">
                          <span className="font-bold text-white text-sm">{item.quantity}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-tight">{item.name}</p>
                          {item.notes && item.notes !== "-" && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md w-fit">
                              <AlertCircle className="h-3 w-3" />
                              <p className="text-[10px] font-bold uppercase tracking-tight">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    {order.status === 'pending' && (
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase text-[11px] tracking-widest h-12 rounded-2xl transition-all shadow-lg shadow-orange-100 border-none"
                        onClick={() => updateStatus(order.id, 'preparing')}
                      >
                        <Flame className="h-4 w-4 mr-2" /> Mulai Masak
                      </Button>
                    )}

                    {order.status === 'preparing' && (
                      <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-[11px] tracking-widest h-12 rounded-2xl transition-all shadow-lg shadow-indigo-100 border-none"
                        onClick={() => updateStatus(order.id, 'ready')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Selesai Masak
                      </Button>
                    )}

                    {order.status === 'ready' && (
                      <Button
                        variant="outline"
                        className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold uppercase text-[11px] tracking-widest h-12 rounded-2xl transition-all"
                        onClick={() => updateStatus(order.id, 'served')}
                      >
                        {isTakeaway ? 'Siap Diambil' : 'Antarkan Pesanan'} <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 animate-in fade-in zoom-in duration-700">
            <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm mb-6">
              <ChefHat className="h-16 w-16 text-indigo-100 dark:text-slate-800" />
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold text-xl tracking-tight">Dapur Bersih!</h3>
            <p className="text-slate-500 text-sm font-medium mt-1">Semua pesanan sudah selesai diproses.</p>
          </div>
        )}
      </main>
    </div>
  )
}