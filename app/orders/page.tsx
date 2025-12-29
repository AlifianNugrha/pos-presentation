"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search, ShoppingCart, LayoutGrid, Check,
  Minus, Plus, Info
} from "lucide-react"

type Table = {
  id: string
  number: number
  status: "available" | "occupied"
}

type MenuItem = {
  id: string
  name: string
  price: number
  category: string
  image: string
}

type OrderItem = MenuItem & {
  quantity: number
}

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<OrderItem[]>([])

  // Data Meja
  const [tables] = useState<Table[]>([
    { id: "1", number: 1, status: "available" },
    { id: "2", number: 2, status: "occupied" },
    { id: "3", number: 3, status: "available" },
    { id: "4", number: 4, status: "available" },
    { id: "5", number: 5, status: "available" },
    { id: "6", number: 6, status: "occupied" },
    { id: "7", number: 7, status: "available" },
    { id: "8", number: 8, status: "available" },
  ])

  const [selectedTableId, setSelectedTableId] = useState<string>("1")

  // Menu yang diperbanyak dengan gambar riil
  const menuItems: MenuItem[] = [
    {
      id: "1", name: "Nasi Goreng Special", price: 30000, category: "Makanan",
      image: "https://images.unsplash.com/photo-1512058560366-cd242d4587ee?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "2", name: "Mie Ayam Pangsit", price: 22000, category: "Makanan",
      image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "3", name: "Ayam Bakar", price: 35000, category: "Makanan",
      image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "4", name: "Bakso Sapi Urat", price: 25000, category: "Makanan",
      image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "5", name: "Mie Goreng Jawa", price: 22000, category: "Makanan",
      image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "6", name: "Soto Ayam Madura", price: 25000, category: "Makanan",
      image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "7", name: "Es Teh Manis", price: 5000, category: "Minuman",
      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "8", name: "Jus Alpukat", price: 15000, category: "Minuman",
      image: "https://images.unsplash.com/photo-1517089534792-804a3a91dcb8?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "9", name: "Kopi Susu", price: 12000, category: "Minuman",
      image: "https://images.unsplash.com/photo-1512568448817-1c970ff48b91?q=80&w=500&auto=format&fit=crop"
    },
  ]

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const activeTable = tables.find(t => t.id === selectedTableId)
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card px-6 py-4">
        <h1 className="text-xl font-bold">Kasir / Input Order</h1>
      </header>

      <main className="container mx-auto px-4 py-6 grid lg:grid-cols-12 gap-6 flex-1">

        {/* KOLOM KIRI: MENU */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari menu makanan..."
              className="pl-10 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {menuItems
              .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((item) => (
                <Card
                  key={item.id}
                  className="p-3 hover:border-primary cursor-pointer transition-all"
                  onClick={() => addToCart(item)}
                >
                  <div className="aspect-video bg-muted rounded-md mb-3 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform hover:scale-110 duration-300"
                    />
                  </div>
                  <h3 className="font-bold text-sm line-clamp-1">{item.name}</h3>
                  <p className="text-primary font-bold">Rp {item.price.toLocaleString()}</p>
                </Card>
              ))}
          </div>
        </div>

        {/* KOLOM KANAN: KERANJANG & PILIH MEJA */}
        <div className="lg:col-span-4">
          <Card className="flex flex-col h-[calc(100vh-120px)] sticky top-6 overflow-hidden border-2">

            {/* List Pesanan */}
            <div className="p-4 border-b bg-secondary/10">
              <div className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider text-muted-foreground">
                <ShoppingCart className="h-4 w-4" /> Detail Pesanan
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-10 opacity-30">Belum ada item</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{item.name} (x{item.quantity})</span>
                    <span className="font-bold">Rp {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>

            {/* VISUAL PILIH MEJA */}
            <div className="p-4 border-t bg-card space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <LayoutGrid className="h-3 w-3" /> Pilih Nomor Meja
                </label>
                <Badge variant="outline" className="text-primary border-primary">
                  Meja {activeTable?.number} Terpilih
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    disabled={table.status === "occupied"}
                    className={`
                      relative py-2 rounded-md text-xs font-bold transition-all border-2
                      ${selectedTableId === table.id
                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                        : table.status === "occupied"
                          ? "bg-secondary text-muted-foreground cursor-not-allowed border-transparent"
                          : "border-border bg-background hover:border-primary/50"
                      }
                    `}
                  >
                    {table.number}
                    {selectedTableId === table.id && (
                      <Check className="absolute -top-1 -right-1 h-3 w-3 bg-white text-primary rounded-full border border-primary" />
                    )}
                  </button>
                ))}
              </div>

              {activeTable?.status === "occupied" && (
                <div className="flex items-center gap-2 text-[10px] text-destructive bg-destructive/5 p-2 rounded">
                  <Info className="h-3 w-3" /> Meja ini masih digunakan pelanggan lain.
                </div>
              )}
            </div>

            {/* Total & Tombol Kirim */}
            <div className="p-4 bg-secondary/20 border-t space-y-3">
              <div className="flex justify-between items-center text-lg font-black">
                <span>TOTAL</span>
                <span className="text-primary">Rp {(total * 1.1).toLocaleString()}</span>
              </div>
              <Button
                className="w-full py-6 text-md font-bold uppercase tracking-widest"
                disabled={cart.length === 0 || activeTable?.status === "occupied"}
              >
                Kirim ke Dapur (Meja {activeTable?.number})
              </Button>
            </div>

          </Card>
        </div>

      </main>
    </div>
  )
}