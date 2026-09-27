import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDays, formatKm, formatKmPerLiter, formatKwacha, formatLiters } from './format'

describe('format helpers', () => {
  it('formats currency with grouping and two decimal places', () => {
    expect(formatCurrency(1234.5)).toBe('1,234.50')
    expect(formatCurrency(0)).toBe('0.00')
  })

  it('formats liters with two decimal places and a unit suffix', () => {
    expect(formatLiters(1234.567)).toBe('1,234.57 L')
  })

  it('formats km as a whole number with a unit suffix', () => {
    expect(formatKm(1234.9)).toBe('1,235 km')
  })

  it('formats km per liter with two decimal places', () => {
    expect(formatKmPerLiter(12.345)).toBe('12.35 km/L')
  })

  it('formats days with two decimal places', () => {
    expect(formatDays(2.5)).toBe('2.50 days')
  })

  it('formats kwacha with a K prefix and two decimal places', () => {
    expect(formatKwacha(1234.5)).toBe('K 1,234.50')
  })
})
