/**
 * AppLayout
 * ===========
 * Layout wrapper for authenticated pages.
 * Renders the Sidebar + a scrollable main content area.
 * Handles mobile sidebar toggle via hamburger button.
 */
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-canvas)]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar — mobile only */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <span className="font-semibold text-gray-800">StudyFlow</span>
        </header>

        {/* Page content — rendered via Outlet */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
