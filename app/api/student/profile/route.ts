import { NextRequest, NextResponse } from 'next/server'
import { getSemesterSummary, getWeeklyConsumption } from '@/lib/server-metrics'
import { getCurrentIST } from '@/lib/meal-marking'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get('student_id')

  if (!studentId) {
    return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: student, error: studentError } = await supabase
    .from('users')
    .select('*')
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })

  const { data: mealMarkings } = await supabase
    .from('meal_markings')
    .select('*')
    .eq('student_id', studentId)
    .order('marked_at', { ascending: false })

  const { isoDate: today } = getCurrentIST()
  const todayMeals = (mealMarkings || [])
    .filter((m) => m.marked_at.startsWith(today))
    .map((m) => m.meal_type)

  const DEFAULT_BALANCE = 10000
  const balance = {
    student_id: studentId,
    total_balance: DEFAULT_BALANCE,
    used_balance: DEFAULT_BALANCE - student.balance,
    remaining_balance: student.balance,
  }

  return NextResponse.json({
    success: true,
    data: {
      student,
      balance,
      transactions: transactions || [],
      recentTransactions: (transactions || []).slice(0, 5),
      weeklyConsumption: getWeeklyConsumption(transactions || []),
      semesterSummary: getSemesterSummary(transactions || [], mealMarkings || []),
      todayMeals,
    },
  })
}
