import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing email, password, or role' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const { data: account, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !account) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (account.password !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (account.role !== role) {
      return NextResponse.json(
        { error: `Unauthorized role: ${role} account not found for this email` },
        { status: 403 }
      )
    }

    const { password: _, ...userWithoutPassword } = account
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
