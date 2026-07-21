'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Bell,
  UserPlus,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  Check,
  LogOut,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const studentNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Mark Meal',
    href: '/mark-meal',
    icon: Check,
  },
  {
    title: 'Weekly Menu',
    href: '/menu',
    icon: CalendarDays,
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    badge: 2,
  },
]

const adminNavItems = [
  {
    title: 'Admin Dashboard',
    href: '/admin',
    icon: Users,
  },
  {
    title: 'Create Account',
    href: '/admin/create-account',
    icon: UserPlus,
  },
  {
    title: 'Manage Menu',
    href: '/admin/menu',
    icon: UtensilsCrossed,
  },
  {
    title: 'Manage Items',
    href: '/admin/items',
    icon: ShoppingBag,
  },
  {
    title: 'Send Notification',
    href: '/admin/notifications',
    icon: Bell,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, isAdmin, logout } = useAuth()

  // Get display name initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('')
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UtensilsCrossed className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">Mess Manager</span>
            <span className="text-xs text-sidebar-foreground/60">Hostel Management</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {/* Only show student section if user is NOT an admin */}
        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Student</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {studentNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="ml-auto bg-primary/20 text-primary hover:bg-primary/20"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Only show admin section if user is an admin */}
        {isAdmin && (
          <>
            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/20 text-primary text-sm">
              {user ? getInitials(user.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.name || 'Guest'}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {isAdmin ? 'Administrator' : (user?.hostel?.split(' - ')[0] || '')}
            </span>
          </div>
          <button
            onClick={logout}
            className={cn(
              'flex size-8 items-center justify-center rounded-md text-sidebar-foreground/60',
              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors'
            )}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
