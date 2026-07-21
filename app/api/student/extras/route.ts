import { NextRequest, NextResponse } from 'next/server'
import {
  addTransaction,
  getStudentById,
  syncStudentBalance,
  updateStore,
} from '@/lib/server-store'

export async function POST(request: NextRequest) {
  try {
    const { student_id: studentId, items } = await request.json()

    if (!studentId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'student_id and items are required' }, { status: 400 })
    }

    const result = await updateStore((state) => {
      const student = getStudentById(state, studentId)

      if (!student) {
        return { status: 404 as const, body: { error: 'Student not found' } }
      }

      const lineItems = items.map((item: { id: string; quantity: number }) => {
        const extra = state.extraItems.find((extraItem) => extraItem.id === item.id)
        return extra && item.quantity > 0 ? { extra, quantity: item.quantity } : null
      }).filter(Boolean) as Array<{ extra: (typeof state.extraItems)[number]; quantity: number }>

      if (lineItems.length === 0) {
        return { status: 400 as const, body: { error: 'No valid items were provided' } }
      }

      const total = lineItems.reduce((sum, item) => sum + item.extra.price * item.quantity, 0)
      const balance = state.balances[studentId]

      if (balance.remaining_balance < total) {
        return { status: 400 as const, body: { error: 'Insufficient balance' } }
      }

      balance.used_balance += total
      balance.remaining_balance -= total
      syncStudentBalance(state, studentId)

      const now = new Date()
      addTransaction(state, studentId, {
        id: `txn-extra-${Date.now()}`,
        date: now.toISOString().split('T')[0],
        description: `Extras Order - ${lineItems.map((item) => `${item.extra.name} x${item.quantity}`).join(', ')}`,
        amount: total,
        type: 'debit',
        category: 'extra',
      })

      return {
        status: 200 as const,
        body: {
          success: true,
          data: {
            balance,
            total,
          },
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
