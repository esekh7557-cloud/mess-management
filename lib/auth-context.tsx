'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export type UserRole = 'student' | 'admin'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  hostel?: string
  room?: string
  balance?: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, role: UserRole) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  isAdmin: boolean
  isStudent: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'mess_manager_auth'
const AUTH_COOKIE_KEY = 'mess_manager_role'
const AUTH_ROUTES = ['/login', '/signup', '/owner-signup']
const ADMIN_ROUTES = ['/admin']
const STUDENT_ROUTES = ['/dashboard', '/mark-meal', '/billing', '/extras', '/balance', '/notifications', '/menu']

function isSameRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

function syncRoleCookie(role: UserRole | null) {
  if (typeof document === 'undefined') {
    return
  }

  if (!role) {
    document.cookie = `${AUTH_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
    return
  }

  document.cookie = `${AUTH_COOKIE_KEY}=${role}; path=/; max-age=86400; samesite=lax`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isStudent, setIsStudent] = useState(false)

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      try {
        const userData = JSON.parse(stored)
        setUser(userData)
        setIsAdmin(userData.role === 'admin')
        setIsStudent(userData.role === 'student')
        syncRoleCookie(userData.role)
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (isLoading || !user || user.role !== 'student') {
      return
    }

    void refreshUser()
    // We only want to sync after initial restoration or login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user?.id])

  // Redirect logic for protected routes
  useEffect(() => {
    if (isLoading) return

    const currentPath = pathname ?? ''
    const isAuthRoute = AUTH_ROUTES.includes(currentPath)
    const isAdminRoute = ADMIN_ROUTES.some((route) => isSameRoute(currentPath, route))
    const isStudentRoute = STUDENT_ROUTES.some((route) => isSameRoute(currentPath, route))

    // If not logged in and trying to access protected routes
    if (!user && (isAdminRoute || isStudentRoute)) {
      router.push('/login')
      return
    }

    // If student trying to access admin routes
    if (user && user.role === 'student' && isAdminRoute) {
      router.push('/access-denied')
      return
    }

    // If admin trying to access student-only routes - strict enforcement
    if (user && user.role === 'admin' && isStudentRoute) {
      router.push('/access-denied')
      return
    }

    // If logged in and on auth page, redirect to appropriate dashboard
    if (user && isAuthRoute) {
      router.push(user.role === 'admin' ? '/admin' : '/dashboard')
    }
  }, [user, isLoading, pathname, router])

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      if (data.success && data.user) {
        const loggedInUser = data.user
        setUser(loggedInUser)
        setIsAdmin(loggedInUser.role === 'admin')
        setIsStudent(loggedInUser.role === 'student')
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser))
        syncRoleCookie(loggedInUser.role)

        router.push(loggedInUser.role === 'admin' ? '/admin' : '/dashboard')
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const refreshUser = async () => {
    if (!user || user.role !== 'student') {
      return
    }

    try {
      const response = await fetch(`/api/student/profile?student_id=${user.id}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        // If the student no longer exists (e.g. store was reset), auto-logout
        if (response.status === 404) {
          logout()
          router.push('/login')
        }
        return
      }

      const payload = await response.json()
      const latestStudent = payload?.data?.student

      if (!latestStudent) {
        return
      }

      setUser((currentUser) => {
        if (!currentUser) {
          return currentUser
        }

        const nextUser = {
          ...currentUser,
          name: latestStudent.name,
          email: latestStudent.email,
          hostel: latestStudent.hostel,
          room: latestStudent.room,
          balance: latestStudent.balance,
        }

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
        return nextUser
      })
    } catch {
      // Ignore refresh failures and keep the local session usable.
    }
  }

  const logout = () => {
    setUser(null)
    setIsAdmin(false)
    setIsStudent(false)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    syncRoleCookie(null)
    router.push('/login')
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    refreshUser,
    isAdmin,
    isStudent,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
