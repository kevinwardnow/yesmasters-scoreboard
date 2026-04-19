import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { WeeklyEntry } from '../types'

export function useScoreboard() {
  const { profile } = useAuth()
  const [scoreboardId, setScoreboardId] = useState<string | null>(null)
  const [entries, setEntries] = useState<WeeklyEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    loadScoreboard()
  }, [profile])

  async function loadScoreboard() {
    setLoading(true)
    const { data: sb } = await supabase
      .from('scoreboards')
      .select('id')
      .eq('profile_id', profile!.id)
      .single()

    if (!sb) { setLoading(false); return }
    setScoreboardId(sb.id)

    const { data: entriesData } = await supabase
      .from('weekly_entries')
      .select('*')
      .eq('scoreboard_id', sb.id)
      .order('week_number', { ascending: true })

    setEntries(entriesData || [])
    setLoading(false)
  }

  async function upsertEntry(weekNumber: number, data: Partial<WeeklyEntry>) {
    if (!scoreboardId) return

    const existing = entries.find(e => e.week_number === weekNumber)
    if (existing) {
      await supabase.from('weekly_entries').update({ ...data, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('weekly_entries').insert({ ...data, scoreboard_id: scoreboardId, week_number: weekNumber })
    }
    await loadScoreboard()
  }

  return { scoreboardId, entries, loading, refresh: loadScoreboard, upsertEntry }
}
