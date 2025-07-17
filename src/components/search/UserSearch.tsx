import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Search, MapPin, Linkedin, Twitter, Globe, UserPlus, MessageCircle, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/blink/client'
import type { User, UserRole, Connection } from '@/types'

interface UserSearchProps {
  currentUser: User
}

interface SearchFilters {
  query: string
  role: UserRole | 'all'
  location: string
}

export function UserSearch({ currentUser }: UserSearchProps) {
  const [users, setUsers] = useState<User[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    role: 'all',
    location: ''
  })
  const { toast } = useToast()

  const roles: UserRole[] = ['Founder', 'Co-founder', 'Talent', 'Enthusiast', 'Solopreneur', 'HR Agency', 'Community']

  useEffect(() => {
    loadUsers()
    loadConnections()
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (filters.query || filters.role !== 'all' || filters.location) {
        searchUsers()
      } else {
        loadUsers()
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [filters])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data: result, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error loading users:', error)
        throw error
      }

      // Transform snake_case to camelCase
      const transformedUsers: User[] = (result || []).map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        bio: user.bio,
        location: user.location,
        interests: user.interests,
        linkedinUrl: user.linkedin_url,
        twitterUrl: user.twitter_url,
        websiteUrl: user.website_url,
        avatarUrl: user.avatar_url,
        userType: user.user_type,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }))

      setUsers(transformedUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadConnections = async () => {
    try {
      const { data: result, error } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)

      if (error) {
        console.error('Error loading connections:', error)
        throw error
      }

      // Transform snake_case to camelCase
      const transformedConnections: Connection[] = (result || []).map(conn => ({
        id: conn.id,
        requesterId: conn.requester_id,
        recipientId: conn.recipient_id,
        status: conn.status,
        createdAt: conn.created_at
      }))

      setConnections(transformedConnections)
    } catch (error) {
      console.error('Error loading connections:', error)
    }
  }

  const searchUsers = async () => {
    try {
      setSearchLoading(true)
      
      let query = supabase
        .from('users')
        .select('*')
        .neq('id', currentUser.id)

      // Apply text search
      if (filters.query) {
        query = query.or(`full_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%,interests.ilike.%${filters.query}%`)
      }

      // Apply role filter
      if (filters.role !== 'all') {
        query = query.eq('role', filters.role)
      }

      // Apply location filter
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`)
      }

      const { data: result, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error searching users:', error)
        throw error
      }

      // Transform snake_case to camelCase
      const transformedUsers: User[] = (result || []).map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        bio: user.bio,
        location: user.location,
        interests: user.interests,
        linkedinUrl: user.linkedin_url,
        twitterUrl: user.twitter_url,
        websiteUrl: user.website_url,
        avatarUrl: user.avatar_url,
        userType: user.user_type,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }))

      setUsers(transformedUsers)
    } catch (error) {
      console.error('Error searching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive'
      })
    } finally {
      setSearchLoading(false)
    }
  }

  const sendConnectionRequest = async (recipientId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: currentUser.id,
          recipient_id: recipientId,
          status: 'pending'
        })

      if (error) {
        console.error('Error sending connection request:', error)
        throw error
      }

      toast({
        title: 'Connection Request Sent',
        description: 'Your connection request has been sent successfully'
      })

      loadConnections()
    } catch (error) {
      console.error('Error sending connection request:', error)
      toast({
        title: 'Error',
        description: 'Failed to send connection request',
        variant: 'destructive'
      })
    }
  }

  const getConnectionStatus = (userId: string) => {
    return connections.find(conn => 
      (conn.requesterId === currentUser.id && conn.recipientId === userId) ||
      (conn.recipientId === currentUser.id && conn.requesterId === userId)
    )
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getRoleColor = (role: UserRole) => {
    const colors = {
      'Founder': 'bg-purple-100 text-purple-800',
      'Co-founder': 'bg-blue-100 text-blue-800',
      'Talent': 'bg-green-100 text-green-800',
      'Enthusiast': 'bg-yellow-100 text-yellow-800',
      'Solopreneur': 'bg-orange-100 text-orange-800',
      'HR Agency': 'bg-pink-100 text-pink-800',
      'Community': 'bg-indigo-100 text-indigo-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Professionals</h1>
        <p className="text-gray-600">Connect with like-minded professionals in your industry</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, bio, or interests..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value as UserRole | 'all' }))}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Location..."
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="w-full md:w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(loading || searchLoading) ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : users.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No professionals found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          users.map((user) => {
            const connection = getConnectionStatus(user.id)
            
            return (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{user.fullName}</h3>
                      <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>

                  {user.bio && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{user.bio}</p>
                  )}

                  {user.location && (
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      {user.location}
                    </div>
                  )}

                  {user.interests && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Interests:</p>
                      <p className="text-sm text-gray-700 line-clamp-1">{user.interests}</p>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {user.linkedinUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {user.twitterUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={user.twitterUrl} target="_blank" rel="noopener noreferrer">
                            <Twitter className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                      {user.websiteUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer">
                            <Globe className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {connection ? (
                        <Badge variant={connection.status === 'accepted' ? 'default' : 'secondary'}>
                          {connection.status === 'accepted' ? 'Connected' : 
                           connection.status === 'pending' ? 'Pending' : 'Declined'}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => sendConnectionRequest(user.id)}
                          className="flex items-center gap-1"
                        >
                          <UserPlus className="w-4 h-4" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}