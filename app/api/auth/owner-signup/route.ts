import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

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

    const supabase = createAdminClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'An account with this email already exists',
      }, { status: 400 })
    }

    // Get current admin count to generate ID
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')

    const adminCount = count || 0
    const userId = `ADM${String(adminCount + 1).padStart(3, '0')}`

    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      name: fullName,
      email,
      password,
      role: 'admin',
    })

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: fullName,
        email,
        role: 'admin',
      },
    })
  } catch (error) {
    console.error('Owner signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
