// The resync rule, extracted to be testable — see docs/reference/customization.md
export function shouldCommit(draft: string, serverValue: string) {
  return draft.trim() !== '' && draft.trim() !== serverValue
}

export function clampDelay(raw: string, min: number, max: number): number | null {
  const parsed = Number(raw)

  if (raw.trim() === '' || !Number.isFinite(parsed)) return null

  return Math.max(min, Math.min(max, Math.round(parsed)))
}
