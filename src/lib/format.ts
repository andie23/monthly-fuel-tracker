const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const wholeNumberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number): string {
  return numberFormatter.format(value)
}

export function formatLiters(value: number): string {
  return `${numberFormatter.format(value)} L`
}

export function formatKm(value: number): string {
  return `${wholeNumberFormatter.format(value)} km`
}

export function formatKmPerLiter(value: number): string {
  return `${numberFormatter.format(value)} km/L`
}

export function formatDays(value: number): string {
  return `${numberFormatter.format(value)} days`
}

export function formatKwacha(value: number): string {
  return `K ${numberFormatter.format(value)}`
}
