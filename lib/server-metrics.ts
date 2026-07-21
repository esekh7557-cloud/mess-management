import 'server-only'

// Remove AppState import since it's no longer used
// Using any for MealMarkingRecord for simplicity after removing AppState
// Define Transaction type locally to avoid import issues
interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'debit' | 'credit'
  category: 'meal' | 'extra' | 'recharge' | 'refund'
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function getHostelDistribution(students: { hostel?: string | null }[]) {
  const counts = new Map<string, number>()

  for (const student of students) {
    if (!student.hostel) continue
    const hostel = student.hostel.includes(' - ') 
      ? student.hostel.split(' - ')[0] 
      : student.hostel
    counts.set(hostel, (counts.get(hostel) ?? 0) + 1)
  }

  const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

  return Array.from(counts.entries()).map(([name, value], index) => ({
    name,
    value,
    fill: palette[index % palette.length],
  }))
}

export function getMealSummary(markings: any[]) {
  return {
    breakfast: getSingleMealSummary(markings, 'breakfast'),
    lunch: getSingleMealSummary(markings, 'lunch'),
    dinner: getSingleMealSummary(markings, 'dinner'),
  }
}

function getSingleMealSummary(markings: any[], mealType: string) {
  const items = markings.filter((marking) => marking.meal_type === mealType)

  return {
    veg: items.filter((marking) => marking.meal_category === 'veg').length,
    nonveg: items.filter((marking) => marking.meal_category === 'nonveg').length,
    total: items.length,
  }
}

function getLastSevenDates() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return date
  })
}

export function getWeeklyConsumption(transactions: Transaction[]) {
  const totals = new Map<string, { meals: number; extras: number; total: number; day: string }>()

  for (const date of getLastSevenDates()) {
    const isoDate = date.toISOString().split('T')[0]
    totals.set(isoDate, {
      day: WEEKDAY_LABELS[date.getDay()],
      meals: 0,
      extras: 0,
      total: 0,
    })
  }

  for (const transaction of transactions) {
    const key = transaction.date
    const bucket = totals.get(key)

    if (!bucket || transaction.type !== 'debit') {
      continue
    }

    if (transaction.category === 'meal') {
      bucket.meals += transaction.amount
    }

    if (transaction.category === 'extra') {
      bucket.extras += transaction.amount
    }

    bucket.total += transaction.amount
  }

  return Array.from(totals.values())
}

export function getSemesterSummary(transactions: Transaction[], mealMarkings: any[]) {
  const totalDays = 120
  const semesterStart = new Date()
  semesterStart.setDate(semesterStart.getDate() - 45)
  const daysElapsed = 46

  const totalSpent = transactions
    .filter((transaction) => transaction.type === 'debit')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const extraSpent = transactions
    .filter((transaction) => transaction.category === 'extra' && transaction.type === 'debit')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const mealsConsumed = mealMarkings.length
  const totalMeals = totalDays * 3
  const averageDaily = daysElapsed > 0 ? Math.round(totalSpent / daysElapsed) : 0

  return {
    totalDays,
    daysElapsed,
    totalMeals,
    mealsConsumed,
    totalSpent,
    extraSpent,
    averageDaily,
  }
}
