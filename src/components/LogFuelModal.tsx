import { useMemo, useState, type FormEvent } from 'react'
import { costFromLiters, litersFromCash } from '../lib/calculations'
import { formatCurrency, formatLiters } from '../lib/format'
import type { Settings } from '../types'

interface LogFuelModalProps {
  settings: Settings
  /** False for the very first fill-up ever logged — there's no earlier fill-up to attach a trip distance to. */
  canLogTripDistance: boolean
  onClose: () => void
  onSave: (entry: { date: string; tripKm?: number; liters: number; cost: number }) => void
}

type EntryMode = 'liters' | 'cash'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function LogFuelModal({ settings, canLogTripDistance, onClose, onSave }: LogFuelModalProps) {
  const [date, setDate] = useState(todayIso())
  const [tripKm, setTripKm] = useState('')
  const [mode, setMode] = useState<EntryMode>('liters')
  const [amount, setAmount] = useState('')

  const hasPrice = settings.fuelPricePerLiter > 0

  const { liters, cost } = useMemo(() => {
    const value = parseFloat(amount) || 0
    if (mode === 'liters') {
      return { liters: value, cost: costFromLiters(value, settings.fuelPricePerLiter) }
    }
    return { liters: litersFromCash(value, settings.fuelPricePerLiter), cost: value }
  }, [amount, mode, settings.fuelPricePerLiter])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (liters <= 0) return
    onSave({
      date,
      tripKm: tripKm.trim() === '' ? undefined : parseFloat(tripKm),
      liters,
      cost,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-slate-900 p-6 sm:rounded-2xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Log fuel</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400" htmlFor="date">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              required
            />
          </div>

          {canLogTripDistance && (
            <div>
              <label className="mb-1 block text-sm text-slate-400" htmlFor="tripKm">
                Distance since last fill-up (optional)
              </label>
              <input
                id="tripKm"
                type="number"
                inputMode="decimal"
                value={tripKm}
                onChange={(e) => setTripKm(e.target.value)}
                placeholder="e.g. 350"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              />
              <p className="mt-1 text-xs text-slate-500">
                Read this off your trip meter before filling up, then reset it once you're done.
              </p>
            </div>
          )}

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm text-slate-400" htmlFor="amount">
                {mode === 'liters' ? 'Liters bought' : 'Cash spent'}
              </label>
              <button
                type="button"
                onClick={() => setMode(mode === 'liters' ? 'cash' : 'liters')}
                disabled={!hasPrice}
                className="text-xs font-medium text-sky-400 disabled:text-slate-600"
              >
                Switch to {mode === 'liters' ? 'cash' : 'liters'}
              </button>
            </div>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={mode === 'liters' ? 'e.g. 20' : 'e.g. 500'}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              required
            />
            {!hasPrice && (
              <p className="mt-1 text-xs text-amber-400">
                Set a fuel price in Settings to enable cash entry and cost tracking.
              </p>
            )}
            {hasPrice && (
              <p className="mt-1 text-xs text-slate-500">
                {mode === 'liters'
                  ? `≈ ${formatCurrency(cost)} cost`
                  : `≈ ${formatLiters(liters)}`}
              </p>
            )}
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
              className="flex-1 rounded-lg bg-sky-500 py-2 font-medium text-slate-950"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
