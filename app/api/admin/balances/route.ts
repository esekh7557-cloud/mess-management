import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const DEFAULT_BALANCE = 10000

export async function GET() {
  const supabase = createAdminClient()

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'student')

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch students' }, { status: 500 })
  }

  const studentsWithBalance = users.map((student) => ({
    ...student,
    balanceDetails: {
      student_id: student.id,
      total_balance: DEFAULT_BALANCE,
      used_balance: DEFAULT_BALANCE - student.balance,
      remaining_balance: student.balance,
    }
  }))

  return NextResponse.json({
    success: true,
    data: studentsWithBalance,
  })
}

export async function PATCH(request: NextRequest) {
  try {
    const { studentId, action, amount } = await request.json()

    if (!studentId || !action) {
      return NextResponse.json({ error: 'studentId and action are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Get current student balance
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('*')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    let newBalance = student.balance
    let transactionAmount = amount
    let transactionDesc = ''

    if (action === 'recharge') {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: 'A positive amount is required for recharge' }, { status: 400 })
      }
      newBalance += amount
      transactionDesc = 'Admin Wallet Recharge'
    } else if (action === 'reset') {
      newBalance = DEFAULT_BALANCE
      transactionAmount = DEFAULT_BALANCE
      transactionDesc = 'Admin Balance Reset'
    } else {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }

    // 2. Update balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', studentId)

    if (updateError) throw updateError

    // 3. Insert transaction
    await supabase.from('transactions').insert({
      id: `txn-admin-${action}-${Date.now()}`,
      student_id: studentId,
      date: new Date().toISOString().split('T')[0],
      description: transactionDesc,
      amount: transactionAmount,
      type: 'credit',
      category: 'recharge',
    })

    // 4. Return updated students list
    const { data: allUsers } = await supabase.from('users').select('*').eq('role', 'student')
    const studentsWithBalance = (allUsers || []).map((stu) => ({
      ...stu,
      balanceDetails: {
        student_id: stu.id,
        total_balance: DEFAULT_BALANCE,
        used_balance: DEFAULT_BALANCE - stu.balance,
        remaining_balance: stu.balance,
      }
    }))

    return NextResponse.json({
      success: true,
      data: studentsWithBalance,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
