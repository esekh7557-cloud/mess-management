import { NextRequest, NextResponse } from 'next/server'
import { getAccountByEmail, updateStore, type UserAccount } from '@/lib/server-store'
import type { Student } from '@/lib/mock-data'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, hostel, room, semester } = await request.json()

    if (!name || !email || !password || !hostel || !room || !semester) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const result = await updateStore((state) => {
      // Check if user already exists
      const existingUser = getAccountByEmail(state, email)
      if (existingUser) {
        return {
          status: 400 as const,
          body: {
            success: false,
            error: 'An account with this email already exists',
          },
        }
      }

      // Generate a structured student/user ID
      const userId = `STU${String(state.students.length + 1).padStart(3, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      const initialBalance = 5000 // Default signup bonus balance

      const newAccount: UserAccount = {
        id: userId,
        name,
        email,
        password,
        role: 'student',
        hostel,
        room,
        semester: Number(semester),
        balance: initialBalance,
      }

      const newStudent: Student = {
        id: userId,
        name,
        email,
        hostel,
        room,
        semester: Number(semester),
        balance: initialBalance,
      }

      state.accounts.push(newAccount)
      state.students.push(newStudent)
      state.balances[userId] = {
        student_id: userId,
        total_balance: 10000,
        used_balance: 10000 - initialBalance,
        remaining_balance: initialBalance,
      }

      state.transactionsByStudent[userId] = [
        {
          id: `tx-init-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: 'Opening Wallet Balance',
          amount: 10000,
          type: 'credit',
          category: 'recharge',
        },
      ]

      state.notificationStateByStudent[userId] = { readIds: [], deletedIds: [] }

      const { password: _, ...userWithoutPassword } = newAccount

      return {
        status: 200 as const,
        body: {
          success: true,
          user: userWithoutPassword,
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
