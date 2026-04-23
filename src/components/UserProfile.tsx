// @ts-ignore
import React from 'react'
import { useAuth } from '../contexts/AuthContext'

interface UserProfileProps {
  className?: string
}

export const UserProfile: React.FC<UserProfileProps> = ({ className }) => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    // Navigation will be handled by AuthProvider
  }

  if (!user) {
    return (
      <div className={`text-center p-4 ${className || ''}`}>
        <p>Please sign in to view your profile</p>
      </div>
    )
  }

  return (
    <div className={`p-6 ${className || ''}`}>
      <div className="flex items-center space-x-4 mb-6">
        <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold">
            {user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-semibold">
            {user.user_metadata?.full_name || 'User'}
          </h2>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Account Settings</h3>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
