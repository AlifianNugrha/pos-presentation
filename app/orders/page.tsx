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
  Sparkles, Utensils, ShoppingBag
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
      toast.error("Lengkapi data menu!")
      return
    }
    setUploading(true)
    try {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `menu/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, selectedFile)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(filePath)

      const { error: dbError } = await supabase.from('menu_items').insert([
        {
          name: formData.name,
          price: Number(formData.price),
          image: urlData.publicUrl,
          category: "General"
        }
      ])
      if (dbError) throw dbError
      toast.success("Menu ditambahkan")
      setFormData({ name: "", price: "" }); setSelectedFile(null);
    } catch (error: any) {
      toast.error("Gagal: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMenu = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Hapus menu ini?")) {
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

    // Validasi Meja jika Dine In
    if (orderType === 'dine_in' && occupiedTables.includes(parseInt(selectedTableId))) {
      toast.error("Meja ini masih terisi!");
      return;
    }

    const toastId = toast.loading("Mengirim pesanan ke dapur...")
    setIsSending(true)

    try {
      // 1. INPUT KE TABEL ORDERS (Hanya ini untuk pesanan baru)
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

      // 2. Update status meja jika dine-in
      if (orderType === 'dine_in') {
        const { error: tableError } = await supabase
          .from('tables')
          .update({ status: 'occupied' })
          .eq('number', parseInt(selectedTableId))
        if (tableError) throw tableError
      }

      toast.success("Pesanan berhasil dikirim!", { id: toastId })
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
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Kitchen Linked
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-indigo-200 text-indigo-600 bg-indigo-50 font-black text-[10px] rounded-full px-3 py-1 uppercase">
            {menuItems.length} Items Available
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Add Menu Section */}
          <Card className="p-6 border-none shadow-sm bg-card rounded-[2rem]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick Add Menu</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input className="bg-muted border-none text-xs h-10 rounded-xl" placeholder="Nama Menu" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <Input className="bg-muted border-none text-xs h-10 rounded-xl" type="number" placeholder="Harga" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              <div className="relative group">
                <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <Button variant="outline" className="w-full justify-start gap-2 border-dashed h-10 text-xs rounded-xl overflow-hidden">
                  <ImagePlus className="h-4 w-4 shrink-0" />
                  <span className="truncate">{selectedFile ? selectedFile.name : "Foto"}</span>
                </Button>
              </div>
              <Button onClick={handleAddMenu} disabled={uploading} className="h-10 text-xs rounded-xl font-bold uppercase">
                {uploading ? <Loader2 className="animate-spin" /> : "Simpan"}
              </Button>
            </div>
          </Card>

          {/* Menu Search & Grid */}
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari menu favorit..."
                className="pl-12 h-12 bg-white dark:bg-slate-900 border-none shadow-sm rounded-2xl text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {menuItems
                .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item) => (
                  <Card key={item.id} className="group relative overflow-hidden border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-card p-3 rounded-3xl" onClick={() => addToCart(item)}>
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 z-20" onClick={(e) => handleDeleteMenu(item.id, e)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <div className="aspect-square rounded-2xl overflow-hidden mb-3">
                      <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={item.name} />
                    </div>
                    <div className="px-1">
                      <h3 className="font-bold text-xs truncate uppercase tracking-tight">{item.name}</h3>
                      <p className="text-indigo-600 font-bold text-sm mt-1">Rp {item.price.toLocaleString()}</p>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="lg:col-span-4">
          <Card className="flex flex-col h-[calc(100vh-120px)] sticky top-24 overflow-hidden border-none shadow-xl bg-card rounded-[2.5rem]">
            <div className="p-5 bg-indigo-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <ReceiptText className="h-4 w-4" />
                <h2 className="text-sm font-bold uppercase">Checkout</h2>
              </div>
              <Badge className={`${orderType === 'takeaway' ? 'bg-orange-500' : 'bg-indigo-500'} border-none text-[9px]`}>
                {orderType === 'takeaway' ? 'Bungkus' : `Meja ${selectedTableId}`}
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30 py-10">
                  <ShoppingCart className="h-8 w-8 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Keranjang Kosong</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="p-3 bg-muted/30 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="max-w-[150px]">
                        <p className="font-bold text-[11px] uppercase truncate">{item.name}</p>
                        <p className="text-indigo-600 font-bold text-[10px]">Rp {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center bg-background rounded-lg p-1 scale-90 shadow-sm">
                        <button onClick={() => decreaseQuantity(item.id)} className="p-1 text-muted-foreground"><Minus className="h-3 w-3" /></button>
                        <span className="font-bold text-xs px-2">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="p-1 text-indigo-600"><Plus className="h-3 w-3" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-background/50 px-2 py-1 rounded-lg">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Catatan..."
                        className="bg-transparent border-none text-[9px] w-full focus:outline-none font-medium uppercase"
                        value={item.notes}
                        onChange={(e) => updateNotes(item.id, e.target.value)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 border-t bg-card space-y-4">
              <div className="flex p-1 bg-muted rounded-xl">
                <button onClick={() => setOrderType('dine_in')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-bold transition-all ${orderType === 'dine_in' ? 'bg-background shadow-sm text-indigo-600' : 'text-muted-foreground'}`}>
                  <Utensils className="h-3 w-3" /> DINE IN
                </button>
                <button onClick={() => setOrderType('takeaway')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-bold transition-all ${orderType === 'takeaway' ? 'bg-background shadow-sm text-orange-500' : 'text-muted-foreground'}`}>
                  <ShoppingBag className="h-3 w-3" /> TAKEAWAY
                </button>
              </div>

              {orderType === 'dine_in' && (
                <div className="grid grid-cols-6 gap-1">
                  {tablesList.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTableId(table.id)}
                      disabled={occupiedTables.includes(table.number)}
                      className={`h-7 rounded-md text-[10px] font-bold border-2 transition-all
                        ${selectedTableId === table.id ? "bg-indigo-600 border-indigo-600 text-white" :
                          occupiedTables.includes(table.number) ? "bg-rose-100 border-rose-100 text-rose-400 cursor-not-allowed" :
                            "bg-background border-transparent"}`}
                    >
                      {table.number}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Amount</span>
                <span className="text-xl font-black text-indigo-600">Rp {total.toLocaleString()}</span>
              </div>

              <Button
                className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg"
                disabled={cart.length === 0 || isSending}
                onClick={handleSendToKitchen}
              >
                {isSending ? <Loader2 className="animate-spin" /> : "Kirim Ke Dapur"}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}