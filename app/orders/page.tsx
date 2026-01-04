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
  ChevronLeft, ReceiptText, MessageSquare,
  Sparkles, Layers, Utensils, ShoppingBag
} from "lucide-react"
import Link from "next/link"

type MenuItem = {
  id: string
  name: string
  price: number
  image: string
  category: string
}

type OrderItem = MenuItem & {
  quantity: number
  notes: string
}

export default function OrdersPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<OrderItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [mounted, setMounted] = useState(false)

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

    const menuChannel = supabase
      .channel('menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchMenu())
      .subscribe()

    const tableChannel = supabase
      .channel('table-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => fetchTableStatuses())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchTableStatuses())
      .subscribe()

    return () => {
      supabase.removeChannel(menuChannel)
      supabase.removeChannel(tableChannel)
    }
  }, [])

  const fetchTableStatuses = async () => {
    const { data: tablesData } = await supabase
      .from('tables')
      .select('number, status')

    if (tablesData) {
      const occupied = tablesData
        .filter(t => t.status === 'occupied' || t.status === 'reserved')
        .map(t => t.number)
      setOccupiedTables(occupied)
    }
  }

  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setMenuItems(data)
    setLoading(false)
  }

  const handleAddMenu = async () => {
    if (!formData.name || !formData.price || !selectedFile) {
      toast.error("Isi data menu dengan lengkap!")
      return
    }
    setUploading(true)
    try {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `menu/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase.from('menu_items').insert([
        {
          name: formData.name,
          price: Number(formData.price),
          image: urlData.publicUrl,
          category: "Makanan"
        }
      ])
      if (dbError) throw dbError
      toast.success("Menu berhasil ditambahkan")
      setFormData({ name: "", price: "" }); setSelectedFile(null);
    } catch (error: any) {
      toast.error("Gagal menyimpan: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMenu = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Hapus menu ini secara permanen?")) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id)
      if (!error) toast.success("Menu dihapus")
    }
  }

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
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
    const toastId = toast.loading("Memproses pesanan...")
    setIsSending(true)

    try {
      // 1. INPUT KE TABEL ORDERS (Untuk Monitor Dapur)
      const { error: orderError } = await supabase
        .from('orders')
        .insert([
          {
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
          }
        ])

      if (orderError) throw orderError

      // 2. INPUT KE TABEL REVENUE (Agar Langsung Masuk History/Dashboard)
      const { error: revenueError } = await supabase
        .from('revenue')
        .insert([
          {
            table_number: orderType === 'takeaway' ? 0 : parseInt(selectedTableId),
            total_amount: total,
            payment_method: "Tunai", // Default
            created_at: new Date().toISOString()
          }
        ])

      if (revenueError) throw revenueError

      // 3. Update status meja jika dine-in
      if (orderType === 'dine_in') {
        const { error: tableError } = await supabase
          .from('tables')
          .update({ status: 'occupied' })
          .eq('number', parseInt(selectedTableId))
        if (tableError) throw tableError
      }

      toast.success(orderType === 'takeaway' ? "Takeaway Berhasil Dicatat!" : `Meja #${selectedTableId} Berhasil!`, { id: toastId })
      setCart([])
      fetchTableStatuses()
    } catch (error: any) {
      toast.error("Gagal: " + error.message, { id: toastId })
    } finally {
      setIsSending(false)
    }
  }

  const tablesList = Array.from({ length: 12 }, (_, i) => ({ id: `${i + 1}`, number: i + 1 }))

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-[family-name:var(--font-poppins)]">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">Point of Sale</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 mt-0.5 tracking-[0.2em]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> System Online
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-indigo-200 text-indigo-600 bg-indigo-50 font-black text-[10px] uppercase tracking-widest rounded-full px-3 py-1">
            {menuItems.length} Menu Ready
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="p-6 border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[2.5rem]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add New Menu</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input className="bg-slate-100 dark:bg-slate-800 border-none text-[11px] h-11 rounded-2xl font-bold" placeholder="Menu Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <Input className="bg-slate-100 dark:bg-slate-800 border-none text-[11px] h-11 rounded-2xl font-bold" type="number" placeholder="Price" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              <div className="relative group">
                <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <Button variant="outline" className="w-full justify-start gap-2 border-dashed border-2 border-slate-200 dark:border-slate-700 h-11 text-[11px] rounded-2xl font-bold">
                  <ImagePlus className="h-4 w-4 shrink-0 text-indigo-500" />
                  <span className="truncate">{selectedFile ? selectedFile.name : "Choose Image"}</span>
                </Button>
              </div>
              <Button onClick={handleAddMenu} disabled={uploading} className="bg-slate-900 dark:bg-indigo-600 h-11 text-[11px] rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg border-none text-white">
                {uploading ? <Loader2 className="animate-spin" /> : "Save Menu"}
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search menu..."
                className="pl-12 h-14 bg-white dark:bg-slate-900 border-none shadow-xl rounded-[2rem] text-sm font-bold transition-all focus:ring-2 ring-indigo-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {menuItems
                .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item) => (
                  <Card key={item.id} className="group relative overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-[2.5rem]" onClick={() => addToCart(item)}>
                    <Button variant="destructive" size="icon" className="absolute top-4 right-4 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 z-20 shadow-xl" onClick={(e) => handleDeleteMenu(item.id, e)}><Trash2 className="h-4 w-4" /></Button>
                    <div className="aspect-square rounded-[2rem] overflow-hidden mb-5">
                      <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-black text-base text-slate-800 dark:text-slate-100 truncate uppercase tracking-tight">{item.name}</h3>
                      <p className="text-indigo-600 font-black text-lg">Rp {item.price.toLocaleString()}</p>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 relative">
          <Card className="flex flex-col h-[calc(100vh-120px)] sticky top-24 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem]">
            <div className="p-5 bg-indigo-600 text-white shrink-0 relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                    <ReceiptText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-tight leading-none">Checkout</h2>
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] opacity-70">Order ID: #{new Date().getTime().toString().slice(-4)}</span>
                  </div>
                </div>
                <Badge className={`${orderType === 'takeaway' ? 'bg-orange-500' : 'bg-white/20'} border-none font-black text-[9px] px-3 py-1 rounded-full uppercase`}>
                  {orderType === 'takeaway' ? 'Bungkus' : `Meja ${selectedTableId}`}
                </Badge>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white dark:bg-transparent">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                  <ShoppingCart className="h-10 w-10 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Keranjang Kosong</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="space-y-2 pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-[12px] text-slate-800 dark:text-slate-100 uppercase block truncate">{item.name}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">Rp {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl p-1 shrink-0 scale-90">
                        <button onClick={() => decreaseQuantity(item.id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500"><Minus className="h-3 w-3" /></button>
                        <span className="font-black text-[11px] px-2 min-w-[20px] text-center">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-indigo-600"><Plus className="h-3 w-3" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl">
                      <MessageSquare className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="CATATAN..."
                        className="bg-transparent border-none text-[9px] w-full focus:outline-none text-slate-600 dark:text-slate-300 font-bold uppercase"
                        value={item.notes}
                        onChange={(e) => updateNotes(item.id, e.target.value)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="shrink-0 bg-white dark:bg-slate-900 border-t">
              <div className="p-3 flex gap-2 bg-slate-50/50 dark:bg-slate-800/30">
                <button
                  onClick={() => setOrderType('dine_in')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${orderType === 'dine_in' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
                >
                  <Utensils className="h-3 w-3" /> Makan Sini
                </button>
                <button
                  onClick={() => setOrderType('takeaway')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${orderType === 'takeaway' ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-500' : 'text-slate-400'}`}
                >
                  <ShoppingBag className="h-3 w-3" /> Bungkus
                </button>
              </div>

              <div className={`px-6 py-4 transition-all duration-500 ${orderType === 'takeaway' ? 'h-0 py-0 opacity-0 overflow-hidden' : 'h-auto opacity-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nomor Meja</span>
                  <span className="text-[9px] font-black text-indigo-500">{selectedTableId} terpilih</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {tablesList.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTableId(table.id)}
                      className={`h-8 rounded-lg text-[10px] font-black transition-all active:scale-90 border-2
                        ${selectedTableId === table.id && orderType === 'dine_in' ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" :
                          occupiedTables.includes(table.number) ? "bg-rose-500 border-rose-500 text-white" :
                            "bg-white dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400"}`}
                    >
                      {table.number}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-7 pb-7 space-y-4">
                <div className="flex justify-between items-center border-t pt-5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Bayar</span>
                  <span className="text-xl font-black text-indigo-600 tracking-tighter">Rp {total.toLocaleString()}</span>
                </div>
                <Button
                  className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.1em] text-[10px] transition-all shadow-xl border-none disabled:bg-slate-200 dark:disabled:bg-slate-800"
                  disabled={cart.length === 0 || isSending}
                  onClick={handleSendToKitchen}
                >
                  {isSending ? <Loader2 className="animate-spin h-4 w-4" /> : "Kirim Ke Dapur"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}