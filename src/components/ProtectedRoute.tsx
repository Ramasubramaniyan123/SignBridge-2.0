// @ts-ignore
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    // Redirect to login page with return URL
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return <>{children}</>
}

// Higher-order component for protecting routes
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const AuthenticatedComponent = (props: P) => (
    <ProtectedRoute>
      <Component {...props} />
    </ProtectedRoute>
  )
  
  return AuthenticatedComponent
}
