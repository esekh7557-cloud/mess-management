import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { student_id: studentId, items } = await request.json()

    if (!studentId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'student_id and items are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Get student
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('*')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // 2. Get extra items
    const { data: extraItems, error: extrasError } = await supabase
      .from('extra_items')
      .select('*')

    if (extrasError) {
      return NextResponse.json({ error: 'Failed to fetch extra items' }, { status: 500 })
    }

    // 3. Process line items
    const lineItems = items.map((item: { id: string; quantity: number }) => {
      const extra = extraItems.find((extraItem) => extraItem.id === item.id)
      return extra && item.quantity > 0 ? { extra, quantity: item.quantity } : null
    }).filter(Boolean) as Array<{ extra: any; quantity: number }>

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No valid items were provided' }, { status: 400 })
    }

    const total = lineItems.reduce((sum, item) => sum + Number(item.extra.price) * item.quantity, 0)
    
    // 4. Check balance
    if (student.balance < total) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const newBalance = student.balance - total

    // 5. Update balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', studentId)

    if (updateError) throw updateError

    // 6. Insert transaction
    const now = new Date()
    await supabase.from('transactions').insert({
      id: `txn-extra-${Date.now()}`,
      student_id: studentId,
      date: now.toISOString().split('T')[0],
      description: `Extras Order - ${lineItems.map((item) => `${item.extra.name} x${item.quantity}`).join(', ')}`,
      amount: total,
      type: 'debit',
      category: 'extra',
    })

    const balanceDetails = {
      student_id: studentId,
      total_balance: 10000,
      used_balance: 10000 - newBalance,
      remaining_balance: newBalance,
    }

    return NextResponse.json({
      success: true,
      data: {
        balance: balanceDetails,
        total,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
