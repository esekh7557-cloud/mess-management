import { NextRequest, NextResponse } from 'next/server'
import { getMealCost, getMealTargetDate, validateMealMarking } from '@/lib/meal-marking'
import {
  addTransaction,
  getStudentById,
  getStudentTransactions,
  getMealMarkingsForDate,
  getTodayMealMarkings,
  getLowBalanceNotification,
  readStore,
  shouldCreateLowBalanceAlert,
  syncStudentBalance,
  updateStore,
  type MealCategory,
  type MealType,
} from '@/lib/server-store'

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get('student_id')

  if (!studentId) {
    return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
  }

  const state = await readStore()
  const student = getStudentById(state, studentId)

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner']
  const mealTargets = mealTypes.reduce<Record<MealType, { date: string; isTomorrow: boolean }>>((acc, meal) => {
    acc[meal] = getMealTargetDate(meal, state.mealTimings)
    return acc
  }, {} as Record<MealType, { date: string; isTomorrow: boolean }>)

  // Get marked meals per target date for each meal type
  const markedMeals: MealType[] = []
  for (const meal of mealTypes) {
    const { date } = mealTargets[meal]
    const markings = getMealMarkingsForDate(state, date).filter(
      (m) => m.student_id === studentId && m.meal_type === meal
    )
    if (markings.length > 0) {
      markedMeals.push(meal)
    }
  }

  const todayMarkings = getTodayMealMarkings(state).filter((marking) => marking.student_id === studentId)

  return NextResponse.json({
    success: true,
    data: {
      balance: state.balances[studentId],
      timings: state.mealTimings,
      markedMeals,
      mealTargets,
      todayMarkings,
      recentTransactions: getStudentTransactions(state, studentId).slice(0, 5),
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { student_id: studentId, mealType, category, targetDate } = (await request.json()) as {
      student_id?: string
      mealType?: MealType
      category?: MealCategory
      targetDate?: string // YYYY-MM-DD
    }

    if (!studentId || !mealType) {
      return NextResponse.json({ error: 'student_id and mealType are required' }, { status: 400 })
    }

    const result = await updateStore((state) => {
      const student = getStudentById(state, studentId)

      if (!student) {
        return { status: 404 as const, body: { error: 'Student not found' } }
      }

      const selectedCategory = category ?? 'veg'
      const balance = state.balances[studentId]

      // Determine target date and whether it's tomorrow
      const mealTarget = getMealTargetDate(mealType, state.mealTimings)
      const effectiveDate = targetDate ?? mealTarget.date
      const isTomorrow = effectiveDate !== new Date().toISOString().split('T')[0]

      // Check duplicates against the target date, not just today
      const dateMarkings = getMealMarkingsForDate(state, effectiveDate).filter(
        (marking) => marking.student_id === studentId
      )
      const alreadyMarked = dateMarkings.some((marking) => marking.meal_type === mealType)

      if (alreadyMarked) {
        return {
          status: 400 as const,
          body: { error: `You have already marked ${mealType} for ${isTomorrow ? 'tomorrow' : 'today'}` },
        }
      }

      // Skip time validation for tomorrow's meals
      if (!isTomorrow) {
        const validation = validateMealMarking(
          mealType,
          balance.remaining_balance,
          false,
          selectedCategory,
          state.mealTimings
        )

        if (!validation.valid) {
          return { status: 400 as const, body: { error: validation.error ?? 'Unable to mark meal' } }
        }
      }

      // Balance check (needed for both today and tomorrow)
      const mealPrice = getMealCost(mealType, selectedCategory)
      if (balance.remaining_balance < mealPrice) {
        return {
          status: 400 as const,
          body: { error: `Insufficient balance. Required: Rs. ${mealPrice}, Available: Rs. ${balance.remaining_balance}` },
        }
      }

      // Create the marking with the target date's timestamp
      const now = new Date()
      const markedAtDate = isTomorrow ? `${effectiveDate}T${now.toISOString().split('T')[1]}` : now.toISOString()
      const marking = {
        id: `MRK-${Date.now()}`,
        student_id: studentId,
        student_name: student.name,
        meal_type: mealType,
        meal_category: selectedCategory,
        meal_price: mealPrice,
        marked_at: markedAtDate,
        completed: false,
      }

      state.mealMarkings.unshift(marking)
      balance.used_balance += mealPrice
      balance.remaining_balance -= mealPrice
      syncStudentBalance(state, studentId)

      addTransaction(state, studentId, {
        id: `txn-meal-${Date.now()}`,
        date: effectiveDate,
        description: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} - ${selectedCategory === 'veg' ? 'Veg' : 'Non-Veg'}${isTomorrow ? ' (Tomorrow)' : ''}`,
        amount: mealPrice,
        type: 'debit',
        category: 'meal',
      })

      if (shouldCreateLowBalanceAlert(balance.remaining_balance)) {
        state.notifications.unshift(getLowBalanceNotification(student.name, balance.remaining_balance))
      }

      // Return marked meals for each meal's target date
      const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner']
      const updatedMarkedMeals: MealType[] = []
      for (const mt of mealTypes) {
        const target = getMealTargetDate(mt, state.mealTimings)
        const markings = getMealMarkingsForDate(state, target.date).filter(
          (m) => m.student_id === studentId && m.meal_type === mt
        )
        if (markings.length > 0) {
          updatedMarkedMeals.push(mt)
        }
      }

      return {
        status: 200 as const,
        body: {
          success: true,
          data: {
            marking,
            balance,
            markedMeals: updatedMarkedMeals,
          },
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
