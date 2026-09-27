import { useState } from 'react'
import { costFromLiters, getAverageEfficiency } from '../lib/calculations'
import { formatCurrency, formatKm, formatLiters } from '../lib/format'
import type { FuelLog, Settings } from '../types'

/** Weeks in an average month (52 weeks / 12 months), used to project a weekly cadence out to a month. */
const WEEKS_PER_MONTH = 52 / 12

interface TravelPlannerProps {
  logs: FuelLog[]
  settings: Settings
}

export function TravelPlanner({ logs, settings }: TravelPlannerProps) {
  const autoEfficiency = getAverageEfficiency(logs)
  const [efficiencyInput, setEfficiencyInput] = useState(
    autoEfficiency !== null ? autoEfficiency.toFixed(2) : '',
  )
  const [distanceInput, setDistanceInput] = useState('')
  const [roundTrip, setRoundTrip] = useState(false)
  const [peopleInput, setPeopleInput] = useState('1')
  const [daysInput, setDaysInput] = useState('')
  const [tankCapacityInput, setTankCapacityInput] = useState('')

  const hasPrice = settings.fuelPricePerLiter > 0
  const efficiency = parseFloat(efficiencyInput) || 0
  const distance = parseFloat(distanceInput) || 0
  const totalDistance = roundTrip ? distance * 2 : distance
  const fuelNeeded = efficiency > 0 ? totalDistance / efficiency : 0
  const cost = costFromLiters(fuelNeeded, settings.fuelPricePerLiter)
  const oneWayFuel = efficiency > 0 ? distance / efficiency : 0
  const oneWayCost = costFromLiters(oneWayFuel, settings.fuelPricePerLiter)

  const people = Math.max(1, parseInt(peopleInput, 10) || 1)
  const costPerPerson = cost / people
  const collectFromOthers = cost - costPerPerson

  const days = Math.max(1, parseInt(daysInput, 10) || 1)
  const showDaysTotal = days > 1

  const weeklyCost = cost * days
  const monthlyCost = weeklyCost * WEEKS_PER_MONTH
  const monthlyCostPerPerson = (costPerPerson * days) * WEEKS_PER_MONTH
  const monthlyCollectFromOthers = (collectFromOthers * days) * WEEKS_PER_MONTH
  const yearlyCost = monthlyCost * 12
  const yearlyCostPerPerson = monthlyCostPerPerson * 12

  const tankCapacity = parseFloat(tankCapacityInput) || 0
  const hasTankCapacity = tankCapacity > 0
  const fillUpsPerDay = hasTankCapacity && fuelNeeded > 0 ? fuelNeeded / tankCapacity : null
  const monthlyFuel = fuelNeeded * days * WEEKS_PER_MONTH
  const fillUpsPerMonth = hasTankCapacity && monthlyFuel > 0 ? monthlyFuel / tankCapacity : null

  const isEditedFromAuto = autoEfficiency !== null && efficiencyInput !== autoEfficiency.toFixed(2)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm text-slate-400" htmlFor="efficiency">
            Fuel efficiency (km/L)
          </label>
          {isEditedFromAuto && (
            <button
              type="button"
              onClick={() => setEfficiencyInput(autoEfficiency!.toFixed(2))}
              className="text-xs font-medium text-sky-400"
            >
              Reset to average
            </button>
          )}
        </div>
        <input
          id="efficiency"
          type="number"
          inputMode="decimal"
          value={efficiencyInput}
          onChange={(e) => setEfficiencyInput(e.target.value)}
          placeholder="e.g. 12.5"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
        />
        <p className="mt-1 text-xs text-slate-500">
          {autoEfficiency !== null
            ? 'Auto-calculated from your fuel logs. Edit to try a different value.'
            : 'Log a few fill-ups with trip distance to auto-calculate this.'}
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <label className="mb-1 block text-sm text-slate-400" htmlFor="distance">
          Trip distance (km)
        </label>
        <input
          id="distance"
          type="number"
          inputMode="decimal"
          value={distanceInput}
          onChange={(e) => setDistanceInput(e.target.value)}
          placeholder="e.g. 120"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
        />

        <label className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={roundTrip}
            onChange={(e) => setRoundTrip(e.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-sky-500"
          />
          Round trip
        </label>

        <div className="mt-3">
          <label className="mb-1 block text-sm text-slate-400" htmlFor="days">
            Number of days (optional)
          </label>
          <input
            id="days"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={daysInput}
            onChange={(e) => setDaysInput(e.target.value)}
            placeholder="e.g. 5"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            Days per week you make this trip, e.g. 5 for a work week — used to estimate a monthly cost.
          </p>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-sm text-slate-400" htmlFor="people">
            People sharing this trip (including you)
          </label>
          <input
            id="people"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={peopleInput}
            onChange={(e) => setPeopleInput(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
          />
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-sm text-slate-400" htmlFor="tank-capacity">
            Tank capacity (liters, optional)
          </label>
          <input
            id="tank-capacity"
            type="number"
            inputMode="decimal"
            min={0}
            value={tankCapacityInput}
            onChange={(e) => setTankCapacityInput(e.target.value)}
            placeholder="e.g. 45"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
          />
          <p className="mt-1 text-xs text-slate-500">Used to estimate how many fill-ups this trip needs.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Distance</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">
            {totalDistance > 0 ? formatKm(totalDistance) : '—'}
          </p>
          {roundTrip && distance > 0 && (
            <p className="mt-1 text-xs text-slate-500">{formatKm(distance)} one-way</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Fuel needed</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">
            {efficiency > 0 && totalDistance > 0 ? formatLiters(fuelNeeded) : '—'}
          </p>
          {roundTrip && efficiency > 0 && distance > 0 && (
            <p className="mt-1 text-xs text-slate-500">{formatLiters(oneWayFuel)} per trip</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Estimated cost</p>
        <p className="mt-1 text-2xl font-semibold text-slate-100">
          {hasPrice && fuelNeeded > 0 ? formatCurrency(cost) : '—'}
        </p>
        {hasPrice && roundTrip && fuelNeeded > 0 && (
          <p className="mt-1 text-xs text-slate-500">{formatCurrency(oneWayCost)} per trip</p>
        )}
        {!hasPrice && (
          <p className="mt-1 text-xs text-amber-400">Set a fuel price in Settings to estimate cost.</p>
        )}
      </div>

      {hasTankCapacity && fuelNeeded > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Tank refills</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">
            {fillUpsPerDay!.toFixed(2)} tank{fillUpsPerDay === 1 ? '' : 's'} per trip
          </p>
          {fillUpsPerMonth !== null && (
            <p className="mt-1 text-xs text-slate-500">
              ≈{fillUpsPerMonth.toFixed(2)} tanks/month (based on {days} day{days === 1 ? '' : 's'}/week)
            </p>
          )}
        </div>
      )}

      {hasPrice && cost > 0 && people > 1 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Carpool split ({people} people)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{formatCurrency(costPerPerson)} / person</p>
          <p className="mt-1 text-xs text-slate-500">
            You'd collect {formatCurrency(collectFromOthers)} from the other {people - 1} rider
            {people - 1 === 1 ? '' : 's'}.
          </p>
          {showDaysTotal && (
            <p className="mt-2 border-t border-slate-800 pt-2 text-sm text-slate-300">
              Over {days} days: {formatCurrency(costPerPerson * days)} / person total, collect{' '}
              {formatCurrency(collectFromOthers * days)} total.
            </p>
          )}
          <p className="mt-2 border-t border-slate-800 pt-2 text-sm text-slate-300">
            Per month (based on {days} day{days === 1 ? '' : 's'}/week): {formatCurrency(monthlyCostPerPerson)} /
            person, collect {formatCurrency(monthlyCollectFromOthers)} total.
          </p>
        </div>
      )}

      {showDaysTotal && (totalDistance > 0 || fuelNeeded > 0) && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total distance ({days} days)</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">
                {totalDistance > 0 ? formatKm(totalDistance * days) : '—'}
              </p>
              {totalDistance > 0 && (
                <p className="mt-1 text-xs text-slate-500">{formatKm(totalDistance)} per day</p>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total fuel ({days} days)</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">
                {fuelNeeded > 0 ? formatLiters(fuelNeeded * days) : '—'}
              </p>
              {fuelNeeded > 0 && (
                <p className="mt-1 text-xs text-slate-500">{formatLiters(fuelNeeded)} per day</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total cost ({days} days)</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">
              {hasPrice && cost > 0 ? formatCurrency(cost * days) : '—'}
            </p>
            {hasPrice && cost > 0 && (
              <p className="mt-1 text-xs text-slate-500">{formatCurrency(cost)} per day</p>
            )}
          </div>
        </>
      )}

      {hasPrice && cost > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Estimated monthly cost</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{formatCurrency(monthlyCost)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Based on {days} day{days === 1 ? '' : 's'} per week ({formatCurrency(weeklyCost)}/week × ~
            {WEEKS_PER_MONTH.toFixed(2)} weeks).
          </p>
          {people > 1 && (
            <p className="mt-2 border-t border-slate-800 pt-2 text-sm text-emerald-400">
              With {people} people carpooling, your share drops to {formatCurrency(monthlyCostPerPerson)}/month —
              a potential saving of {formatCurrency(monthlyCollectFromOthers)}/month.
            </p>
          )}
          <p className="mt-2 border-t border-slate-800 pt-2 text-sm text-slate-300">
            That's {formatCurrency(yearlyCost)}/year
            {people > 1 && <> ({formatCurrency(yearlyCostPerPerson)}/year per person)</>}.
          </p>
        </div>
      )}
    </div>
  )
}
