"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Store, Printer, Users, Shield,
  Database, HelpCircle, ArrowLeft, Save,
  BookOpen, CheckCircle2, HardDrive
} from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const settingsSections = [
    { id: "info", title: "Informasi Restoran", description: "Nama, alamat, dan detail restoran", icon: Store, color: "bg-primary/10 text-primary" },
    { id: "device", title: "Perangkat & Printer", description: "Konfigurasi printer dan perangkat POS", icon: Printer, color: "bg-blue-500/10 text-blue-500" },
    { id: "users", title: "Manajemen User", description: "Kasir, waiter, dan hak akses", icon: Users, color: "bg-orange-500/10 text-orange-500" },
    { id: "security", title: "Keamanan", description: "Password, PIN, dan autentikasi", icon: Shield, color: "bg-destructive/10 text-destructive" },
    { id: "database", title: "Database & Backup", description: "Backup otomatis dan restore data", icon: Database, color: "bg-emerald-500/10 text-emerald-500" },
    { id: "support", title: "Bantuan & Support", description: "Tutorial, FAQ, dan README", icon: HelpCircle, color: "bg-muted-foreground/10 text-muted-foreground" },
  ]

  if (!activeTab) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
            <p className="text-sm text-muted-foreground">Konfigurasi Sistem & Preferensi</p>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <Card className="p-6 bg-card border-border mb-8 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setActiveTab("info")}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Warung Makan Berkah</h2>
                <p className="text-sm text-muted-foreground">Jl. Merdeka No. 123, Jakarta</p>
                <p className="text-xs text-muted-foreground mt-2">POS Core v2.5.0 • Last sync: 2 menit lalu</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-semibold">Online</span>
                </div>
                <p className="text-xs text-muted-foreground">Device ID: POS-001</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settingsSections.map((section) => (
              <Card key={section.id} onClick={() => setActiveTab(section.id)} className="p-6 bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-lg cursor-pointer group">
                <div className={`h-14 w-14 rounded-xl ${section.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <section.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </Card>
            ))}
          </div>
        </main>
      </div>
    )
  }

  const currentSection = settingsSections.find(s => s.id === activeTab) || settingsSections[0]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setActiveTab(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{currentSection.title}</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <Card className="p-8 shadow-sm border-border">

          {/* 1. INFORMASI RESTORAN */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Nama Restoran</Label><Input defaultValue="Warung Makan Berkah" /></div>
                <div className="space-y-2"><Label>No. Telepon</Label><Input defaultValue="0812345678" /></div>
              </div>
              <div className="space-y-2"><Label>Alamat Lengkap</Label><Textarea defaultValue="Jl. Merdeka No. 123, Jakarta Pusat" /></div>
              <div className="space-y-2"><Label>Pesan di Bawah Struk (Footer)</Label><Input defaultValue="Terima kasih atas kunjungan Anda!" /></div>
            </div>
          )}

          {/* 2. PERANGKAT & PRINTER */}
          {activeTab === "device" && (
            <div className="space-y-6">
              <div className="space-y-2"><Label>Nama Printer</Label><Input placeholder="Contoh: Epson TM-T88V" /></div>
              <div className="space-y-2"><Label>Alamat IP / Port</Label><Input placeholder="192.168.1.100" /></div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label>Cetak Struk Otomatis</Label><Switch defaultChecked />
              </div>
              <Button variant="outline" className="w-full">Test Print</Button>
            </div>
          )}

          {/* 3. MANAJEMEN USER */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg flex justify-between items-center">
                <div><p className="font-bold">Admin (Owner)</p><p className="text-xs text-muted-foreground">Akses Penuh</p></div>
                <Button size="sm" variant="ghost">Edit</Button>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg flex justify-between items-center">
                <div><p className="font-bold">Budi Santoso</p><p className="text-xs text-muted-foreground">Kasir - Shift Pagi</p></div>
                <Button size="sm" variant="ghost">Edit</Button>
              </div>
              <Button className="w-full" variant="outline">+ Tambah Karyawan Baru</Button>
            </div>
          )}

          {/* 4. KEAMANAN */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>PIN Akses Kasir (4 Digit)</Label><Input type="password" maxLength={4} placeholder="****" /></div>
              <div className="space-y-2"><Label>Password Admin</Label><Input type="password" placeholder="Password baru" /></div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label>Kunci Layar Otomatis (5 Menit)</Label><Switch />
              </div>
            </div>
          )}

          {/* 5. DATABASE */}
          {activeTab === "database" && (
            <div className="space-y-6 text-center py-4">
              <div className="flex justify-center"><HardDrive className="h-12 w-12 text-emerald-500 mb-2" /></div>
              <div>
                <h3 className="font-bold">Penyimpanan Lokal</h3>
                <p className="text-sm text-muted-foreground">Terakhir Backup: Hari ini, 10:00 AM</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline">Backup Sekarang</Button>
                <Button variant="outline">Restore Data</Button>
              </div>
            </div>
          )}

          {/* 6. SUPPORT (README) */}
          {activeTab === "support" && (
            <div className="prose prose-sm space-y-4">
              <h3 className="flex items-center gap-2 font-bold"><BookOpen className="h-5 w-5" /> Panduan Penggunaan</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                <li><b>Order:</b> Klik meja, pilih menu, tekan "Kirim ke Dapur".</li>
                <li><b>Bayar:</b> Masuk ke tab Billing, pilih meja, masukkan nominal uang.</li>
                <li><b>Printer:</b> Pastikan printer thermal terhubung ke jaringan WiFi yang sama.</li>
              </ul>
              <Button className="w-full mt-4" variant="secondary">Hubungi CS via WhatsApp</Button>
            </div>
          )}

          {activeTab !== "support" && activeTab !== "users" && (
            <div className="pt-8 flex gap-3">
              <Button className="flex-1 gap-2" onClick={() => setActiveTab(null)}><Save className="h-4 w-4" /> Simpan</Button>
              <Button variant="outline" onClick={() => setActiveTab(null)}>Batal</Button>
            </div>
          )}
          {activeTab === "users" && (
            <Button className="w-full mt-4" onClick={() => setActiveTab(null)}>Selesai</Button>
          )}
        </Card>
      </main>
    </div>
  )
}