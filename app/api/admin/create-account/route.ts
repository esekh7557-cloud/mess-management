import { NextRequest, NextResponse } from 'next/server'
import { getAccountByEmail, updateStore, type UserAccount } from '@/lib/server-store'
import type { Student } from '@/lib/mock-data'

interface CreateAccountRequest {
  name: string
  email: string
  password: string
  role: 'student' | 'admin'
  hostel?: string
  room?: string
  balance?: number
  semester?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateAccountRequest

    // Validate required fields
    if (!body.name || !body.email || !body.password || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const result = await updateStore((state) => {
      // Check if user already exists
      const existingUser = getAccountByEmail(state, body.email)
      if (existingUser) {
        return {
          status: 400 as const,
          body: {
            success: false,
            error: 'User with this email already exists',
          },
        }
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      const initialBalance = body.balance ?? 5000

      const newAccount: UserAccount = {
        id: userId,
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role,
        hostel: body.hostel || '',
        room: body.room || '',
        semester: body.semester || 1,
        balance: body.role === 'student' ? initialBalance : undefined,
      }

      state.accounts.push(newAccount)

      if (body.role === 'student') {
        const newStudent: Student = {
          id: userId,
          name: body.name,
          email: body.email,
          hostel: body.hostel || '',
          room: body.room || '',
          semester: body.semester || 1,
          balance: initialBalance,
        }

        state.students.push(newStudent)
        state.balances[userId] = {
          student_id: userId,
          total_balance: 10000,
          used_balance: 10000 - initialBalance,
          remaining_balance: initialBalance,
        }
        state.transactionsByStudent[userId] = [
          {
            id: `seed-recharge-${userId}`,
            date: new Date().toISOString().split('T')[0],
            description: 'Opening Wallet Balance',
            amount: 10000,
            type: 'credit',
            category: 'recharge',
          },
        ]
        state.notificationStateByStudent[userId] = { readIds: [], deletedIds: [] }
      }

      return {
        status: 201 as const,
        body: {
          success: true,
          data: {
            id: newAccount.id,
            name: newAccount.name,
            email: newAccount.email,
            role: newAccount.role,
            message: `Account created successfully for ${body.name}`,
          },
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
