"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import { toast } from "sonner"
import {
  CreditCard, Banknote, QrCode, CheckCircle,
  ArrowLeft, Loader2, Receipt, ChevronRight,
  Info, ShoppingBag
} from "lucide-react"

type PaymentMethod = "cash" | "card" | "qris"

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get("table")

  // LOGIKA DETEKSI TAKEAWAY
  const isTakeaway = tableNumber === "0"

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [cashAmount, setCashAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [orderItems, setOrderItems] = useState<any[]>([])
  const [orderId, setOrderId] = useState<string | null>(null)
  const [totalFromDb, setTotalFromDb] = useState<number>(0)

  useEffect(() => {
    setMounted(true)
    async function getActiveOrder() {
      if (!tableNumber) return
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('table_number', parseInt(tableNumber))
          .in('status', ['pending', 'preparing', 'ready', 'served'])
          .order('created_at', { ascending: false }) // Ambil yang paling baru
          .limit(1)
          .maybeSingle()

        if (error) throw error
        if (data) {
          setOrderItems(data.items || [])
          setOrderId(data.id)
          setTotalFromDb(data.total_amount || 0)
        }
      } catch (err) {
        console.error("Gagal mengambil data:", err)
        toast.error("Gagal memuat data pesanan")
      }
    }
    getActiveOrder()
  }, [tableNumber])

  const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0)
  const finalTotal = totalFromDb > 0 ? totalFromDb : subtotal

  const paymentMethods = [
    { id: "cash" as PaymentMethod, name: "Tunai", icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { id: "card" as PaymentMethod, name: "Debit/Kartu", icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { id: "qris" as PaymentMethod, name: "QRIS", icon: QrCode, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
  ]

  const quickCash = [50000, 100000, 150000, 200000]
  const cashAmountNumber = Number.parseInt(cashAmount.replace(/\D/g, "")) || 0
  const change = cashAmountNumber - finalTotal

  const handlePayment = async () => {
    if (!orderId || tableNumber === null) {
      toast.error("Data pesanan tidak valid")
      return
    }

    if (!selectedMethod) {
      toast.warning("Silakan pilih metode pembayaran")
      return
    }

    const toastId = toast.loading("Memproses transaksi...")
    setIsProcessing(true)

    try {
      // 1. Catat ke tabel revenue (Ditambah order_type agar dashboard sinkron)
      const { error: revenueError } = await supabase
        .from('revenue')
        .insert([
          {
            order_id: orderId,
            table_number: parseInt(tableNumber),
            order_type: isTakeaway ? "takeaway" : "dine_in", // Integrasi Takeaway
            total_amount: finalTotal,
            payment_method: selectedMethod,
            items: orderItems,
            created_at: new Date().toISOString(),
          }
        ])

      if (revenueError) throw revenueError

      // 2. Reset status meja menjadi 'available' (Hanya jika bukan takeaway)
      if (!isTakeaway) {
        const { error: tableError } = await supabase
          .from('tables')
          .update({ status: 'available' })
          .eq('number', parseInt(tableNumber))

        if (tableError) throw tableError
      }

      // 3. Update status pesanan menjadi 'completed'
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId)

      if (orderError) throw orderError

      toast.success("Pembayaran Berhasil!", {
        id: toastId,
        description: isTakeaway ? "Pesanan bungkusan selesai." : `Meja #${tableNumber} telah dikosongkan.`,
      })

      setIsPaid(true)
    } catch (err: any) {
      console.error("Payment failed:", err)
      toast.error("Pembayaran Gagal", {
        id: toastId,
        description: err.message,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!mounted) return null

  if (isPaid) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-background flex items-center justify-center p-6 font-[family-name:var(--font-poppins)]">
        <Card className="p-8 border-none text-center max-w-sm w-full shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] animate-in fade-in zoom-in duration-500">
          <div className="h-24 w-24 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Selesai!</h2>
          <p className="text-slate-500 mb-8 text-sm font-medium">
            {isTakeaway ? "Pembayaran bungkusan diterima." : `Pembayaran diterima. Meja #${tableNumber} sekarang tersedia.`}
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 mb-8 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Bayar</span>
              <span className="text-xl font-bold text-indigo-600">Rp {finalTotal.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <Link href="/dashboard" className="w-full">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-bold text-sm">
              Kembali ke Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background font-[family-name:var(--font-poppins)]">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">Checkout</h1>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                {isTakeaway ? <><ShoppingBag className="h-3 w-3" /> Pesanan Takeaway</> : `Meja #${tableNumber}`}
              </p>
            </div>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* RINGKASAN PESANAN */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-[2rem]">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isTakeaway ? <ShoppingBag className="h-4 w-4 text-orange-500" /> : <Receipt className="h-4 w-4 text-indigo-600" />}
                  <h2 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Detail Item</h2>
                </div>
                <Badge variant="outline" className={`${isTakeaway ? 'border-orange-200 text-orange-600' : 'border-indigo-200 text-indigo-600'} font-bold text-[9px] uppercase`}>
                  {isTakeaway ? 'Takeaway' : `TABLE ${tableNumber}`}
                </Badge>
              </div>
              <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto">
                {orderItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">{item.name}</span>
                      <span className="text-[10px] font-medium text-slate-400">{item.quantity} x Rp {Number(item.price).toLocaleString("id-ID")}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Rp {((Number(item.price) || 0) * (Number(item.quantity) || 0)).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
              <div className={`p-8 ${isTakeaway ? 'bg-orange-500' : 'bg-indigo-600'} text-white transition-colors`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">Total Tagihan</span>
                  <span className="text-3xl font-bold tracking-tighter">Rp {finalTotal.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* PEMBAYARAN */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${selectedMethod === m.id
                    ? "border-indigo-600 bg-white dark:bg-slate-900 shadow-xl"
                    : "border-transparent bg-white dark:bg-slate-900 shadow-sm opacity-60"
                    }`}
                >
                  <div className={`p-4 rounded-2xl ${m.bg} ${m.color}`}>
                    <m.icon className="h-7 w-7" />
                  </div>
                  <span className="font-bold text-[10px] uppercase tracking-widest">{m.name}</span>
                </button>
              ))}
            </div>

            {selectedMethod && (
              <Card className="p-8 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] animate-in slide-in-from-bottom-4 duration-500">
                {selectedMethod === "cash" && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block ml-1">Input Tunai</label>
                      <Input
                        className="text-3xl h-20 font-bold text-center bg-slate-50 dark:bg-slate-800 border-none rounded-2xl"
                        placeholder="Rp 0"
                        value={cashAmount}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "")
                          setCashAmount(val ? `Rp ${Number.parseInt(val).toLocaleString("id-ID")}` : "")
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {quickCash.map(amt => (
                        <Button
                          key={amt}
                          variant="outline"
                          className="font-bold h-12 text-[11px] rounded-xl"
                          onClick={() => setCashAmount(`Rp ${amt.toLocaleString("id-ID")}`)}
                        >
                          {amt / 1000}K
                        </Button>
                      ))}
                    </div>
                    {cashAmountNumber > 0 && (
                      <div className={`p-5 rounded-2xl flex justify-between items-center ${change >= 0 ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" : "bg-rose-50 dark:bg-rose-950/20 text-rose-600"
                        }`}>
                        <span className="font-bold text-xs">Kembalian</span>
                        <span className="text-2xl font-bold">
                          {change >= 0 ? `Rp ${change.toLocaleString("id-ID")}` : "Uang Kurang"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {selectedMethod === "qris" && (
                  <div className="flex flex-col items-center py-6 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border shadow-inner">
                      <QrCode className="h-44 w-44 text-slate-900" />
                    </div>
                    <div className="flex items-center gap-3 text-indigo-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Menunggu Konfirmasi Pembayaran...</p>
                    </div>
                  </div>
                )}

                {selectedMethod === "card" && (
                  <div className="flex flex-col items-center py-12 gap-6 text-center">
                    <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                      <CreditCard className="h-16 w-16 text-blue-600 animate-bounce" />
                    </div>
                    <p className="text-sm font-bold">Silakan Tap Kartu pada EDC</p>
                  </div>
                )}

                <Button
                  className={`w-full h-16 mt-8 ${isTakeaway ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold text-sm uppercase rounded-2xl transition-colors`}
                  disabled={isProcessing || (selectedMethod === "cash" && change < 0)}
                  onClick={handlePayment}
                >
                  {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : (
                    <>Selesaikan & Cetak Struk <ChevronRight className="ml-2 h-5 w-5" /></>
                  )}
                </Button>

                <p className="text-[9px] text-center text-slate-400 font-medium uppercase tracking-widest mt-6 flex items-center justify-center gap-2">
                  <Info className="h-3 w-3" /> Transaksi otomatis masuk ke laporan {isTakeaway ? 'Takeaway' : 'Harian'}
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}