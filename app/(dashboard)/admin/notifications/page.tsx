'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  Send,
  Info,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiRequest } from '@/lib/api-client'
import type { Notification } from '@/lib/mock-data'

const typeIcons: Record<Notification['type'], React.ReactNode> = {
  info: <Info className="size-4" />,
  warning: <AlertCircle className="size-4" />,
  success: <CheckCircle2 className="size-4" />,
}

const typeColors: Record<Notification['type'], string> = {
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/30',
}

export default function AdminNotificationsPage() {
  const [notificationList, setNotificationList] = useState<Notification[]>([])
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as Notification['type'],
  })
  const [isSending, setIsSending] = useState(false)

  const loadNotifications = async () => {
    const payload = await apiRequest<{ success: boolean; data: Notification[] }>('/api/admin/notifications', {
      cache: 'no-store',
    })
    setNotificationList(payload.data)
  }

  useEffect(() => {
    void loadNotifications()
  }, [])

  const sendNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      return
    }

    setIsSending(true)

    try {
      const payload = await apiRequest<{ success: boolean; data: Notification[] }>('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(newNotification),
      })

      setNotificationList(payload.data)
      setNewNotification({ title: '', message: '', type: 'info' })
    } finally {
      setIsSending(false)
    }
  }

  const deleteNotification = async (id: string) => {
    const payload = await apiRequest<{ success: boolean; data: Notification[] }>(`/api/admin/notifications?id=${id}`, {
      method: 'DELETE',
    })

    setNotificationList(payload.data)
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Send Notifications</h1>
        <p className="text-muted-foreground">Broadcast announcements to all students</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5" />
                New Notification
              </CardTitle>
              <CardDescription>Create and send a notification to all students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Enter notification title" value={newNotification.title} onChange={(event) => setNewNotification((previous) => ({ ...previous, title: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Enter notification message" rows={4} value={newNotification.message} onChange={(event) => setNewNotification((previous) => ({ ...previous, message: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={newNotification.type} onValueChange={(value: Notification['type']) => setNewNotification((previous) => ({ ...previous, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {(newNotification.title || newNotification.message) && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Preview</Label>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-start gap-3">
                      <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', typeColors[newNotification.type])}>
                        {typeIcons[newNotification.type]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">{newNotification.title || 'Notification Title'}</p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{newNotification.message || 'Notification message will appear here...'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={sendNotification} disabled={!newNotification.title || !newNotification.message || isSending}>
                {isSending ? (
                  <>
                    <Clock className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Send to All Students
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                <Users className="mr-1 inline size-3" />
                Will be visible to every student account
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Sent Notifications</CardTitle>
              <CardDescription>History of all sent notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Notification</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notificationList.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', typeColors[notification.type])}>
                            {typeIcons[notification.type]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">{notification.title}</p>
                            <p className="line-clamp-1 text-sm text-muted-foreground">{notification.message}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'capitalize',
                            notification.type === 'info' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
                            notification.type === 'warning' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
                            notification.type === 'success' && 'bg-green-100 text-green-700 dark:bg-green-900/30'
                          )}
                        >
                          {notification.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(notification.date)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => deleteNotification(notification.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
          <CardDescription>Use these templates to quickly send common notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col items-start p-4 text-left" onClick={() => setNewNotification({
              title: 'Menu Change Notice',
              message: "Please note that tomorrow's menu has been updated. Check the menu section for details.",
              type: 'info',
            })}>
              <div className="flex items-center gap-2 text-primary">
                <Info className="size-4" />
                <span className="font-medium">Menu Change</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Notify about menu updates</p>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 text-left" onClick={() => setNewNotification({
              title: 'Mess Timing Change',
              message: 'Mess timings have been modified for tomorrow. Please check the updated schedule.',
              type: 'warning',
            })}>
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="size-4" />
                <span className="font-medium">Timing Change</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Alert about timing modifications</p>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 text-left" onClick={() => setNewNotification({
              title: 'Holiday Notice',
              message: 'The mess will remain closed on the upcoming holiday. Packed meals available on request.',
              type: 'warning',
            })}>
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="size-4" />
                <span className="font-medium">Holiday Notice</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Announce mess closure</p>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 text-left" onClick={() => setNewNotification({
              title: 'Special Menu Today',
              message: "Today's menu features special dishes to celebrate the occasion. Enjoy!",
              type: 'success',
            })}>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="size-4" />
                <span className="font-medium">Special Menu</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Announce special offerings</p>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 text-left" onClick={() => setNewNotification({
              title: 'Balance Reminder',
              message: 'Reminder: Please ensure your mess balance is sufficient. Recharge before it runs low.',
              type: 'info',
            })}>
              <div className="flex items-center gap-2 text-primary">
                <Info className="size-4" />
                <span className="font-medium">Balance Reminder</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Remind about wallet balance</p>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 text-left" onClick={() => setNewNotification({
              title: 'Feedback Request',
              message: 'We value your feedback! Please share your thoughts about the mess service.',
              type: 'info',
            })}>
              <div className="flex items-center gap-2 text-primary">
                <Info className="size-4" />
                <span className="font-medium">Feedback Request</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Ask for student feedback</p>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
