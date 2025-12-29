import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Store, Printer, Wifi, Bell, Users, Shield, Database, HelpCircle } from "lucide-react"

export default function SettingsPage() {
  const settingsSections = [
    {
      title: "Informasi Restoran",
      description: "Nama, alamat, dan detail restoran",
      icon: Store,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Perangkat & Printer",
      description: "Konfigurasi printer dan perangkat POS",
      icon: Printer,
      color: "bg-chart-2/10 text-chart-2",
    },
    {
      title: "Koneksi Internet",
      description: "WiFi, sinkronisasi, dan backup data",
      icon: Wifi,
      color: "bg-chart-3/10 text-chart-3",
    },
    {
      title: "Notifikasi",
      description: "Pengaturan alert dan pemberitahuan",
      icon: Bell,
      color: "bg-chart-4/10 text-chart-4",
    },
    {
      title: "Manajemen User",
      description: "Kasir, waiter, dan hak akses",
      icon: Users,
      color: "bg-chart-5/10 text-chart-5",
    },
    {
      title: "Keamanan",
      description: "Password, PIN, dan autentikasi",
      icon: Shield,
      color: "bg-destructive/10 text-destructive",
    },
    {
      title: "Database & Backup",
      description: "Backup otomatis dan restore data",
      icon: Database,
      color: "bg-accent/10 text-accent",
    },
    {
      title: "Bantuan & Support",
      description: "Tutorial, FAQ, dan hubungi support",
      icon: HelpCircle,
      color: "bg-muted-foreground/10 text-muted-foreground",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
            <p className="text-sm text-muted-foreground">Konfigurasi Sistem & Preferensi</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* System Info Card */}
        <Card className="p-6 bg-card border-border mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Warung Makan Berkah</h2>
              <p className="text-sm text-muted-foreground">Jl. Merdeka No. 123, Jakarta</p>
              <p className="text-xs text-muted-foreground mt-2">POS Core v2.5.0 • Last sync: 2 menit lalu</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-chart-3 mb-1">
                <div className="h-2 w-2 rounded-full bg-chart-3 animate-pulse" />
                <span className="text-sm font-semibold">Online</span>
              </div>
              <p className="text-xs text-muted-foreground">Device ID: POS-001</p>
            </div>
          </div>
        </Card>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsSections.map((section) => (
            <Card
              key={section.title}
              className="p-6 bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-lg cursor-pointer group"
            >
              <div
                className={`h-14 w-14 rounded-xl ${section.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <section.icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {section.title}
              </h3>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="p-6 bg-card border-border mt-8">
          <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">Test Printer</Button>
            <Button variant="outline">Backup Data Now</Button>
            <Button variant="outline">Clear Cache</Button>
            <Button
              variant="outline"
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
            >
              Force Sync
            </Button>
          </div>
        </Card>
      </main>
    </div>
  )
}
