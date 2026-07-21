export const MEAL_COSTS = {
  breakfast: { veg: 40, nonveg: 50 },
  lunch: { veg: 70, nonveg: 80 },
  dinner: { veg: 70, nonveg: 80 },
}

export interface MealSelectionTimings {
  breakfast: {
    startTime: string // HH:MM format
    endTime: string // HH:MM format
  }
  lunch: {
    startTime: string // HH:MM format
    endTime: string // HH:MM format
  }
  dinner: {
    startTime: string // HH:MM format
    endTime: string // HH:MM format
  }
  removeTimeFrame: boolean
}

export type MealType = 'breakfast' | 'lunch' | 'dinner'

const MEAL_SCHEDULES: Record<MealType, string> = {
  breakfast: '08:00',
  lunch: '13:00',
  dinner: '20:00',
}

const MARK_WINDOW_HOURS = 2

function parseTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return { hours, minutes }
}

function formatDisplayTime(time: string) {
  const { hours, minutes } = parseTime(time)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

function getDefaultWindow(mealType: MealType) {
  const scheduledTime = MEAL_SCHEDULES[mealType]
  const { hours, minutes } = parseTime(scheduledTime)
  const startHours = Math.max(0, hours - MARK_WINDOW_HOURS)

  return {
    startTime: `${startHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    endTime: scheduledTime,
  }
}

/**
 * Get current time and date in IST (Asia/Kolkata)
 */
export function getCurrentIST() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value;
  const isoDate = `${get('year')}-${get('month')}-${get('day')}`;
  
  let hours = parseInt(get('hour')!, 10);
  if (hours === 24) hours = 0; // en-GB sometimes returns 24 for midnight
  const minutes = parseInt(get('minute')!, 10);
  
  return { isoDate, hours, minutes };
}

/**
 * Check if a meal can be marked right now
 */
export function canMarkMeal(
  mealType: MealType,
  timings?: MealSelectionTimings
): {
  canMark: boolean
  reason?: string
  nextAvailableTime?: string
} {
  const ist = getCurrentIST()
  const currentMinutes = ist.hours * 60 + ist.minutes

  if (timings?.removeTimeFrame) {
    return { canMark: true }
  }

  const configuredWindow = timings?.[mealType] ?? getDefaultWindow(mealType)
  const start = parseTime(configuredWindow.startTime)
  const end = parseTime(configuredWindow.endTime)
  const startMinutes = start.hours * 60 + start.minutes
  const endMinutes = end.hours * 60 + end.minutes

  if (currentMinutes < startMinutes) {
    return {
      canMark: false,
      reason: `You can mark this meal from ${formatDisplayTime(configuredWindow.startTime)}`,
      nextAvailableTime: formatDisplayTime(configuredWindow.startTime),
    }
  }

  if (currentMinutes > endMinutes) {
    return {
      canMark: false,
      reason: `This meal closed at ${formatDisplayTime(configuredWindow.endTime)}`,
    }
  }

  return { canMark: true }
}

/**
 * Get meal cost based on category
 */
export function getMealCost(mealType: MealType, category: 'veg' | 'nonveg' = 'veg'): number {
  const costs = MEAL_COSTS[mealType]
  return costs[category]
}

/**
 * Validate if meal can be marked (check balance, time window, duplicates)
 */
export function validateMealMarking(
  mealType: MealType,
  remainingBalance: number,
  alreadyMarkedToday: boolean,
  category: 'veg' | 'nonveg' = 'veg',
  timings?: MealSelectionTimings
): {
  valid: boolean
  error?: string
} {
  const timeCheck = canMarkMeal(mealType, timings)
  if (!timeCheck.canMark) {
    return { valid: false, error: timeCheck.reason }
  }
  
  const cost = getMealCost(mealType, category)
  if (remainingBalance < cost) {
    return {
      valid: false,
      error: `Insufficient balance. Required: ₹${cost}, Available: ₹${remainingBalance}`,
    }
  }
  
  if (alreadyMarkedToday) {
    return {
      valid: false,
      error: `You have already marked ${mealType} for today`,
    }
  }
  
  return { valid: true }
}

/**
 * Format meal schedule display
 */
export function formatMealTime(mealType: MealType): string {
  return formatDisplayTime(MEAL_SCHEDULES[mealType])
}

/**
 * Get marking window times
 */
export function getMarkingWindowTimes(
  mealType: MealType,
  timings?: MealSelectionTimings
): {
  startTime: string
  endTime: string
  alwaysOpen: boolean
} {
  if (timings?.removeTimeFrame) {
    return {
      startTime: '00:00',
      endTime: '23:59',
      alwaysOpen: true,
    }
  }

  const configuredWindow = timings?.[mealType] ?? getDefaultWindow(mealType)

  return {
    startTime: configuredWindow.startTime,
    endTime: configuredWindow.endTime,
    alwaysOpen: false,
  }
}

/**
 * Determine the target date for a meal based on whether its time window has passed.
 * If the meal's end time has passed today, the target shifts to tomorrow.
 */
export function getMealTargetDate(
  mealType: MealType,
  timings?: MealSelectionTimings
): { date: string; isTomorrow: boolean } {
  const ist = getCurrentIST()
  const today = ist.isoDate

  const configuredWindow = timings?.[mealType] ?? getDefaultWindow(mealType)
  const end = parseTime(configuredWindow.endTime)
  const endMinutes = end.hours * 60 + end.minutes
  const currentMinutes = ist.hours * 60 + ist.minutes

  if (currentMinutes > endMinutes) {
    // Tomorrow in IST
    const tomorrowDate = new Date(`${today}T12:00:00Z`)
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    
    // We only need the ISO date YYYY-MM-DD
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0]
    return { date: tomorrowStr, isTomorrow: true }
  }

  return { date: today, isTomorrow: false }
}

/**
 * Check if a meal can be marked, accounting for whether it targets today or tomorrow.
 * If it targets tomorrow, the time window is always open (it hasn't started yet).
 */
export function canMarkMealForDate(
  mealType: MealType,
  isTomorrow: boolean,
  timings?: MealSelectionTimings
): {
  canMark: boolean
  reason?: string
  nextAvailableTime?: string
} {
  // If "Allow Anytime Marking" is enabled, anything goes
  if (timings?.removeTimeFrame) {
    return { canMark: true }
  }

  // If anytime marking is disabled and we've shifted to tomorrow's meal,
  // the student must wait until tomorrow's marking window actually opens.
  if (isTomorrow) {
    const configuredWindow = timings?.[mealType] ?? getDefaultWindow(mealType)
    return {
      canMark: false,
      reason: `You can mark this meal from ${formatDisplayTime(configuredWindow.startTime)} tomorrow`,
      nextAvailableTime: formatDisplayTime(configuredWindow.startTime),
    }
  }

  // Otherwise, apply standard time window rules for today's meal
  return canMarkMeal(mealType, timings)
}
