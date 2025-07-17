import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Calendar, MapPin, Users, Clock, Filter, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/blink/client'
import type { User, Event, EventRSVP, UserRole } from '@/types'
import { EventDetails } from './EventDetails'
import { CreateEventModal } from './CreateEventModal'

interface EventsPageProps {
  currentUser: User
}

export function EventsPage({ currentUser }: EventsPageProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('discover')
  const { toast } = useToast()

  const isAdmin = currentUser.userType === 'admin' || currentUser.userType === 'super_admin'

  useEffect(() => {
    loadEvents()
    loadMyEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      
      // Get events from Supabase
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(50)

      if (error) {
        console.error('Error loading events:', error)
        throw error
      }

      // Add attendee count and user registration status
      const eventsWithDetails = await Promise.all(
        (eventsData || []).map(async (event) => {
          // Get attendee count
          const { data: rsvps, error: rsvpError } = await supabase
            .from('event_rsvps')
            .select('id')
            .eq('event_id', event.id)
            .eq('status', 'attending')

          if (rsvpError) {
            console.error('Error loading RSVPs:', rsvpError)
          }

          // Check if current user is registered
          const { data: userRsvp, error: userRsvpError } = await supabase
            .from('event_rsvps')
            .select('id')
            .eq('event_id', event.id)
            .eq('user_id', currentUser.id)

          if (userRsvpError) {
            console.error('Error loading user RSVP:', userRsvpError)
          }

          // Transform to our Event type
          const transformedEvent: Event = {
            id: event.id,
            title: event.title,
            description: event.description,
            eventDate: event.event_date,
            location: event.location,
            maxAttendees: event.max_attendees,
            roleRestrictions: event.role_restrictions ? JSON.parse(event.role_restrictions) : [],
            createdBy: event.created_by,
            createdAt: event.created_at,
            updatedAt: event.updated_at,
            attendeeCount: rsvps?.length || 0,
            isUserRegistered: userRsvp && userRsvp.length > 0
          }

          return transformedEvent
        })
      )
      
      setEvents(eventsWithDetails)
    } catch (error) {
      console.error('Error loading events:', error)
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMyEvents = async () => {
    try {
      // Get user's RSVPs
      const { data: rsvps, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select('event_id')
        .eq('user_id', currentUser.id)
        .eq('status', 'attending')

      if (rsvpError) {
        console.error('Error loading user RSVPs:', rsvpError)
        return
      }

      if (rsvps && rsvps.length > 0) {
        const eventIds = rsvps.map(rsvp => rsvp.event_id)
        
        // Get events for those RSVPs
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .in('id', eventIds)
          .order('event_date', { ascending: true })

        if (eventsError) {
          console.error('Error loading my events:', eventsError)
          return
        }

        // Transform to our Event type
        const transformedEvents: Event[] = (eventsData || []).map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          eventDate: event.event_date,
          location: event.location,
          maxAttendees: event.max_attendees,
          roleRestrictions: event.role_restrictions ? JSON.parse(event.role_restrictions) : [],
          createdBy: event.created_by,
          createdAt: event.created_at,
          updatedAt: event.updated_at
        }))

        setMyEvents(transformedEvents)
      } else {
        setMyEvents([])
      }
    } catch (error) {
      console.error('Error loading my events:', error)
    }
  }

  const handleRSVP = async (eventId: string, status: 'attending' | 'not_attending') => {
    try {
      // Check if user already has an RSVP
      const { data: existingRsvp, error: fetchError } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', currentUser.id)

      if (fetchError) {
        console.error('Error fetching existing RSVP:', fetchError)
        throw fetchError
      }

      if (existingRsvp && existingRsvp.length > 0) {
        // Update existing RSVP
        const { error: updateError } = await supabase
          .from('event_rsvps')
          .update({ status })
          .eq('id', existingRsvp[0].id)

        if (updateError) {
          console.error('Error updating RSVP:', updateError)
          throw updateError
        }
      } else {
        // Create new RSVP
        const { error: insertError } = await supabase
          .from('event_rsvps')
          .insert({
            event_id: eventId,
            user_id: currentUser.id,
            status
          })

        if (insertError) {
          console.error('Error creating RSVP:', insertError)
          throw insertError
        }
      }

      toast({
        title: status === 'attending' ? 'RSVP Confirmed' : 'RSVP Cancelled',
        description: status === 'attending' 
          ? 'You have successfully registered for this event'
          : 'Your registration has been cancelled'
      })

      loadEvents()
      loadMyEvents()
    } catch (error) {
      console.error('Error updating RSVP:', error)
      toast({
        title: 'Error',
        description: 'Failed to update RSVP',
        variant: 'destructive'
      })
    }
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

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedEvent(event)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">{event.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{event.description}</p>
          </div>
          {event.isUserRegistered && (
            <Badge className="bg-green-100 text-green-800">Registered</Badge>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            {formatDate(event.eventDate)}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            {formatTime(event.eventDate)}
          </div>
          {event.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              {event.location}
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            {event.attendeeCount} attending
            {event.maxAttendees && ` / ${event.maxAttendees} max`}
          </div>
        </div>

        {event.roleRestrictions && event.roleRestrictions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Restricted to:</p>
            <div className="flex flex-wrap gap-1">
              {event.roleRestrictions.map(role => (
                <Badge key={role} className={`text-xs ${getRoleColor(role as UserRole)}`}>
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-4" />

        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={(e) => {
            e.stopPropagation()
            setSelectedEvent(event)
          }}>
            View Details
          </Button>
          
          {event.isUserRegistered ? (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleRSVP(event.id, 'not_attending')
              }}
            >
              Cancel RSVP
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleRSVP(event.id, 'attending')
              }}
              disabled={event.maxAttendees ? (event.attendeeCount || 0) >= event.maxAttendees : false}
            >
              RSVP
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Events</h1>
          <p className="text-gray-600">Discover and attend networking events</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discover">Discover Events</TabsTrigger>
          <TabsTrigger value="my-events">My Events</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
              <p className="text-gray-600">Check back later for new networking opportunities</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-events" className="space-y-6">
          {myEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No registered events</h3>
              <p className="text-gray-600">Browse events and RSVP to see them here</p>
              <Button className="mt-4" onClick={() => setActiveTab('discover')}>
                Discover Events
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          currentUser={currentUser}
          onClose={() => setSelectedEvent(null)}
          onRSVP={handleRSVP}
        />
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onEventCreated={() => {
            loadEvents()
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}