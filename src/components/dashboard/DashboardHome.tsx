import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, UserPlus, TrendingUp } from 'lucide-react'
import type { User } from '@/types'

interface DashboardHomeProps {
  user: User
  onNavigate: (page: string) => void
}

export function DashboardHome({ user, onNavigate }: DashboardHomeProps) {
  const stats = [
    {
      title: 'Network Connections',
      value: '24',
      change: '+3 this week',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Events Attended',
      value: '8',
      change: '+2 this month',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Profile Views',
      value: '156',
      change: '+12 this week',
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      title: 'Pending Invites',
      value: '3',
      change: 'New requests',
      icon: UserPlus,
      color: 'text-orange-600'
    }
  ]

  const upcomingEvents = [
    {
      id: '1',
      title: 'Tech Startup Mixer',
      date: '2024-01-25',
      time: '6:00 PM',
      location: 'Downtown Convention Center',
      attendees: 45
    },
    {
      id: '2',
      title: 'Founder\'s Breakfast',
      date: '2024-01-28',
      time: '8:00 AM',
      location: 'Innovation Hub',
      attendees: 28
    },
    {
      id: '3',
      title: 'AI & Future of Work Panel',
      date: '2024-02-02',
      time: '2:00 PM',
      location: 'Tech Campus Auditorium',
      attendees: 120
    }
  ]

  const recentConnections = [
    {
      id: '1',
      name: 'Sarah Chen',
      role: 'Founder',
      company: 'TechFlow',
      avatar: null
    },
    {
      id: '2',
      name: 'Marcus Johnson',
      role: 'Co-founder',
      company: 'DataViz Pro',
      avatar: null
    },
    {
      id: '3',
      name: 'Elena Rodriguez',
      role: 'Talent',
      company: 'Design Studio',
      avatar: null
    }
  ]

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user.fullName.split(' ')[0]}!</h1>
            <p className="text-blue-100 text-lg">
              Ready to expand your professional network?
            </p>
            <div className="flex items-center mt-4 space-x-4">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {user.role}
              </Badge>
              {user.location && (
                <span className="text-blue-100 text-sm">📍 {user.location}</span>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold">{getInitials(user.fullName)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events you've registered for</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('events')}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(event.date).toLocaleDateString()} at {event.time}
                  </p>
                  <p className="text-sm text-gray-500">{event.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{event.attendees} attending</p>
                  <Button variant="ghost" size="sm" className="mt-2">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Connections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Connections</CardTitle>
              <CardDescription>New people in your network</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('search')}>
              Find More
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentConnections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-medium text-sm">
                      {getInitials(connection.name)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{connection.name}</h4>
                    <p className="text-sm text-gray-600">{connection.role} at {connection.company}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Message
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with networking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => onNavigate('search')}
            >
              <Users className="w-6 h-6" />
              <span>Find Professionals</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => onNavigate('events')}
            >
              <Calendar className="w-6 h-6" />
              <span>Browse Events</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => onNavigate('profile')}
            >
              <UserPlus className="w-6 h-6" />
              <span>Update Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}