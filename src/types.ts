export interface FuelLog {
  id: string
  /** ISO date string, e.g. 2026-09-27 */
  date: string
  /**
   * Distance driven after this fill-up, until the next one — read off the trip
   * meter (then reset) at that next fill-up, and recorded back onto this log
   * since it describes the trip this fill-up's fuel powered. Optional, and
   * only filled in once a later fill-up has been logged.
   */
  tripKm?: number
  liters: number
  cost: number
  createdAt: string
}

export interface Settings {
  fuelPricePerLiter: number
  monthlyBudget: number
  /**
   * Day of the month your pay cycle starts on (e.g. 25, if you're paid on
   * the 24th/25th) — fuel logged on or after this day counts toward the
   * next cycle rather than the current calendar month. 1 = calendar month.
   */
  payCycleStartDay: number
}

export const DEFAULT_SETTINGS: Settings = {
  fuelPricePerLiter: 0,
  monthlyBudget: 0,
  payCycleStartDay: 1,
}

export interface CarpoolContribution {
  id: string
  /** ISO date for the week this contribution covers, e.g. 2026-09-21 */
  date: string
  /** Amount contributed, in Kwacha */
  amount: number
  createdAt: string
}
