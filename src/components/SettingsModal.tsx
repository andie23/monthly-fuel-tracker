import { useState, type FormEvent } from 'react'
import type { Settings } from '../types'

interface SettingsModalProps {
  settings: Settings
  onClose: () => void
  onSave: (settings: Settings) => void
}

export function SettingsModal({ settings, onClose, onSave }: SettingsModalProps) {
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState(String(settings.fuelPricePerLiter || ''))
  const [monthlyBudget, setMonthlyBudget] = useState(String(settings.monthlyBudget || ''))
  const [payCycleStartDay, setPayCycleStartDay] = useState(String(settings.payCycleStartDay || 1))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsedCycleDay = parseInt(payCycleStartDay, 10)
    onSave({
      fuelPricePerLiter: parseFloat(fuelPricePerLiter) || 0,
      monthlyBudget: parseFloat(monthlyBudget) || 0,
      payCycleStartDay: parsedCycleDay >= 1 && parsedCycleDay <= 31 ? parsedCycleDay : 1,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-slate-900 p-6 sm:rounded-2xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400" htmlFor="fuelPrice">
              Fuel price per liter
            </label>
            <input
              id="fuelPrice"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={fuelPricePerLiter}
              onChange={(e) => setFuelPricePerLiter(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400" htmlFor="monthlyBudget">
              Monthly budget
            </label>
            <input
              id="monthlyBudget"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400" htmlFor="payCycleStartDay">
              Pay cycle start day
            </label>
            <input
              id="payCycleStartDay"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              step={1}
              value={payCycleStartDay}
              onChange={(e) => setPayCycleStartDay(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500">
              Day of the month you get paid, e.g. 25. Fuel logged on or after this day counts toward the
              next pay cycle instead of the current one. Use 1 to track by calendar month.
            </p>
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
