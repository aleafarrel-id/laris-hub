import type React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts'
import { MARGIN_GOOD_THRESHOLD, MARGIN_WARNING_THRESHOLD } from '@/lib/constants'
import { calcMargin, formatRupiah } from '@/lib/utils'
import type { ProductFormData } from '@/lib/validations/product.schema'
import { uploadProductImage } from '@/services/product.service'
import type { Product } from '@/types'
import { ImageDropzone } from '../ui/ImageDropzone'

interface LocalProductFormData {
  name: string
  sku: string
  hpp: string
  selling_price: string
  description: string
  image_url: string
  is_active: boolean
}

export function ProductForm({
  product,
  onSuccess,
}: {
  product: Product | null
  onSuccess: () => void
}) {
  const { mutate: create, isPending: isCreating } = useCreateProduct()
  const { mutate: update, isPending: isUpdating } = useUpdateProduct()

  const [form, setForm] = useState<LocalProductFormData>({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    hpp: product?.hpp ? String(product.hpp) : '',
    selling_price: product?.selling_price ? String(product.selling_price) : '',
    description: product?.description ?? '',
    image_url: product?.image_url ?? '',
    is_active: product?.is_active ?? true,
  })

  const [errors, setErrors] = useState<Partial<LocalProductFormData>>({})

  // Image Upload States
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image_url ?? null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const hpp = Number(form.hpp) || 0
  const sellingPrice = Number(form.selling_price) || 0
  const margin = calcMargin(sellingPrice, hpp)
  const isPending = isCreating || isUpdating || isUploadingImage

  const validate = () => {
    const errs: Partial<LocalProductFormData> = {}
    if (!form.name.trim()) errs.name = 'Nama produk wajib diisi'
    if (hpp < 0) errs.hpp = 'HPP tidak boleh negatif'
    if (sellingPrice <= 0) errs.selling_price = 'Harga jual harus lebih dari 0'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleImageChange = (file: File | null) => {
    setImageFile(file)
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
      setForm((f) => ({ ...f, image_url: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    let finalImageUrl = form.image_url

    if (imageFile) {
      setIsUploadingImage(true)
      try {
        finalImageUrl = await uploadProductImage(imageFile)
      } catch (err: any) {
        toast.error('Gagal mengunggah gambar: ' + err.message)
        setIsUploadingImage(false)
        return
      }
    }

    const payload: ProductFormData = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      hpp,
      selling_price: sellingPrice,
      description: form.description.trim() || null,
      image_url: finalImageUrl || null,
      is_active: form.is_active,
    }

    if (product) {
      // biome-ignore lint/suspicious/noExplicitAny: API shape ok
      update({ id: product.id, data: payload as any }, { onSuccess })
    } else {
      // biome-ignore lint/suspicious/noExplicitAny: API shape ok
      create(payload as any, { onSuccess })
    }
  }

  const field = (
    id: keyof LocalProductFormData,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
    isTextarea = false,
  ) => (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-neutral-600 uppercase tracking-wider"
      >
        {label}
      </label>
      {isTextarea ? (
        <textarea
          id={id}
          value={typeof form[id] === 'boolean' ? '' : String(form[id])}
          onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
          disabled={isPending}
          className={`w-full border rounded-xl px-4 py-3 text-sm bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all min-h-[100px] resize-y shadow-sm ${
            errors[id]
              ? 'border-danger focus:ring-danger/20 focus:border-danger'
              : 'border-neutral-200 focus:ring-primary/20 focus:border-primary hover:border-neutral-300'
          }`}
          {...(props as any)}
        />
      ) : (
        <input
          id={id}
          value={typeof form[id] === 'boolean' ? '' : String(form[id])}
          onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
          disabled={isPending}
          className={`w-full border rounded-xl px-4 py-3 text-sm bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all shadow-sm ${
            errors[id]
              ? 'border-danger focus:ring-danger/20 focus:border-danger'
              : 'border-neutral-200 focus:ring-primary/20 focus:border-primary hover:border-neutral-300'
          }`}
          {...(props as any)}
        />
      )}
      {errors[id] && <p className="text-xs text-danger font-medium mt-0.5">{errors[id]}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-full relative">
      {/* Content Area */}
      <div className="flex-1 p-5 sm:p-6 lg:p-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 max-w-5xl mx-auto">
          {/* Left Column: Image & Status */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
              <label className="block text-xs font-semibold text-neutral-600 mb-3 uppercase tracking-wider">
                Foto Produk
              </label>
              <ImageDropzone
                currentPreviewUrl={previewUrl}
                onImageChange={handleImageChange}
                isUploading={isPending}
              />
            </div>

            <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm hover:border-primary/20 transition-colors">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className="relative flex items-center justify-center shrink-0">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    disabled={isPending}
                    className="peer sr-only"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary transition-colors cursor-pointer" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-neutral-900 group-hover:text-primary transition-colors block truncate">
                    Status Produk Aktif
                  </span>
                  <span className="text-xs text-neutral-500 block truncate">
                    Tampil di menu Kasir
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Right Column: Detailed Info */}
          <div className="flex flex-col gap-6">
            {/* Informasi Dasar */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
                Informasi Dasar
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {field('name', 'Nama Produk *', {
                  placeholder: 'Contoh: Pukis Coklat Keju',
                  required: true,
                })}
                {field('sku', 'SKU (Opsional)', { placeholder: 'Contoh: PKS-CKJ-01' })}
              </div>

              {field(
                'description',
                'Deskripsi (Opsional)',
                {
                  placeholder: 'Tuliskan detail produk di sini...',
                },
                true,
              )}
            </div>

            {/* Harga & Modal */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
                Harga & Modal
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {field('hpp', 'Modal Dasar (HPP) *', {
                  type: 'number',
                  inputMode: 'numeric',
                  min: 0,
                  placeholder: 'Contoh: 3000',
                  required: true,
                })}

                <div className="flex flex-col">
                  {field('selling_price', 'Harga Jual *', {
                    type: 'number',
                    inputMode: 'numeric',
                    min: 0,
                    placeholder: 'Contoh: 5000',
                    required: true,
                  })}

                  {/* Margin Visualizer */}
                  {hpp > 0 && sellingPrice > 0 && (
                    <div className="mt-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-600">Margin Keuntungan:</span>
                      <span
                        className={`font-bold px-2.5 py-1 rounded-md ${
                          margin >= MARGIN_GOOD_THRESHOLD
                            ? 'bg-success/15 text-success-700'
                            : margin >= MARGIN_WARNING_THRESHOLD
                              ? 'bg-amber-500/15 text-amber-700'
                              : 'bg-danger/15 text-danger-700'
                        }`}
                      >
                        {margin.toFixed(1)}% ({formatRupiah(sellingPrice - hpp)})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white/90 backdrop-blur-md px-6 py-4 flex justify-end gap-3 shrink-0 rounded-b-2xl mt-auto shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={onSuccess}
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-50 active:scale-95"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center min-w-[140px]"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Produk'}
        </button>
      </div>
    </form>
  )
}
