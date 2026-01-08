"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
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
  RefreshCcw, Trash2, Lock, MessageSquare,
  Sparkles
} from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [settings, setSettings] = useState({
    restaurantName: "Memuat...",
    phone: "",
    address: "",
    footerMessage: "Terima kasih atas kunjungan Anda!",
    printerName: "Epson TM-T88V",
    printerIp: "192.168.1.100",
    autoPrint: true,
    autoLock: false,
    cashierPin: "1234"
  })

  const [staffs, setStaffs] = useState<any[]>([])
  const [isAddingStaff, setIsAddingStaff] = useState(false)
  const [newStaff, setNewStaff] = useState({ name: "", role: "Cashier" })

  useEffect(() => {
    setMounted(true)
    initializeSettings()
    fetchStaffs()
  }, [])

  const initializeSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const savedData = localStorage.getItem(`pos_settings_${user.id}`)
      if (savedData) {
        setSettings(JSON.parse(savedData))
      } else {
        setSettings(prev => ({
          ...prev,
          restaurantName: user.user_metadata?.restaurant_name || "Restoran Baru",
          phone: user.phone || ""
        }))
      }
    }
  }

  const fetchStaffs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (error) throw error

      if (data) {
        const colors = ["bg-green-100 text-[#00BA4A]", "bg-orange-100 text-[#FF5700]", "bg-blue-100 text-blue-600", "bg-slate-100 text-slate-600"]
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    localStorage.setItem(`pos_settings_${user.id}`, JSON.stringify(settings))
    window.dispatchEvent(new Event("storage"))
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => { setSaveSuccess(false); setActiveTab(null); }, 1500)
  }

  const handleAddStaff = async () => {
    if (!newStaff.name) return
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('profiles').insert([{ user_id: user.id, name: newStaff.name, role: newStaff.role }])
      if (error) throw error
      await fetchStaffs()
      setNewStaff({ name: "", role: "Cashier" })
      setIsAddingStaff(false)
    } catch (error) {
      console.error("Error adding staff:", error)
    } finally { setIsSaving(false) }
  }

  const deleteStaff = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase.from('profiles').delete().eq('id', id).eq('user_id', user.id)
      if (!error) setStaffs(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error("Error deleting staff:", error)
    }
  }

  const sections = [
    { id: "info", title: "Info Restoran", description: "Nama, alamat, dan kontak", icon: Store, color: "text-[#00BA4A]", bg: "bg-green-50" },
    { id: "device", title: "Printer Struk", description: "Konfigurasi cetak struk", icon: Printer, color: "text-blue-600", bg: "bg-blue-50" },
    { id: "users", title: "Manajemen Staf", description: "Hak akses kasir & waiter", icon: Users, color: "text-[#FF5700]", bg: "bg-orange-50" },
    { id: "security", title: "Keamanan", description: "PIN kasir & kunci layar", icon: Shield, color: "text-rose-600", bg: "bg-rose-50" },
    { id: "database", title: "Cloud Sync", description: "Manajemen backup data", icon: Database, color: "text-emerald-600", bg: "bg-emerald-50" },
    { id: "support", title: "Pusat Bantuan", description: "Panduan & Support 24/7", icon: HelpCircle, color: "text-slate-600", bg: "bg-slate-100" },
  ]

  if (!mounted) return null

  if (!activeTab) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-[#00BA4A]/20">
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6">
          <div className="container mx-auto py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100"><ArrowLeft className="h-5 w-5 text-[#00BA4A]" /></Button>
              </Link>
              <div>
                <h1 className="text-xl font-serif font-bold uppercase tracking-tight leading-none">Pengaturan <span className="text-[#00BA4A]">Sistem</span></h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfigurasi Natadesa POS</p>
              </div>
            </div>
            <ModeToggle />
          </div>
        </header>

        <main className="container mx-auto px-6 py-10 max-w-5xl space-y-10 relative z-10">
          <Card className="p-10 border-none shadow-sm bg-[#1A1C1E] text-white rounded-[2.5rem] overflow-hidden relative group">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
              <div className="space-y-4">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <div className="p-2 bg-[#00BA4A]/20 rounded-xl backdrop-blur-md border border-[#00BA4A]/20"><Globe className="h-4 w-4 text-[#00BA4A]" /></div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#00BA4A]">Terminal Aktif</span>
                </div>
                <div>
                  <h2 className="text-3xl font-serif font-bold italic tracking-tight">{settings.restaurantName}</h2>
                  <p className="text-slate-400 text-sm font-medium mt-2 max-w-md">{settings.address || "Alamat belum diatur"}</p>
                </div>
              </div>
              <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:rotate-45 transition-transform duration-700"><Store className="h-8 w-8 text-[#00BA4A]" /></div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((s) => (
              <Card key={s.id} onClick={() => setActiveTab(s.id)} className="p-8 cursor-pointer border-none bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group rounded-[2rem]">
                <div className="flex items-center justify-between mb-6">
                  <div className={`h-14 w-14 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform`}><s.icon className="h-7 w-7" /></div>
                  <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-[#00BA4A] group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="font-serif font-bold text-lg text-slate-800 dark:text-white mb-2">{s.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{s.description}</p>
              </Card>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 font-sans selection:bg-[#00BA4A]/20">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setActiveTab(null); setIsAddingStaff(false); }} className="rounded-full hover:bg-slate-100 transition-colors"><ArrowLeft className="h-5 w-5 text-[#00BA4A]" /></Button>
          <h1 className="text-xl font-serif font-bold text-slate-800 dark:text-white">{sections.find(s => s.id === activeTab)?.title}</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-3xl relative z-10">
        <Card className="relative overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900 rounded-[3rem]">
          {(isSaving || saveSuccess) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
              {isSaving ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-[#00BA4A]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#00BA4A]">Menyimpan Data...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                  <div className="h-20 w-20 rounded-full bg-[#00BA4A]/10 flex items-center justify-center"><Check className="h-10 w-10 text-[#00BA4A]" /></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#00BA4A]">Sinkronisasi Berhasil</p>
                </div>
              )}
            </div>
          )}

          <div className="p-10 space-y-10">
            {activeTab === "info" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Unit Bisnis</Label>
                  <Input className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-serif font-bold px-6" value={settings.restaurantName} onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })} />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Alamat Lengkap</Label>
                  <Textarea className="min-h-[140px] rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-medium px-6 py-4" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Daftar Staf Aktif</Label>
                  <Button variant="ghost" onClick={() => setIsAddingStaff(!isAddingStaff)} className="text-[#00BA4A] text-[10px] font-black uppercase tracking-widest h-auto p-0 hover:bg-transparent">{isAddingStaff ? "Batal" : "+ Tambah Staf"}</Button>
                </div>
                {isAddingStaff && (
                  <div className="p-8 rounded-[2.5rem] bg-green-50/30 dark:bg-green-950/20 border-2 border-dashed border-[#00BA4A]/20 space-y-4">
                    <Input placeholder="Nama Lengkap Staf" className="h-12 rounded-2xl border-none bg-white dark:bg-slate-800 font-bold px-6 shadow-sm" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
                    <select className="w-full h-12 rounded-2xl bg-white dark:bg-slate-800 border-none px-6 font-bold text-xs outline-none" value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}>
                      <option value="Cashier">Kasir / POS</option>
                      <option value="Waiter">Waiter / Pramusaji</option>
                      <option value="Owner">Manajer / Owner</option>
                    </select>
                    <Button onClick={handleAddStaff} className="w-full bg-[#00BA4A] hover:bg-[#009e3f] h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]">Tambah Anggota</Button>
                  </div>
                )}
                <div className="space-y-4">
                  {staffs.map((user) => (
                    <div key={user.id} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border border-slate-100 dark:border-slate-800 group hover:border-[#00BA4A]/30 transition-all">
                      <div className="flex items-center gap-5">
                        <div className={`h-12 w-12 rounded-2xl ${user.color} flex items-center justify-center font-bold text-sm shadow-sm`}>{user.initial}</div>
                        <div>
                          <p className="text-base font-serif font-bold text-slate-800 dark:text-white leading-none">{user.name}</p>
                          <p className="text-[10px] text-[#00BA4A] font-bold uppercase tracking-widest mt-2">{user.role}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteStaff(user.id)} className="h-10 w-10 text-slate-200 hover:text-rose-600"><Trash2 className="h-5 w-5" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab && activeTab !== "support" && (
              <div className="pt-8 flex flex-col sm:flex-row gap-4 border-t border-slate-50 dark:border-slate-800">
                <Button onClick={handleSave} className="flex-1 bg-[#00BA4A] hover:bg-[#009e3f] text-white h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-green-100 transition-all active:scale-95" disabled={isSaving}><Save className="h-4 w-4 mr-3" /> Simpan Perubahan</Button>
                <Button variant="ghost" onClick={() => { setActiveTab(null); setIsAddingStaff(false); }} className="h-14 rounded-2xl text-slate-300 font-black text-[10px] uppercase tracking-widest hover:text-slate-900">Batal</Button>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}