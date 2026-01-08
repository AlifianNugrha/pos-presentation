"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { UtensilsCrossed, ArrowRight, Lock, Mail, Loader2, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [restaurantName, setRestaurantName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // 1. Mendaftar ke Supabase Auth dengan metadata nama restoran
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        restaurant_name: restaurantName,
                    },
                },
            })

            if (error) throw error

            // ALUR OTOMATIS: Jika data session ada, artinya Supabase mengizinkan auto-login
            if (data.session) {
                toast.success("Registrasi berhasil! Selamat datang di dashboard.")
                router.push("/dashboard")
                router.refresh()
            } else if (data.user) {
                // Jika konfirmasi email aktif di Supabase, user harus login manual
                toast.success("Akun berhasil dibuat! Silakan masuk.")
                router.push("/login")
            }

        } catch (error: any) {
            toast.error(error.message || "Gagal melakukan registrasi. Silakan coba lagi.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans bg-white selection:bg-[#00BA4A]/30">

            {/* SISI KIRI: BRANDING & MOTIVASI (ORANGE THEME) */}
            <div className="hidden md:flex bg-[#1A1C1E] p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5700]/10 rounded-full -mr-40 -mt-40 blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FF5700]/5 rounded-full -ml-40 -mb-40 blur-[80px]" />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-[#1A1C1E] p-2.5 rounded-xl border border-white/10 shadow-2xl">
                        <UtensilsCrossed className="h-6 w-6 text-[#FF5700]" />
                    </div>
                    <span className="text-2xl font-serif font-bold text-white tracking-tight uppercase">
                        Kasir<span className="text-[#00BA4A]">in</span>
                    </span>
                </div>

                <div className="relative z-10">
                    <h2 className="text-5xl font-serif font-bold text-white leading-[1.1] mb-6 tracking-tight">
                        Gabung & <br />
                        <span className="text-[#FF5700]">Mulai Suksesmu.</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-sm font-medium leading-relaxed">
                        Dapatkan alat bantu cerdas untuk mengelola setiap transaksi dan operasional dapur restoran Anda.
                    </p>
                </div>

                <div className="relative z-10 text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
                    &copy; 2026 Kasirin — Join the Digital Revolution
                </div>
            </div>

            {/* SISI KANAN: FORM REGISTER */}
            <div className="flex items-center justify-center p-8 bg-[#F8FAF9]">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-4xl font-serif font-bold text-slate-900 uppercase tracking-tight">
                            Daftar <span className="text-[#FF5700]">Baru</span>
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Lengkapi data untuk membuat akun admin restoran.
                        </p>
                    </div>

                    <Card className="p-8 border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] bg-white">
                        <form onSubmit={handleRegister} className="space-y-5">

                            {/* Nama Restoran */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">
                                    Nama Bisnis / Restoran
                                </label>
                                <div className="relative">
                                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="text"
                                        required
                                        value={restaurantName}
                                        onChange={(e) => setRestaurantName(e.target.value)}
                                        className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all focus:ring-[#FF5700]"
                                        placeholder="Contoh: Warung Berkah"
                                    />
                                </div>
                            </div>

                            {/* Email */}
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
                                        className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all focus:ring-[#FF5700]"
                                        placeholder="admin@bisnisanda.com"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all focus:ring-[#FF5700]"
                                        placeholder="Minimal 6 karakter"
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
                                        Buat Akun Sekarang
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-[#FF5700]" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>

                    <div className="pt-4 text-center">
                        <p className="text-sm text-slate-500 font-medium">
                            Sudah menjadi bagian dari kami?
                            <Link href="/login" className="ml-2 font-bold text-[#00BA4A] hover:underline transition-all">
                                Login di sini
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}