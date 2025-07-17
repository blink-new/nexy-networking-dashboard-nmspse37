import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, MapPin, Users, Clock, Search, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/blink/client'
import type { User, Event, EventRSVP, UserRole } from '@/types'

interface EventDetailsProps {
  event: Event
  currentUser: User
  onClose: () => void
  onRSVP: (eventId: string, status: 'attending' | 'not_attending') => void
}

interface AttendeeWithUser extends EventRSVP {
  user: User
}

export function EventDetails({ event, currentUser, onClose, onRSVP }: EventDetailsProps) {
  const [attendees, setAttendees] = useState<AttendeeWithUser[]>([])
  const [filteredAttendees, setFilteredAttendees] = useState<AttendeeWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [userRsvp, setUserRsvp] = useState<EventRSVP | null>(null)
  const { toast } = useToast()

  const roles: UserRole[] = ['Founder', 'Co-founder', 'Talent', 'Enthusiast', 'Solopreneur', 'HR Agency', 'Community']

  useEffect(() => {
    loadAttendees()
    loadUserRsvp()
  }, [event.id])

  useEffect(() => {
    filterAttendees()
  }, [attendees, searchQuery, roleFilter])

  const loadAttendees = async () => {
    try {
      setLoading(true)
      
      // Get RSVPs with user data using a join
      const { data: rsvps, error } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          users (*)
        `)
        .eq('event_id', event.id)
        .eq('status', 'attending')

      if (error) {
        console.error('Error loading attendees:', error)
        throw error
      }

      // Transform the data
      const attendeesWithUsers: AttendeeWithUser[] = (rsvps || []).map(rsvp => ({
        id: rsvp.id,
        eventId: rsvp.event_id,
        userId: rsvp.user_id,
        status: rsvp.status,
        rsvpDate: rsvp.rsvp_date,
        user: {
          id: rsvp.users.id,
          email: rsvp.users.email,
          fullName: rsvp.users.full_name,
          role: rsvp.users.role,
          bio: rsvp.users.bio,
          location: rsvp.users.location,
          interests: rsvp.users.interests,
          linkedinUrl: rsvp.users.linkedin_url,
          twitterUrl: rsvp.users.twitter_url,
          websiteUrl: rsvp.users.website_url,
          avatarUrl: rsvp.users.avatar_url,
          userType: rsvp.users.user_type,
          createdAt: rsvp.users.created_at,
          updatedAt: rsvp.users.updated_at
        }
      }))

      setAttendees(attendeesWithUsers)
    } catch (error) {
      console.error('Error loading attendees:', error)
      toast({
        title: 'Error',
        description: 'Failed to load attendees',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUserRsvp = async () => {
    try {
      const { data: rsvps, error } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', event.id)
        .eq('user_id', currentUser.id)

      if (error) {
        console.error('Error loading user RSVP:', error)
        throw error
      }

      if (rsvps && rsvps.length > 0) {
        const rsvp = rsvps[0]
        setUserRsvp({
          id: rsvp.id,
          eventId: rsvp.event_id,
          userId: rsvp.user_id,
          status: rsvp.status,
          rsvpDate: rsvp.rsvp_date
        })
      } else {
        setUserRsvp(null)
      }
    } catch (error) {
      console.error('Error loading user RSVP:', error)
    }
  }

  const filterAttendees = () => {
    let filtered = attendees

    if (searchQuery) {
      filtered = filtered.filter(attendee =>
        attendee.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.user.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.user.interests?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(attendee => attendee.user.role === roleFilter)
    }

    setFilteredAttendees(filtered)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
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

  const handleRSVPClick = (status: 'attending' | 'not_attending') => {
    onRSVP(event.id, status)
    loadUserRsvp()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Info */}
          <div className="space-y-4">
            <p className="text-gray-700">{event.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <p className="font-medium">{formatDate(event.eventDate)}</p>
                    <p className="text-sm">{formatTime(event.eventDate)}</p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-3" />
                    <p>{event.location}</p>
                  </div>
                )}

                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-3" />
                  <p>
                    {attendees.length} attending
                    {event.maxAttendees && ` / ${event.maxAttendees} max`}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {event.roleRestrictions && event.roleRestrictions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Restricted to:</p>
                    <div className="flex flex-wrap gap-1">
                      {event.roleRestrictions.map(role => (
                        <Badge key={role} className={`text-xs ${getRoleColor(role as UserRole)}`}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  {userRsvp?.status === 'attending' ? (
                    <Button 
                      variant="destructive"
                      onClick={() => handleRSVPClick('not_attending')}
                    >
                      Cancel RSVP
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleRSVPClick('attending')}
                      disabled={event.maxAttendees ? attendees.length >= event.maxAttendees : false}
                    >
                      RSVP to Event
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Attendees Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Attendees ({attendees.length})</h3>
            </div>

            {attendees.length > 0 && (
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search attendees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={roleFilter}
                  onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}
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
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAttendees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {attendees.length === 0 ? 'No attendees yet' : 'No attendees match your search'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredAttendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={attendee.user.avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                        {getInitials(attendee.user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{attendee.user.fullName}</p>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${getRoleColor(attendee.user.role)}`}>
                          {attendee.user.role}
                        </Badge>
                        {attendee.user.location && (
                          <span className="text-xs text-gray-500">{attendee.user.location}</span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}