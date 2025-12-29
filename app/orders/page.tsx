"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus, ShoppingCart, Trash2 } from "lucide-react"

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
  const [selectedCategory, setSelectedCategory] = useState("Semua")
  const [cart, setCart] = useState<OrderItem[]>([])
  const [selectedTable, setSelectedTable] = useState("Meja 5")

  const categories = ["Semua", "Makanan", "Minuman", "Snack", "Dessert"]

  const menuItems: MenuItem[] = [
    { id: "1", name: "Nasi Goreng Special", price: 30000, category: "Makanan", image: "/nasi-goreng.jpg" },
    { id: "2", name: "Ayam Bakar", price: 35000, category: "Makanan", image: "/ayam-bakar.jpg" },
    { id: "3", name: "Soto Ayam", price: 25000, category: "Makanan", image: "/soto-ayam.jpg" },
    { id: "4", name: "Mie Goreng", price: 22000, category: "Makanan", image: "/mie-goreng.png" },
    { id: "5", name: "Es Teh Manis", price: 5000, category: "Minuman", image: "/es-teh.png" },
    { id: "6", name: "Jus Alpukat", price: 15000, category: "Minuman", image: "/jus-alpukat.jpg" },
    { id: "7", name: "Kopi Susu", price: 12000, category: "Minuman", image: "/kopi-susu.png" },
    { id: "8", name: "Pisang Goreng", price: 10000, category: "Snack", image: "/pisang-goreng.jpg" },
  ]

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "Semua" || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + delta
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    })
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pesanan Baru</h1>
              <p className="text-sm text-muted-foreground">Input & Kelola Pesanan</p>
            </div>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              {selectedTable}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Filter */}
            <Card className="p-4 bg-card border-border">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className="whitespace-nowrap"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="p-4 bg-card border-border hover:border-primary cursor-pointer transition-all"
                  onClick={() => addToCart(item)}
                >
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-24 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2">{item.name}</h3>
                  <p className="text-primary font-bold">Rp {item.price.toLocaleString("id-ID")}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div>
            <Card className="p-6 bg-card border-border sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Keranjang</h2>
                <Badge variant="secondary" className="ml-auto">
                  {cart.length} item
                </Badge>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">Keranjang masih kosong</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Rp {item.price.toLocaleString("id-ID")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-transparent"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-transparent"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold text-foreground">Rp {total.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pajak (10%)</span>
                      <span className="font-semibold text-foreground">Rp {(total * 0.1).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">Rp {(total * 1.1).toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg">
                    Kirim ke Dapur
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
