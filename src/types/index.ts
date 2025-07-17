export type UserRole = 'Founder' | 'Co-founder' | 'Talent' | 'Enthusiast' | 'Solopreneur' | 'HR Agency' | 'Community'
export type UserType = 'super_admin' | 'admin' | 'user'
export type ConnectionStatus = 'pending' | 'accepted' | 'declined'
export type RSVPStatus = 'attending' | 'maybe' | 'not_attending'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  bio?: string
  location?: string
  interests?: string
  linkedinUrl?: string
  twitterUrl?: string
  websiteUrl?: string
  avatarUrl?: string
  userType: UserType
  createdAt: string
  updatedAt?: string
}

export interface Event {
  id: string
  title: string
  description: string
  eventDate: string
  location?: string
  maxAttendees?: number
  roleRestrictions?: UserRole[]
  createdBy: string
  createdAt: string
  updatedAt?: string
  attendeeCount?: number
  isUserRegistered?: boolean
}

export interface EventRSVP {
  id: string
  eventId: string
  userId: string
  status: RSVPStatus
  rsvpDate: string
  user?: User
}

export interface Connection {
  id: string
  requesterId: string
  recipientId: string
  status: ConnectionStatus
  createdAt: string
  requester?: User
  recipient?: User
}