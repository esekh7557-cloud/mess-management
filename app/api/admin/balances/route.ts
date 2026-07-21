import { NextRequest, NextResponse } from 'next/server'
import {
  addTransaction,
  readStore,
  syncStudentBalance,
  updateStore,
} from '@/lib/server-store'

const DEFAULT_BALANCE = 10000

export async function GET() {
  const state = await readStore()

  return NextResponse.json({
    success: true,
    data: state.students.map((student) => ({
      ...student,
      balanceDetails: state.balances[student.id],
    })),
  })
}

export async function PATCH(request: NextRequest) {
  try {
    const { studentId, action, amount } = await request.json()

    if (!studentId || !action) {
      return NextResponse.json({ error: 'studentId and action are required' }, { status: 400 })
    }

    const result = await updateStore((state) => {
      const student = state.students.find((item) => item.id === studentId)
      const balance = state.balances[studentId]

      if (!student || !balance) {
        return { status: 404 as const, body: { error: 'Student not found' } }
      }

      if (action === 'recharge') {
        if (typeof amount !== 'number' || amount <= 0) {
          return { status: 400 as const, body: { error: 'A positive amount is required for recharge' } }
        }

        balance.total_balance += amount
        balance.remaining_balance += amount

        addTransaction(state, studentId, {
          id: `txn-admin-recharge-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: 'Admin Wallet Recharge',
          amount,
          type: 'credit',
          category: 'recharge',
        })
      } else if (action === 'reset') {
        balance.total_balance = DEFAULT_BALANCE
        balance.used_balance = 0
        balance.remaining_balance = DEFAULT_BALANCE

        addTransaction(state, studentId, {
          id: `txn-admin-reset-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: 'Admin Balance Reset',
          amount: DEFAULT_BALANCE,
          type: 'credit',
          category: 'recharge',
        })
      } else {
        return { status: 400 as const, body: { error: 'Unsupported action' } }
      }

      syncStudentBalance(state, studentId)

      return {
        status: 200 as const,
        body: {
          success: true,
          data: state.students.map((item) => ({
            ...item,
            balanceDetails: state.balances[item.id],
          })),
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
