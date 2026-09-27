export function confirmDeleteLog(date: string): boolean {
  return window.confirm(`Delete the fuel log from ${date}? This can't be undone.`)
}

export function confirmDeleteCarpool(date: string): boolean {
  return window.confirm(`Delete the carpool contribution from ${date}? This can't be undone.`)
}
