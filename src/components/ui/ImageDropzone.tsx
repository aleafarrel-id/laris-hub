import { Image as ImageIcon, UploadCloud, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type React from 'react'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

interface ImageDropzoneProps {
  currentPreviewUrl: string | null
  onImageChange: (file: File | null) => void
  isUploading?: boolean
}

export function ImageDropzone({
  currentPreviewUrl,
  onImageChange,
  isUploading = false,
}: ImageDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }, [])

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Format file tidak didukung. Harap unggah gambar (JPG, PNG, dll).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 2MB')
      return
    }
    onImageChange(file)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)
      if (isUploading) return

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        processFile(files[0])
      }
    },
    [isUploading, onImageChange],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (isUploading) return

    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isUploading) return
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        className={`relative w-full h-48 sm:h-64 lg:h-auto lg:aspect-square overflow-hidden rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center cursor-pointer group ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : currentPreviewUrl
              ? 'border-transparent bg-neutral-100'
              : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300'
        } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !currentPreviewUrl && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !currentPreviewUrl) {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
          disabled={isUploading}
        />

        <AnimatePresence mode="wait">
          {currentPreviewUrl ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 w-full h-full"
            >
              <img src={currentPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-3 bg-danger text-white rounded-full hover:bg-danger/90 hover:scale-105 active:scale-[0.96] transition-all shadow-xl"
                  title="Hapus Foto"
                >
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center p-6"
            >
              <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
                {isDragActive ? <UploadCloud size={28} /> : <ImageIcon size={28} />}
              </div>
              <p className="text-sm font-semibold text-neutral-700 mb-1">
                {isDragActive ? 'Lepaskan Gambar...' : 'Unggah Foto Produk'}
              </p>
              <p className="text-xs text-neutral-500 max-w-[200px]">
                Seret gambar ke sini atau klik untuk mencari. Maksimal 2MB.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
