import { NextRequest, NextResponse } from 'next/server'
import {
  addTransaction,
  getStudentById,
  readStore,
  syncStudentBalance,
  updateStore,
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

  return NextResponse.json({
    success: true,
    data: state.balances[studentId],
  })
}

export async function POST(request: NextRequest) {
  try {
    const { student_id: studentId, action, amount } = await request.json()

    if (!studentId || !action || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'student_id, action, and a positive amount are required' }, { status: 400 })
    }

    const result = await updateStore((state) => {
      const student = getStudentById(state, studentId)

      if (!student) {
        return { status: 404 as const, body: { error: 'Student not found' } }
      }

      const balance = state.balances[studentId]

      if (action === 'recharge') {
        balance.total_balance += amount
        balance.remaining_balance += amount

        addTransaction(state, studentId, {
          id: `txn-recharge-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: 'Wallet Recharge',
          amount,
          type: 'credit',
          category: 'recharge',
        })
      } else if (action === 'deduct') {
        if (balance.remaining_balance < amount) {
          return { status: 400 as const, body: { error: 'Insufficient balance' } }
        }

        balance.used_balance += amount
        balance.remaining_balance -= amount
      } else {
        return { status: 400 as const, body: { error: 'Unsupported action' } }
      }

      syncStudentBalance(state, studentId)

      return {
        status: 200 as const,
        body: {
          success: true,
          data: {
            student: getStudentById(state, studentId),
            balance,
            transactions: state.transactionsByStudent[studentId] ?? [],
          },
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
