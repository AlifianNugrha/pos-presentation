import { createClient } from '@supabase/supabase-js'

// Menggunakan casting 'as string' untuk meyakinkan TypeScript bahwa nilai ini akan ada
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Konfigurasi Supabase hilang. Pastikan .env.local sudah terisi.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)