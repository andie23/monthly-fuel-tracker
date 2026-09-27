import type { CarpoolContribution, FuelLog } from '../types'

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function litersFromCash(cash: number, pricePerLiter: number): number {
  if (pricePerLiter <= 0) return 0
  return cash / pricePerLiter
}

export function costFromLiters(liters: number, pricePerLiter: number): number {
  return liters * pricePerLiter
}

export function sortLogsByDate(logs: FuelLog[]): FuelLog[] {
  return [...logs].sort((a, b) => a.date.localeCompare(b.date))
}

export interface EfficiencyEntry {
  /** The fill-up whose trip this describes — the trip started here. */
  log: FuelLog
  /** The following fill-up, which refilled the tank and ended the trip. */
  nextLog: FuelLog
  kmPerLiter: number
  /** Days between the two fill-ups, used to weight this entry into a daily average. */
  days: number | null
}

/**
 * Efficiency for each fill-up that recorded a trip-meter reading: the distance
 * driven since that fill-up (read directly off the trip meter, then reset),
 * divided by the liters bought at the *next* fill-up to refill the tank.
 */
export function getEfficiencyEntries(logs: FuelLog[]): EfficiencyEntry[] {
  const sorted = sortLogsByDate(logs)
  const entries: EfficiencyEntry[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const log = sorted[i]
    const nextLog = sorted[i + 1]
    if (typeof log.tripKm !== 'number' || log.tripKm <= 0 || nextLog.liters <= 0) continue

    const days = (new Date(nextLog.date).getTime() - new Date(log.date).getTime()) / MS_PER_DAY

    entries.push({ log, nextLog, kmPerLiter: log.tripKm / nextLog.liters, days: days > 0 ? days : null })
  }

  return entries
}

/** Maps each starting log's id to the efficiency of the trip it began, for quick per-log lookups. */
export function getEfficiencyByLogId(logs: FuelLog[]): Map<string, EfficiencyEntry> {
  return new Map(getEfficiencyEntries(logs).map((entry) => [entry.log.id, entry]))
}

export function getLatestEfficiency(logs: FuelLog[]): number | null {
  const entries = getEfficiencyEntries(logs)
  if (entries.length === 0) return null
  return entries[entries.length - 1].kmPerLiter
}

export function getAverageEfficiency(logs: FuelLog[]): number | null {
  const entries = getEfficiencyEntries(logs)
  if (entries.length === 0) return null
  const total = entries.reduce((sum, entry) => sum + entry.kmPerLiter, 0)
  return total / entries.length
}

/** Average distance covered per day, weighted by the days elapsed between each logged trip. */
export function getAverageDailyDistance(logs: FuelLog[]): number | null {
  const entries = getEfficiencyEntries(logs).filter((entry) => entry.days !== null)
  if (entries.length === 0) return null

  const totalKm = entries.reduce((sum, entry) => sum + entry.log.tripKm!, 0)
  const totalDays = entries.reduce((sum, entry) => sum + entry.days!, 0)

  if (totalDays <= 0) return null
  return totalKm / totalDays
}

export function getAverageWeeklyMileage(logs: FuelLog[]): number | null {
  const dailyDistance = getAverageDailyDistance(logs)
  if (dailyDistance === null) return null
  return dailyDistance * 7
}

/** Estimated distance the given liters of fuel will cover, based on historical average efficiency. */
export function estimateFuelRangeKm(liters: number, logs: FuelLog[]): number | null {
  const efficiency = getAverageEfficiency(logs)
  if (efficiency === null) return null
  return liters * efficiency
}

/** Estimated number of days the given liters of fuel will last, based on historical efficiency and usage. */
export function estimateFuelDurationDays(
  liters: number,
  logs: FuelLog[],
): number | null {
  const rangeKm = estimateFuelRangeKm(liters, logs)
  const dailyDistance = getAverageDailyDistance(logs)
  if (rangeKm === null || dailyDistance === null || dailyDistance <= 0) return null
  return rangeKm / dailyDistance
}

/** Estimated cost per day, based on average weekly mileage, average efficiency and fuel price. */
export function getCostPerDay(logs: FuelLog[], pricePerLiter: number): number | null {
  const weeklyMileage = getAverageWeeklyMileage(logs)
  const efficiency = getAverageEfficiency(logs)
  if (weeklyMileage === null || efficiency === null || efficiency <= 0) return null
  const dailyDistance = weeklyMileage / 7
  const litersPerDay = dailyDistance / efficiency
  return litersPerDay * pricePerLiter
}

/**
 * Key identifying the pay cycle a date falls in, named after the calendar
 * month the cycle *starts* in. With `cycleStartDay` 1 (the default) this is
 * just the calendar month; with e.g. 25, a date on or after the 25th
 * belongs to the cycle starting that month, and anything earlier belongs to
 * the cycle that started the previous month.
 */
export function getMonthKey(date: string | Date, cycleStartDay = 1): string {
  const d = typeof date === 'string' ? new Date(date) : date
  let year = d.getFullYear()
  let month = d.getMonth()
  if (d.getDate() < cycleStartDay) {
    month -= 1
    if (month < 0) {
      month = 11
      year -= 1
    }
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

/** First and last calendar day of the pay cycle identified by a {@link getMonthKey} key. */
export function getCycleBoundsForKey(monthKey: string, cycleStartDay = 1): { start: Date; end: Date } {
  const [year, month] = monthKey.split('-').map(Number)
  return {
    start: new Date(year, month - 1, cycleStartDay),
    end: new Date(year, month, cycleStartDay - 1),
  }
}

/** First and last calendar day of the pay cycle that `date` falls in. */
export function getCycleBounds(date: Date, cycleStartDay = 1): { start: Date; end: Date } {
  return getCycleBoundsForKey(getMonthKey(date, cycleStartDay), cycleStartDay)
}

function daysBetweenDates(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcB - utcA) / MS_PER_DAY)
}

export interface MonthlyUsage {
  month: string
  liters: number
  cost: number
  fillCount: number
  /** Distance driven, attributed to the month of the fill-up that started each recorded trip. */
  km: number
}

export function getMonthlyUsage(logs: FuelLog[], cycleStartDay = 1): MonthlyUsage[] {
  const byMonth = new Map<string, MonthlyUsage>()

  for (const log of sortLogsByDate(logs)) {
    const month = getMonthKey(log.date, cycleStartDay)
    const existing = byMonth.get(month) ?? { month, liters: 0, cost: 0, fillCount: 0, km: 0 }
    existing.liters += log.liters
    existing.cost += log.cost
    existing.fillCount += 1
    if (typeof log.tripKm === 'number' && log.tripKm > 0) existing.km += log.tripKm
    byMonth.set(month, existing)
  }

  return [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month))
}

export function getCurrentMonthSpent(logs: FuelLog[], now: Date = new Date(), cycleStartDay = 1): number {
  const currentMonth = getMonthKey(now, cycleStartDay)
  return logs
    .filter((log) => getMonthKey(log.date, cycleStartDay) === currentMonth)
    .reduce((sum, log) => sum + log.cost, 0)
}

/** Distance driven this cycle, attributed the same way as {@link getMonthlyUsage}. */
export function getCurrentMonthKm(logs: FuelLog[], now: Date = new Date(), cycleStartDay = 1): number {
  const currentMonth = getMonthKey(now, cycleStartDay)
  return getMonthlyUsage(logs, cycleStartDay).find((entry) => entry.month === currentMonth)?.km ?? 0
}

/**
 * Projected total spend for the cycle, assuming spending continues at the
 * historical daily rate for the days remaining after `now`.
 */
export function getProjectedMonthSpend(
  logs: FuelLog[],
  pricePerLiter: number,
  now: Date = new Date(),
  cycleStartDay = 1,
): number | null {
  const costPerDay = getCostPerDay(logs, pricePerLiter)
  if (costPerDay === null) return null

  const spent = getCurrentMonthSpent(logs, now, cycleStartDay)
  const { end } = getCycleBounds(now, cycleStartDay)
  const daysRemaining = Math.max(daysBetweenDates(now, end), 0)
  return spent + costPerDay * daysRemaining
}

/**
 * Projected savings (budget minus projected spend) if the cycle finishes at
 * the current spending rate. Negative means projected to go over budget.
 */
export function getProjectedMonthSavings(
  logs: FuelLog[],
  monthlyBudget: number,
  pricePerLiter: number,
  now: Date = new Date(),
  cycleStartDay = 1,
): number | null {
  if (monthlyBudget <= 0) return null
  const projectedSpend = getProjectedMonthSpend(logs, pricePerLiter, now, cycleStartDay)
  if (projectedSpend === null) return null
  return monthlyBudget - projectedSpend
}

/**
 * Money saved so far this cycle: budget surplus (or deficit, if over) plus
 * carpool contributions collected this cycle.
 */
export function getCurrentMonthSavings(
  logs: FuelLog[],
  contributions: CarpoolContribution[],
  monthlyBudget: number,
  now: Date = new Date(),
  cycleStartDay = 1,
): number | null {
  if (monthlyBudget <= 0) return null
  const remaining = monthlyBudget - getCurrentMonthSpent(logs, now, cycleStartDay)
  return remaining + getCurrentMonthCarpoolSavings(contributions, now, cycleStartDay)
}

/** Amount actually spent out of pocket this cycle, after subtracting carpool contributions collected. */
export function getCurrentMonthNetSpent(
  logs: FuelLog[],
  contributions: CarpoolContribution[],
  now: Date = new Date(),
  cycleStartDay = 1,
): number {
  return getCurrentMonthSpent(logs, now, cycleStartDay) - getCurrentMonthCarpoolSavings(contributions, now, cycleStartDay)
}

/** Total carpooling contributions collected across all time, treated as fuel-cost savings. */
export function getTotalCarpoolSavings(contributions: CarpoolContribution[]): number {
  return contributions.reduce((sum, c) => sum + c.amount, 0)
}

export interface MonthlyCarpoolSavings {
  month: string
  amount: number
  contributionCount: number
}

export function getMonthlyCarpoolSavings(
  contributions: CarpoolContribution[],
  cycleStartDay = 1,
): MonthlyCarpoolSavings[] {
  const byMonth = new Map<string, MonthlyCarpoolSavings>()

  for (const c of contributions) {
    const month = getMonthKey(c.date, cycleStartDay)
    const existing = byMonth.get(month) ?? { month, amount: 0, contributionCount: 0 }
    existing.amount += c.amount
    existing.contributionCount += 1
    byMonth.set(month, existing)
  }

  return [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month))
}

export function getCurrentMonthCarpoolSavings(
  contributions: CarpoolContribution[],
  now: Date = new Date(),
  cycleStartDay = 1,
): number {
  const currentMonth = getMonthKey(now, cycleStartDay)
  return contributions
    .filter((c) => getMonthKey(c.date, cycleStartDay) === currentMonth)
    .reduce((sum, c) => sum + c.amount, 0)
}
