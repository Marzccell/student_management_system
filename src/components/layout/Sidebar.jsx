/**
 * Sidebar
 * =========
 * Fixed navigation sidebar with links to Dashboard, Assignments, and Planner.
 * Shows user email and sign-out button at the bottom.
 * Collapsible on mobile via hamburger toggle.
 */
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  LogOut,
  GraduationCap,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assignments', icon: ClipboardList, label: 'Assignments' },
  { to: '/planner', icon: BookOpen, label: 'Study Planner' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 w-64
          bg-[var(--color-sidebar)] text-white
          flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight">StudyFlow</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-[var(--color-sidebar-active)] text-white shadow-lg shadow-primary-900/20'
                    : 'text-gray-400 hover:bg-[var(--color-sidebar-hover)] hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section & sign out */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Signed in as</p>
            <p className="text-sm text-gray-300 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
