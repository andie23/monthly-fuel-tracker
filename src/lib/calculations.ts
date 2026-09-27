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

/** Estimated number of days the given liters of fuel will last, based on historical efficiency and usage. */
export function estimateFuelDurationDays(
  liters: number,
  logs: FuelLog[],
): number | null {
  const efficiency = getAverageEfficiency(logs)
  const dailyDistance = getAverageDailyDistance(logs)
  if (efficiency === null || dailyDistance === null || dailyDistance <= 0) return null
  const totalRangeKm = liters * efficiency
  return totalRangeKm / dailyDistance
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

export function getMonthKey(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export interface MonthlyUsage {
  month: string
  liters: number
  cost: number
  fillCount: number
  /** Distance driven, attributed to the month of the fill-up that started each recorded trip. */
  km: number
}

export function getMonthlyUsage(logs: FuelLog[]): MonthlyUsage[] {
  const byMonth = new Map<string, MonthlyUsage>()

  for (const log of sortLogsByDate(logs)) {
    const month = getMonthKey(log.date)
    const existing = byMonth.get(month) ?? { month, liters: 0, cost: 0, fillCount: 0, km: 0 }
    existing.liters += log.liters
    existing.cost += log.cost
    existing.fillCount += 1
    if (typeof log.tripKm === 'number' && log.tripKm > 0) existing.km += log.tripKm
    byMonth.set(month, existing)
  }

  return [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month))
}

export function getCurrentMonthSpent(logs: FuelLog[], now: Date = new Date()): number {
  const currentMonth = getMonthKey(now)
  return logs
    .filter((log) => getMonthKey(log.date) === currentMonth)
    .reduce((sum, log) => sum + log.cost, 0)
}

/** Distance driven this month, attributed the same way as {@link getMonthlyUsage}. */
export function getCurrentMonthKm(logs: FuelLog[], now: Date = new Date()): number {
  const currentMonth = getMonthKey(now)
  return getMonthlyUsage(logs).find((entry) => entry.month === currentMonth)?.km ?? 0
}

/**
 * Projected total spend for the month, assuming spending continues at the
 * historical daily rate for the days remaining after `now`.
 */
export function getProjectedMonthSpend(
  logs: FuelLog[],
  pricePerLiter: number,
  now: Date = new Date(),
): number | null {
  const costPerDay = getCostPerDay(logs, pricePerLiter)
  if (costPerDay === null) return null

  const spent = getCurrentMonthSpent(logs, now)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysRemaining = Math.max(daysInMonth - now.getDate(), 0)
  return spent + costPerDay * daysRemaining
}

/**
 * Projected savings (budget minus projected spend) if the month finishes at
 * the current spending rate. Negative means projected to go over budget.
 */
export function getProjectedMonthSavings(
  logs: FuelLog[],
  monthlyBudget: number,
  pricePerLiter: number,
  now: Date = new Date(),
): number | null {
  if (monthlyBudget <= 0) return null
  const projectedSpend = getProjectedMonthSpend(logs, pricePerLiter, now)
  if (projectedSpend === null) return null
  return monthlyBudget - projectedSpend
}

/**
 * Money saved so far this month: budget surplus (or deficit, if over) plus
 * carpool contributions collected this month.
 */
export function getCurrentMonthSavings(
  logs: FuelLog[],
  contributions: CarpoolContribution[],
  monthlyBudget: number,
  now: Date = new Date(),
): number | null {
  if (monthlyBudget <= 0) return null
  const remaining = monthlyBudget - getCurrentMonthSpent(logs, now)
  return remaining + getCurrentMonthCarpoolSavings(contributions, now)
}

/** Amount actually spent out of pocket this month, after subtracting carpool contributions collected. */
export function getCurrentMonthNetSpent(
  logs: FuelLog[],
  contributions: CarpoolContribution[],
  now: Date = new Date(),
): number {
  return getCurrentMonthSpent(logs, now) - getCurrentMonthCarpoolSavings(contributions, now)
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

export function getMonthlyCarpoolSavings(contributions: CarpoolContribution[]): MonthlyCarpoolSavings[] {
  const byMonth = new Map<string, MonthlyCarpoolSavings>()

  for (const c of contributions) {
    const month = getMonthKey(c.date)
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
): number {
  const currentMonth = getMonthKey(now)
  return contributions
    .filter((c) => getMonthKey(c.date) === currentMonth)
    .reduce((sum, c) => sum + c.amount, 0)
}
