'use client'
import { useEffect } from 'react'
export default function LocaleAttributes({ locale }: { locale: string }) {
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  return null
}
