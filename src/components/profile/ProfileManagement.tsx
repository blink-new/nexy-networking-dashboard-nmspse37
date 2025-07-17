import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Camera, MapPin, Globe, Linkedin, Twitter, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/blink/client'
import type { User, UserRole } from '@/types'

interface ProfileManagementProps {
  user: User
  onUpdateUser: (updatedUser: User) => void
}

const USER_ROLES: UserRole[] = [
  'Founder',
  'Co-founder', 
  'Talent',
  'Enthusiast',
  'Solopreneur',
  'HR Agency',
  'Community'
]

export function ProfileManagement({ user, onUpdateUser }: ProfileManagementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    role: user.role,
    bio: user.bio || '',
    location: user.location || '',
    interests: user.interests || '',
    linkedinUrl: user.linkedinUrl || '',
    twitterUrl: user.twitterUrl || '',
    websiteUrl: user.websiteUrl || ''
  })
  const { toast } = useToast()

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Update user in Supabase (convert camelCase to snake_case)
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          role: formData.role,
          bio: formData.bio,
          location: formData.location,
          interests: formData.interests,
          linkedin_url: formData.linkedinUrl,
          twitter_url: formData.twitterUrl,
          website_url: formData.websiteUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating user:', error)
        toast({
          title: 'Error',
          description: 'Failed to update profile',
          variant: 'destructive'
        })
        return
      }

      const updatedUser: User = {
        ...user,
        ...formData,
        updatedAt: new Date().toISOString()
      }
      
      onUpdateUser(updatedUser)
      setIsEditing(false)
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully'
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      fullName: user.fullName,
      role: user.role,
      bio: user.bio || '',
      location: user.location || '',
      interests: user.interests || '',
      linkedinUrl: user.linkedinUrl || '',
      twitterUrl: user.twitterUrl || '',
      websiteUrl: user.websiteUrl || ''
    })
    setIsEditing(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{user.fullName}</h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {user.role}
                    </Badge>
                    {user.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{user.location}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2">{user.email}</p>
                </div>
                
                <div className="mt-4 md:mt-0">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button variant="outline" onClick={handleCancel} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Professional Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="interests">Interests & Skills</Label>
                <Input
                  id="interests"
                  placeholder="e.g., AI, Startups, Product Management"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Connect your social profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-gray-50 border border-r-0 rounded-l-md">
                    <Linkedin className="w-4 h-4 text-blue-600" />
                  </div>
                  <Input
                    id="linkedinUrl"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    disabled={!isEditing}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="twitterUrl">Twitter Profile</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-gray-50 border border-r-0 rounded-l-md">
                    <Twitter className="w-4 h-4 text-blue-400" />
                  </div>
                  <Input
                    id="twitterUrl"
                    placeholder="https://twitter.com/username"
                    value={formData.twitterUrl}
                    onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                    disabled={!isEditing}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="websiteUrl">Website</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-gray-50 border border-r-0 rounded-l-md">
                    <Globe className="w-4 h-4 text-gray-600" />
                  </div>
                  <Input
                    id="websiteUrl"
                    placeholder="https://yourwebsite.com"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    disabled={!isEditing}
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Stats & Activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Profile Views</span>
                <span className="font-semibold">156</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Connections</span>
                <span className="font-semibold">24</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Events Attended</span>
                <span className="font-semibold">8</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Member Since</span>
                <span className="font-semibold">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Account Type</span>
                <Badge variant="outline">{user.userType}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Email Verified</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Verified
                </Badge>
              </div>
              <Separator />
              <Button variant="outline" className="w-full">
                Privacy Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}