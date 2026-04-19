import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { UserPlus, ArrowLeft } from 'lucide-react'

export default function AddAgentPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin
      ? await (supabase.auth as unknown as { admin: { createUser: (d: unknown) => Promise<{ data: { user: { id: string } } | null; error: Error | null }> } }).admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        })
      : { data: null, error: new Error('Admin API not available') }

    if (authError || !authData?.user) {
      // Fall back to signup
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (signupError) {
        setError(signupError.message)
        setLoading(false)
        return
      }
      if (signupData.user) {
        await supabase.from('profiles').upsert({
          id: signupData.user.id,
          email,
          full_name: fullName,
          role: 'agent',
        })
        await supabase.from('scoreboards').insert({ profile_id: signupData.user.id })
      }
    } else {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'agent',
      })
      await supabase.from('scoreboards').insert({ profile_id: authData.user.id })
    }

    setLoading(false)
    navigate('/coach')
  }

  return (
    <div className="p-6 max-w-lg">
      <button onClick={() => navigate('/coach')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Team Dashboard
      </button>

      <div className="flex items-center gap-3 mb-6">
        <UserPlus className="text-blue-400" size={24} />
        <h1 className="text-2xl font-bold text-white">Add New Agent</h1>
      </div>

      <div className="card p-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm mb-5">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" placeholder="Jane Smith" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="jane@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Temporary Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Min 6 characters" minLength={6} required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-50">
              {loading ? 'Creating…' : 'Create Agent Account'}
            </button>
            <button type="button" onClick={() => navigate('/coach')} className="btn-secondary flex-1 py-3">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
