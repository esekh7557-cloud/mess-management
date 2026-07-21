'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  Info,
  Check,
  Trash2,
  MailOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiRequest } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import type { Notification } from '@/lib/mock-data'

const typeIcons: Record<Notification['type'], React.ReactNode> = {
  info: <Info className="size-5" />,
  warning: <AlertCircle className="size-5" />,
  success: <CheckCircle2 className="size-5" />,
}

const typeColors: Record<Notification['type'], string> = {
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/30',
}

const typeBadgeColors: Record<Notification['type'], string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notificationList, setNotificationList] = useState<Notification[]>([])

  const loadNotifications = async () => {
    if (!user?.id) {
      return
    }

    const payload = await apiRequest<{ success: boolean; data: Notification[] }>(
      `/api/student/notifications?student_id=${user.id}`,
      { cache: 'no-store' }
    )

    setNotificationList(payload.data)
  }

  useEffect(() => {
    void loadNotifications()
  }, [user?.id])

  const unreadCount = notificationList.filter((notification) => !notification.read).length

  const updateNotifications = async (action: 'markRead' | 'markAllRead' | 'delete', notificationId?: string) => {
    if (!user?.id) {
      return
    }

    const payload = await apiRequest<{ success: boolean; data: Notification[] }>('/api/student/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        student_id: user.id,
        action,
        notificationId,
      }),
    })

    setNotificationList(payload.data)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with mess announcements</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {unreadCount} unread
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => updateNotifications('markAllRead')} disabled={unreadCount === 0}>
            <Check className="mr-1 size-4" />
            Mark all read
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="size-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold">{notificationList.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
              <Info className="size-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unread</p>
              <p className="text-2xl font-semibold">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30">
              <AlertCircle className="size-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alerts</p>
              <p className="text-2xl font-semibold">{notificationList.filter((notification) => notification.type === 'warning').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>Click to mark as read</CardDescription>
        </CardHeader>
        <CardContent>
          {notificationList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MailOpen className="mb-4 size-12 text-muted-foreground/50" />
              <p className="font-medium text-muted-foreground">No notifications</p>
              <p className="text-sm text-muted-foreground">You are all caught up!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {notificationList.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={cn('cursor-pointer rounded-lg p-4 transition-colors hover:bg-muted', !notification.read && 'bg-primary/5')}
                    onClick={() => updateNotifications('markRead', notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', typeColors[notification.type])}>
                        {typeIcons[notification.type]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h3 className={cn('font-medium', !notification.read && 'font-semibold')}>{notification.title}</h3>
                            {!notification.read && <span className="size-2 rounded-full bg-primary" />}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary" className={cn('text-xs', typeBadgeColors[notification.type])}>
                              {notification.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(notification.date)}</span>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(event) => {
                          event.stopPropagation()
                          void updateNotifications('delete', notification.id)
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  {index < notificationList.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
