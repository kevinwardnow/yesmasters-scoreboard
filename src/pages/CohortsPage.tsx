import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Group, Plus, X } from 'lucide-react'
import { Cohort, Profile } from '../types'

export default function CohortsPage() {
  const { profile } = useAuth()
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [agents, setAgents] = useState<Profile[]>([])
  const [newCohortName, setNewCohortName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    load()
  }, [profile])

  async function load() {
    const [{ data: cohortData }, { data: agentData }] = await Promise.all([
      supabase.from('cohorts').select('*').eq('coach_id', profile!.id).order('name'),
      supabase.from('profiles').select('*').eq('role', 'agent').order('full_name'),
    ])
    setCohorts(cohortData || [])
    setAgents(agentData || [])
    setLoading(false)
  }

  async function createCohort(e: FormEvent) {
    e.preventDefault()
    if (!newCohortName.trim()) return
    setCreating(true)
    await supabase.from('cohorts').insert({ name: newCohortName.trim(), coach_id: profile!.id })
    setNewCohortName('')
    await load()
    setCreating(false)
  }

  async function deleteCohort(id: string) {
    await supabase.from('cohorts').delete().eq('id', id)
    setCohorts(prev => prev.filter(c => c.id !== id))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Group className="text-blue-400" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-white">Cohorts</h1>
          <p className="text-slate-400 text-sm">Organize agents into groups</p>
        </div>
      </div>

      {/* Create cohort */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-bold text-slate-300 mb-3">Create New Cohort</h2>
        <form onSubmit={createCohort} className="flex gap-3">
          <input
            type="text"
            value={newCohortName}
            onChange={e => setNewCohortName(e.target.value)}
            placeholder="Cohort name…"
            className="input-field"
            required
          />
          <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus size={16} /> {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>

      {/* Cohort list */}
      {cohorts.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">No cohorts yet. Create one above.</div>
      ) : (
        <div className="space-y-3">
          {cohorts.map(cohort => (
            <div key={cohort.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Group size={14} className="text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-white">{cohort.name}</span>
              </div>
              <button
                onClick={() => deleteCohort(cohort.id)}
                className="text-slate-400 hover:text-red-400 transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 card p-4">
        <p className="text-xs text-slate-400">{agents.length} total agents available to assign to cohorts.</p>
      </div>
    </div>
  )
}
