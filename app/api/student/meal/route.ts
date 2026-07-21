import { NextRequest, NextResponse } from 'next/server'
import { getMealCost, getMealTargetDate, validateMealMarking, getCurrentIST } from '@/lib/meal-marking'
import {
  type MealCategory,
  type MealType,
  getLowBalanceNotification,
  shouldCreateLowBalanceAlert,
} from '@/lib/server-store'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get('student_id')

  if (!studentId) {
    return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1. Get user & balance
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', studentId)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // 2. Get meal timings
  const { data: timingsData } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'meal_timings')
    .single()
  
  const mealTimings = timingsData?.value

  // 3. Get transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .limit(5)

  // 4. Get markings
  const { data: markings } = await supabase
    .from('meal_markings')
    .select('*')
    .eq('student_id', studentId)

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner']
  const mealTargets = mealTypes.reduce<Record<MealType, { date: string; isTomorrow: boolean }>>((acc, meal) => {
    acc[meal] = getMealTargetDate(meal, mealTimings)
    return acc
  }, {} as Record<MealType, { date: string; isTomorrow: boolean }>)

  // Get marked meals per target date for each meal type
  const markedMeals: MealType[] = []
  for (const meal of mealTypes) {
    const { date } = mealTargets[meal]
    const hasMarking = markings?.some(
      (m) => m.meal_type === meal && m.marked_at.startsWith(date)
    )
    if (hasMarking) {
      markedMeals.push(meal)
    }
  }

  const { isoDate: today } = getCurrentIST()
  const todayMarkings = markings?.filter((m) => m.marked_at.startsWith(today)) || []

  // Create balance object shaped like old StudentBalance
  const remaining_balance = user.balance
  const balance = {
    student_id: user.id,
    total_balance: 10000,
    used_balance: 10000 - remaining_balance,
    remaining_balance
  }

  return NextResponse.json({
    success: true,
    data: {
      balance,
      timings: mealTimings,
      markedMeals,
      mealTargets,
      todayMarkings,
      recentTransactions: transactions || [],
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

    const supabase = createAdminClient()

    // Get student
    const { data: student, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', studentId)
      .single()

    if (userError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get timings
    const { data: timingsData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'meal_timings')
      .single()
    const mealTimings = timingsData?.value

    const selectedCategory = category ?? 'veg'
    const remainingBalance = student.balance

    // Determine target date and whether it's tomorrow
    const mealTarget = getMealTargetDate(mealType, mealTimings)
    const effectiveDate = targetDate ?? mealTarget.date
    const { isoDate: todayStr } = getCurrentIST()
    const isTomorrow = effectiveDate !== todayStr

    // Check duplicates
    const { data: existingMarkings } = await supabase
      .from('meal_markings')
      .select('*')
      .eq('student_id', studentId)
      .eq('meal_type', mealType)
      .like('marked_at', `${effectiveDate}%`)

    if (existingMarkings && existingMarkings.length > 0) {
      return NextResponse.json({ error: `You have already marked ${mealType} for ${isTomorrow ? 'tomorrow' : 'today'}` }, { status: 400 })
    }

    // Skip time validation for tomorrow's meals
    if (!isTomorrow) {
      const validation = validateMealMarking(
        mealType,
        remainingBalance,
        false,
        selectedCategory,
        mealTimings
      )

      if (!validation.valid) {
        return NextResponse.json({ error: validation.error ?? 'Unable to mark meal' }, { status: 400 })
      }
    }

    // Balance check
    const mealPrice = getMealCost(mealType, selectedCategory)
    if (remainingBalance < mealPrice) {
      return NextResponse.json({ error: `Insufficient balance. Required: Rs. ${mealPrice}, Available: Rs. ${remainingBalance}` }, { status: 400 })
    }

    const now = new Date()
    const markedAtDate = isTomorrow ? `${effectiveDate}T${now.toISOString().split('T')[1]}` : now.toISOString()
    const markingId = `MRK-${Date.now()}`
    
    // Update balance
    const newBalance = remainingBalance - mealPrice
    await supabase.from('users').update({ balance: newBalance }).eq('id', studentId)

    // Insert marking
    const marking = {
      id: markingId,
      student_id: studentId,
      meal_type: mealType,
      meal_category: selectedCategory,
      meal_price: mealPrice,
      marked_at: markedAtDate,
      completed: false,
    }
    await supabase.from('meal_markings').insert(marking)

    // Insert transaction
    await supabase.from('transactions').insert({
      id: `txn-meal-${Date.now()}`,
      student_id: studentId,
      date: effectiveDate,
      description: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} - ${selectedCategory === 'veg' ? 'Veg' : 'Non-Veg'}${isTomorrow ? ' (Tomorrow)' : ''}`,
      amount: mealPrice,
      type: 'debit',
      category: 'meal',
    })

    // Insert notification if low balance
    if (shouldCreateLowBalanceAlert(newBalance)) {
      const notif = getLowBalanceNotification(student.name, newBalance)
      await supabase.from('notifications').insert({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        date: notif.date,
        type: notif.type
      })
      await supabase.from('student_notifications').insert({
        student_id: studentId,
        notification_id: notif.id,
        is_read: false,
        is_deleted: false
      })
    }

    // Refetch marked meals
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner']
    const updatedMarkedMeals: MealType[] = []
    
    const { data: allMarkings } = await supabase.from('meal_markings').select('*').eq('student_id', studentId)
    for (const mt of mealTypes) {
      const target = getMealTargetDate(mt, mealTimings)
      if (allMarkings?.some(m => m.meal_type === mt && m.marked_at.startsWith(target.date))) {
        updatedMarkedMeals.push(mt)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        marking: { ...marking, student_name: student.name },
        balance: {
          student_id: studentId,
          total_balance: 10000,
          used_balance: 10000 - newBalance,
          remaining_balance: newBalance
        },
        markedMeals: updatedMarkedMeals,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process meal' }, { status: 400 })
  }
}
