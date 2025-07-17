import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/blink/client'
import { LoginForm } from './LoginForm'
import type { User } from '@/types'

interface AuthGuardProps {
  children: (user: User) => React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authSession, setAuthSession] = useState<any>(null)

  const syncUserWithDatabase = useCallback(async (authUser: any, session: any) => {
    try {
      // Ensure the session is set in supabase client
      if (session) {
        await supabase.auth.setSession(session)
      }

      // Check if user exists in database
      const { data: existingUsers, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .limit(1)

      if (fetchError) {
        console.error('Error fetching user:', fetchError)
        // If it's an auth error, try to refresh the session
        if (fetchError.code === 'PGRST301' || fetchError.message?.includes('JWT')) {
          console.log('JWT error, attempting to refresh session...')
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshedSession && !refreshError) {
            // Retry with refreshed session
            return await syncUserWithDatabase(authUser, refreshedSession)
          }
        }
        throw fetchError
      }

      let dbUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null

      if (!dbUser) {
        // Create new user in database
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth_user_id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            role: 'Talent', // Default role
            user_type: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating user:', createError)
          throw createError
        }

        dbUser = newUser
      }

      // Transform to our User type (convert snake_case to camelCase)
      const transformedUser: User = {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.full_name,
        role: dbUser.role,
        bio: dbUser.bio,
        location: dbUser.location,
        interests: dbUser.interests,
        linkedinUrl: dbUser.linkedin_url,
        twitterUrl: dbUser.twitter_url,
        websiteUrl: dbUser.website_url,
        avatarUrl: dbUser.avatar_url,
        userType: dbUser.user_type,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      }
      setUser(transformedUser)
      setAuthSession(session)
    } catch (error) {
      console.error('Error syncing user with database:', error)
      // Fallback to basic user data if database sync fails
      const transformedUser: User = {
        id: authUser.id,
        email: authUser.email || '',
        fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        role: 'Talent',
        userType: 'user',
        createdAt: new Date().toISOString()
      }
      setUser(transformedUser)
      setAuthSession(session)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) setLoading(false)
          return
        }

        if (session?.user && mounted) {
          await syncUserWithDatabase(session.user, session)
        } else if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        if (mounted) setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setAuthSession(null)
        setLoading(false)
        return
      }

      if (session?.user) {
        setLoading(true)
        await syncUserWithDatabase(session.user, session)
      } else {
        setUser(null)
        setAuthSession(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [syncUserWithDatabase])

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