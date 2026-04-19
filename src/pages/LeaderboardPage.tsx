import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Award, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../lib/calculations'

interface LeaderRow {
  rank: number
  full_name: string
  listings_taken: number
  sales_closed: number
  earned_income: number
  pro_days: number
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Try the leaderboard_view first, fall back to manual query
      const { data, error } = await supabase.from('leaderboard_view').select('*').order('rank', { ascending: true })
      if (!error && data) {
        setRows(data)
      } else {
        // Manual fallback
        const { data: entries } = await supabase
          .from('weekly_entries')
          .select('scoreboard_id, listings_taken, sales_closed, earned_income, pro_days, scoreboards(profiles(full_name))')
        if (entries) {
          const agg: Record<string, LeaderRow> = {}
          entries.forEach((e: Record<string, unknown>) => {
            const sb = e.scoreboard_id as string
            const scoreboardData = e.scoreboards as Record<string, unknown>
            const profileData = scoreboardData?.profiles as Record<string, unknown>
            const name = (profileData?.full_name as string) || 'Unknown'
            if (!agg[sb]) agg[sb] = { rank: 0, full_name: name, listings_taken: 0, sales_closed: 0, earned_income: 0, pro_days: 0 }
            agg[sb].listings_taken += Number(e.listings_taken) || 0
            agg[sb].sales_closed += Number(e.sales_closed) || 0
            agg[sb].earned_income += Number(e.earned_income) || 0
            agg[sb].pro_days += Number(e.pro_days) || 0
          })
          const sorted = Object.values(agg).sort((a, b) => b.earned_income - a.earned_income).map((r, i) => ({ ...r, rank: i + 1 }))
          setRows(sorted)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Award className="text-yellow-400" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-slate-400 text-sm">YTD Rankings</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">No data yet</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a2240]">
                {['RANK', 'AGENT', 'PRO DAYS', 'LISTINGS', 'CLOSED', 'INCOME'].map(h => (
                  <th key={h} className={`px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider ${h === 'AGENT' ? 'text-left' : 'text-right'} first:text-center`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.full_name} className="border-t border-[#1a2240]/50 hover:bg-[#1a2240]/30 transition-colors">
                  <td className="px-5 py-3 text-center text-lg">{medals[row.rank - 1] || row.rank}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-white">{row.full_name}</td>
                  <td className="px-5 py-3 text-sm text-slate-300 text-right">{row.pro_days}</td>
                  <td className="px-5 py-3 text-sm text-slate-300 text-right">{row.listings_taken}</td>
                  <td className="px-5 py-3 text-sm text-slate-300 text-right">{row.sales_closed}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-emerald-400 text-right">{formatCurrency(row.earned_income)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
