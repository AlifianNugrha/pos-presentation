"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CreditCard, Wallet, Banknote, QrCode, CheckCircle } from "lucide-react"

type PaymentMethod = "cash" | "card" | "qris" | "gopay" | "ovo" | "dana"

export default function PaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [cashAmount, setCashAmount] = useState("")
  const [isPaid, setIsPaid] = useState(false)

  const orderItems = [
    { name: "Nasi Goreng Special", quantity: 2, price: 30000 },
    { name: "Ayam Bakar", quantity: 1, price: 35000 },
    { name: "Es Teh Manis", quantity: 3, price: 5000 },
    { name: "Jus Alpukat", quantity: 1, price: 15000 },
  ]

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.1
  const serviceCharge = subtotal * 0.05
  const total = subtotal + tax + serviceCharge

  const paymentMethods = [
    { id: "cash" as PaymentMethod, name: "Cash", icon: Banknote, color: "bg-chart-3" },
    { id: "card" as PaymentMethod, name: "Debit/Credit Card", icon: CreditCard, color: "bg-primary" },
    { id: "qris" as PaymentMethod, name: "QRIS", icon: QrCode, color: "bg-chart-2" },
    { id: "gopay" as PaymentMethod, name: "GoPay", icon: Wallet, color: "bg-chart-4" },
    { id: "ovo" as PaymentMethod, name: "OVO", icon: Wallet, color: "bg-chart-5" },
    { id: "dana" as PaymentMethod, name: "DANA", icon: Wallet, color: "bg-accent" },
  ]

  const quickCash = [50000, 100000, 150000, 200000]

  const handlePayment = () => {
    setIsPaid(true)
    setTimeout(() => {
      // Reset or redirect after showing success
    }, 2000)
  }

  const cashAmountNumber = Number.parseInt(cashAmount.replace(/\D/g, "")) || 0
  const change = cashAmountNumber - total

  if (isPaid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-12 bg-card border-border text-center max-w-md">
          <CheckCircle className="h-20 w-20 text-chart-3 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-foreground mb-2">Pembayaran Berhasil!</h2>
          <p className="text-muted-foreground mb-6">Transaksi telah selesai diproses</p>
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Metode</span>
              <span className="font-semibold text-foreground">
                {paymentMethods.find((m) => m.id === selectedMethod)?.name}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span className="text-foreground">Total</span>
              <span className="text-primary">Rp {total.toLocaleString("id-ID")}</span>
            </div>
            {selectedMethod === "cash" && change > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kembalian</span>
                <span className="font-semibold text-chart-3">Rp {change.toLocaleString("id-ID")}</span>
              </div>
            )}
          </div>
          <Link href="/">
            <Button className="w-full" size="lg">
              Kembali ke Beranda
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pembayaran</h1>
              <p className="text-sm text-muted-foreground">Proses Transaksi & Bill Splitting</p>
            </div>
            <Badge variant="secondary" className="text-sm px-4 py-2">
              Meja 5
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <Card className="p-6 bg-card border-border">
            <h2 className="text-lg font-bold text-foreground mb-4">Ringkasan Pesanan</h2>
            <div className="space-y-3 mb-6">
              {orderItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">{item.quantity}x</span>
                    <span className="text-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pajak (10%)</span>
                <span className="font-semibold text-foreground">Rp {tax.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service (5%)</span>
                <span className="font-semibold text-foreground">Rp {serviceCharge.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-border">
                <span className="text-foreground">Total</span>
                <span className="text-primary">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </Card>

          {/* Payment Methods & Process */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Methods */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">Pilih Metode Pembayaran</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedMethod === method.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <method.icon className={`h-8 w-8 ${method.color} text-white rounded-lg p-1.5 mx-auto mb-2`} />
                    <p className="text-sm font-semibold text-foreground">{method.name}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Payment Details */}
            {selectedMethod && (
              <Card className="p-6 bg-card border-border">
                <h2 className="text-lg font-bold text-foreground mb-4">Detail Pembayaran</h2>

                {selectedMethod === "cash" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Jumlah Uang Diterima</label>
                      <Input
                        type="text"
                        placeholder="Rp 0"
                        value={cashAmount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          setCashAmount(value ? `Rp ${Number.parseInt(value).toLocaleString("id-ID")}` : "")
                        }}
                        className="text-lg font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {quickCash.map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setCashAmount(`Rp ${amount.toLocaleString("id-ID")}`)}
                        >
                          {amount / 1000}K
                        </Button>
                      ))}
                    </div>

                    {cashAmountNumber > 0 && (
                      <div className="p-4 bg-secondary/50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Kembalian</span>
                          <span className={`text-2xl font-bold ${change >= 0 ? "text-chart-3" : "text-destructive"}`}>
                            {change >= 0 ? `Rp ${change.toLocaleString("id-ID")}` : "Kurang"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedMethod === "qris" && (
                  <div className="text-center py-8">
                    <div className="w-64 h-64 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <QrCode className="h-48 w-48 text-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Scan QR Code dengan aplikasi pembayaran Anda</p>
                  </div>
                )}

                {(selectedMethod === "gopay" || selectedMethod === "ovo" || selectedMethod === "dana") && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Nomor {paymentMethods.find((m) => m.id === selectedMethod)?.name}
                      </label>
                      <Input type="tel" placeholder="08xx xxxx xxxx" className="text-lg" />
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Total Tagihan</p>
                      <p className="text-2xl font-bold text-primary">Rp {total.toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                )}

                {selectedMethod === "card" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Nomor Kartu</label>
                      <Input type="text" placeholder="**** **** **** ****" className="text-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">Expired</label>
                        <Input type="text" placeholder="MM/YY" />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">CVV</label>
                        <Input type="text" placeholder="***" />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full mt-6"
                  size="lg"
                  onClick={handlePayment}
                  disabled={selectedMethod === "cash" && change < 0}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Proses Pembayaran
                </Button>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
