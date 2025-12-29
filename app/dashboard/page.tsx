import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock } from "lucide-react"

export default function DashboardPage() {
  const salesData = [
    { time: "08:00", amount: 450000 },
    { time: "09:00", amount: 680000 },
    { time: "10:00", amount: 920000 },
    { time: "11:00", amount: 1250000 },
    { time: "12:00", amount: 2100000 },
    { time: "13:00", amount: 1850000 },
    { time: "14:00", amount: 1350000 },
  ]

  const topItems = [
    { name: "Nasi Goreng Special", sold: 45, revenue: "Rp 1.350.000" },
    { name: "Ayam Bakar", sold: 38, revenue: "Rp 1.140.000" },
    { name: "Es Teh Manis", sold: 120, revenue: "Rp 360.000" },
    { name: "Soto Ayam", sold: 32, revenue: "Rp 800.000" },
  ]

  const maxAmount = Math.max(...salesData.map((d) => d.amount))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Statistik & Analitik Penjualan</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">29 Desember 2025</p>
              <p className="text-xs text-muted-foreground">Shift: Siang (08:00 - 16:00)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Penjualan</p>
              <DollarSign className="h-5 w-5 text-chart-1" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">Rp 15.450.000</p>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-chart-3" />
              <span className="text-chart-3 font-medium">+12.5%</span>
              <span className="text-muted-foreground">vs kemarin</span>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <ShoppingBag className="h-5 w-5 text-chart-2" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">156</p>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-chart-3" />
              <span className="text-chart-3 font-medium">+8.2%</span>
              <span className="text-muted-foreground">vs kemarin</span>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Rata-rata Bill</p>
              <Users className="h-5 w-5 text-chart-4" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">Rp 99.038</p>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-chart-3" />
              <span className="text-chart-3 font-medium">+3.8%</span>
              <span className="text-muted-foreground">vs kemarin</span>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Waktu Tunggu Avg</p>
              <Clock className="h-5 w-5 text-chart-5" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">12 menit</p>
            <div className="flex items-center gap-1 text-sm">
              <TrendingDown className="h-4 w-4 text-chart-3" />
              <span className="text-chart-3 font-medium">-2 min</span>
              <span className="text-muted-foreground">vs kemarin</span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <Card className="p-6 bg-card border-border lg:col-span-2">
            <h3 className="text-lg font-bold text-foreground mb-6">Grafik Penjualan Per Jam</h3>
            <div className="space-y-3">
              {salesData.map((data) => (
                <div key={data.time} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-16">{data.time}</span>
                  <div className="flex-1 h-8 bg-secondary rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-primary rounded-lg transition-all duration-500"
                      style={{ width: `${(data.amount / maxAmount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-32 text-right">
                    Rp {data.amount.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Items */}
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-bold text-foreground mb-6">Menu Terlaris</h3>
            <div className="space-y-4">
              {topItems.map((item, index) => (
                <div key={item.name} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sold} terjual</p>
                  </div>
                  <p className="text-sm font-bold text-chart-1 flex-shrink-0">{item.revenue}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Payment Methods */}
        <Card className="p-6 bg-card border-border mt-6">
          <h3 className="text-lg font-bold text-foreground mb-6">Metode Pembayaran</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { method: "Cash", amount: "Rp 6.2M", percentage: "40%" },
              { method: "QRIS", amount: "Rp 4.6M", percentage: "30%" },
              { method: "Debit Card", amount: "Rp 2.8M", percentage: "18%" },
              { method: "GoPay", amount: "Rp 1.2M", percentage: "8%" },
              { method: "OVO", amount: "Rp 465K", percentage: "3%" },
              { method: "DANA", amount: "Rp 155K", percentage: "1%" },
            ].map((payment) => (
              <div key={payment.method} className="text-center">
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-accent">{payment.percentage}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{payment.method}</p>
                <p className="text-xs text-muted-foreground">{payment.amount}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
