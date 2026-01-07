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
  ShoppingBag, Wallet, Printer, Hash
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
    { id: "cash" as PaymentMethod, name: "Tunai", icon: Banknote, color: "text-[#00BA4A]" },
    { id: "card" as PaymentMethod, name: "Kartu", icon: CreditCard, color: "text-blue-500" },
    { id: "qris" as PaymentMethod, name: "QRIS", icon: QrCode, color: "text-indigo-500" },
  ]

  const quickCash = [50000, 100000, 150000, 200000]
  const cashAmountNumber = Number.parseInt(cashAmount.replace(/\D/g, "")) || 0
  const change = cashAmountNumber - finalTotal

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = orderItems.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>${item.name} x${item.quantity}</span>
        <span>${(item.price * item.quantity).toLocaleString("id-ID")}</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt_${orderId}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 10px; font-size: 14px; }
            .center { text-align: center; }
            .line { border-bottom: 1px dashed #000; margin: 10px 0; }
            .total { font-weight: bold; font-size: 16px; }
            @media print { body { width: 80mm; } }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin:0 uppercase">Kasirin POS</h2>
            <p>Struk Pembayaran</p>
          </div>
          <div class="line"></div>
          <div>Tanggal: ${new Date().toLocaleString("id-ID")}</div>
          <div>Order: #${orderId?.slice(0, 8)}</div>
          <div>Tipe: ${isTakeaway ? "Takeaway" : "Meja " + tableNumber}</div>
          <div class="line"></div>
          ${itemsHtml}
          <div class="line"></div>
          <div style="display: flex; justify-content: space-between;" class="total">
            <span>TOTAL</span>
            <span>Rp ${finalTotal.toLocaleString("id-ID")}</span>
          </div>
          <div>Metode: ${selectedMethod?.toUpperCase()}</div>
          ${selectedMethod === 'cash' ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Bayar</span>
              <span>Rp ${cashAmountNumber.toLocaleString("id-ID")}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Kembali</span>
              <span>Rp ${change.toLocaleString("id-ID")}</span>
            </div>
          ` : ''}
          <div class="line"></div>
          <div class="center">
            <p>Terima Kasih Atas Kunjungannya!</p>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePayment = async () => {
    if (!orderId || tableNumber === null) {
      toast.error("Data pesanan tidak valid")
      return
    }
    if (!selectedMethod) {
      toast.warning("Pilih metode pembayaran")
      return
    }

    const toastId = toast.loading("Memproses transaksi...")
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

      toast.success("Pembayaran Berhasil", { id: toastId })
      setIsPaid(true)
    } catch (err: any) {
      toast.error("Gagal memproses pembayaran", { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!mounted) return null

  if (isPaid) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] p-10 text-center bg-white">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-[#00BA4A]/10 text-[#00BA4A] mb-8 animate-in zoom-in duration-500">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-3 italic">Transaksi Sukses</h2>
          <p className="text-slate-400 text-sm mb-10 font-medium">
            Pembayaran untuk {isTakeaway ? "Layanan Takeaway" : `Meja ${tableNumber}`} telah diverifikasi oleh sistem.
          </p>
          <div className="bg-[#1A1C1E] rounded-[2rem] p-8 mb-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Receipt className="w-20 h-20" /></div>
            <div className="text-[10px] text-[#00BA4A] font-black uppercase tracking-[0.3em] mb-2 relative z-10">Total Dibayar</div>
            <div className="text-4xl font-serif font-bold tracking-tight relative z-10">Rp {finalTotal.toLocaleString("id-ID")}</div>
          </div>
          <div className="flex flex-col gap-4">
            <Button onClick={handlePrintReceipt} variant="outline" className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest border-slate-200 gap-3 hover:border-[#00BA4A] hover:text-[#00BA4A] transition-all">
              <Printer className="w-4 h-4" /> Cetak Struk Fisik
            </Button>
            <Link href="/dashboard" className="block">
              <Button className="w-full h-16 rounded-2xl bg-[#00BA4A] hover:bg-[#009e3f] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-green-100 transition-all active:scale-95">
                Selesai & Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-slate-950 font-sans selection:bg-[#00BA4A]/20">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="container max-w-6xl mx-auto h-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-[#00BA4A]" />
            </Button>
            <div>
              <h1 className="font-serif font-bold text-xl tracking-tight leading-none uppercase">Proses <span className="text-[#00BA4A]">Checkout</span></h1>
              <div className="flex items-center gap-2 text-slate-400 mt-2">
                {isTakeaway ? <ShoppingBag className="w-3.5 h-3.5 text-[#FF5700]" /> : <Receipt className="w-3.5 h-3.5 text-[#00BA4A]" />}
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {isTakeaway ? "Pesanan Takeaway" : `Terminal Meja ${tableNumber}`}
                </span>
              </div>
            </div>
          </div>
          <ModeToggle />
        </div>
      </nav>

      <main className="container max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* SISI KIRI: ORDER SUMMARY */}
          <div className="lg:col-span-5 space-y-8">
            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900">
              <div className="p-8 bg-[#F8FAF9] dark:bg-slate-800/50 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#00BA4A]/10 rounded-lg"><Wallet className="w-5 h-5 text-[#00BA4A]" /></div>
                  <h3 className="font-serif font-bold text-base tracking-tight">Ringkasan Pesanan</h3>
                </div>
                <Badge className="bg-[#1A1C1E] text-white border-none rounded-full px-4 py-1 text-[10px] font-bold">
                  {orderItems.length} Produk
                </Badge>
              </div>
              <CardContent className="p-0">
                <div className="px-8 py-6 space-y-5 max-h-[400px] overflow-y-auto custom-scrollbar font-medium">
                  {orderItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-start group">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight leading-tight">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.quantity}x <span className="mx-1">•</span> Rp {Number(item.price).toLocaleString("id-ID")}</p>
                      </div>
                      <span className="text-sm font-serif font-bold text-slate-900 dark:text-white">
                        Rp {((Number(item.price) || 0) * (Number(item.quantity) || 0)).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="p-10 bg-[#1A1C1E] text-white">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-[#00BA4A] uppercase tracking-[0.3em]">Total Tagihan</span>
                      <div className="text-4xl font-serif font-bold tracking-tighter italic">Rp {finalTotal.toLocaleString("id-ID")}</div>
                    </div>
                    <Hash className="w-8 h-8 opacity-10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SISI KANAN: PAYMENT SELECTION */}
          <div className="lg:col-span-7 space-y-8">
            <div className="grid grid-cols-3 gap-4">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${selectedMethod === m.id
                    ? "border-[#00BA4A] bg-[#00BA4A]/5 shadow-lg shadow-green-50 scale-[1.02]"
                    : "border-slate-100 bg-white hover:border-[#00BA4A]/30 hover:bg-[#F8FAF9] dark:bg-slate-900 dark:border-slate-800"
                    }`}
                >
                  <div className={`p-4 rounded-2xl bg-white shadow-sm border border-slate-50`}>
                    <m.icon className={`w-7 h-7 ${m.color}`} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">{m.name}</span>
                </button>
              ))}
            </div>

            {selectedMethod && (
              <Card className="border-none shadow-2xl rounded-[3rem] p-10 animate-in slide-in-from-top-4 duration-500 bg-white dark:bg-slate-900">
                {selectedMethod === "cash" && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">Input Nominal Tunai</label>
                      <Input
                        className="text-4xl h-24 font-serif font-bold text-center bg-[#F8FAF9] dark:bg-slate-800 border-none rounded-[2rem] shadow-inner px-8 placeholder:text-slate-200"
                        placeholder="Rp 0"
                        autoFocus
                        value={cashAmount}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "")
                          setCashAmount(val ? `Rp ${Number.parseInt(val).toLocaleString("id-ID")}` : "")
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-3 px-2">
                      {quickCash.map(amt => (
                        <Button
                          key={amt}
                          variant="outline"
                          className="h-12 text-[11px] font-black rounded-xl border-slate-100 uppercase tracking-widest hover:border-[#00BA4A] hover:text-[#00BA4A]"
                          onClick={() => setCashAmount(`Rp ${amt.toLocaleString("id-ID")}`)}
                        >
                          {amt / 1000}k
                        </Button>
                      ))}
                    </div>
                    {cashAmountNumber > 0 && (
                      <div className={`p-6 rounded-[2rem] flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 ${change >= 0 ? "bg-[#00BA4A]/5 border border-[#00BA4A]/10 text-[#00BA4A]" : "bg-rose-50 border border-rose-100 text-rose-500"}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest">Saldo Kembali</span>
                        <span className="text-2xl font-serif font-bold italic">
                          {change >= 0 ? `Rp ${change.toLocaleString("id-ID")}` : "Dana Tidak Mencukupi"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {selectedMethod === "qris" && (
                  <div className="flex flex-col items-center py-6 gap-6">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 relative group">
                      <QrCode className="w-48 h-48 text-slate-900 transition-transform group-hover:scale-105 duration-500" />
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge className="bg-[#00BA4A]">SCAN QRIS</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[#00BA4A] bg-[#00BA4A]/10 px-6 py-2 rounded-full border border-[#00BA4A]/10">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sinkronisasi Sinyal Pembayaran...</span>
                    </div>
                  </div>
                )}

                {selectedMethod === "card" && (
                  <div className="flex flex-col items-center py-12 gap-6 text-center">
                    <div className="w-24 h-24 rounded-[2rem] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center animate-bounce shadow-lg">
                      <CreditCard className="w-10 h-10 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-lg leading-tight">Menunggu EDC</h4>
                      <p className="text-xs text-slate-400 mt-2 font-medium">Silakan tempel atau masukkan kartu <br /> pelanggan pada mesin terminal.</p>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full h-16 mt-10 rounded-[1.5rem] bg-[#00BA4A] hover:bg-[#009e3f] text-white font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-[1.01] active:scale-95 hover:shadow-[0_20px_40px_-10px_rgba(0,186,74,0.4)] disabled:opacity-50 disabled:grayscale"
                  disabled={isProcessing || (selectedMethod === "cash" && change < 0)}
                  onClick={handlePayment}
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>Verifikasi & Bayar Sekarang</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
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
      <div className="min-h-screen bg-[#F8FAF9] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#00BA4A]/20 border-t-[#00BA4A] rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center font-serif font-bold text-[#00BA4A]">K</div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Menghubungkan Terminal POS...</p>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}