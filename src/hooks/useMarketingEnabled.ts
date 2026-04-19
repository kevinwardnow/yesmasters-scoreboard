import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useMarketingEnabled() {
  const { profile } = useAuth()
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) { setLoading(false); return }
    if (profile.role === 'coach') { setEnabled(true); setLoading(false); return }

    async function check() {
      const { data: scoreboard } = await supabase
        .from('scoreboards')
        .select('id')
        .eq('profile_id', profile!.id)
        .single()

      if (!scoreboard) { setLoading(false); return }

      const { data } = await supabase
        .from('marketing_settings')
        .select('enabled')
        .eq('scoreboard_id', scoreboard.id)
        .single()

      setEnabled(data?.enabled ?? false)
      setLoading(false)
    }
    check()
  }, [profile])

  return { enabled, loading }
}
