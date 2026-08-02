import { zodResolver } from '@hookform/resolvers/zod'
import imageCompression from 'browser-image-compression'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts'
import { MARGIN_GOOD_THRESHOLD, MARGIN_WARNING_THRESHOLD } from '@/lib/constants'
import { calcMargin, formatRupiah } from '@/lib/utils'
import { type ProductFormData, productSchemaWithValidation } from '@/lib/validations/product.schema'
import { uploadProductImage } from '@/services/product.service'
import type { Product } from '@/types'
import { Button } from '../ui/Button'
import { ImageDropzone } from '../ui/ImageDropzone'
import { Input, Textarea } from '../ui/Input'

export function ProductForm({
  product,
  onSuccess,
}: {
  product: Product | null
  onSuccess: () => void
}) {
  const { mutate: create, isPending: isCreating } = useCreateProduct()
  const { mutate: update, isPending: isUpdating } = useUpdateProduct()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchemaWithValidation),
    defaultValues: {
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      hpp: product?.hpp ?? ('' as unknown as number),
      selling_price: product?.selling_price ?? ('' as unknown as number),
      description: product?.description ?? '',
      image_url: product?.image_url ?? '',
      is_active: product?.is_active ?? true,
    },
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image_url ?? null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const hpp = watch('hpp')
  const sellingPrice = watch('selling_price')
  const margin = calcMargin(sellingPrice, hpp)
  const isPending = isCreating || isUpdating || isUploadingImage

  const handleImageChange = (file: File | null) => {
    setImageFile(file)
    if (file) {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
      setValue('image_url', '')
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    let finalImageUrl = data.image_url

    if (imageFile) {
      if (!navigator.onLine) {
        // Read file as Base64 for offline cache
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(imageFile)
        })
        finalImageUrl = dataUrl
        toast.info('Menyimpan Gambar Offline', {
          description: 'Gambar akan diunggah otomatis saat koneksi tersedia.',
        })
      } else {
        setIsUploadingImage(true)
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          }
          const compressedFile = await imageCompression(imageFile, options)
          finalImageUrl = await uploadProductImage(compressedFile)
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Gagal mengunggah gambar'
          toast.error(message)
          setIsUploadingImage(false)
          return
        } finally {
          setIsUploadingImage(false)
        }
      }
    }

    const payload: ProductFormData = {
      ...data,
      image_url: finalImageUrl || null,
      sku: data.sku?.trim() || null,
      description: data.description?.trim() || null,
    }

    if (product) {
      update({ id: product.id, data: payload }, { onSuccess })
    } else {
      create(payload, { onSuccess })
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col min-h-full relative"
    >
      <div className="flex-1 px-5 py-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-12">
          {/* Left column: image & status toggle */}
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
                    {...register('is_active')}
                    disabled={isPending}
                    className="peer sr-only"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary transition-colors cursor-pointer" />
                </div>
              </label>
            </div>
          </div>

          {/* Right column: product info & pricing */}
          <div className="space-y-8">
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-neutral-900 pb-2 border-b border-neutral-100">
                Informasi Dasar
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  id="name"
                  label="Nama Produk"
                  {...register('name')}
                  error={errors.name?.message}
                  placeholder="Contoh: Pukis Coklat Keju"
                  required
                  disabled={isPending}
                />
                <Input
                  id="sku"
                  label="SKU (Opsional)"
                  {...register('sku')}
                  error={errors.sku?.message}
                  placeholder="Contoh: PKS-CKJ-01"
                  disabled={isPending}
                />
              </div>
              <Textarea
                id="description"
                label="Deskripsi (Opsional)"
                {...register('description')}
                error={errors.description?.message}
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
                  {...register('hpp')}
                  error={errors.hpp?.message}
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
                    {...register('selling_price')}
                    error={errors.selling_price?.message}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Contoh: 5000"
                    required
                    disabled={isPending}
                  />
                  {hpp > 0 && sellingPrice > 0 && (
                    <MarginBadge margin={margin} sellingPrice={sellingPrice} hpp={hpp} />
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

// ─── Sub-components ────────────────────────────────────────────────────────────

function MarginBadge({
  margin,
  sellingPrice,
  hpp,
}: {
  margin: number
  sellingPrice: number
  hpp: number
}) {
  const colorClass =
    margin >= MARGIN_GOOD_THRESHOLD
      ? 'bg-success/15 text-success-700'
      : margin >= MARGIN_WARNING_THRESHOLD
        ? 'bg-amber-500/15 text-amber-700'
        : 'bg-danger/15 text-danger-700'

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs">
      <span className="font-semibold text-neutral-600">Margin:</span>
      <span className={`font-bold px-2.5 py-1 rounded-md ${colorClass}`}>
        {margin.toFixed(1)}% ({formatRupiah(sellingPrice - hpp)})
      </span>
    </div>
  )
}
