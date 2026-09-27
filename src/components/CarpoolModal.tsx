import { useState, type FormEvent } from 'react'

interface CarpoolModalProps {
  onClose: () => void
  onSave: (entry: { date: string; amount: number }) => void
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function CarpoolModal({ onClose, onSave }: CarpoolModalProps) {
  const [date, setDate] = useState(todayIso())
  const [amount, setAmount] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = parseFloat(amount) || 0
    if (value <= 0) return
    onSave({ date, amount: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-slate-900 p-6 sm:rounded-2xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Log carpool contribution</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400" htmlFor="carpoolDate">
              Week starting
            </label>
            <input
              id="carpoolDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400" htmlFor="carpoolAmount">
              Amount (Kwacha)
            </label>
            <input
              id="carpoolAmount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-700 py-2 font-medium text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-emerald-500 py-2 font-medium text-slate-950"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
