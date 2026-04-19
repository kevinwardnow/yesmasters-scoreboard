import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMarketingEnabled } from '../hooks/useMarketingEnabled'
import {
  LayoutDashboard, Users, UserPlus, Award, Target,
  TrendingUp, LogOut, Megaphone, Group
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  coachOnly?: boolean
  agentOnly?: boolean
  marketingOnly?: boolean
}

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const { enabled: marketingEnabled } = useMarketingEnabled()
  const navigate = useNavigate()
  const isCoach = profile?.role === 'coach'

  const navItems: NavItem[] = [
    { to: '/coach', label: 'Team Dashboard', icon: <Users size={18} />, coachOnly: true },
    { to: '/coach/add-agent', label: 'Add Member', icon: <UserPlus size={18} />, coachOnly: true },
    { to: '/coach/cohorts', label: 'Cohorts', icon: <Group size={18} />, coachOnly: true },
    { to: '/leaderboard', label: 'Leaderboard', icon: <Award size={18} /> },
    { to: '/dashboard', label: 'My Scoreboard', icon: <LayoutDashboard size={18} />, agentOnly: true },
    { to: '/goals', label: 'Goals & Setup', icon: <Target size={18} /> },
    { to: '/marketing', label: 'Marketing', icon: <Megaphone size={18} />, agentOnly: true, marketingOnly: true },
    { to: '/coach/marketing', label: 'Marketing', icon: <Megaphone size={18} />, coachOnly: true },
  ]

  const visibleItems = navItems.filter(item => {
    if (item.coachOnly && !isCoach) return false
    if (item.agentOnly && isCoach) return false
    if (item.marketingOnly && !isCoach && !marketingEnabled) return false
    return true
  })

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0d1224] border-r border-[#1a2240] flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-[#1a2240]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">YesMasters</div>
            <div className="text-xs text-slate-400 leading-tight">Performance Scoreboard</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/coach'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#1a2240]'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + Sign Out */}
      <div className="p-4 border-t border-[#1a2240]">
        <div className="mb-3">
          <div className="text-sm font-semibold text-white truncate">{profile?.full_name || profile?.email}</div>
          <div className="text-xs text-slate-400 capitalize">{profile?.role}</div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
