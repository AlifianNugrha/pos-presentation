"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Perbaikan: Impor langsung dari "next-themes"
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}