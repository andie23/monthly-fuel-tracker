import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('App', () => {
  it('renders the dashboard by default with the log fuel button', () => {
    render(<App />)
    expect(screen.getByText('+ Log Fuel')).toBeInTheDocument()
  })

  it('lets the user set fuel price and log a fuel entry by cash', () => {
    render(<App />)

    fireEvent.click(screen.getByLabelText('Open settings'))
    fireEvent.change(screen.getByLabelText('Fuel price per liter'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    fireEvent.click(screen.getByText('+ Log Fuel'))
    fireEvent.click(screen.getByText('Switch to cash'))
    fireEvent.change(screen.getByLabelText('Cash spent'), { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    fireEvent.click(screen.getByText('History'))
    expect(screen.getByText(/10.00 L/)).toBeInTheDocument()
  })

  it('shows logged entries in history and allows deleting from there', () => {
    render(<App />)
    fireEvent.click(screen.getByText('+ Log Fuel'))
    fireEvent.change(screen.getByLabelText('Liters bought'), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    fireEvent.click(screen.getByText('History'))
    expect(screen.getByText(/12.00 L/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Delete log/ }))
    expect(screen.getByText('No fuel logs yet.')).toBeInTheDocument()
  })

  it('shows logged carpool contributions in the carpool tab and allows deleting from there', () => {
    render(<App />)
    fireEvent.click(screen.getByText('+ Log Carpool Contribution'))
    fireEvent.change(screen.getByLabelText('Amount (Kwacha)'), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    fireEvent.click(screen.getByText('Carpool'))
    expect(screen.getByText(/K 50/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Delete carpool contribution/ }))
    expect(screen.getByText('No carpool contributions yet.')).toBeInTheDocument()
  })

  it('deletes a logged entry from history after confirming', () => {
    render(<App />)
    fireEvent.click(screen.getByText('+ Log Fuel'))
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-02-01' } })
    fireEvent.change(screen.getByLabelText('Liters bought'), { target: { value: '15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    fireEvent.click(screen.getByText('History'))
    expect(screen.getByText(/15.00 L/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Delete log/ }))
    expect(window.confirm).toHaveBeenCalledWith(
      "Delete the fuel log from 2026-02-01? This can't be undone.",
    )
    expect(screen.getByText('No fuel logs yet.')).toBeInTheDocument()
  })

  it('keeps a logged entry when the delete confirmation is declined', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<App />)
    fireEvent.click(screen.getByText('+ Log Fuel'))
    fireEvent.change(screen.getByLabelText('Liters bought'), { target: { value: '15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    fireEvent.click(screen.getByText('History'))
    fireEvent.click(screen.getByRole('button', { name: /Delete log/ }))

    expect(screen.getByText(/15.00 L/)).toBeInTheDocument()
  })

  it('does not offer trip distance on the very first fill-up, with nothing earlier to attach it to', () => {
    render(<App />)
    fireEvent.click(screen.getByText('+ Log Fuel'))
    expect(screen.queryByLabelText('Distance since last fill-up (optional)')).not.toBeInTheDocument()
  })

  it('attaches the trip distance entered at a refuel back onto the previous fill-up', () => {
    render(<App />)

    fireEvent.click(screen.getByText('+ Log Fuel'))
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText('Liters bought'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    fireEvent.click(screen.getByText('+ Log Fuel'))
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-01-08' } })
    fireEvent.change(screen.getByLabelText('Distance since last fill-up (optional)'), {
      target: { value: '100' },
    })
    fireEvent.change(screen.getByLabelText('Liters bought'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    fireEvent.click(screen.getByText('History'))
    // The 100km belongs to the Jan 1 fill-up (the trip it powered), tagged with
    // when that trip ended — not shown as if it happened on Jan 1 itself.
    expect(
      screen.getByText(/100 km until next fill-up \(2026-01-08\).*10\.00 km\/L/),
    ).toBeInTheDocument()
  })
})
