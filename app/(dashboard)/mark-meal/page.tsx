'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth-context'
import { apiRequest } from '@/lib/api-client'
import { MEAL_COSTS, type MealSelectionTimings } from '@/lib/meal-marking'
import { canMarkMealForDate, formatMealTime, getMealTargetDate, getMarkingWindowTimes } from '@/lib/meal-marking'
import { Coffee, Sun, Moon, AlertCircle, CheckCircle2, Clock, DollarSign, CalendarClock } from 'lucide-react'

type MealType = 'breakfast' | 'lunch' | 'dinner'
type MealCategory = 'veg' | 'nonveg'

interface BalanceSnapshot {
  remaining_balance: number
}

interface MealTarget {
  date: string
  isTomorrow: boolean
}

interface MealStatus {
  type: MealType
  icon: React.ReactNode
  label: string
  vegCost: number
  nonvegCost: number
  scheduledTime: string
  markedForDate: boolean
  canMark: boolean
  error?: string
  isTomorrow: boolean
  targetDate: string
}

interface MealApiResponse {
  success: boolean
  data: {
    balance: BalanceSnapshot
    timings: MealSelectionTimings
    markedMeals: MealType[]
    mealTargets: Record<MealType, MealTarget>
  }
}

export default function MarkMealPage() {
  const { user, refreshUser } = useAuth()
  const [balance, setBalance] = useState(0)
  const [markedMeals, setMarkedMeals] = useState<MealType[]>([])
  const [timings, setTimings] = useState<MealSelectionTimings | null>(null)
  const [mealTargets, setMealTargets] = useState<Record<MealType, MealTarget> | null>(null)
  const [loading, setLoading] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Record<MealType, MealCategory>>({
    breakfast: 'veg',
    lunch: 'veg',
    dinner: 'veg',
  })

  useEffect(() => {
    if (!user?.id) {
      return
    }

    let cancelled = false

    const loadMealState = async () => {
      try {
        const payload = await apiRequest<MealApiResponse>(`/api/student/meal?student_id=${user.id}`, {
          cache: 'no-store',
        })

        if (cancelled) {
          return
        }

        setBalance(payload.data.balance.remaining_balance)
        setMarkedMeals(payload.data.markedMeals)
        setTimings(payload.data.timings)
        setMealTargets(payload.data.mealTargets)
      } catch (error) {
        if (!cancelled) {
          setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load meal data' })
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    void loadMealState()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const mealStatuses = useMemo<MealStatus[]>(() => {
    const getMealTarget = (mealType: MealType): MealTarget => {
      if (mealTargets?.[mealType]) {
        return mealTargets[mealType]
      }
      // Fallback: compute on client side
      if (timings) {
        return getMealTargetDate(mealType, timings)
      }
      return { date: new Date().toISOString().split('T')[0], isTomorrow: false }
    }

    return [
      {
        type: 'breakfast',
        icon: <Coffee className="size-5 text-orange-500" />,
        label: 'Breakfast',
        vegCost: MEAL_COSTS.breakfast.veg,
        nonvegCost: MEAL_COSTS.breakfast.nonveg,
        scheduledTime: formatMealTime('breakfast'),
        markedForDate: markedMeals.includes('breakfast'),
        canMark: timings ? canMarkMealForDate('breakfast', getMealTarget('breakfast').isTomorrow, timings).canMark : false,
        error: timings ? canMarkMealForDate('breakfast', getMealTarget('breakfast').isTomorrow, timings).reason : undefined,
        isTomorrow: getMealTarget('breakfast').isTomorrow,
        targetDate: getMealTarget('breakfast').date,
      },
      {
        type: 'lunch',
        icon: <Sun className="size-5 text-yellow-500" />,
        label: 'Lunch',
        vegCost: MEAL_COSTS.lunch.veg,
        nonvegCost: MEAL_COSTS.lunch.nonveg,
        scheduledTime: formatMealTime('lunch'),
        markedForDate: markedMeals.includes('lunch'),
        canMark: timings ? canMarkMealForDate('lunch', getMealTarget('lunch').isTomorrow, timings).canMark : false,
        error: timings ? canMarkMealForDate('lunch', getMealTarget('lunch').isTomorrow, timings).reason : undefined,
        isTomorrow: getMealTarget('lunch').isTomorrow,
        targetDate: getMealTarget('lunch').date,
      },
      {
        type: 'dinner',
        icon: <Moon className="size-5 text-indigo-500" />,
        label: 'Dinner',
        vegCost: MEAL_COSTS.dinner.veg,
        nonvegCost: MEAL_COSTS.dinner.nonveg,
        scheduledTime: formatMealTime('dinner'),
        markedForDate: markedMeals.includes('dinner'),
        canMark: timings ? canMarkMealForDate('dinner', getMealTarget('dinner').isTomorrow, timings).canMark : false,
        error: timings ? canMarkMealForDate('dinner', getMealTarget('dinner').isTomorrow, timings).reason : undefined,
        isTomorrow: getMealTarget('dinner').isTomorrow,
        targetDate: getMealTarget('dinner').date,
      },
    ]
  }, [markedMeals, timings, mealTargets])

  const handleMarkMeal = async (mealType: MealType, targetDate: string) => {
    if (!user?.id) {
      return
    }

    setLoading(true)

    try {
      const payload = await apiRequest<{
        success: boolean
        data: {
          balance: BalanceSnapshot
          markedMeals: MealType[]
        }
      }>('/api/student/meal', {
        method: 'POST',
        body: JSON.stringify({
          student_id: user.id,
          mealType,
          category: selectedCategory[mealType],
          targetDate,
        }),
      })

      const meal = mealStatuses.find((m) => m.type === mealType)
      const categoryLabel = selectedCategory[mealType] === 'veg' ? 'Veg' : 'Non-Veg'
      const selectedCost = selectedCategory[mealType] === 'veg' ? MEAL_COSTS[mealType].veg : MEAL_COSTS[mealType].nonveg
      const dayLabel = meal?.isTomorrow ? ' for tomorrow' : ''

      setBalance(payload.data.balance.remaining_balance)
      setMarkedMeals(payload.data.markedMeals)
      setMessage({
        type: 'success',
        text: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} (${categoryLabel}) marked${dayLabel}. Deducted Rs. ${selectedCost}.`,
      })
      await refreshUser()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to mark meal. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mark Meal</h1>
        <p className="text-muted-foreground">Mark your upcoming meals</p>
      </div>

      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-3xl font-bold text-green-600">Rs. {balance.toLocaleString()}</p>
            </div>
            <DollarSign className="size-12 text-green-600 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          {message.type === 'success' ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {mealStatuses.map((meal) => {
          const selectedCost = selectedCategory[meal.type] === 'veg' ? meal.vegCost : meal.nonvegCost
          const isBalanceSufficient = balance >= selectedCost
          const windows = timings ? getMarkingWindowTimes(meal.type, timings) : null

          return (
            <Card
              key={meal.type}
              className={`relative overflow-hidden transition-all ${
                meal.markedForDate
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10'
                  : 'hover:shadow-md'
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {meal.icon}
                    <CardTitle className="text-lg">{meal.label}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {meal.isTomorrow && (
                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                        <CalendarClock className="mr-1 size-3" />
                        Tomorrow
                      </Badge>
                    )}
                    {meal.markedForDate && <Badge className="bg-green-600">Marked</Badge>}
                  </div>
                </div>
                <CardDescription>
                  {meal.scheduledTime}
                  {meal.isTomorrow && (
                    <span className="ml-1 text-amber-600 dark:text-amber-400">
                      · {new Date(meal.targetDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Meal Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedCategory({ ...selectedCategory, [meal.type]: 'veg' })}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        selectedCategory[meal.type] === 'veg'
                          ? 'bg-green-600 text-white'
                          : 'bg-green-100 text-green-900 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-100 dark:hover:bg-green-900/50'
                      }`}
                      disabled={meal.markedForDate || !meal.canMark}
                    >
                      Veg Rs. {meal.vegCost}
                    </button>
                    <button
                      onClick={() => setSelectedCategory({ ...selectedCategory, [meal.type]: 'nonveg' })}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        selectedCategory[meal.type] === 'nonveg'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-100 text-red-900 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-100 dark:hover:bg-red-900/50'
                      }`}
                      disabled={meal.markedForDate || !meal.canMark}
                    >
                      Non-Veg Rs. {meal.nonvegCost}
                    </button>
                  </div>
                </div>

                {windows && !meal.isTomorrow && (
                  <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-2 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-200">
                    <Clock className="mt-0.5 size-4 flex-shrink-0" />
                    <span>
                      {windows.alwaysOpen ? 'Meal marking is open all day.' : `Mark between ${windows.startTime} and ${windows.endTime}.`}
                    </span>
                  </div>
                )}

                {meal.isTomorrow && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                    <CalendarClock className="mt-0.5 size-4 flex-shrink-0" />
                    <span>Today&apos;s window has ended. Marking for tomorrow.</span>
                  </div>
                )}

                {!meal.canMark && meal.error && (
                  <Alert variant="destructive" className="p-3">
                    <AlertDescription className="text-xs">{meal.error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={() => handleMarkMeal(meal.type, meal.targetDate)}
                  disabled={isBootstrapping || meal.markedForDate || !meal.canMark || loading || !isBalanceSufficient}
                  className="w-full"
                  variant={meal.markedForDate ? 'outline' : 'default'}
                >
                  {meal.markedForDate
                    ? 'Already Marked'
                    : !isBalanceSufficient
                      ? 'Insufficient Balance'
                      : meal.isTomorrow
                        ? 'Mark for Tomorrow'
                        : 'Mark Meal'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="text-base">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Meals now sync directly with the admin dashboard as soon as you mark them.</p>
          <p>Each meal can be marked only once per day.</p>
          <p>When a meal&apos;s time window has ended, marking shifts to the next day automatically.</p>
          <p>Your balance is deducted immediately and shown across the student screens.</p>
          <p>{timings?.removeTimeFrame ? 'The admin has removed meal time restrictions for now.' : 'Meal access follows the admin-configured timing window.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
