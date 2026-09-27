import { useState } from 'react'
import { CarpoolHistory } from './components/CarpoolHistory'
import { CarpoolModal } from './components/CarpoolModal'
import { Dashboard } from './components/Dashboard'
import { LogFuelModal } from './components/LogFuelModal'
import { LogHistory } from './components/LogHistory'
import { MonthlyUsage } from './components/MonthlyUsage'
import { SettingsModal } from './components/SettingsModal'
import { sortLogsByDate } from './lib/calculations'
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
} from './lib/storage'
import type { Settings } from './types'

type Tab = 'dashboard' | 'history' | 'carpool' | 'monthly'

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'history', label: 'History' },
  { id: 'carpool', label: 'Carpool' },
  { id: 'monthly', label: 'Monthly' },
]

function App() {
  const [logs, setLogs] = useState(getLogs)
  const [carpoolContributions, setCarpoolContributions] = useState(getCarpoolContributions)
  const [settings, setSettings] = useState(getSettings)
  const [tab, setTab] = useState<Tab>('dashboard')
  const [showLogModal, setShowLogModal] = useState(false)
  const [showCarpoolModal, setShowCarpoolModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  function handleSaveLog(entry: { date: string; tripKm?: number; liters: number; cost: number }) {
    // The trip-meter reading describes the trip since the *previous* fill-up,
    // so it belongs on that earlier log, not on the one being created now.
    if (typeof entry.tripKm === 'number' && entry.tripKm > 0) {
      const earlierLogs = sortLogsByDate(logs).filter((log) => log.date <= entry.date)
      const previous = earlierLogs[earlierLogs.length - 1]
      if (previous) {
        updateLog(previous.id, { tripKm: entry.tripKm })
      }
    }

    const updated = addLog({
      id: makeId(),
      createdAt: new Date().toISOString(),
      date: entry.date,
      liters: entry.liters,
      cost: entry.cost,
    })
    setLogs(updated)
    setShowLogModal(false)
  }

  function handleDeleteLog(id: string) {
    setLogs(deleteLog(id))
  }

  function handleSaveCarpool(entry: { date: string; amount: number }) {
    const updated = addCarpoolContribution({
      id: makeId(),
      createdAt: new Date().toISOString(),
      date: entry.date,
      amount: entry.amount,
    })
    setCarpoolContributions(updated)
    setShowCarpoolModal(false)
  }

  function handleDeleteCarpool(id: string) {
    setCarpoolContributions(deleteCarpoolContribution(id))
  }

  function handleSaveSettings(next: Settings) {
    saveSettings(next)
    setSettings(next)
    setShowSettingsModal(false)
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Fuel Tracker</h1>
        <button
          onClick={() => setShowSettingsModal(true)}
          aria-label="Open settings"
          className="rounded-full border border-slate-800 p-2 text-slate-300"
        >
          ⚙
        </button>
      </header>

      <nav className="mb-6 flex gap-2 rounded-xl bg-slate-900 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-sky-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'dashboard' && (
        <Dashboard
          logs={logs}
          carpoolContributions={carpoolContributions}
          settings={settings}
          onLogFuel={() => setShowLogModal(true)}
          onLogCarpool={() => setShowCarpoolModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
      )}
      {tab === 'history' && <LogHistory logs={logs} onDelete={handleDeleteLog} />}
      {tab === 'carpool' && (
        <CarpoolHistory carpoolContributions={carpoolContributions} onDelete={handleDeleteCarpool} />
      )}
      {tab === 'monthly' && (
        <MonthlyUsage logs={logs} carpoolContributions={carpoolContributions} settings={settings} />
      )}

      {showLogModal && (
        <LogFuelModal
          settings={settings}
          canLogTripDistance={logs.length > 0}
          onClose={() => setShowLogModal(false)}
          onSave={handleSaveLog}
        />
      )}
      {showCarpoolModal && (
        <CarpoolModal onClose={() => setShowCarpoolModal(false)} onSave={handleSaveCarpool} />
      )}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  )
}

export default App
