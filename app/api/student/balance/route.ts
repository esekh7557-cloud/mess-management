import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const DEFAULT_BALANCE = 10000

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get('student_id')

  if (!studentId) {
    return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: student, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', studentId)
    .single()

  if (error || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const balanceDetails = {
    student_id: student.id,
    total_balance: DEFAULT_BALANCE,
    used_balance: DEFAULT_BALANCE - student.balance,
    remaining_balance: student.balance,
  }

  return NextResponse.json({
    success: true,
    data: balanceDetails,
  })
}

export async function POST(request: NextRequest) {
  try {
    const { student_id: studentId, action, amount } = await request.json()

    if (!studentId || !action || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'student_id, action, and a positive amount are required' }, { status: 400 })
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

    let newBalance = student.balance
    let transactionType = 'credit'
    let transactionDesc = ''
    let transactionCategory = 'recharge'

    if (action === 'recharge') {
      newBalance += amount
      transactionDesc = 'Wallet Recharge'
    } else if (action === 'deduct') {
      if (student.balance < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
      }
      newBalance -= amount
      transactionType = 'debit'
      transactionDesc = 'Wallet Deduction'
      transactionCategory = 'meal'
    } else {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }

    // Update balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', studentId)

    if (updateError) throw updateError

    // Insert transaction (if applicable, e.g. recharge. Deduct might also be recorded)
    await supabase.from('transactions').insert({
      id: `txn-${action}-${Date.now()}`,
      student_id: studentId,
      date: new Date().toISOString().split('T')[0],
      description: transactionDesc,
      amount,
      type: transactionType,
      category: transactionCategory,
    })

    // Fetch updated transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false })

    const updatedStudent = { ...student, balance: newBalance }
    const balanceDetails = {
      student_id: studentId,
      total_balance: DEFAULT_BALANCE,
      used_balance: DEFAULT_BALANCE - newBalance,
      remaining_balance: newBalance,
    }

    return NextResponse.json({
      success: true,
      data: {
        student: updatedStudent,
        balance: balanceDetails,
        transactions: transactions || [],
      },
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
