import { useAutoAnimate } from '@formkit/auto-animate/react'
import { PlusCircle, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useCreateExpense } from '@/hooks/useTransactions'
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/lib/constants'
import { formatRupiah } from '@/lib/utils'

interface ExpenseLineItem {
  id: string
  name: string
  qty: number
  unit_price: number
}

// Hoist static object entries
const EXPENSE_CATEGORY_ENTRIES = Object.entries(EXPENSE_CATEGORIES) as [string, ExpenseCategory][]

export function ExpenseForm({
  onSuccess,
  recordedBy,
}: {
  onSuccess: () => void
  recordedBy: string
}) {
  const { mutate: createExpense, isPending } = useCreateExpense()
  const [parentRef] = useAutoAnimate()

  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('operasional')
  const [items, setItems] = useState<ExpenseLineItem[]>([])
  const [notes, setNotes] = useState('')
  const [manualTotal, setManualTotal] = useState('')

  const totalAmount = useMemo(() => {
    if (items.length > 0) {
      return items.reduce((s, i) => {
        const qty = Number.isFinite(i.qty) ? i.qty : 0
        const price = Number.isFinite(i.unit_price) ? i.unit_price : 0
        return s + price * qty
      }, 0)
    }

    const parsed = Number(manualTotal.replace(/[^0-9]/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }, [items, manualTotal])

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name: '', qty: 1, unit_price: 0 }])
  }, [])

  const updateItem = useCallback(
    (id: string, field: keyof ExpenseLineItem, value: string | number) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
    },
    [],
  )

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleSubmit = useCallback(() => {
    const desc = description.trim()
    if (!desc || !recordedBy) return

    const safeTotal = Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : 0
    if (safeTotal <= 0) return

    createExpense(
      {
        payload: {
          description: desc,
          total_amount: safeTotal,
          expense_category: category,
          expense_items: items.length
            ? items.map(({ name, qty, unit_price }) => ({ name, qty, unit_price }))
            : [],
          notes: notes.trim() || null,
        },
        recordedBy,
      },
      { onSuccess: () => onSuccess() },
    )
  }, [description, totalAmount, category, items, notes, recordedBy, createExpense, onSuccess])

  const isSubmitDisabled =
    !description.trim() || !(Number.isFinite(totalAmount) && totalAmount > 0) || isPending

  return (
    <div className="px-5 py-5 space-y-6">
      {/* Description */}
      <div>
        <label htmlFor="expense-desc" className="block text-sm font-semibold text-neutral-700 mb-2">
          Keterangan <span className="text-danger">*</span>
        </label>
        <input
          id="expense-desc"
          type="text"
          placeholder="Contoh: Belanja bahan baku mingguan"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
          className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="expense-cat" className="block text-sm font-semibold text-neutral-700 mb-2">
          Kategori
        </label>
        <div className="flex flex-wrap gap-2">
          {EXPENSE_CATEGORY_ENTRIES.map(([, val]) => {
            const isSelected = category === val
            return (
              <button
                key={val}
                type="button"
                onClick={() => setCategory(val)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                  isSelected
                    ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                {EXPENSE_CATEGORY_LABELS[val]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail Items */}
      <div
        className="animate-fade-in animate-slide-up"
        style={{ animationDelay: '100ms', animationFillMode: 'both' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-neutral-700">Detail Item</span>
        </div>

        {items.length > 0 ? (
          <div ref={parentRef} className="space-y-3 pr-1 pb-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 bg-neutral-50/80 rounded-xl p-3 border border-neutral-100 animate-fade-in"
              >
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Nama item"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.qty || ''}
                      onChange={(e) =>
                        updateItem(item.id, 'qty', Math.max(1, parseInt(e.target.value, 10) || 1))
                      }
                      min={1}
                      className="w-20 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm tabular-nums"
                    />
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                        Rp
                      </span>
                      <input
                        type="number"
                        placeholder="Harga"
                        value={item.unit_price || ''}
                        onChange={(e) =>
                          updateItem(
                            item.id,
                            'unit_price',
                            Math.max(0, parseFloat(e.target.value) || 0),
                          )
                        }
                        min={0}
                        inputMode="numeric"
                        className="w-full bg-white border border-neutral-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm tabular-nums"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-danger rounded-xl hover:bg-danger/10 transition-colors mt-1"
                  aria-label="Hapus item"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <label
              htmlFor="expense-total"
              className="block text-xs font-medium text-neutral-500 mb-1.5"
            >
              Total Pengeluaran (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-neutral-500">
                Rp
              </span>
              <input
                id="expense-total"
                type="number"
                placeholder="0"
                value={manualTotal}
                onChange={(e) => setManualTotal(e.target.value)}
                min={1}
                inputMode="numeric"
                className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary tabular-nums shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Running total */}
        {items.length > 0 && (
          <div className="mt-2 bg-neutral-50 rounded-xl px-3 py-2 flex justify-between items-center">
            <span className="text-xs text-neutral-500">Total</span>
            <span className="text-sm font-bold tabular-nums text-danger">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={addItem}
          className="w-full mt-3 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle size={16} />
          Tambah Item
        </button>
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="expense-notes"
          className="block text-sm font-semibold text-neutral-700 mb-2"
        >
          Catatan (Opsional)
        </label>
        <input
          id="expense-notes"
          type="text"
          placeholder="Catatan tambahan..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={200}
          className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        className="w-full mt-2 py-3.5 bg-danger text-white rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-danger/20 flex items-center justify-between px-5 hover:bg-danger/90 hover:shadow-lg hover:shadow-danger/30"
      >
        <span className="font-bold text-sm">
          {isPending ? 'Menyimpan...' : 'Catat Pengeluaran'}
        </span>
        {!isPending && (
          <span className="bg-white/20 px-2.5 py-1 rounded-lg text-sm font-bold tabular-nums">
            {formatRupiah(totalAmount)}
          </span>
        )}
      </button>
    </div>
  )
}
