import { redirect } from "next/navigation"

/**
 * Halaman index (/) yang bertugas sebagai pintu masuk.
 * Secara otomatis mengarahkan user ke halaman login.
 */
export default function HomePage() {
  redirect("/login")
}