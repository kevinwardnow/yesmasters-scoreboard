import { useState, useEffect, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Target, Check } from 'lucide-react'

const GOAL_FIELDS = [
  { section: 'Activity', fields: [
    { key: 'pro_days', label: 'PRO Days' },
    { key: 'hours_practiced', label: 'Hours Practiced' },
    { key: 'hours_prospected', label: 'Hours Prospected' },
    { key: 'quality_conversations', label: 'Quality Conversations' },
    { key: 'added_to_pc', label: 'Added to PC' },
    { key: 'new_leads', label: 'New Leads' },
    { key: 'open_house_events', label: 'Open House Events' },
  ]},
  { section: 'Listings', fields: [
    { key: 'listing_appts_set', label: 'Listing Appts Set' },
    { key: 'listing_appts_held', label: 'Listing Appts Held' },
    { key: 'listings_taken', label: 'Listings Taken' },
    { key: 'listings_sold', label: 'Listings Sold' },
  ]},
  { section: 'Buyers', fields: [
    { key: 'buyer_rep', label: 'Buyer Rep Agreements' },
    { key: 'buyer_sales', label: 'Buyer Sales' },
  ]},
  { section: 'Income', fields: [
    { key: 'earned_income', label: 'Earned Income ($)' },
    { key: 'sales_closed', label: 'Sales Closed' },
    { key: 'paid_income', label: 'Paid Income ($)' },
  ]},
]

const DEFAULTS: Record<string, number> = {
  pro_days: 200, hours_practiced: 200, hours_prospected: 400, quality_conversations: 800,
  added_to_pc: 200, new_leads: 100, open_house_events: 20,
  listing_appts_set: 100, listing_appts_held: 80, listings_taken: 50, listings_sold: 45,
  buyer_rep: 30, buyer_sales: 25,
  earned_income: 200000, sales_closed: 30, paid_income: 180000,
}

export default function GoalsPage() {
  const { profile } = useAuth()
  const [scoreboardId, setScoreboardId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(DEFAULTS).map(([k, v]) => [k, String(v)]))
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    async function load() {
      const { data: sb } = await supabase.from('scoreboards').select('id').eq('profile_id', profile!.id).single()
      if (!sb) { setLoading(false); return }
      setScoreboardId(sb.id)
      const { data } = await supabase.from('goals').select('*').eq('scoreboard_id', sb.id).single()
      if (data) {
        const v: Record<string, string> = {}
        Object.keys(DEFAULTS).forEach(k => { v[k] = String(data[k] ?? DEFAULTS[k]) })
        setValues(v)
      }
      setLoading(false)
    }
    load()
  }, [profile])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!scoreboardId) return
    setSaving(true)
    const data: Record<string, number> = {}
    Object.entries(values).forEach(([k, v]) => { data[k] = parseFloat(v) || 0 })
    await supabase.from('goals').upsert({ scoreboard_id: scoreboardId, ...data }, { onConflict: 'scoreboard_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Target className="text-blue-400" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-white">Goals & Setup</h1>
          <p className="text-slate-400 text-sm">Set your annual performance goals</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {GOAL_FIELDS.map(section => (
          <div key={section.section} className="card p-5">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">{section.section}</h2>
            <div className="grid grid-cols-2 gap-4">
              {section.fields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm text-slate-300 mb-1.5">{f.label}</label>
                  <input
                    type="number"
                    min="0"
                    step={f.key.includes('income') ? '1000' : '1'}
                    value={values[f.key]}
                    onChange={e => setValues(p => ({ ...p, [f.key]: e.target.value }))}
                    className="input-field"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className={`btn-primary flex items-center gap-2 px-6 py-3 ${saved ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}
        >
          {saved ? <><Check size={16} /> Saved!</> : saving ? 'Saving…' : 'Save Goals'}
        </button>
      </form>
    </div>
  )
}
