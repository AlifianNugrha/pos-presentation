"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, DollarSign } from "lucide-react"

type Table = {
  id: string
  number: number
  capacity: number
  status: "available" | "occupied" | "reserved"
  currentBill?: number
  duration?: string
  guests?: number
}

export default function TablesPage() {
  const [tables] = useState<Table[]>([
    { id: "1", number: 1, capacity: 2, status: "available" },
    { id: "2", number: 2, capacity: 4, status: "occupied", currentBill: 150000, duration: "45 min", guests: 3 },
    { id: "3", number: 3, capacity: 4, status: "available" },
    { id: "4", number: 4, capacity: 6, status: "occupied", currentBill: 280000, duration: "1h 20m", guests: 5 },
    { id: "5", number: 5, capacity: 4, status: "occupied", currentBill: 95000, duration: "25 min", guests: 2 },
    { id: "6", number: 6, capacity: 2, status: "reserved" },
    { id: "7", number: 7, capacity: 8, status: "available" },
    { id: "8", number: 8, capacity: 4, status: "occupied", currentBill: 320000, duration: "55 min", guests: 4 },
    { id: "9", number: 9, capacity: 4, status: "available" },
    { id: "10", number: 10, capacity: 6, status: "reserved" },
    { id: "11", number: 11, capacity: 2, status: "occupied", currentBill: 75000, duration: "15 min", guests: 2 },
    { id: "12", number: 12, capacity: 4, status: "available" },
  ])

  const stats = {
    total: tables.length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    available: tables.filter((t) => t.status === "available").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
  }

  const getStatusColor = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "border-chart-3 bg-chart-3/10"
      case "occupied":
        return "border-destructive bg-destructive/10"
      case "reserved":
        return "border-chart-4 bg-chart-4/10"
    }
  }

  const getStatusBadge = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return <Badge className="bg-chart-3 text-white">Tersedia</Badge>
      case "occupied":
        return <Badge className="bg-destructive text-white">Terisi</Badge>
      case "reserved":
        return <Badge className="bg-chart-4 text-white">Reserved</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manajemen Meja</h1>
            <p className="text-sm text-muted-foreground">Layout & Status Meja</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-card border-border">
            <p className="text-sm text-muted-foreground mb-1">Total Meja</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-card border-destructive/50 bg-destructive/5">
            <p className="text-sm text-muted-foreground mb-1">Terisi</p>
            <p className="text-2xl font-bold text-destructive">{stats.occupied}</p>
          </Card>
          <Card className="p-4 bg-card border-chart-3/50 bg-chart-3/5">
            <p className="text-sm text-muted-foreground mb-1">Tersedia</p>
            <p className="text-2xl font-bold text-chart-3">{stats.available}</p>
          </Card>
          <Card className="p-4 bg-card border-chart-4/50 bg-chart-4/5">
            <p className="text-sm text-muted-foreground mb-1">Reserved</p>
            <p className="text-2xl font-bold text-chart-4">{stats.reserved}</p>
          </Card>
        </div>

        {/* Table Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={`p-5 border-2 cursor-pointer hover:scale-105 transition-transform ${getStatusColor(table.status)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-foreground">Meja {table.number}</h3>
                {getStatusBadge(table.status)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Kapasitas: {table.capacity} orang</span>
                </div>

                {table.status === "occupied" && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{table.guests} tamu</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{table.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary font-bold pt-2 border-t border-border">
                      <DollarSign className="h-4 w-4" />
                      <span>Rp {table.currentBill?.toLocaleString("id-ID")}</span>
                    </div>
                  </>
                )}
              </div>

              {table.status === "occupied" && (
                <div className="mt-4 pt-4 border-t border-border flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs bg-transparent">
                    Tambah Order
                  </Button>
                  <Link href="/payment" className="flex-1">
                    <Button size="sm" className="w-full text-xs">
                      Bayar
                    </Button>
                  </Link>
                </div>
              )}

              {table.status === "available" && (
                <Button size="sm" variant="outline" className="w-full mt-4 bg-transparent">
                  Buka Meja
                </Button>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
