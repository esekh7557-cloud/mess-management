import { NextRequest, NextResponse } from 'next/server'
import { getHostelDistribution, getMealSummary, getWeeklyConsumption } from '@/lib/server-metrics'
import { getMealMarkingsForDate, getTodayMealMarkings, readStore } from '@/lib/server-store'

export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get('date')
    const state = await readStore()

    // Use date param if provided, otherwise default to today
    const mealMarkings = dateParam
      ? getMealMarkingsForDate(state, dateParam).sort((a, b) => b.marked_at.localeCompare(a.marked_at))
      : getTodayMealMarkings(state).sort((a, b) => b.marked_at.localeCompare(a.marked_at))

    const allTransactions = Object.values(state.transactionsByStudent).flat()
    const totalBalance = state.students.reduce((sum, student) => sum + student.balance, 0)
    const lowBalanceStudents = state.students.filter((student) => student.balance < 2000).length

    return NextResponse.json({
      success: true,
      data: {
        students: state.students,
        mealMarkings,
        mealSummary: getMealSummary(mealMarkings),
        hostelData: getHostelDistribution(state),
        weeklyRevenue: getWeeklyConsumption(allTransactions),
        stats: {
          totalStudents: state.students.length,
          totalBalance,
          lowBalanceStudents,
        },
      },
    })
  } catch (error) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' 
      },
      { status: 500 }
    )
  }
}
