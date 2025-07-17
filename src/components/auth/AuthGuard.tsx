import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { blink } from '@/blink/client'
import { LoginForm } from './LoginForm'
import type { User } from '@/types'

interface AuthGuardProps {
  children: (user: User) => React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Use Blink SDK's auth state listener
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setLoading(state.isLoading)
      
      if (state.user) {
        // Transform Blink user to our User type
        const transformedUser: User = {
          id: state.user.id,
          email: state.user.email || '',
          fullName: state.user.displayName || state.user.email?.split('@')[0] || 'User',
          role: 'Talent', // Default role - will be updated from database
          userType: 'user',
          createdAt: new Date().toISOString()
        }
        setUser(transformedUser)
      } else {
        setUser(null)
      }
    })

    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading NEXY...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <>{children(user)}</>
}