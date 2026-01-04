"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "@/components/mode-toggle"
import { toast } from "sonner"
import {
  CreditCard, Banknote, QrCode, CheckCircle,
  ArrowLeft, Loader2, Receipt, ChevronRight,
  ShoppingBag, Wallet
} from "lucide-react"

type PaymentMethod = "cash" | "card" | "qris"

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get("table")
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
          .order('created_at', { ascending: false })
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
    { id: "cash" as PaymentMethod, name: "Tunai", icon: Banknote, color: "text-emerald-500" },
    { id: "card" as PaymentMethod, name: "Kartu", icon: CreditCard, color: "text-blue-500" },
    { id: "qris" as PaymentMethod, name: "QRIS", icon: QrCode, color: "text-indigo-500" },
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
      toast.warning("Pilih metode pembayaran")
      return
    }

    const toastId = toast.loading("Memproses...")
    setIsProcessing(true)

    try {
      const { error: revenueError } = await supabase
        .from('revenue')
        .insert([{
          order_id: orderId,
          table_number: parseInt(tableNumber),
          order_type: isTakeaway ? "takeaway" : "dine_in",
          total_amount: finalTotal,
          payment_method: selectedMethod,
          items: orderItems,
          created_at: new Date().toISOString(),
        }])

      if (revenueError) throw revenueError

      if (!isTakeaway) {
        await supabase.from('tables').update({ status: 'available' }).eq('number', parseInt(tableNumber))
      }

      await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId)

      toast.success("Berhasil", { id: toastId })
      setIsPaid(true)
    } catch (err: any) {
      toast.error("Gagal", { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!mounted) return null

  if (isPaid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-none shadow-lg rounded-3xl p-8 text-center bg-card">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Pembayaran Berhasil</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Transaksi untuk {isTakeaway ? "Pesanan Bawa Pulang" : `Meja ${tableNumber}`} telah selesai.
          </p>
          <div className="bg-muted/50 rounded-2xl p-6 mb-8">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Dibayar</div>
            <div className="text-3xl font-bold">Rp {finalTotal.toLocaleString("id-ID")}</div>
          </div>
          <Link href="/dashboard" className="block">
            <Button className="w-full h-12 rounded-xl text-sm font-medium">
              Kembali ke Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container max-w-6xl mx-auto h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-base">Checkout</h1>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {isTakeaway ? <ShoppingBag className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  {isTakeaway ? "Takeaway" : `Meja ${tableNumber}`}
                </span>
              </div>
            </div>
          </div>
          <ModeToggle />
        </div>
      </nav>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* SISI KIRI: Detail Pesanan */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" /> Ringkasan Pesanan
                  </CardTitle>
                  <Badge variant="secondary" className="rounded-md text-[10px]">
                    {orderItems.length} Items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-6 py-4 space-y-4 max-h-[300px] overflow-y-auto">
                  {orderItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity}x @ Rp {Number(item.price).toLocaleString("id-ID")}</p>
                      </div>
                      <span className="text-sm font-semibold">
                        Rp {((Number(item.price) || 0) * (Number(item.quantity) || 0)).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-primary text-primary-foreground">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium opacity-80 uppercase tracking-wider">Total Tagihan</span>
                    <span className="text-3xl font-bold leading-none">Rp {finalTotal.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SISI KANAN: Pembayaran */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${selectedMethod === m.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:bg-muted/50"
                    }`}
                >
                  <m.icon className={`w-6 h-6 ${m.color}`} />
                  <span className="text-xs font-medium">{m.name}</span>
                </button>
              ))}
            </div>

            {selectedMethod && (
              <Card className="border-none shadow-md rounded-3xl p-6 animate-in slide-in-from-top-2">
                {selectedMethod === "cash" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground ml-1">Input Tunai</label>
                      <Input
                        className="text-2xl h-16 font-bold text-center bg-muted/30 border-none rounded-2xl"
                        placeholder="Rp 0"
                        value={cashAmount}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "")
                          setCashAmount(val ? `Rp ${Number.parseInt(val).toLocaleString("id-ID")}` : "")
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {quickCash.map(amt => (
                        <Button
                          key={amt}
                          variant="outline"
                          className="h-10 text-xs rounded-xl"
                          onClick={() => setCashAmount(`Rp ${amt.toLocaleString("id-ID")}`)}
                        >
                          {amt / 1000}k
                        </Button>
                      ))}
                    </div>
                    {cashAmountNumber > 0 && (
                      <div className={`p-4 rounded-2xl flex justify-between items-center ${change >= 0 ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                        <span className="text-xs font-medium">Kembalian</span>
                        <span className="text-xl font-bold">
                          {change >= 0 ? `Rp ${change.toLocaleString("id-ID")}` : "Dana Kurang"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {selectedMethod === "qris" && (
                  <div className="flex flex-col items-center py-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border">
                      <QrCode className="w-40 h-40 text-slate-900" />
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest">Menunggu Sinyal...</span>
                    </div>
                  </div>
                )}

                {selectedMethod === "card" && (
                  <div className="flex flex-col items-center py-8 gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-blue-500 animate-pulse" />
                    </div>
                    <p className="text-sm font-medium">Tempel kartu pada mesin EDC</p>
                  </div>
                )}

                <Button
                  className="w-full h-14 mt-6 rounded-2xl text-sm font-bold uppercase tracking-wide gap-2"
                  disabled={isProcessing || (selectedMethod === "cash" && change < 0)}
                  onClick={handlePayment}
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <>Konfirmasi Pembayaran <ChevronRight className="w-4 h-4" /></>}
                </Button>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Loading POS...</p>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}