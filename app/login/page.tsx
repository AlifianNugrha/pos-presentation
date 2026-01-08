"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UtensilsCrossed, ArrowRight, Lock, Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            // Jika berhasil, arahkan ke dashboard
            router.push("/dashboard")
        } catch (error: any) {
            alert(error.message || "Gagal masuk. Silakan periksa kembali email dan password Anda.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans bg-white selection:bg-[#00BA4A]/30">
            {/* SISI KIRI: BRANDING & VISUAL */}
            <div className="hidden md:flex bg-[#1A1C1E] p-12 flex-col justify-between relative overflow-hidden">
                {/* Dekorasi Glow Minimalis */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#00BA4A]/10 rounded-full -mr-40 -mt-40 blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FF5700]/10 rounded-full -ml-40 -mb-40 blur-[100px]" />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-[#1A1C1E] p-2.5 rounded-xl border border-white/10 shadow-2xl">
                        <UtensilsCrossed className="h-6 w-6 text-[#00BA4A]" />
                    </div>
                    <span className="text-2xl font-serif font-bold text-white tracking-tight uppercase">
                        Kasir<span className="text-[#00BA4A]">in</span>
                    </span>
                </div>

                <div className="relative z-10">
                    <h2 className="text-5xl font-serif font-bold text-white leading-[1.1] mb-6 tracking-tight">
                        Kelola Bisnis <br />
                        <span className="text-[#00BA4A]">Lebih Efisien.</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-sm font-medium leading-relaxed">
                        Satu platform untuk kendali penuh atas transaksi, stok, dan laporan pendapatan secara real-time.
                    </p>
                </div>

                <div className="relative z-10 text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
                    &copy; 2026 Kasirin — Premium POS Solution
                </div>
            </div>

            {/* SISI KANAN: FORM LOGIN */}
            <div className="flex items-center justify-center p-8 bg-[#F8FAF9]">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-4xl font-serif font-bold text-slate-900 uppercase tracking-tight">
                            Selamat <span className="text-[#00BA4A]">Datang</span>
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Masukkan email dan password untuk mengelola tokomu.
                        </p>
                    </div>

                    <Card className="p-8 border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] bg-white">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">
                                    Email Business
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all focus:ring-[#00BA4A]"
                                        placeholder="admin@warungberkah.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                                        Password
                                    </label>
                                    <Link href="#" className="text-[10px] font-bold text-[#FF5700] uppercase hover:underline">
                                        Lupa?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all focus:ring-[#00BA4A]"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#1A1C1E] hover:bg-black text-white h-14 rounded-2xl mt-4 font-bold transition-all shadow-lg hover:shadow-black/20 group flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Masuk ke Dashboard
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-[#00BA4A]" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>

                    <div className="pt-4 text-center">
                        <p className="text-sm text-slate-500 font-medium">
                            Belum memiliki akun Kasirin?
                            <Link href="/register" className="ml-2 font-bold text-[#00BA4A] hover:underline transition-all">
                                Daftar Sekarang
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}