import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { MarketingEntry } from '../types'
import { computeMarketingKPIs, formatCurrency } from '../lib/calculations'
import { Megaphone, ToggleLeft, ToggleRight, ChevronUp, ChevronDown } from 'lucide-react'

interface AgentMarketingRow {
  profileId: string
  scoreboardId: string
  fullName: string
  email: string
  enabled: boolean
  entries: MarketingEntry[]
  latestEntry: MarketingEntry | null
}

type SortKey = 'name' | 'ad_spend' | 'cpl' | 'contact_rate' | 'cac' | 'deals_closed' | 'cost_per_deal' | 'spend_gci'

export default function CoachMarketingPage() {
  const { profile } = useAuth()
  const [agents, setAgents] = useState<AgentMarketingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    load()
  }, [profile])

  async function load() {
    const { data: agentProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, scoreboards(id)')
      .eq('role', 'agent')
      .order('full_name')

    if (!agentProfiles) { setLoading(false); return }

    const rows: AgentMarketingRow[] = []
    for (const p of agentProfiles) {
      const scoreboards = p.scoreboards as { id: string }[] | null
      const sbId = scoreboards?.[0]?.id
      if (!sbId) continue

      const [{ data: settingsData }, { data: entriesData }] = await Promise.all([
        supabase.from('marketing_settings').select('enabled').eq('scoreboard_id', sbId).single(),
        supabase.from('marketing_entries').select('*').eq('scoreboard_id', sbId).order('month', { ascending: false }),
      ])

      const entries = entriesData || []
      rows.push({
        profileId: p.id,
        scoreboardId: sbId,
        fullName: p.full_name,
        email: p.email,
        enabled: settingsData?.enabled ?? false,
        entries,
        latestEntry: entries[0] || null,
      })
    }
    setAgents(rows)
    setLoading(false)
  }

  async function toggleMarketing(row: AgentMarketingRow) {
    const newEnabled = !row.enabled
    await supabase.from('marketing_settings').upsert({
      scoreboard_id: row.scoreboardId,
      enabled: newEnabled,
      enabled_by: profile!.id,
      enabled_at: new Date().toISOString(),
    }, { onConflict: 'scoreboard_id' })
    setAgents(prev => prev.map(a => a.scoreboardId === row.scoreboardId ? { ...a, enabled: newEnabled } : a))
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp size={12} className="text-slate-600" />
    return sortAsc ? <ChevronUp size={12} className="text-blue-400" /> : <ChevronDown size={12} className="text-blue-400" />
  }

  function ThSort({ k, label, right }: { k: SortKey; label: string; right?: boolean }) {
    return (
      <th className={`px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white select-none ${right ? 'text-right' : 'text-left'}`} onClick={() => handleSort(k)}>
        <span className="inline-flex items-center gap-1">{label}<SortIcon k={k} /></span>
      </th>
    )
  }

  const monthOptions = Array.from({ length: 13 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - 12 + i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const displayedAgents = [...agents].sort((a, b) => {
    const eA = a.entries.find(e => e.month?.startsWith(selectedMonth)) || null
    const eB = b.entries.find(e => e.month?.startsWith(selectedMonth)) || null
    const kA = eA ? computeMarketingKPIs(eA) : null
    const kB = eB ? computeMarketingKPIs(eB) : null

    let valA = 0, valB = 0
    switch (sortKey) {
      case 'name': return sortAsc ? a.fullName.localeCompare(b.fullName) : b.fullName.localeCompare(a.fullName)
      case 'ad_spend': valA = eA?.ad_spend ?? 0; valB = eB?.ad_spend ?? 0; break
      case 'cpl': valA = kA?.cplRaw ?? 0; valB = kB?.cplRaw ?? 0; break
      case 'contact_rate': valA = kA?.contactRateRaw ?? 0; valB = kB?.contactRateRaw ?? 0; break
      case 'cac': valA = kA?.cacRaw ?? 0; valB = kB?.cacRaw ?? 0; break
      case 'deals_closed': valA = eA?.deals_closed ?? 0; valB = eB?.deals_closed ?? 0; break
      case 'cost_per_deal': valA = kA?.costPerDealRaw ?? 0; valB = kB?.costPerDealRaw ?? 0; break
      case 'spend_gci': valA = kA?.spendToGciRaw ?? 0; valB = kB?.spendToGciRaw ?? 0; break
    }
    return sortAsc ? valA - valB : valB - valA
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="text-blue-400" size={24} />
          <div>
            <h1 className="text-2xl font-bold text-white">Marketing — Team View</h1>
            <p className="text-slate-400 text-sm">Monitor all agent marketing performance</p>
          </div>
        </div>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="bg-[#0d1224] border border-[#1a2240] text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
        >
          {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a2240]">
                <ThSort k="name" label="Agent" />
                <ThSort k="ad_spend" label="Ad Spend" right />
                <ThSort k="cpl" label="CPL" right />
                <ThSort k="contact_rate" label="Contact %" right />
                <ThSort k="cac" label="CAC" right />
                <ThSort k="deals_closed" label="Deals" right />
                <ThSort k="cost_per_deal" label="Cost/Deal" right />
                <ThSort k="spend_gci" label="Spend:GCI" right />
                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Marketing</th>
              </tr>
            </thead>
            <tbody>
              {displayedAgents.map(agent => {
                const entry = agent.entries.find(e => e.month?.startsWith(selectedMonth))
                const kpis = entry ? computeMarketingKPIs(entry) : null
                return (
                  <tr key={agent.profileId} className="border-t border-[#1a2240]/50 hover:bg-[#1a2240]/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-white">{agent.fullName}</div>
                      <div className="text-xs text-slate-400">{agent.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-300">{entry ? formatCurrency(entry.ad_spend) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-300">{kpis?.cpl ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-300">{kpis?.contactRate ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-300">{kpis?.cac ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-300">{entry?.deals_closed ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-300">{kpis?.costPerDeal ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-300">{kpis?.spendToGci ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleMarketing(agent)}
                        className={`transition-colors ${agent.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-400'}`}
                        title={agent.enabled ? 'Disable marketing for this agent' : 'Enable marketing for this agent'}
                      >
                        {agent.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
