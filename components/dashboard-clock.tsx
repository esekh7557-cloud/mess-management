'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Calendar } from 'lucide-react'

export function DashboardClock() {
  const [time, setTime] = useState<string>('')
  const [date, setDate] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const updateDateTime = () => {
      const now = new Date()
      
      // Format time with leading zeros
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const timeString = `${hours}:${minutes}:${seconds}`
      
      // Format date
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      }
      const dateString = new Intl.DateTimeFormat('en-US', options).format(now)
      
      setTime(timeString)
      setDate(dateString)
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="space-y-3">
          {/* Time Display */}
          <div className="flex items-center gap-3">
            <Clock className="size-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Current Time</p>
              <p className="text-2xl font-mono font-bold text-primary">{time}</p>
            </div>
          </div>

          {/* Date Display */}
          <div className="flex items-center gap-3 pt-2 border-t border-primary/10">
            <Calendar className="size-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Today</p>
              <p className="text-sm font-semibold text-foreground">{date}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
