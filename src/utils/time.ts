/** 相对时间显示 · 不引 dayjs · 简陋版 (5 分钟前 / 1 小时前 / 昨天 / 3-15) */

const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/** 输入 ISO 字符串 / Date · 返中文相对时间 */
export function relativeTime(input: string | Date | null | undefined): string {
  if (!input) return ''
  const t = typeof input === 'string' ? new Date(input).getTime() : input.getTime()
  if (!Number.isFinite(t)) return ''
  const now = Date.now()
  const diff = now - t
  if (diff < MIN) return '刚刚'
  if (diff < HOUR) return `${Math.floor(diff / MIN)} 分钟前`
  if (diff < DAY) return `${Math.floor(diff / HOUR)} 小时前`
  if (diff < 2 * DAY) return '昨天'
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} 天前`
  // 超 7 天 · 显示 月-日 (今年) / 年-月-日 (跨年)
  const d = new Date(t)
  const nowD = new Date(now)
  const m = d.getMonth() + 1
  const day = d.getDate()
  if (d.getFullYear() === nowD.getFullYear()) return `${m}-${day}`
  return `${d.getFullYear()}-${m}-${day}`
}
