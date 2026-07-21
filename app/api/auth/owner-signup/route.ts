import { NextRequest, NextResponse } from 'next/server'
import { getAccountByEmail, updateStore, type UserAccount } from '@/lib/server-store'

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password, adminKey } = await request.json()

    if (!fullName || !email || !password || !adminKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify admin key
    const expectedKey = process.env.ADMIN_SECRET || 'admin123'
    if (adminKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Invalid admin registration key' },
        { status: 403 }
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

      const adminCount = state.accounts.filter((a) => a.role === 'admin').length
      const userId = `ADM${String(adminCount + 1).padStart(3, '0')}`

      const newAccount: UserAccount = {
        id: userId,
        name: fullName,
        email,
        password,
        role: 'admin',
      }

      state.accounts.push(newAccount)

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
    console.error('Owner signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
