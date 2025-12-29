"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, ChefHat } from "lucide-react"

type OrderStatus = "pending" | "preparing" | "ready" | "served"

type KitchenOrder = {
  id: string
  tableNumber: number
  items: { name: string; quantity: number; notes?: string }[]
  status: OrderStatus
  orderTime: string
  waitTime: string
  priority: "normal" | "high"
  zone: "Hot Kitchen" | "Cold Kitchen" | "Grill" | "Bar"
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([
    {
      id: "001",
      tableNumber: 5,
      items: [
        { name: "Nasi Goreng Special", quantity: 2, notes: "Pedas level 3" },
        { name: "Ayam Bakar", quantity: 1 },
      ],
      status: "pending",
      orderTime: "14:35",
      waitTime: "2 min",
      priority: "high",
      zone: "Hot Kitchen",
    },
    {
      id: "002",
      tableNumber: 8,
      items: [
        { name: "Es Teh Manis", quantity: 3 },
        { name: "Jus Alpukat", quantity: 2 },
      ],
      status: "preparing",
      orderTime: "14:32",
      waitTime: "5 min",
      priority: "normal",
      zone: "Bar",
    },
    {
      id: "003",
      tableNumber: 2,
      items: [
        { name: "Soto Ayam", quantity: 2 },
        { name: "Nasi Putih", quantity: 2 },
      ],
      status: "preparing",
      orderTime: "14:28",
      waitTime: "9 min",
      priority: "normal",
      zone: "Hot Kitchen",
    },
    {
      id: "004",
      tableNumber: 11,
      items: [{ name: "Steak Daging", quantity: 1, notes: "Medium rare" }],
      status: "preparing",
      orderTime: "14:25",
      waitTime: "12 min",
      priority: "high",
      zone: "Grill",
    },
    {
      id: "005",
      tableNumber: 4,
      items: [{ name: "Salad Caesar", quantity: 2 }],
      status: "ready",
      orderTime: "14:20",
      waitTime: "17 min",
      priority: "normal",
      zone: "Cold Kitchen",
    },
  ])

  const [selectedZone, setSelectedZone] = useState<string>("Semua")
  const zones = ["Semua", "Hot Kitchen", "Cold Kitchen", "Grill", "Bar"]

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
  }

  const filteredOrders = selectedZone === "Semua" ? orders : orders.filter((order) => order.zone === selectedZone)

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-chart-4 text-white"
      case "preparing":
        return "bg-primary text-primary-foreground"
      case "ready":
        return "bg-chart-3 text-white"
      case "served":
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "Menunggu"
      case "preparing":
        return "Diproses"
      case "ready":
        return "Siap"
      case "served":
        return "Terkirim"
    }
  }

  const stats = {
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kitchen Display System</h1>
              <p className="text-sm text-muted-foreground">Monitor & Kelola Pesanan Dapur</p>
            </div>
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-card border-chart-4/50 bg-chart-4/5">
            <p className="text-sm text-muted-foreground mb-1">Menunggu</p>
            <p className="text-3xl font-bold text-chart-4">{stats.pending}</p>
          </Card>
          <Card className="p-4 bg-card border-primary/50 bg-primary/5">
            <p className="text-sm text-muted-foreground mb-1">Diproses</p>
            <p className="text-3xl font-bold text-primary">{stats.preparing}</p>
          </Card>
          <Card className="p-4 bg-card border-chart-3/50 bg-chart-3/5">
            <p className="text-sm text-muted-foreground mb-1">Siap</p>
            <p className="text-3xl font-bold text-chart-3">{stats.ready}</p>
          </Card>
        </div>

        {/* Zone Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {zones.map((zone) => (
            <Button
              key={zone}
              variant={selectedZone === zone ? "default" : "outline"}
              onClick={() => setSelectedZone(zone)}
              className="whitespace-nowrap"
            >
              {zone}
            </Button>
          ))}
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className={`p-5 bg-card border-2 ${order.priority === "high" ? "border-destructive" : "border-border"}`}
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Meja {order.tableNumber}</h3>
                  <p className="text-xs text-muted-foreground">Order #{order.id}</p>
                </div>
                <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
              </div>

              {/* Time Info */}
              <div className="flex items-center gap-4 mb-4 p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{order.orderTime}</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      Number.parseInt(order.waitTime) > 10 ? "text-destructive" : "text-chart-3"
                    }`}
                  >
                    ⏱ {order.waitTime}
                  </span>
                </div>
                <Badge variant="outline" className="ml-auto text-xs">
                  {order.zone}
                </Badge>
              </div>

              {/* Order Items */}
              <div className="space-y-2 mb-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Badge variant="secondary" className="mt-0.5 text-xs">
                      {item.quantity}x
                    </Badge>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{item.name}</p>
                      {item.notes && <p className="text-xs text-destructive italic">📝 {item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {order.status === "pending" && (
                  <>
                    <Button size="sm" className="flex-1" onClick={() => updateOrderStatus(order.id, "preparing")}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mulai Masak
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "served")}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {order.status === "preparing" && (
                  <Button
                    size="sm"
                    className="flex-1 bg-chart-3 hover:bg-chart-3/90"
                    onClick={() => updateOrderStatus(order.id, "ready")}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Selesai
                  </Button>
                )}
                {order.status === "ready" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => updateOrderStatus(order.id, "served")}
                  >
                    Sudah Diantar
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground">Tidak ada pesanan di zona ini</p>
          </div>
        )}
      </main>
    </div>
  )
}
