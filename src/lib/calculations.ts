import { WeeklyEntry, StatusColor } from '../types'

export const WEEKS_IN_YEAR = 52

export function sumEntries(entries: WeeklyEntry[], field: keyof WeeklyEntry): number {
  return entries.reduce((sum, e) => sum + (Number(e[field]) || 0), 0)
}

export function weeklyRequired(annualGoal: number): number {
  return annualGoal / WEEKS_IN_YEAR
}

export function shouldBe(annualGoal: number, currentWeek: number): number {
  return (annualGoal / WEEKS_IN_YEAR) * currentWeek
}

export function onTrackFor(actual: number, currentWeek: number): number {
  if (currentWeek === 0) return 0
  return (actual / currentWeek) * WEEKS_IN_YEAR
}

export function getStatus(actual: number, shouldBeVal: number): StatusColor {
  if (shouldBeVal === 0) return 'on-track'
  const ratio = actual / shouldBeVal
  if (ratio >= 1.05) return 'ahead'
  if (ratio >= 0.95) return 'on-track'
  if (ratio >= 0.75) return 'behind'
  return 'critical'
}

export function getStatusColors(status: StatusColor) {
  switch (status) {
    case 'ahead': return { text: 'text-emerald-400', bg: 'bg-emerald-400', border: 'border-emerald-500/30', row: 'bg-emerald-500/5' }
    case 'on-track': return { text: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-500/30', row: 'bg-yellow-500/5' }
    case 'behind': return { text: 'text-orange-400', bg: 'bg-orange-400', border: 'border-orange-500/30', row: 'bg-orange-500/5' }
    case 'critical': return { text: 'text-red-400', bg: 'bg-red-400', border: 'border-red-500/30', row: 'bg-red-500/5' }
  }
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

export function formatNumber(val: number, decimals = 1): string {
  if (val === 0) return '0'
  return val.toFixed(decimals).replace(/\.0$/, '')
}

export function safeDiv(num: number, den: number): number {
  if (!den || den === 0) return 0
  return num / den
}

export function getCurrentWeek(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))
}

export function getRankBadge(entries: WeeklyEntry[]): { rank: string; color: string } {
  const totalClosed = sumEntries(entries, 'sales_closed')
  const totalListings = sumEntries(entries, 'listings_taken')
  if (totalClosed >= 30 || totalListings >= 30) return { rank: 'GOLD', color: 'text-yellow-400' }
  if (totalClosed >= 15 || totalListings >= 15) return { rank: 'SILVER', color: 'text-slate-300' }
  if (totalClosed >= 5 || totalListings >= 5) return { rank: 'BRONZE', color: 'text-amber-600' }
  return { rank: '', color: '' }
}

export function computeMarketingKPIs(entry: {
  ad_spend: number
  total_optins: number
  conversations: number
  agreements_signed: number
  deals_closed: number
  gci_from_ads: number
}) {
  const { ad_spend, total_optins, conversations, agreements_signed, deals_closed, gci_from_ads } = entry

  const fmt = (val: number, prefix = '$') => {
    if (!isFinite(val) || isNaN(val)) return '—'
    return prefix === '$'
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
      : val.toFixed(1) + '%'
  }

  return {
    cpl: total_optins > 0 ? fmt(ad_spend / total_optins) : '—',
    cplRaw: total_optins > 0 ? ad_spend / total_optins : null,
    contactRate: total_optins > 0 ? fmt((conversations / total_optins) * 100, '%') : '—',
    contactRateRaw: total_optins > 0 ? (conversations / total_optins) * 100 : null,
    cac: agreements_signed > 0 ? fmt(ad_spend / agreements_signed) : '—',
    cacRaw: agreements_signed > 0 ? ad_spend / agreements_signed : null,
    costPerDeal: deals_closed > 0 ? fmt(ad_spend / deals_closed) : '—',
    costPerDealRaw: deals_closed > 0 ? ad_spend / deals_closed : null,
    spendToGci: gci_from_ads > 0 ? `1:${(gci_from_ads / ad_spend).toFixed(1)}` : '—',
    spendToGciRaw: gci_from_ads > 0 ? gci_from_ads / ad_spend : null,
  }
}
