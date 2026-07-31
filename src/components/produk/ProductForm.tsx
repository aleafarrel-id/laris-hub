import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts'
import { MARGIN_GOOD_THRESHOLD, MARGIN_WARNING_THRESHOLD } from '@/lib/constants'
import { calcMargin, formatRupiah } from '@/lib/utils'
import type { ProductFormData } from '@/lib/validations/product.schema'
import { uploadProductImage } from '@/services/product.service'
import type { Product } from '@/types'
import { Button } from '../ui/Button'
import { ImageDropzone } from '../ui/ImageDropzone'
import { Input, Textarea } from '../ui/Input'

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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image_url ?? null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const hpp = useMemo(() => Number(form.hpp) || 0, [form.hpp])
  const sellingPrice = useMemo(() => Number(form.selling_price) || 0, [form.selling_price])
  const margin = useMemo(() => calcMargin(sellingPrice, hpp), [sellingPrice, hpp])
  const isPending = isCreating || isUpdating || isUploadingImage

  const handleFieldChange = useCallback((id: keyof LocalProductFormData, value: string) => {
    setForm((f) => ({ ...f, [id]: value }))
  }, [])

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
      update({ id: product.id, data: payload as any }, { onSuccess })
    } else {
      create(payload as any, { onSuccess })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-full relative">
      <div className="flex-1 px-5 py-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-12">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="block text-sm font-semibold text-neutral-700">Foto Produk</div>
              <ImageDropzone
                currentPreviewUrl={previewUrl}
                onImageChange={handleImageChange}
                isUploading={isPending}
              />
            </div>
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex-1 pr-4">
                  <span className="text-sm font-bold text-neutral-900 block">
                    Status Produk Aktif
                  </span>
                  <span className="text-xs text-neutral-500 block mt-0.5">
                    Tampil di menu Kasir
                  </span>
                </div>
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
              </label>
            </div>
          </div>
          <div className="space-y-8">
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
                Informasi Dasar
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  id="name"
                  label="Nama Produk"
                  value={form.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="Contoh: Pukis Coklat Keju"
                  required
                  disabled={isPending}
                />
                <Input
                  id="sku"
                  label="SKU (Opsional)"
                  value={form.sku}
                  onChange={(e) => handleFieldChange('sku', e.target.value)}
                  error={errors.sku}
                  placeholder="Contoh: PKS-CKJ-01"
                  disabled={isPending}
                />
              </div>
              <Textarea
                id="description"
                label="Deskripsi (Opsional)"
                value={form.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                error={errors.description}
                placeholder="Tuliskan detail produk di sini..."
                disabled={isPending}
              />
            </div>
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
                Harga & Modal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  id="hpp"
                  label="Modal Dasar (HPP)"
                  value={form.hpp}
                  onChange={(e) => handleFieldChange('hpp', e.target.value)}
                  error={errors.hpp}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Contoh: 3000"
                  required
                  disabled={isPending}
                />
                <div className="flex flex-col">
                  <Input
                    id="selling_price"
                    label="Harga Jual"
                    value={form.selling_price}
                    onChange={(e) => handleFieldChange('selling_price', e.target.value)}
                    error={errors.selling_price}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Contoh: 5000"
                    required
                    disabled={isPending}
                  />
                  {hpp > 0 && sellingPrice > 0 && (
                    <div className="mt-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-600">Margin:</span>
                      <span
                        className={`font-bold px-2.5 py-1 rounded-md ${margin >= MARGIN_GOOD_THRESHOLD ? 'bg-success/15 text-success-700' : margin >= MARGIN_WARNING_THRESHOLD ? 'bg-amber-500/15 text-amber-700' : 'bg-danger/15 text-danger-700'}`}
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
      <div className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white/90 backdrop-blur-md px-6 py-4 flex justify-end gap-3 shrink-0 mt-auto shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <Button type="button" variant="ghost" onClick={onSuccess} disabled={isPending}>
          Batal
        </Button>
        <Button type="submit" variant="primary" isLoading={isPending}>
          Simpan
        </Button>
      </div>
    </form>
  )
}
