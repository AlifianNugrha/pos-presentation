"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase" // Pastikan path ini benar sesuai project Anda
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
import {
  Store, Printer, Users, Shield,
  Database, HelpCircle, ArrowLeft, Save,
  Loader2, Check, ChevronRight, Globe,
  RefreshCcw, Trash2, Lock, MessageSquare
} from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  // --- SETTINGS STATE ---
  const [settings, setSettings] = useState({
    restaurantName: "Warung Makan Berkah",
    phone: "0812345678",
    address: "Jl. Merdeka No. 123, Jakarta Pusat",
    footerMessage: "Terima kasih atas kunjungan Anda!",
    printerName: "Epson TM-T88V",
    printerIp: "192.168.1.100",
    autoPrint: true,
    autoLock: false,
    cashierPin: "1234"
  })

  // --- STAFF STATE ---
  const [staffs, setStaffs] = useState<any[]>([])
  const [isAddingStaff, setIsAddingStaff] = useState(false)
  const [newStaff, setNewStaff] = useState({ name: "", role: "Cashier" })

  useEffect(() => {
    setMounted(true)

    // Load Settings (Tetap localStorage untuk konfigurasi lokal aplikasi)
    const savedData = localStorage.getItem("pos_settings")
    if (savedData) setSettings(JSON.parse(savedData))

    // Load Staffs dari Supabase agar sinkron dengan halaman Shift
    fetchStaffs()
  }, [])

  // Fungsi untuk mengambil data staff dari Supabase
  const fetchStaffs = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles') // Nama tabel disesuaikan dengan integrasi database Anda
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      if (data) {
        const colors = [
          "bg-indigo-100 text-indigo-600",
          "bg-emerald-100 text-emerald-600",
          "bg-orange-100 text-orange-600",
          "bg-rose-100 text-rose-600"
        ]

        const formattedData = data.map((s: any, i: number) => ({
          ...s,
          initial: s.name ? s.name.charAt(0).toUpperCase() : "?",
          color: colors[i % colors.length]
        }))
        setStaffs(formattedData)
      }
    } catch (error) {
      console.error("Error fetching staff:", error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulasi delay sinkronisasi
    await new Promise(resolve => setTimeout(resolve, 1200))
    localStorage.setItem("pos_settings", JSON.stringify(settings))
    window.dispatchEvent(new Event("storage"))
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => {
      setSaveSuccess(false)
      setActiveTab(null)
    }, 1500)
  }

  const handleAddStaff = async () => {
    if (!newStaff.name) return
    setIsSaving(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          name: newStaff.name,
          role: newStaff.role
        }])
        .select()

      if (error) throw error

      // Refresh list setelah berhasil tambah
      await fetchStaffs()
      setNewStaff({ name: "", role: "Cashier" })
      setIsAddingStaff(false)
    } catch (error) {
      console.error("Error adding staff:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteStaff = async (index: number) => {
    const target = staffs[index]
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('name', target.name) // Filter berdasarkan nama atau ID jika ada

      if (error) throw error

      const updated = staffs.filter((_, i) => i !== index)
      setStaffs(updated)
    } catch (error) {
      console.error("Error deleting staff:", error)
    }
  }

  const sections = [
    { id: "info", title: "Informasi Restoran", description: "Nama, alamat, dan detail kontak", icon: Store, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
    { id: "device", title: "Perangkat & Printer", description: "Konfigurasi cetak struk", icon: Printer, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { id: "users", title: "Manajemen User", description: "Kasir, waiter, dan hak akses", icon: Users, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { id: "security", title: "Keamanan", description: "Password, PIN, dan kunci layar", icon: Shield, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
    { id: "database", title: "Database & Backup", description: "Manajemen data dan restore", icon: Database, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { id: "support", title: "Bantuan", description: "Panduan dan kontak bantuan", icon: HelpCircle, color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800" },
  ]

  if (!mounted) return null

  if (!activeTab) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-background font-[family-name:var(--font-poppins)]">
        <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">Settings</h1>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1">System Configuration</p>
              </div>
            </div>
            <ModeToggle />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <Card className="p-8 mb-8 border-none shadow-sm bg-indigo-600 text-white rounded-[2rem] overflow-hidden relative group">
            <div className="relative z-10 flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100">Live Production</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">{settings.restaurantName}</h2>
                  <p className="text-indigo-100/80 text-sm font-medium mt-1 max-w-md">{settings.address}</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 bg-white/10 rounded-full blur-3xl" />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((s) => (
              <Card
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className="p-6 cursor-pointer border-none bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group rounded-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-12 w-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{s.description}</p>
              </Card>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background font-[family-name:var(--font-poppins)]">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40 px-4 py-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setActiveTab(null); setIsAddingStaff(false); }} className="rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {sections.find(s => s.id === activeTab)?.title}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-2xl">
        <Card className="relative overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem]">
          {(isSaving || saveSuccess) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
              {isSaving ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-full">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-600 animate-pulse">Saving to database...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                    <Check className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-emerald-600">Sync Successful!</p>
                </div>
              )}
            </div>
          )}

          <div className="p-8 space-y-8">
            {/* 1. RESTAURANT INFO */}
            {activeTab === "info" && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Restaurant Name</Label>
                  <Input className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-medium" value={settings.restaurantName} onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Phone Number</Label>
                  <Input className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-medium" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Address</Label>
                  <Textarea className="min-h-[120px] rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-medium py-3" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
                </div>
              </div>
            )}

            {/* 2. DEVICE & PRINTER */}
            {activeTab === "device" && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Printer Name</Label>
                  <Input className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-medium" value={settings.printerName} onChange={(e) => setSettings({ ...settings, printerName: e.target.value })} />
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Auto-Print Receipt</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Print automatically after payment</p>
                  </div>
                  <Switch checked={settings.autoPrint} onCheckedChange={(val) => setSettings({ ...settings, autoPrint: val })} />
                </div>
              </div>
            )}

            {/* 3. USER MANAGEMENT */}
            {activeTab === "users" && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Active Staff</Label>
                  <Button variant="link" onClick={() => setIsAddingStaff(!isAddingStaff)} className="text-indigo-600 text-xs font-bold h-auto p-0">
                    {isAddingStaff ? "Cancel" : "+ Add New Staff"}
                  </Button>
                </div>

                {isAddingStaff && (
                  <div className="p-4 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 border-2 border-dashed border-indigo-200 space-y-3">
                    <Input placeholder="Staff Name" className="h-10 rounded-xl border-none bg-white dark:bg-slate-800 font-bold" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
                    <select className="w-full h-10 rounded-xl bg-white dark:bg-slate-800 border-none px-3 font-bold text-xs outline-none" value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}>
                      <option value="Cashier">Cashier</option>
                      <option value="Waiter">Waiter</option>
                      <option value="Owner">Owner</option>
                    </select>
                    <Button onClick={handleAddStaff} className="w-full bg-indigo-600 h-10 rounded-xl font-bold text-[10px] uppercase">Add Member</Button>
                  </div>
                )}

                <div className="space-y-3">
                  {staffs.map((user, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border border-slate-100 dark:border-slate-800 group transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${user.color} flex items-center justify-center font-bold text-xs`}>{user.initial}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase">{user.role}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteStaff(i)} className="h-8 w-8 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. SECURITY */}
            {activeTab === "security" && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Cashier PIN (4 Digits)</Label>
                  <div className="flex gap-3">
                    {[0, 1, 2, 3].map((i) => (
                      <Input key={i} type="password" maxLength={1} className="h-14 w-full rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-center text-lg font-bold" defaultValue={settings.cashierPin[i]} />
                    ))}
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Auto-Lock Screen</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Lock app after 5 mins of inactivity</p>
                  </div>
                  <Switch checked={settings.autoLock} onCheckedChange={(val) => setSettings({ ...settings, autoLock: val })} />
                </div>
              </div>
            )}

            {/* 5. DATABASE & BACKUP */}
            {activeTab === "database" && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Database Health: Excellent</p>
                  </div>
                  <Button className="w-full bg-white dark:bg-slate-900 text-emerald-600 font-bold text-[10px] h-10 rounded-xl shadow-sm border-none">
                    <RefreshCcw className="h-3 w-3 mr-2" /> SYNC TO CLOUD
                  </Button>
                </div>
              </div>
            )}

            {/* 6. SUPPORT */}
            {activeTab === "support" && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="text-center py-4">
                  <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Butuh Bantuan?</h3>
                  <p className="text-xs text-slate-500 px-8 mt-2 leading-relaxed">Tim support kami siap membantu operasional harian Anda 24/7.</p>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Panduan Cepat</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Buka menu 'Database' untuk mencadangkan transaksi harian Anda secara berkala.</p>
                  </div>
                  <Button className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 h-14 rounded-2xl font-black text-xs uppercase tracking-widest">
                    <MessageSquare className="h-4 w-4 mr-2" /> Hubungi WhatsApp
                  </Button>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            {activeTab !== "support" && (
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl font-bold shadow-lg transition-all" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
                <Button variant="ghost" onClick={() => { setActiveTab(null); setIsAddingStaff(false); }} className="h-12 rounded-xl text-slate-400 font-bold">
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}