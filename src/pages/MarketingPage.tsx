import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { MarketingEntry } from '../types'
import { computeMarketingKPIs, formatCurrency } from '../lib/calculations'
import { Megaphone, Plus, Edit2, X, Check, TrendingUp, DollarSign, Users, Target, BarChart2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

interface EntryFormData {
  ad_spend: string
  total_optins: string
  conversations: string
  agreements_signed: string
  deals_closed: string
  gci_from_ads: string
}

function EntryModal({ entry, month, scoreboardId, onSave, onClose }: {
  entry: Partial<MarketingEntry>
  month: string
  scoreboardId: string
  onSave: () => void
  onClose: () => void
}) {
  const [values, setValues] = useState<EntryFormData>({
    ad_spend: String(entry.ad_spend ?? 0),
    total_optins: String(entry.total_optins ?? 0),
    conversations: String(entry.conversations ?? 0),
    agreements_signed: String(entry.agreements_signed ?? 0),
    deals_closed: String(entry.deals_closed ?? 0),
    gci_from_ads: String(entry.gci_from_ads ?? 0),
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const data = {
      scoreboard_id: scoreboardId,
      month: month + '-01',
      ad_spend: parseFloat(values.ad_spend) || 0,
      total_optins: parseInt(values.total_optins) || 0,
      conversations: parseInt(values.conversations) || 0,
      agreements_signed: parseInt(values.agreements_signed) || 0,
      deals_closed: parseInt(values.deals_closed) || 0,
      gci_from_ads: parseFloat(values.gci_from_ads) || 0,
      updated_at: new Date().toISOString(),
    }
    if (entry.id) {
      await supabase.from('marketing_entries').update(data).eq('id', entry.id)
    } else {
      await supabase.from('marketing_entries').insert(data)
    }
    setSaving(false)
    onSave()
  }

  const fields: { key: keyof EntryFormData; label: string; step: string }[] = [
    { key: 'ad_spend', label: 'Ad Spend ($)', step: '0.01' },
    { key: 'total_optins', label: 'Total Opt-ins', step: '1' },
    { key: 'conversations', label: 'Conversations', step: '1' },
    { key: 'agreements_signed', label: 'Agreements Signed', step: '1' },
    { key: 'deals_closed', label: 'Deals Closed', step: '1' },
    { key: 'gci_from_ads', label: 'GCI from Ads ($)', step: '0.01' },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1224] border border-[#1a2240] rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-[#1a2240]">
          <h2 className="text-lg font-bold text-white">{entry.id ? 'Edit' : 'Add'} — {month}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-sm text-slate-300 mb-1.5">{f.label}</label>
              <input
                type="number" min="0" step={f.step}
                value={values[f.key]}
                onChange={e => setValues(p => ({ ...p, [f.key]: e.target.value }))}
                className="input-field"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 p-5 border-t border-[#1a2240]">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
            <Check size={16} /> {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function MarketingPage() {
  const { profile } = useAuth()
  const [scoreboardId, setScoreboardId] = useState<string | null>(null)
  const [entries, setEntries] = useState<MarketingEntry[]>([])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    async function load() {
      const { data: sb } = await supabase.from('scoreboards').select('id').eq('profile_id', profile!.id).single()
      if (!sb) { setLoading(false); return }
      setScoreboardId(sb.id)
      const { data } = await supabase.from('marketing_entries').select('*').eq('scoreboard_id', sb.id).order('month', { ascending: true })
      setEntries(data || [])
      setLoading(false)
    }
    load()
  }, [profile])

  async function refresh() {
    if (!scoreboardId) return
    const { data } = await supabase.from('marketing_entries').select('*').eq('scoreboard_id', scoreboardId).order('month', { ascending: true })
    setEntries(data || [])
    setModalOpen(false)
  }

  const currentEntry = entries.find(e => e.month?.startsWith(selectedMonth)) || {} as Partial<MarketingEntry>
  const kpis = computeMarketingKPIs({
    ad_spend: currentEntry.ad_spend ?? 0,
    total_optins: currentEntry.total_optins ?? 0,
    conversations: currentEntry.conversations ?? 0,
    agreements_signed: currentEntry.agreements_signed ?? 0,
    deals_closed: currentEntry.deals_closed ?? 0,
    gci_from_ads: currentEntry.gci_from_ads ?? 0,
  })

  // Generate month options (last 12 months + future 3)
  const monthOptions = Array.from({ length: 15 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - 12 + i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  // Trend data (last 6 months with data)
  const trendData = entries.slice(-6).map(e => {
    const kpi = computeMarketingKPIs(e)
    return {
      month: e.month?.slice(0, 7) || '',
      cpl: kpi.cplRaw ?? 0,
      costPerDeal: kpi.costPerDealRaw ?? 0,
    }
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="text-blue-400" size={24} />
          <div>
            <h1 className="text-2xl font-bold text-white">Marketing Performance</h1>
            <p className="text-slate-400 text-sm">Track your ad spend ROI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-[#0d1224] border border-[#1a2240] text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
            {currentEntry.id ? <><Edit2 size={15} /> Edit</> : <><Plus size={15} /> Add Month</>}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total Ad Spend" value={formatCurrency(currentEntry.ad_spend ?? 0)} icon={<DollarSign size={16} className="text-white" />} color="bg-blue-600/20" />
        <KpiCard label="Cost Per Lead" value={kpis.cpl} icon={<Target size={16} className="text-white" />} color="bg-purple-600/20" />
        <KpiCard label="Contact Rate" value={kpis.contactRate} icon={<Users size={16} className="text-white" />} color="bg-emerald-600/20" />
        <KpiCard label="CAC" value={kpis.cac} icon={<TrendingUp size={16} className="text-white" />} color="bg-orange-600/20" />
        <KpiCard label="Cost Per Deal" value={kpis.costPerDeal} icon={<BarChart2 size={16} className="text-white" />} color="bg-red-600/20" />
        <KpiCard label="Ad Spend : GCI" value={kpis.spendToGci} icon={<TrendingUp size={16} className="text-white" />} color="bg-yellow-600/20" />
      </div>

      {/* Raw data summary */}
      {currentEntry.id && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Raw Data — {selectedMonth}</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Opt-ins', value: currentEntry.total_optins ?? 0 },
              { label: 'Conversations', value: currentEntry.conversations ?? 0 },
              { label: 'Agreements Signed', value: currentEntry.agreements_signed ?? 0 },
              { label: 'Deals Closed', value: currentEntry.deals_closed ?? 0 },
              { label: 'GCI from Ads', value: formatCurrency(currentEntry.gci_from_ads ?? 0) },
            ].map(item => (
              <div key={item.label} className="bg-[#121830] rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">{item.label}</div>
                <div className="text-lg font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {trendData.length > 1 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-4">6-Month Trend — CPL & Cost/Deal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2240" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0d1224', border: '1px solid #1a2240', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v: number, name: string) => [`$${v.toFixed(0)}`, name === 'cpl' ? 'CPL' : 'Cost/Deal']}
              />
              <Line type="monotone" dataKey="cpl" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa' }} name="cpl" />
              <Line type="monotone" dataKey="costPerDeal" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} name="costPerDeal" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {entries.length === 0 && (
        <div className="card p-12 text-center">
          <Megaphone size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">No marketing data yet. Add your first month.</p>
          <button onClick={() => setModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Add Month
          </button>
        </div>
      )}

      {modalOpen && scoreboardId && (
        <EntryModal
          entry={currentEntry}
          month={selectedMonth}
          scoreboardId={scoreboardId}
          onSave={refresh}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
