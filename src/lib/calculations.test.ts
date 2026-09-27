import { describe, expect, it } from 'vitest'
import type { CarpoolContribution, FuelLog } from '../types'
import {
  costFromLiters,
  estimateFuelDurationDays,
  getAverageDailyDistance,
  getAverageEfficiency,
  getAverageWeeklyMileage,
  getCostPerDay,
  getCurrentMonthCarpoolSavings,
  getCurrentMonthKm,
  getCurrentMonthSavings,
  getCurrentMonthSpent,
  getCycleBounds,
  getCycleBoundsForKey,
  getEfficiencyByLogId,
  getEfficiencyEntries,
  getLatestEfficiency,
  getMonthKey,
  getMonthlyCarpoolSavings,
  getMonthlyUsage,
  getProjectedMonthSavings,
  getProjectedMonthSpend,
  getTotalCarpoolSavings,
  litersFromCash,
} from './calculations'

function log(overrides: Partial<FuelLog>): FuelLog {
  return {
    id: overrides.id ?? Math.random().toString(),
    date: '2026-01-01',
    liters: 10,
    cost: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('litersFromCash / costFromLiters', () => {
  it('converts cash to liters using the price per liter', () => {
    expect(litersFromCash(100, 10)).toBe(10)
  })

  it('returns 0 when price per liter is not positive', () => {
    expect(litersFromCash(100, 0)).toBe(0)
    expect(litersFromCash(100, -5)).toBe(0)
  })

  it('converts liters to cost using the price per liter', () => {
    expect(costFromLiters(10, 10)).toBe(100)
  })
})

describe('getEfficiencyEntries / getLatestEfficiency / getAverageEfficiency', () => {
  // Each log's tripKm is the distance driven *after* that fill-up, so it
  // pairs with the liters bought at the *next* log to compute efficiency.
  const logs: FuelLog[] = [
    log({ id: '1', date: '2026-01-01', tripKm: 100, liters: 10 }),
    log({ id: '2', date: '2026-01-08', tripKm: 80, liters: 10 }),
    log({ id: '3', date: '2026-01-15', liters: 8 }), // most recent: trip still in progress
  ]

  it('pairs each trip distance with the following fill-up\'s liters', () => {
    const entries = getEfficiencyEntries(logs)
    expect(entries).toHaveLength(2)
    expect(entries[0].log.id).toBe('1')
    expect(entries[0].nextLog.id).toBe('2')
    expect(entries[0].kmPerLiter).toBe(10)
    expect(entries[0].days).toBe(7)
    expect(entries[1].log.id).toBe('2')
    expect(entries[1].nextLog.id).toBe('3')
    expect(entries[1].kmPerLiter).toBe(10)
    expect(entries[1].days).toBe(7)
  })

  it('ignores logs without a recorded trip distance', () => {
    const withOptional = [...logs, log({ id: '4', date: '2026-01-20', liters: 5 })]
    expect(getEfficiencyEntries(withOptional)).toHaveLength(2)
  })

  it('skips entries with a non-positive trip distance', () => {
    const bad = [
      log({ id: '1', date: '2026-01-01', tripKm: 0, liters: 10 }),
      log({ id: '2', date: '2026-01-08', liters: 10 }),
    ]
    expect(getEfficiencyEntries(bad)).toHaveLength(0)
  })

  it('skips entries where the next fill-up has non-positive liters', () => {
    const bad = [
      log({ id: '1', date: '2026-01-01', tripKm: 100, liters: 10 }),
      log({ id: '2', date: '2026-01-08', liters: 0 }),
    ]
    expect(getEfficiencyEntries(bad)).toHaveLength(0)
  })

  it('returns the most recently completed trip\'s efficiency', () => {
    expect(getLatestEfficiency(logs)).toBe(10)
  })

  it('returns null latest efficiency with fewer than two logs', () => {
    expect(getLatestEfficiency([log({ liters: 10 })])).toBeNull()
  })

  it('averages efficiency across all entries', () => {
    expect(getAverageEfficiency(logs)).toBe(10)
  })
})

describe('getEfficiencyByLogId', () => {
  it('keys each entry by the id of the log the trip started at', () => {
    const logs: FuelLog[] = [
      log({ id: 'a', date: '2026-01-01', tripKm: 100, liters: 10 }),
      log({ id: 'b', date: '2026-01-08', liters: 10 }),
    ]
    const map = getEfficiencyByLogId(logs)
    expect(map.size).toBe(1)
    expect(map.get('a')?.kmPerLiter).toBe(10)
    expect(map.has('b')).toBe(false)
  })
})

describe('getAverageDailyDistance / getAverageWeeklyMileage', () => {
  it('computes average distance per day, weighted by days between fill-ups', () => {
    const logs: FuelLog[] = [
      log({ id: '1', date: '2026-01-01', tripKm: 200, liters: 10 }),
      log({ id: '2', date: '2026-01-11', liters: 20 }),
    ]
    expect(getAverageDailyDistance(logs)).toBe(20)
    expect(getAverageWeeklyMileage(logs)).toBe(140)
  })

  it('returns null with only one logged fill-up', () => {
    expect(getAverageDailyDistance([log({ tripKm: 100, liters: 10 })])).toBeNull()
  })

  it('returns null when trip distance is not positive', () => {
    const logs: FuelLog[] = [
      log({ id: '1', date: '2026-01-01', tripKm: 0, liters: 10 }),
      log({ id: '2', date: '2026-01-11', liters: 10 }),
    ]
    expect(getAverageDailyDistance(logs)).toBeNull()
  })
})

describe('estimateFuelDurationDays', () => {
  it('estimates days remaining from liters, efficiency and daily distance', () => {
    const logs: FuelLog[] = [
      log({ id: '1', date: '2026-01-01', tripKm: 200, liters: 10 }),
      log({ id: '2', date: '2026-01-11', liters: 20 }),
    ]
    // efficiency = 200/20 = 10 km/l, daily distance = 200/10 = 20 km/day
    // 5 liters * 10 km/l = 50 km range / 20 km per day = 2.5 days
    expect(estimateFuelDurationDays(5, logs)).toBe(2.5)
  })

  it('returns null without enough history', () => {
    expect(estimateFuelDurationDays(10, [])).toBeNull()
  })
})

describe('getCostPerDay', () => {
  it('derives cost per day from weekly mileage, efficiency and fuel price', () => {
    const logs: FuelLog[] = [
      log({ id: '1', date: '2026-01-01', tripKm: 200, liters: 10 }),
      log({ id: '2', date: '2026-01-11', liters: 20 }),
    ]
    // daily distance 20km, efficiency 10 km/l -> 2 liters/day * price 5 = 10/day
    expect(getCostPerDay(logs, 5)).toBe(10)
  })

  it('returns null without enough history', () => {
    expect(getCostPerDay([], 5)).toBeNull()
  })
})

describe('getMonthKey / getMonthlyUsage / getCurrentMonthSpent', () => {
  it('formats a month key as YYYY-MM', () => {
    expect(getMonthKey('2026-03-15')).toBe('2026-03')
  })

  it('groups logs by month, newest first', () => {
    const logs: FuelLog[] = [
      log({ id: '1', date: '2026-01-05', liters: 10, cost: 100, tripKm: 120 }),
      log({ id: '2', date: '2026-01-20', liters: 5, cost: 50 }),
      log({ id: '3', date: '2026-02-02', liters: 8, cost: 80, tripKm: 60 }),
    ]
    const usage = getMonthlyUsage(logs)
    expect(usage).toEqual([
      { month: '2026-02', liters: 8, cost: 80, fillCount: 1, km: 60 },
      { month: '2026-01', liters: 15, cost: 150, fillCount: 2, km: 120 },
    ])
  })

  it('sums cost for logs within the current month', () => {
    const now = new Date('2026-03-15T00:00:00.000Z')
    const logs: FuelLog[] = [
      log({ id: '1', date: '2026-03-01', cost: 100 }),
      log({ id: '2', date: '2026-03-20', cost: 50 }),
      log({ id: '3', date: '2026-02-20', cost: 999 }),
    ]
    expect(getCurrentMonthSpent(logs, now)).toBe(150)
  })
})

describe('pay cycle support', () => {
  it('buckets a date before the cycle start day into the previous month\'s cycle', () => {
    expect(getMonthKey('2026-03-20', 25)).toBe('2026-02')
  })

  it('buckets a date on or after the cycle start day into that month\'s cycle', () => {
    expect(getMonthKey('2026-03-25', 25)).toBe('2026-03')
    expect(getMonthKey('2026-03-31', 25)).toBe('2026-03')
  })

  it('rolls over the year when the cycle starts in December', () => {
    expect(getMonthKey('2026-01-10', 25)).toBe('2025-12')
  })

  it('computes cycle bounds from a date', () => {
    const { start, end } = getCycleBounds(new Date('2026-03-20T00:00:00.000Z'), 25)
    expect(getMonthKey(start, 1)).toBe('2026-02') // sanity: start is Feb 25
    expect(start.getDate()).toBe(25)
    expect(start.getMonth()).toBe(1)
    expect(end.getMonth()).toBe(2)
    expect(end.getDate()).toBe(24)
  })

  it('computes cycle bounds from a month key', () => {
    const { start, end } = getCycleBoundsForKey('2026-03', 25)
    expect(start).toEqual(new Date(2026, 2, 25))
    expect(end).toEqual(new Date(2026, 3, 24))
  })

  it('groups fuel logs by pay cycle instead of calendar month', () => {
    const logs: FuelLog[] = [
      log({ id: '1', date: '2026-03-20', cost: 50 }), // before the 25th -> Feb cycle
      log({ id: '2', date: '2026-03-25', cost: 80 }), // on/after the 25th -> Mar cycle
      log({ id: '3', date: '2026-04-01', cost: 20 }), // before next cycle start -> Mar cycle
    ]
    const usage = getMonthlyUsage(logs, 25)
    expect(usage).toEqual([
      { month: '2026-03', liters: 20, cost: 100, fillCount: 2, km: 0 },
      { month: '2026-02', liters: 10, cost: 50, fillCount: 1, km: 0 },
    ])
  })

  it('sums current-cycle spend using the configured cycle start day', () => {
    const now = new Date('2026-03-20T00:00:00.000Z')
    const logs: FuelLog[] = [
      log({ id: '1', date: '2026-02-26', cost: 100 }), // in the cycle that contains now
      log({ id: '2', date: '2026-03-25', cost: 999 }), // next cycle, excluded
    ]
    expect(getCurrentMonthSpent(logs, now, 25)).toBe(100)
  })

  it('projects cycle-end spend using days remaining in the cycle, not the calendar month', () => {
    const now = new Date('2026-03-20T00:00:00.000Z') // cycle runs Feb 25 - Mar 24, 4 days remain
    const logs: FuelLog[] = [
      log({ id: '1', date: '2026-02-25', tripKm: 200, liters: 10, cost: 50 }),
      log({ id: '2', date: '2026-03-07', liters: 20, cost: 100 }),
    ]
    // costPerDay = 10 (as in getCostPerDay test), spent so far = 150
    expect(getProjectedMonthSpend(logs, 5, now, 25)).toBe(150 + 10 * 4)
  })
})

describe('getCurrentMonthKm', () => {
  it('sums km attributed to the current month', () => {
    const now = new Date('2026-03-15T00:00:00.000Z')
    const logs: FuelLog[] = [
      log({ id: '1', date: '2026-03-01', tripKm: 100 }),
      log({ id: '2', date: '2026-03-10', tripKm: 50 }),
      log({ id: '3', date: '2026-02-20', tripKm: 999 }),
    ]
    expect(getCurrentMonthKm(logs, now)).toBe(150)
  })

  it('returns 0 when there are no logs for the month', () => {
    expect(getCurrentMonthKm([], new Date('2026-03-15T00:00:00.000Z'))).toBe(0)
  })
})

describe('getProjectedMonthSpend / getProjectedMonthSavings', () => {
  it('projects month-end spend using the current daily cost rate', () => {
    const now = new Date('2026-01-11T00:00:00.000Z')
    const logs: FuelLog[] = [
      log({ id: '1', date: '2026-01-01', tripKm: 200, liters: 10, cost: 50 }),
      log({ id: '2', date: '2026-01-11', liters: 20, cost: 100 }),
    ]
    // costPerDay = 10 (see getCostPerDay test), spent so far = 150,
    // 20 days remain in January after the 11th
    expect(getProjectedMonthSpend(logs, 5, now)).toBe(150 + 10 * 20)
    expect(getProjectedMonthSavings(logs, 400, 5, now)).toBe(400 - (150 + 10 * 20))
  })

  it('returns null without enough history to compute a daily rate', () => {
    expect(getProjectedMonthSpend([], 5)).toBeNull()
    expect(getProjectedMonthSavings([], 400, 5)).toBeNull()
  })

  it('returns null when no monthly budget is set', () => {
    const logs: FuelLog[] = [
      log({ id: '1', date: '2026-01-01', tripKm: 200, liters: 10 }),
      log({ id: '2', date: '2026-01-11', liters: 20 }),
    ]
    expect(getProjectedMonthSavings(logs, 0, 5)).toBeNull()
  })
})

describe('getCurrentMonthSavings', () => {
  it('combines budget surplus with carpool contributions collected this month', () => {
    const now = new Date('2026-03-15T00:00:00.000Z')
    const logs: FuelLog[] = [log({ id: '1', date: '2026-03-01', cost: 100 })]
    const contributions: CarpoolContribution[] = [
      carpool({ id: '1', date: '2026-03-05', amount: 30 }),
      carpool({ id: '2', date: '2026-02-05', amount: 999 }),
    ]
    // budget 400 - spent 100 = 300 surplus, + 30 carpool this month
    expect(getCurrentMonthSavings(logs, contributions, 400, now)).toBe(330)
  })

  it('returns null when no monthly budget is set', () => {
    expect(getCurrentMonthSavings([], [], 0)).toBeNull()
  })
})

function carpool(overrides: Partial<CarpoolContribution>): CarpoolContribution {
  return {
    id: overrides.id ?? Math.random().toString(),
    date: '2026-01-01',
    amount: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('getTotalCarpoolSavings / getCurrentMonthCarpoolSavings', () => {
  it('sums all contributions', () => {
    const contributions = [carpool({ amount: 100 }), carpool({ amount: 50 })]
    expect(getTotalCarpoolSavings(contributions)).toBe(150)
  })

  it('returns 0 for no contributions', () => {
    expect(getTotalCarpoolSavings([])).toBe(0)
  })

  it('sums only contributions within the current month', () => {
    const now = new Date('2026-03-15T00:00:00.000Z')
    const contributions = [
      carpool({ id: '1', date: '2026-03-01', amount: 100 }),
      carpool({ id: '2', date: '2026-03-20', amount: 50 }),
      carpool({ id: '3', date: '2026-02-20', amount: 999 }),
    ]
    expect(getCurrentMonthCarpoolSavings(contributions, now)).toBe(150)
  })
})

describe('getMonthlyCarpoolSavings', () => {
  it('groups contributions by month, newest first', () => {
    const contributions: CarpoolContribution[] = [
      carpool({ id: '1', date: '2026-01-05', amount: 100 }),
      carpool({ id: '2', date: '2026-01-20', amount: 50 }),
      carpool({ id: '3', date: '2026-02-02', amount: 80 }),
    ]
    expect(getMonthlyCarpoolSavings(contributions)).toEqual([
      { month: '2026-02', amount: 80, contributionCount: 1 },
      { month: '2026-01', amount: 150, contributionCount: 2 },
    ])
  })
})
