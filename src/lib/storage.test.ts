import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../types'
import {
  addCarpoolContribution,
  addLog,
  deleteCarpoolContribution,
  deleteLog,
  getCarpoolContributions,
  getLogs,
  getSettings,
  makeId,
  saveSettings,
  updateLog,
} from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('logs storage', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(getLogs()).toEqual([])
  })

  it('adds a log and persists it sorted by date', () => {
    addLog({ id: makeId(), date: '2026-02-01', liters: 5, cost: 50, createdAt: 'x' })
    const logs = addLog({ id: makeId(), date: '2026-01-01', liters: 10, cost: 100, createdAt: 'y' })
    expect(logs.map((l) => l.date)).toEqual(['2026-01-01', '2026-02-01'])
  })

  it('deletes a log by id', () => {
    const id = makeId()
    addLog({ id, date: '2026-01-01', liters: 10, cost: 100, createdAt: 'x' })
    const logs = deleteLog(id)
    expect(logs).toEqual([])
  })

  it('recovers gracefully from corrupted storage', () => {
    localStorage.setItem('pft.fuelLogs', 'not json')
    expect(getLogs()).toEqual([])
  })

  it('updates a log by id, leaving others untouched', () => {
    const id = makeId()
    addLog({ id, date: '2026-01-01', liters: 10, cost: 100, createdAt: 'x' })
    addLog({ id: makeId(), date: '2026-01-08', liters: 5, cost: 50, createdAt: 'y' })

    const logs = updateLog(id, { tripKm: 250 })
    expect(logs.find((l) => l.id === id)?.tripKm).toBe(250)
    expect(logs.find((l) => l.id !== id)?.tripKm).toBeUndefined()
  })
})

describe('settings storage', () => {
  it('returns defaults when nothing is stored', () => {
    expect(getSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('saves and reloads settings', () => {
    saveSettings({ fuelPricePerLiter: 1.5, monthlyBudget: 200, payCycleStartDay: 25 })
    expect(getSettings()).toEqual({ fuelPricePerLiter: 1.5, monthlyBudget: 200, payCycleStartDay: 25 })
  })

  it('recovers gracefully from corrupted storage', () => {
    localStorage.setItem('pft.settings', 'not json')
    expect(getSettings()).toEqual(DEFAULT_SETTINGS)
  })
})

describe('carpool contribution storage', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(getCarpoolContributions()).toEqual([])
  })

  it('adds a contribution and persists it sorted by date', () => {
    addCarpoolContribution({ id: makeId(), date: '2026-02-01', amount: 500, createdAt: 'x' })
    const contributions = addCarpoolContribution({
      id: makeId(),
      date: '2026-01-01',
      amount: 300,
      createdAt: 'y',
    })
    expect(contributions.map((c) => c.date)).toEqual(['2026-01-01', '2026-02-01'])
  })

  it('deletes a contribution by id', () => {
    const id = makeId()
    addCarpoolContribution({ id, date: '2026-01-01', amount: 300, createdAt: 'x' })
    expect(deleteCarpoolContribution(id)).toEqual([])
  })

  it('recovers gracefully from corrupted storage', () => {
    localStorage.setItem('pft.carpoolContributions', 'not json')
    expect(getCarpoolContributions()).toEqual([])
  })
})
