import { useState, useEffect } from 'react'
import { useScoreboard } from '../hooks/useScoreboard'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  sumEntries, shouldBe, weeklyRequired, onTrackFor,
  getStatus, getStatusColors, formatCurrency, formatNumber,
  safeDiv, getCurrentWeek, getRankBadge
} from '../lib/calculations'
import { WeeklyEntry } from '../types'
import { ChevronDown, ChevronUp, Edit2, X, Check, Trophy, Star, TrendingUp } from 'lucide-react'

interface GoalRow {
  key: keyof WeeklyEntry
  label: string
  isCurrency?: boolean
  isPercent?: boolean
  decimals?: number
}

const ACTIVITY_ROWS: GoalRow[] = [
  { key: 'pro_days', label: 'PRO Days' },
  { key: 'hours_practiced', label: 'Hours Practiced' },
  { key: 'hours_prospected', label: 'Hours Prospected' },
  { key: 'quality_conversations', label: 'Quality Conversations' },
  { key: 'added_to_pc', label: 'Added to PC' },
  { key: 'new_leads', label: 'New Leads' },
  { key: 'open_house_events', label: 'Open House Events' },
]

const LISTING_ROWS: GoalRow[] = [
  { key: 'listing_appts_set', label: 'Listing Appts Set' },
  { key: 'listing_appts_held', label: 'Listing Appts Held' },
  { key: 'listings_taken', label: 'Listings Taken' },
  { key: 'listings_sold', label: 'Listings Sold' },
]

const BUYER_ROWS: GoalRow[] = [
  { key: 'buyer_rep', label: 'Buyer Rep Agreements' },
  { key: 'buyer_sales', label: 'Buyer Sales' },
]

const INCOME_ROWS: GoalRow[] = [
  { key: 'earned_income', label: 'Earned Income', isCurrency: true },
  { key: 'sales_closed', label: 'Sales Closed' },
  { key: 'paid_income', label: 'Paid Income', isCurrency: true },
]

const ALL_SECTIONS = [
  { title: 'ACTIVITY', rows: ACTIVITY_ROWS },
  { title: 'LISTINGS', rows: LISTING_ROWS },
  { title: 'BUYERS', rows: BUYER_ROWS },
  { title: 'INCOME', rows: INCOME_ROWS },
]

type GoalMap = Record<string, number>

const DEFAULT_GOALS: GoalMap = {
  pro_days: 200, hours_practiced: 200, hours_prospected: 400, quality_conversations: 800,
  added_to_pc: 200, new_leads: 100, open_house_events: 20,
  listing_appts_set: 100, listing_appts_held: 80, listings_taken: 50, listings_sold: 45,
  buyer_rep: 30, buyer_sales: 25,
  earned_income: 200000, sales_closed: 30, paid_income: 180000,
}

function EditWeekModal({ entry, weekNumber, onSave, onClose }: {
  entry: Partial<WeeklyEntry>
  weekNumber: number
  onSave: (data: Partial<WeeklyEntry>) => void
  onClose: () => void
}) {
  const allRows = ALL_SECTIONS.flatMap(s => s.rows)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    allRows.forEach(r => { init[r.key] = String(entry[r.key] ?? 0) })
    init.active_pipeline = String(entry.active_pipeline ?? 0)
    init.pending = String(entry.pending ?? 0)
    init.starting_pc_total = String(entry.starting_pc_total ?? 0)
    init.current_pc_total = String(entry.current_pc_total ?? 0)
    return init
  })

  function handleSave() {
    const data: Partial<WeeklyEntry> = {}
    Object.entries(values).forEach(([k, v]) => {
      (data as Record<string, number>)[k] = parseFloat(v) || 0
    })
    onSave(data)
  }

  const inputCls = 'bg-[#121830] border border-[#1a2240] text-white rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 w-full'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1224] border border-[#1a2240] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#1a2240]">
          <h2 className="text-lg font-bold text-white">Edit Week {weekNumber}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-6">
          {ALL_SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">{section.title}</h3>
              <div className="grid grid-cols-2 gap-3">
                {section.rows.map(row => (
                  <div key={row.key}>
                    <label className="block text-xs text-slate-400 mb-1">{row.label}</label>
                    <input type="number" min="0" step={row.isCurrency ? '0.01' : '1'} value={values[row.key]} onChange={e => setValues(p => ({ ...p, [row.key]: e.target.value }))} className={inputCls} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">PIPELINE</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['starting_pc_total', 'current_pc_total', 'active_pipeline', 'pending'] as const).map(key => (
                <div key={key}>
                  <label className="block text-xs text-slate-400 mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                  <input type="number" min="0" value={values[key]} onChange={e => setValues(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-[#1a2240]">
          <button onClick={handleSave} className="btn-primary flex items-center gap-2 flex-1 justify-center">
            <Check size={16} /> Save Week
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ value, goal, status }: { value: number; goal: number; status: string }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  const colors = getStatusColors(status as 'ahead' | 'on-track' | 'behind' | 'critical')
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-[#1a2240] rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${colors.bg} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs ${colors.text} w-8 text-right`}>{pct.toFixed(0)}%</span>
    </div>
  )
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { scoreboardId, entries, loading, upsertEntry } = useScoreboard()
  const [goals, setGoals] = useState<GoalMap>(DEFAULT_GOALS)
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek())
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [goalsLoading, setGoalsLoading] = useState(true)
  const maxWeek = Math.max(...entries.map(e => e.week_number), selectedWeek)
  const weekOptions = Array.from({ length: maxWeek }, (_, i) => i + 1)
  const currentEntry = entries.find(e => e.week_number === selectedWeek) || {} as Partial<WeeklyEntry>
  const rank = getRankBadge(entries)

  useEffect(() => {
    if (!scoreboardId) return
    async function loadGoals() {
      try {
        const { data } = await supabase.from('goals').select('*').eq('scoreboard_id', scoreboardId).maybeSingle()
        if (data) {
          const g: GoalMap = {}
          Object.keys(DEFAULT_GOALS).forEach(k => { g[k] = Number(data[k]) || DEFAULT_GOALS[k] })
          setGoals(g)
        }
      } catch (_) {
        // use defaults
      } finally {
        setGoalsLoading(false)
      }
    }
    loadGoals()
  }, [scoreboardId])

  if (loading || goalsLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  )

  function formatVal(val: number, row: GoalRow) {
    if (row.isCurrency) return formatCurrency(val)
    return formatNumber(val, row.decimals ?? 0)
  }

  function renderSection(title: string, rows: GoalRow[]) {
    return (
      <tbody key={title}>
        <tr>
          <td colSpan={7} className="px-4 pt-5 pb-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{title}</span>
          </td>
        </tr>
        {rows.map(row => {
          const actual = sumEntries(entries, row.key)
          const goal = goals[row.key] ?? 0
          const wkReq = weeklyRequired(goal)
          const sb = shouldBe(goal, selectedWeek)
          const wkAvg = entries.length > 0 ? actual / selectedWeek : 0
          const otf = onTrackFor(actual, selectedWeek)
          const status = getStatus(actual, sb)
          const colors = getStatusColors(status)

          return (
            <tr key={row.key} className={`border-t border-[#1a2240]/50 hover:bg-[#1a2240]/30 transition-colors ${colors.row}`}>
              <td className="px-4 py-2.5 text-sm text-slate-300">{row.label}</td>
              <td className="px-4 py-2.5 text-sm text-white font-medium text-right">{formatVal(goal, row)}</td>
              <td className="px-4 py-2.5 text-sm text-slate-300 text-right">{formatVal(wkReq, row)}</td>
              <td className="px-4 py-2.5 text-sm text-slate-300 text-right">{formatVal(sb, row)}</td>
              <td className="px-4 py-2.5 text-right">
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-sm font-semibold ${colors.text}`}>{formatVal(actual, row)}</span>
                  <ProgressBar value={actual} goal={goal} status={status} />
                </div>
              </td>
              <td className="px-4 py-2.5 text-sm text-slate-300 text-right">{formatVal(wkAvg, row)}</td>
              <td className={`px-4 py-2.5 text-sm font-semibold text-right ${colors.text}`}>{formatVal(otf, row)}</td>
            </tr>
          )
        })}
      </tbody>
    )
  }

  // Pipeline data from latest entry
  const latestEntry = entries[entries.length - 1] || {}
  const totalEarnedIncome = sumEntries(entries, 'earned_income')
  const totalHoursProspected = sumEntries(entries, 'hours_prospected')
  const totalConversations = sumEntries(entries, 'quality_conversations')
  const totalProDays = sumEntries(entries, 'pro_days')
  const totalListingAppts = sumEntries(entries, 'listing_appts_set')
  const totalListingsTaken = sumEntries(entries, 'listings_taken')

  const ratios = [
    { label: 'Hrs Prospected / PRO Day', goal: safeDiv(goals.hours_prospected, goals.pro_days), actual: safeDiv(totalHoursProspected, totalProDays) },
    { label: 'Contacts / PRO Day', goal: safeDiv(goals.quality_conversations, goals.pro_days), actual: safeDiv(totalConversations, totalProDays) },
    { label: 'Contacts / Hour', goal: safeDiv(goals.quality_conversations, goals.hours_prospected), actual: safeDiv(totalConversations, totalHoursProspected) },
    { label: 'Hrs Prospected / Appt', goal: safeDiv(goals.hours_prospected, goals.listing_appts_set), actual: safeDiv(totalHoursProspected, totalListingAppts) },
    { label: 'Contacts / Appt', goal: safeDiv(goals.quality_conversations, goals.listing_appts_set), actual: safeDiv(totalConversations, totalListingAppts) },
    { label: 'Hrs Prospected / Listing', goal: safeDiv(goals.hours_prospected, goals.listings_taken), actual: safeDiv(totalHoursProspected, totalListingsTaken) },
    { label: 'Contacts / Listing', goal: safeDiv(goals.quality_conversations, goals.listings_taken), actual: safeDiv(totalConversations, totalListingsTaken) },
    { label: 'List Appts / Listing Taken', goal: safeDiv(goals.listing_appts_set, goals.listings_taken), actual: safeDiv(totalListingAppts, totalListingsTaken) },
    { label: 'Income / Contact', goal: safeDiv(goals.earned_income, goals.quality_conversations), actual: safeDiv(totalEarnedIncome, totalConversations), isCurrency: true },
    { label: 'Income / Hr Prospected', goal: safeDiv(goals.earned_income, goals.hours_prospected), actual: safeDiv(totalEarnedIncome, totalHoursProspected), isCurrency: true },
  ]

  const badges = [
    { id: 'bench', label: 'Off the Bench', icon: '🏀', earned: sumEntries(entries, 'quality_conversations') >= 10 },
    { id: 'listed', label: 'Listed!', icon: '🏠', earned: sumEntries(entries, 'listings_taken') >= 1 },
    { id: 'closed', label: 'Closed!', icon: '🔑', earned: sumEntries(entries, 'sales_closed') >= 1 },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Scoreboard</h1>
          <p className="text-slate-400 text-sm mt-1">{profile?.full_name || profile?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {rank.rank && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1224] border border-[#1a2240] ${rank.color}`}>
              <Trophy size={14} />
              <span className="text-sm font-bold">{rank.rank}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Week</label>
            <select
              value={selectedWeek}
              onChange={e => setSelectedWeek(Number(e.target.value))}
              className="bg-[#0d1224] border border-[#1a2240] text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              {weekOptions.map(w => <option key={w} value={w}>Week {w}</option>)}
              {!weekOptions.includes(selectedWeek) && <option value={selectedWeek}>Week {selectedWeek}</option>}
            </select>
          </div>
          <button
            onClick={() => setEditModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Edit2 size={15} /> Edit Week
          </button>
        </div>
      </div>

      {/* Main Scoreboard Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a2240]">
                {['METRIC', 'ANNUAL GOAL', 'WKLY REQ', 'SHOULD BE', 'ACTUAL YTD', 'WKLY AVG', 'ON TRACK FOR'].map(h => (
                  <th key={h} className={`px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider ${h === 'METRIC' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            {ALL_SECTIONS.map(s => renderSection(s.title, s.rows))}
          </table>
        </div>
      </div>

      {/* Bottom widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Tracker */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" /> Pipeline Tracker
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Starting PC Total', value: latestEntry.starting_pc_total ?? 0 },
              { label: 'Current PC Total', value: latestEntry.current_pc_total ?? 0 },
              { label: 'Active Pipeline', value: latestEntry.active_pipeline ?? 0 },
              { label: 'Pending', value: latestEntry.pending ?? 0 },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-[#1a2240]/50 last:border-0">
                <span className="text-sm text-slate-400">{item.label}</span>
                <span className="text-sm font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency Ratios */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-4">Efficiency Ratios</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a2240]">
                  <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-2">RATIO</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider pb-2">GOAL</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase tracking-wider pb-2">ACTUAL</th>
                </tr>
              </thead>
              <tbody>
                {ratios.map(r => (
                  <tr key={r.label} className="border-t border-[#1a2240]/50">
                    <td className="py-2 text-sm text-slate-300">{r.label}</td>
                    <td className="py-2 text-sm text-slate-300 text-right">
                      {r.isCurrency ? formatCurrency(r.goal) : formatNumber(r.goal)}
                    </td>
                    <td className={`py-2 text-sm font-semibold text-right ${r.actual >= r.goal ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {r.isCurrency ? formatCurrency(r.actual) : formatNumber(r.actual)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Star size={16} className="text-yellow-400" /> Earned Badges
        </h3>
        <div className="flex gap-4">
          {badges.map(b => (
            <div key={b.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${b.earned ? 'border-yellow-500/40 bg-yellow-500/10' : 'border-[#1a2240] opacity-40 grayscale'}`}>
              <span className="text-2xl">{b.icon}</span>
              <span className={`text-sm font-semibold ${b.earned ? 'text-yellow-300' : 'text-slate-400'}`}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Week Modal */}
      {editModalOpen && (
        <EditWeekModal
          entry={currentEntry}
          weekNumber={selectedWeek}
          onSave={async (data) => {
            await upsertEntry(selectedWeek, data)
            setEditModalOpen(false)
          }}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </div>
  )
}
