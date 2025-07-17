import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/blink/client'
import type { User, UserRole } from '@/types'

interface CreateEventModalProps {
  currentUser: User
  onClose: () => void
  onEventCreated: () => void
}

interface EventForm {
  title: string
  description: string
  eventDate: Date | undefined
  eventTime: string
  location: string
  maxAttendees: string
  roleRestrictions: UserRole[]
}

export function CreateEventModal({ currentUser, onClose, onEventCreated }: CreateEventModalProps) {
  const [form, setForm] = useState<EventForm>({
    title: '',
    description: '',
    eventDate: undefined,
    eventTime: '',
    location: '',
    maxAttendees: '',
    roleRestrictions: []
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const roles: UserRole[] = ['Founder', 'Co-founder', 'Talent', 'Enthusiast', 'Solopreneur', 'HR Agency', 'Community']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.title || !form.description || !form.eventDate || !form.eventTime) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)

      // Combine date and time
      const [hours, minutes] = form.eventTime.split(':')
      const eventDateTime = new Date(form.eventDate)
      eventDateTime.setHours(parseInt(hours), parseInt(minutes))

      const eventData = {
        title: form.title,
        description: form.description,
        event_date: eventDateTime.toISOString(),
        location: form.location || null,
        max_attendees: form.maxAttendees ? parseInt(form.maxAttendees) : null,
        role_restrictions: form.roleRestrictions.length > 0 ? JSON.stringify(form.roleRestrictions) : null,
        created_by: currentUser.id
      }

      const { error } = await supabase
        .from('events')
        .insert(eventData)

      if (error) {
        console.error('Error creating event:', error)
        throw error
      }

      toast({
        title: 'Event Created',
        description: 'Your event has been created successfully'
      })

      onEventCreated()
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleToggle = (role: UserRole) => {
    setForm(prev => ({
      ...prev,
      roleRestrictions: prev.roleRestrictions.includes(role)
        ? prev.roleRestrictions.filter(r => r !== role)
        : [...prev.roleRestrictions, role]
    }))
  }

  const removeRoleRestriction = (role: UserRole) => {
    setForm(prev => ({
      ...prev,
      roleRestrictions: prev.roleRestrictions.filter(r => r !== role)
    }))
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your event"
                rows={4}
                required
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Event Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.eventDate ? format(form.eventDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.eventDate}
                    onSelect={(date) => setForm(prev => ({ ...prev, eventDate: date }))}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="time">Event Time *</Label>
              <Input
                id="time"
                type="time"
                value={form.eventTime}
                onChange={(e) => setForm(prev => ({ ...prev, eventTime: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Location and Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Event location"
              />
            </div>

            <div>
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                min="1"
                value={form.maxAttendees}
                onChange={(e) => setForm(prev => ({ ...prev, maxAttendees: e.target.value }))}
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>

          {/* Role Restrictions */}
          <div>
            <Label className="text-base font-medium">Role Restrictions</Label>
            <p className="text-sm text-gray-600 mb-3">
              Select which roles can attend this event (leave empty for all roles)
            </p>
            
            {form.roleRestrictions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.roleRestrictions.map(role => (
                  <Badge 
                    key={role} 
                    className={`${getRoleColor(role)} cursor-pointer`}
                    onClick={() => removeRoleRestriction(role)}
                  >
                    {role}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {roles.map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    id={role}
                    checked={form.roleRestrictions.includes(role)}
                    onCheckedChange={() => handleRoleToggle(role)}
                  />
                  <Label htmlFor={role} className="text-sm cursor-pointer">
                    {role}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}