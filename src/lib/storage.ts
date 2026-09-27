import { DEFAULT_SETTINGS, type CarpoolContribution, type FuelLog, type Settings } from '../types'

const LOGS_KEY = 'pft.fuelLogs'
const SETTINGS_KEY = 'pft.settings'
const CARPOOL_KEY = 'pft.carpoolContributions'

export function getLogs(): FuelLog[] {
  const raw = localStorage.getItem(LOGS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLogs(logs: FuelLog[]): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
}

export function addLog(log: FuelLog): FuelLog[] {
  const logs = [...getLogs(), log].sort((a, b) => a.date.localeCompare(b.date))
  saveLogs(logs)
  return logs
}

export function updateLog(id: string, patch: Partial<FuelLog>): FuelLog[] {
  const logs = getLogs().map((log) => (log.id === id ? { ...log, ...patch } : log))
  saveLogs(logs)
  return logs
}

export function deleteLog(id: string): FuelLog[] {
  const logs = getLogs().filter((log) => log.id !== id)
  saveLogs(logs)
  return logs
}

export function getSettings(): Settings {
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (!raw) return DEFAULT_SETTINGS
  try {
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function getCarpoolContributions(): CarpoolContribution[] {
  const raw = localStorage.getItem(CARPOOL_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCarpoolContributions(contributions: CarpoolContribution[]): void {
  localStorage.setItem(CARPOOL_KEY, JSON.stringify(contributions))
}

export function addCarpoolContribution(contribution: CarpoolContribution): CarpoolContribution[] {
  const contributions = [...getCarpoolContributions(), contribution].sort((a, b) => a.date.localeCompare(b.date))
  saveCarpoolContributions(contributions)
  return contributions
}

export function deleteCarpoolContribution(id: string): CarpoolContribution[] {
  const contributions = getCarpoolContributions().filter((c) => c.id !== id)
  saveCarpoolContributions(contributions)
  return contributions
}

export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
