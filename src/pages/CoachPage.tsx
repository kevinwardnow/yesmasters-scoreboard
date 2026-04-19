import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { UserPlus, Users } from 'lucide-react'
import { formatCurrency, sumEntries } from '../lib/calculations'
import { WeeklyEntry } from '../types'

interface AgentRow {
  id: string
  full_name: string
  email: string
  scoreboardId: string | null
  entries: WeeklyEntry[]
}

export default function CoachPage() {
  const [agents, setAgents] = useState<AgentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, scoreboards(id)')
        .eq('role', 'agent')
        .order('full_name')

      if (!profiles) { setLoading(false); return }

      const rows: AgentRow[] = []
      for (const p of profiles) {
        const scoreboards = p.scoreboards as { id: string }[] | null
        const sbId = scoreboards?.[0]?.id ?? null
        let entries: WeeklyEntry[] = []
        if (sbId) {
          const { data } = await supabase.from('weekly_entries').select('*').eq('scoreboard_id', sbId)
          entries = data || []
        }
        rows.push({ id: p.id, full_name: p.full_name, email: p.email, scoreboardId: sbId, entries })
      }
      setAgents(rows)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-blue-400" size={24} />
          <div>
            <h1 className="text-2xl font-bold text-white">Team Dashboard</h1>
            <p className="text-slate-400 text-sm">{agents.length} agents</p>
          </div>
        </div>
        <Link to="/coach/add-agent" className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> Add Member
        </Link>
      </div>

      {agents.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400 mb-4">No agents yet</p>
          <Link to="/coach/add-agent" className="btn-primary inline-flex items-center gap-2">
            <UserPlus size={16} /> Add First Agent
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a2240]">
                {['AGENT', 'PRO DAYS', 'CONVERSATIONS', 'LISTINGS', 'CLOSED', 'INCOME', 'STATUS'].map(h => (
                  <th key={h} className={`px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider ${h === 'AGENT' ? 'text-left' : 'text-right'} last:text-center`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => {
                const proDays = sumEntries(agent.entries, 'pro_days')
                const convos = sumEntries(agent.entries, 'quality_conversations')
                const listings = sumEntries(agent.entries, 'listings_taken')
                const closed = sumEntries(agent.entries, 'sales_closed')
                const income = sumEntries(agent.entries, 'earned_income')
                const hasData = agent.entries.length > 0
                return (
                  <tr key={agent.id} className="border-t border-[#1a2240]/50 hover:bg-[#1a2240]/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="text-sm font-semibold text-white">{agent.full_name}</div>
                      <div className="text-xs text-slate-400">{agent.email}</div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-300 text-right">{proDays}</td>
                    <td className="px-5 py-3 text-sm text-slate-300 text-right">{convos}</td>
                    <td className="px-5 py-3 text-sm text-slate-300 text-right">{listings}</td>
                    <td className="px-5 py-3 text-sm text-slate-300 text-right">{closed}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-emerald-400 text-right">{formatCurrency(income)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${hasData ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'}`}>
                        {hasData ? 'Active' : 'No Data'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
