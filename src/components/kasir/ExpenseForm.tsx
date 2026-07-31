import { motion } from 'motion/react'
import { PlusCircle, X, Minus, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCreateExpense, useUpdateExpense } from '@/hooks/useTransactions'
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/lib/constants'
import { formatRupiah } from '@/lib/utils'
import type { TransactionWithItems } from '@/types'
import { useExpenseItems } from '@/hooks/useTransactionForm'

const EXPENSE_CATEGORY_ENTRIES = Object.entries(EXPENSE_CATEGORIES) as [string, ExpenseCategory][]

interface ExpenseFormProps {
  /** When provided, the form operates in "edit" mode. */
  transaction?: TransactionWithItems
  onSuccess: () => void
}

/**
 * Unified expense form for both creating and editing.
 * Pass `transaction` to enter edit mode; omit for create mode.
 */
export function ExpenseForm({ transaction, onSuccess }: ExpenseFormProps) {
  const isEditing = !!transaction

  const { mutate: createExpense, isPending: isCreating } = useCreateExpense()
  const { mutate: updateExpense, isPending: isUpdating } = useUpdateExpense()
  const isPending = isCreating || isUpdating

  const [description, setDescription] = useState(transaction?.description ?? '')
  const [category, setCategory] = useState<ExpenseCategory>(
    (transaction?.expense_category as ExpenseCategory) ?? 'operasional',
  )
  const { items, setItems, addItem, updateItem, removeItem, lineItemsTotal } = useExpenseItems()
  const [notes, setNotes] = useState(transaction?.notes ?? '')
  const [manualTotal, setManualTotal] = useState(() => {
    const hasItems =
      Array.isArray(transaction?.expense_items) && transaction.expense_items.length > 0
    return hasItems ? '' : (transaction?.total_amount.toString() ?? '')
  })

  // Populate line items from the existing transaction when editing
  useEffect(() => {
    if (transaction?.expense_items && Array.isArray(transaction.expense_items)) {
      setItems(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transaction.expense_items.map((item: any) => ({
          id: crypto.randomUUID(),
          name: item.name,
          qty: item.qty ?? 1,
          unit_price: item.unit_price,
        })),
      )
    }
  }, [transaction, setItems])

  // Removed useMemo per Vercel Best Practices for simple primitives
  let totalAmount = 0
  if (items.length > 0) {
    totalAmount = lineItemsTotal
  } else {
    const parsed = Number(manualTotal.replace(/[^0-9]/g, ''))
    totalAmount = Number.isFinite(parsed) ? parsed : 0
  }

  const handleSubmit = useCallback(() => {
    const desc = description.trim()
    if (!desc) return

    const safeTotal = Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : 0
    if (safeTotal <= 0) return

    const payload = {
      description: desc,
      total_amount: safeTotal,
      expense_category: category,
      expense_items: items.length
        ? items.map(({ name, qty, unit_price }) => ({ name, qty, unit_price }))
        : [],
      notes: notes.trim() || null,
    }

    if (isEditing) {
      updateExpense(
        { id: transaction.id, payload: { ...payload, transaction_at: transaction.transaction_at } },
        { onSuccess },
      )
    } else {
      createExpense({ payload }, { onSuccess })
    }
  }, [
    description,
    totalAmount,
    category,
    items,
    notes,
    isEditing,
    transaction,
    createExpense,
    updateExpense,
    onSuccess,
  ])

  const isSubmitDisabled =
    !description.trim() || !(Number.isFinite(totalAmount) && totalAmount > 0) || isPending

  const idPrefix = isEditing ? 'edit-expense' : 'expense'

  return (
    <div className="px-5 py-5 space-y-6">
      <Input
        id={`${idPrefix}-desc`}
        label="Keterangan"
        required
        type="text"
        placeholder="Contoh: Belanja bahan baku mingguan"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={200}
      />

      <div>
        <label
          htmlFor={`${idPrefix}-cat`}
          className="block text-sm font-semibold text-neutral-700 mb-2"
        >
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
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all active:scale-[0.96] ${
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

      <div className="animate-fade-in animate-slide-up [animation-delay:100ms] [animation-fill-mode:both]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-neutral-700">Detail Item</span>
        </div>

        {items.length > 0 ? (
          <div className="space-y-3 pr-1 pb-2">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2 bg-neutral-50/80 rounded-xl p-3 border border-neutral-100"
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
                    <div className="flex items-center justify-between bg-primary rounded-xl p-1 shadow-sm shadow-primary/20 w-28 h-10 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, 'qty', Math.max(1, (Number(item.qty) || 1) - 1))}
                        className="w-8 h-8 flex items-center justify-center text-white active:scale-[0.96] transition-transform bg-black/10 rounded-lg hover:bg-black/20 cursor-pointer flex-shrink-0"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.qty === 0 ? '' : item.qty || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          updateItem(item.id, 'qty', val === '' ? ('' as any) : parseInt(val, 10))
                        }}
                        min={1}
                        className="w-10 bg-transparent text-white font-bold text-center text-sm focus:outline-none tabular-nums placeholder:text-white/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                      />
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, 'qty', (Number(item.qty) || 0) + 1)}
                        className="w-8 h-8 flex items-center justify-center text-white active:scale-[0.96] transition-transform bg-black/10 rounded-lg hover:bg-black/20 cursor-pointer flex-shrink-0"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                    <Input
                      className="flex-1 tabular-nums bg-white rounded-lg py-2"
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
                      leftDecorator="Rp"
                    />
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
              </motion.div>
            ))}
          </div>
        ) : (
          <Input
            id={`${idPrefix}-total`}
            label="Total Pengeluaran"
            type="number"
            placeholder="0"
            value={manualTotal}
            onChange={(e) => setManualTotal(e.target.value)}
            min={1}
            inputMode="numeric"
            leftDecorator="Rp"
            className="tabular-nums"
          />
        )}

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
          className="w-full mt-3 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold active:scale-[0.96] transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle size={16} />
          Tambah Item
        </button>
      </div>

      <Input
        id={`${idPrefix}-notes`}
        label="Catatan (Opsional)"
        type="text"
        placeholder="Catatan tambahan..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={200}
      />

      <Button
        variant={isEditing ? 'primary' : 'danger'}
        size="lg"
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        isLoading={isPending}
        className="w-full mt-2 flex items-center justify-between"
        rightIcon={
          <span className="bg-white/20 px-2.5 py-1 rounded-lg text-sm font-bold tabular-nums">
            {formatRupiah(totalAmount)}
          </span>
        }
      >
        {isEditing ? 'Simpan' : 'Catat Pengeluaran'}
      </Button>
    </div>
  )
}
