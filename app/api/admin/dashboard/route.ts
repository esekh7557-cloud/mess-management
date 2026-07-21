import { NextRequest, NextResponse } from 'next/server'
import { getHostelDistribution, getMealSummary, getWeeklyConsumption } from '@/lib/server-metrics'
import { getCurrentIST } from '@/lib/meal-marking'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get('date')
    const { isoDate } = getCurrentIST()
    const targetDate = dateParam || isoDate
    const supabase = createAdminClient()

    // 1. Fetch Students
    const { data: students } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')

    // 2. Fetch Meal Markings for the target date
    const { data: mealMarkings } = await supabase
      .from('meal_markings')
      .select('*, users(name)')
      .like('marked_at', `${targetDate}%`)
      .order('marked_at', { ascending: false })
      
    // Transform mealMarkings to include student_name
    const transformedMarkings = (mealMarkings || []).map(m => ({
      ...m,
      student_name: m.users?.name || 'Unknown'
    }))

    // 3. Fetch Transactions (last 7 days is enough for weeklyRevenue, but let's just fetch all or recent)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])

    const totalBalance = (students || []).reduce((sum, student) => sum + student.balance, 0)
    const lowBalanceStudents = (students || []).filter((student) => student.balance < 2000).length

    return NextResponse.json({
      success: true,
      data: {
        students: students || [],
        mealMarkings: transformedMarkings,
        mealSummary: getMealSummary(transformedMarkings),
        hostelData: getHostelDistribution(students || []),
        weeklyRevenue: getWeeklyConsumption(transactions || []),
        stats: {
          totalStudents: (students || []).length,
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
