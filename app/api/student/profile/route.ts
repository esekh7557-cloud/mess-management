import { NextRequest, NextResponse } from 'next/server'
import { getSemesterSummary, getWeeklyConsumption } from '@/lib/server-metrics'
import {
  getStudentById,
  getStudentTransactions,
  getTodayMealMarkings,
  readStore,
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

  const transactions = getStudentTransactions(state, studentId)
  const studentMealMarkings = state.mealMarkings.filter((marking) => marking.student_id === studentId)
  const todayMeals = getTodayMealMarkings(state)
    .filter((marking) => marking.student_id === studentId)
    .map((marking) => marking.meal_type)

  return NextResponse.json({
    success: true,
    data: {
      student,
      balance: state.balances[studentId],
      transactions,
      recentTransactions: transactions.slice(0, 5),
      weeklyConsumption: getWeeklyConsumption(transactions),
      semesterSummary: getSemesterSummary(transactions, studentMealMarkings),
      todayMeals,
    },
  })
}
