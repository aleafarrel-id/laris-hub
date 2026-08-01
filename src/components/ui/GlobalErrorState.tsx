import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { Button } from './Button'

export function GlobalErrorState({ error, reset }: ErrorComponentProps) {
  // Try to extract a meaningful error message
  const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga.'

  return (
    <div className="min-h-[100dvh] bg-neutral-50 flex items-center justify-center p-4 selection:bg-primary/20">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-neutral-200/50 p-6 md:p-8 border border-neutral-100 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6 ring-8 ring-danger/5">
          <AlertTriangle size={36} strokeWidth={2} />
        </div>

        <h1 className="text-2xl font-black text-neutral-900 tracking-tight mb-2">
          Ups! Ada yang salah.
        </h1>

        <p className="text-neutral-500 mb-6 text-sm leading-relaxed">
          Tampaknya terjadi kesalahan sistem saat memproses halaman ini.
          Anda dapat memuat ulang halaman atau kembali ke beranda.
        </p>

        <div className="bg-neutral-50 text-neutral-600 text-xs font-mono p-4 rounded-xl border border-neutral-200/60 w-full mb-8 overflow-hidden text-left break-words">
          {errorMessage}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-12 border-neutral-200"
            onClick={reset}
          >
            <RefreshCw size={18} className="mr-2" />
            Muat Ulang
          </Button>

          <Link to="/" className="flex-1">
            <Button variant="primary" className="w-full rounded-xl h-12 shadow-md shadow-primary/20">
              <Home size={18} className="mr-2" />
              Ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
