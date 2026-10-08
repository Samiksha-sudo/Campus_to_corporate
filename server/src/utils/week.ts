// Weeks run Monday 00:00 → Sunday 23:59:59 UK time, so the counter resets just after midnight on Sunday night.
const TZ = 'Europe/London'

function offsetMs(at: Date): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(at).map(x => [x.type, x.value]),
  )
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return asUtc - Math.floor(at.getTime() / 1000) * 1000
}

/** Instant of the most recent Monday 00:00 UK time, `weeksBack` weeks earlier if given. */
export function ukWeekStart(now = new Date(), weeksBack = 0): Date {
  const local = new Date(now.getTime() + offsetMs(now))       // UK wall-clock as UTC fields
  const daysBack = (local.getUTCDay() + 6) % 7                // Mon=0 … Sun=6
  const wallMonday = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysBack - weeksBack * 7)
  const guess = new Date(wallMonday - offsetMs(now))
  return new Date(wallMonday - offsetMs(guess))                // re-resolve offset across DST changes
}

/**
 * Weekly used count. An admin can set a manual count for the current week
 * (stored in subscriptions.weeklyApplicationsUsed with weekStartedAt = when it was set);
 * it only applies while it falls inside the current UK week, so it clears itself on Sunday midnight.
 */
export function effectiveWeeklyUsed(
  sub: { weeklyApplicationsUsed?: number | null; weekStartedAt?: Date | string | null } | undefined,
  derived: number,
  now = new Date(),
): number {
  if (sub?.weekStartedAt != null && sub.weeklyApplicationsUsed != null
      && new Date(sub.weekStartedAt).getTime() >= ukWeekStart(now).getTime()) {
    return sub.weeklyApplicationsUsed
  }
  return derived
}
