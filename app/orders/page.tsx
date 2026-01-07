"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Search, ShoppingCart, Plus,
  Trash2, Loader2, ImagePlus, Minus,
  ChevronLeft, MessageSquare,
  Sparkles, Utensils, ShoppingBag, Clock, Edit3,
  Flame, CheckCircle2, Store
} from "lucide-react"
import Link from "next/link"

type MenuItem = { id: string; name: string; price: number; image: string; category: string }
type OrderItem = MenuItem & { quantity: number; notes: string }

export default function OrdersPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<OrderItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in')
  const [occupiedTables, setOccupiedTables] = useState<number[]>([])
  const [formData, setFormData] = useState({ name: "", price: "" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedTableId, setSelectedTableId] = useState("1")

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  useEffect(() => {
    setMounted(true)
    fetchMenu()
    fetchTableStatuses()
    fetchActiveOrders()

    const menuChannel = supabase
      .channel('menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchMenu())
      .subscribe()

    const tableChannel = supabase
      .channel('pos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => fetchTableStatuses())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchActiveOrders())
      .subscribe()

    return () => {
      supabase.removeChannel(menuChannel)
      supabase.removeChannel(tableChannel)
    }
  }, [])

  const fetchActiveOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
    if (data) setActiveOrders(data)
  }

  const fetchTableStatuses = async () => {
    const { data: tablesData } = await supabase.from('tables').select('number, status')
    if (tablesData) {
      const occupied = tablesData.filter(t => t.status === 'occupied' || t.status === 'reserved').map(t => t.number)
      setOccupiedTables(occupied)
    }
  }

  const fetchMenu = async () => {
    const { data, error } = await supabase.from('menu_items').select('*').order('created_at', { ascending: false })
    if (!error && data) setMenuItems(data)
    setLoading(false)
  }

  const editOrder = async (order: any) => {
    if (cart.length > 0) {
      if (!confirm("Isi keranjang akan diganti dengan pesanan yang diedit. Lanjutkan?")) return
    }
    const { error } = await supabase.from('orders').delete().eq('id', order.id)
    if (!error) {
      const itemsToCart = order.items.map((item: any) => ({
        id: Math.random().toString(),
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
        image: ""
      }))
      setCart(itemsToCart)
      setOrderType(order.order_type)
      setSelectedTableId(order.table_number.toString())
      toast.info(`Pesanan ditarik. Silakan sesuaikan kuantitas/menu lalu kirim ulang.`)
    }
  }

  const cancelOrder = async (orderId: string, tableNum: number) => {
    if (!confirm("Batalkan pesanan ini?")) return
    const { error } = await supabase.from('orders').delete().eq('id', orderId)
    if (!error) {
      if (tableNum !== 0) {
        await supabase.from('tables').update({ status: 'available' }).eq('number', tableNum)
      }
      toast.success("Pesanan dibatalkan")
    }
  }

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.name === item.name)
      if (existing) return prev.map((i) => (i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i))
      return [...prev, { ...item, quantity: 1, notes: "" }]
    })
  }

  const decreaseQuantity = (id: string) => {
    setCart((prev) => {
      const existing = prev.find(i => i.id === id)
      if (existing?.quantity === 1) return prev.filter(i => i.id !== id)
      return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i)
    })
  }

  const updateNotes = (id: string, notes: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, notes } : item))
  }

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return
    const toastId = toast.loading("Mengirim data terbaru ke dapur...")
    setIsSending(true)
    try {
      const { error: orderError } = await supabase.from('orders').insert([{
        table_number: orderType === 'takeaway' ? 0 : parseInt(selectedTableId),
        order_type: orderType,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || "-"
        })),
        status: 'pending',
        total_amount: total
      }])
      if (orderError) throw orderError
      if (orderType === 'dine_in') {
        await supabase.from('tables').update({ status: 'occupied' }).eq('number', parseInt(selectedTableId))
      }
      toast.success("Pesanan berhasil dikirim!", { id: toastId })
      setCart([])
    } catch (error: any) {
      toast.error("Gagal: " + error.message, { id: toastId })
    } finally {
      setIsSending(false)
    }
  }

  const handleAddMenu = async () => {
    if (!formData.name || !formData.price || !selectedFile) { toast.error("Lengkapi data menu!"); return }
    setUploading(true)
    try {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `menu/${fileName}`
      const { error: uploadError } = await supabase.storage.from('menu-images').upload(filePath, selectedFile)
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(filePath)
      const { error: dbError } = await supabase.from('menu_items').insert([{ name: formData.name, price: Number(formData.price), image: urlData.publicUrl, category: "General" }])
      if (dbError) throw dbError
      toast.success("Menu ditambahkan")
      setFormData({ name: "", price: "" }); setSelectedFile(null);
    } catch (error: any) { toast.error("Gagal: " + error.message) } finally { setUploading(false) }
  }

  const handleDeleteMenu = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Hapus menu ini?")) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id)
      if (!error) toast.success("Menu dihapus")
    }
  }

  const tablesList = Array.from({ length: 12 }, (_, i) => ({ id: `${i + 1}`, number: i + 1 }))

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-[#00BA4A]/20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[30%] h-[30%] bg-[#00BA4A]/5 rounded-full blur-[100px]" />
      </div>

      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6">
        <div className="container mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                <ChevronLeft className="h-5 w-5 text-[#00BA4A]" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-serif font-bold uppercase tracking-tight">Kasir<span className="text-[#00BA4A]">in</span> POS</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00BA4A] animate-pulse" /> Kitchen Synchronized
              </p>
            </div>
          </div>
          <Badge className="bg-[#00BA4A]/10 text-[#00BA4A] border-none font-bold text-[10px] rounded-full px-4 py-1.5 uppercase tracking-widest">
            {menuItems.length} Produk Tersedia
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 grid lg:grid-cols-12 gap-10 relative z-10">
        <div className="lg:col-span-7 space-y-10">
          <Card className="p-8 border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5"><Plus className="h-12 w-12" /></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-[#00BA4A]/10 rounded-lg"><Sparkles className="h-4 w-4 text-[#00BA4A]" /></div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tambah Menu Baru</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input className="bg-slate-50 border-none h-12 rounded-2xl text-xs px-5 focus-visible:ring-1 focus-visible:ring-[#00BA4A]" placeholder="Nama Produk" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <Input className="bg-slate-50 border-none h-12 rounded-2xl text-xs px-5 focus-visible:ring-1 focus-visible:ring-[#00BA4A]" type="number" placeholder="Harga (Rp)" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              <div className="relative group">
                <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <Button variant="outline" className="w-full justify-start gap-2 border-dashed border-slate-200 h-12 text-xs rounded-2xl overflow-hidden bg-white hover:bg-slate-50">
                  <ImagePlus className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate text-slate-400">{selectedFile ? selectedFile.name : "Upload Foto"}</span>
                </Button>
              </div>
              <Button onClick={handleAddMenu} disabled={uploading} className="h-12 bg-[#00BA4A] hover:bg-[#00BA4A] text-white rounded-2xl font-bold uppercase text-[11px] transition-all hover:shadow-[0_10px_30px_-5px_rgba(0,186,74,0.5)]">
                {uploading ? <Loader2 className="animate-spin" /> : "Simpan Menu"}
              </Button>
            </div>
          </Card>

          <div className="space-y-8">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#00BA4A] transition-colors" />
              <Input placeholder="Cari menu untuk pelanggan..." className="pl-14 h-16 bg-white dark:bg-slate-900 border-none shadow-sm rounded-[2rem] text-sm text-slate-900 dark:text-white placeholder:text-slate-300" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {menuItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                <Card key={item.id} className="group relative overflow-hidden border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-[2.5rem]" onClick={() => addToCart(item)}>
                  <Button variant="destructive" size="icon" className="absolute top-4 right-4 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 z-20 shadow-lg scale-75 group-hover:scale-100 transition-all" onClick={(e) => handleDeleteMenu(item.id, e)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="aspect-square rounded-[2rem] overflow-hidden mb-4 bg-slate-50">
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                  </div>
                  <div className="px-2 pb-2">
                    <h3 className="font-serif font-bold text-sm truncate text-slate-800 dark:text-slate-200">{item.name}</h3>
                    <p className="text-[#00BA4A] font-bold text-base mt-1 italic font-serif">Rp {item.price.toLocaleString()}</p>
                  </div>
                  <div className="absolute bottom-4 right-6 bg-[#00BA4A] text-white p-2 rounded-xl translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                    <Plus className="h-4 w-4" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <Card className="flex flex-col h-[700px] overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem]">
            <div className="p-8 bg-[#1A1C1E] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00BA4A] rounded-2xl"><ShoppingCart className="h-6 w-6 text-white" /></div>
                <div>
                  <h2 className="text-xl font-serif font-bold tracking-tight">Checkout</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Detail Pesanan</p>
                </div>
              </div>
              <Badge className={`${orderType === 'takeaway' ? 'bg-[#FF5700]' : 'bg-[#00BA4A]'} border-none px-5 py-1.5 text-[10px] font-black uppercase rounded-full shadow-lg`}>
                {orderType === 'takeaway' ? 'Bungkus' : `Meja ${selectedTableId}`}
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                  <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                    <ShoppingBag className="h-10 w-10 opacity-20" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">Keranjang Kosong</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 transition-all hover:border-[#00BA4A]/30">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-4">
                        <p className="font-serif font-bold text-base text-slate-800 dark:text-slate-200 leading-tight mb-1">{item.name}</p>
                        <p className="text-[#00BA4A] font-bold text-sm">Rp {item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl p-1 shadow-sm border border-slate-100 dark:border-slate-800">
                        <button onClick={() => decreaseQuantity(item.id)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"><Minus className="h-4 w-4" /></button>
                        <span className="font-bold text-sm px-4 text-slate-800 dark:text-white">{item.quantity}</span>
                        <button onClick={() => addToCart(item as MenuItem)} className="p-2 text-[#00BA4A] hover:bg-green-50 dark:hover:bg-slate-800 rounded-xl transition-colors"><Plus className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-950/40 px-4 py-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <MessageSquare className="h-4 w-4 text-slate-300" />
                      <input type="text" placeholder="Tambahkan catatan khusus..." className="bg-transparent border-none text-[11px] w-full focus:outline-none font-medium text-slate-500" value={item.notes} onChange={(e) => updateNotes(item.id, e.target.value)} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 border-t bg-slate-50/80 dark:bg-slate-900/50 space-y-6">
              <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-800 rounded-[1.5rem] border border-slate-200/50">
                <button onClick={() => setOrderType('dine_in')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.2rem] text-[11px] font-bold transition-all ${orderType === 'dine_in' ? 'bg-white dark:bg-slate-700 shadow-md text-[#00BA4A]' : 'text-slate-400'}`}>
                  <Utensils className="h-4 w-4" /> MAKAN DI SINI
                </button>
                <button onClick={() => setOrderType('takeaway')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.2rem] text-[11px] font-bold transition-all ${orderType === 'takeaway' ? 'bg-white dark:bg-slate-700 shadow-md text-[#FF5700]' : 'text-slate-400'}`}>
                  <ShoppingBag className="h-4 w-4" /> BUNGKUS
                </button>
              </div>

              {orderType === 'dine_in' && (
                <div className="grid grid-cols-6 gap-2">
                  {tablesList.map((table) => (
                    <button key={table.id} onClick={() => setSelectedTableId(table.id)} disabled={occupiedTables.includes(table.number) && selectedTableId !== table.id} className={`h-10 rounded-xl text-[11px] font-bold border-2 transition-all ${selectedTableId === table.id ? "bg-[#00BA4A] border-[#00BA4A] text-white shadow-lg shadow-green-100" : occupiedTables.includes(table.number) ? "bg-rose-50 border-rose-50 text-rose-200 cursor-not-allowed" : "bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 text-slate-400"}`}>{table.number}</button>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Bayar</span>
                  <span className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">Rp {total.toLocaleString()}</span>
                </div>
                <Button className="h-16 px-10 rounded-[1.5rem] bg-[#00BA4A] hover:bg-[#00BA4A] text-white font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 hover:shadow-[0_10px_30px_-5px_rgba(0,186,74,0.6)]" disabled={cart.length === 0 || isSending} onClick={handleSendToKitchen}>
                  {isSending ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                  Kirim Dapur
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-sm bg-white dark:bg-slate-900 rounded-[3rem]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#FF5700]/10 rounded-xl"><Clock className="h-5 w-5 text-[#FF5700]" /></div>
                <h3 className="text-sm font-serif font-bold tracking-tight">Status Pesanan Aktif</h3>
              </div>
              <Badge className="bg-slate-50 text-slate-400 border-none text-[10px] px-4 py-1 rounded-full uppercase font-bold tracking-widest">{activeOrders.length} Pesanan</Badge>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {activeOrders.map((ord) => {
                const isPending = ord.status === 'pending';
                const isPreparing = ord.status === 'preparing';
                const isReady = ord.status === 'ready';

                return (
                  <div key={ord.id} className={`flex items-center justify-between p-5 rounded-[2rem] border transition-all ${isReady ? 'bg-green-50/50 border-green-100' : 'bg-slate-50/50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-800'}`}>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-serif font-bold uppercase text-slate-800 dark:text-slate-200">
                        {ord.table_number === 0 ? "🛍️ Takeaway" : `🪑 Meja ${ord.table_number}`}
                      </span>
                      <div className="flex items-center gap-2">
                        {isPending && <Badge className="text-[9px] bg-slate-200 text-slate-600 border-none font-bold uppercase tracking-tighter">Antrean</Badge>}
                        {isPreparing && <Badge className="text-[9px] bg-[#00BA4A]/10 text-[#00BA4A] border-none font-bold uppercase tracking-tighter flex items-center gap-1"><Flame className="h-3 w-3 animate-pulse" /> Dimasak</Badge>}
                        {isReady && <Badge className="text-[9px] bg-[#FF5700] text-white border-none font-bold uppercase tracking-tighter flex items-center gap-1 shadow-md shadow-orange-100 animate-bounce"><CheckCircle2 className="h-3 w-3" /> Siap!</Badge>}
                        <span className="text-[10px] text-slate-400 font-medium">{ord.items?.length} Menu</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {isPending && (
                        <>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-[#00BA4A] hover:bg-green-50 rounded-full" onClick={() => editOrder(ord)}><Edit3 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-400 hover:bg-rose-50 rounded-full" onClick={() => cancelOrder(ord.id, ord.table_number)}><Trash2 className="h-4 w-4" /></Button>
                        </>
                      )}
                      {isReady && <div className="p-2 bg-[#FF5700] rounded-full text-white shadow-lg"><Store className="h-4 w-4" /></div>}
                    </div>
                  </div>
                );
              })}
              {activeOrders.length === 0 && (
                <div className="text-center py-12 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                  <Clock className="h-8 w-8 mx-auto mb-3 text-slate-200" />
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Semua Pesanan Selesai</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}