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

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({
      fuelPricePerLiter: parseFloat(fuelPricePerLiter) || 0,
      monthlyBudget: parseFloat(monthlyBudget) || 0,
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
