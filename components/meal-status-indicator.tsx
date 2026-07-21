import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle2, Lock, AlertCircle } from 'lucide-react'

type MealStatus = 'available' | 'upcoming' | 'closed' | 'marked'

interface MealStatusIndicatorProps {
  status: MealStatus
  mealName: string
  time?: string
}

export function MealStatusIndicator({ status, mealName, time }: MealStatusIndicatorProps) {
  const configs = {
    available: {
      variant: 'default' as const,
      icon: <CheckCircle2 className="size-4" />,
      label: 'Available Now',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30',
    },
    upcoming: {
      variant: 'secondary' as const,
      icon: <Clock className="size-4" />,
      label: 'Coming Soon',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30',
    },
    closed: {
      variant: 'secondary' as const,
      icon: <Lock className="size-4" />,
      label: 'Closed',
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30',
    },
    marked: {
      variant: 'outline' as const,
      icon: <CheckCircle2 className="size-4" />,
      label: 'Marked',
      color: 'bg-green-50 text-green-700 dark:bg-green-900/20',
    },
  }

  const config = configs[status]

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        <span>{config.label}</span>
      </Badge>
      {time && <span className="text-xs text-muted-foreground">{time}</span>}
    </div>
  )
}

export default MealStatusIndicator
