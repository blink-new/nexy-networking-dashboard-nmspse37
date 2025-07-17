import { useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Header } from '@/components/layout/Header'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import { ProfileManagement } from '@/components/profile/ProfileManagement'
import { UserSearch } from '@/components/search/UserSearch'
import { EventsPage } from '@/components/events/EventsPage'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { Toaster } from '@/components/ui/toaster'
import type { User } from '@/types'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
  }

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser)
    // TODO: Save to database
  }

  const renderPage = (user: User) => {
    // Set current user if not already set
    if (!currentUser) {
      setCurrentUser(user)
    }

    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome user={user} onNavigate={handleNavigate} />
      case 'profile':
        return <ProfileManagement user={currentUser || user} onUpdateUser={handleUpdateUser} />
      case 'search':
        return <UserSearch currentUser={currentUser || user} />
      case 'events':
        return <EventsPage currentUser={currentUser || user} />
      case 'admin':
        return <AdminPanel currentUser={currentUser || user} />
      default:
        return <DashboardHome user={user} onNavigate={handleNavigate} />
    }
  }

  return (
    <AuthGuard>
      {(user) => (
        <div className="min-h-screen bg-gray-50">
          <Header 
            user={currentUser || user} 
            onNavigate={handleNavigate} 
            currentPage={currentPage} 
          />
          <main className="container mx-auto px-4 py-8">
            {renderPage(user)}
          </main>
          <Toaster />
        </div>
      )}
    </AuthGuard>
  )
}

export default App