import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

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

    const supabase = createAdminClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single()

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists',
      }, { status: 400 })
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    const initialBalance = body.balance ?? 5000

    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
      hostel: body.hostel || '',
      room: body.room || '',
      semester: body.semester || 1,
      balance: body.role === 'student' ? initialBalance : 0,
    })

    if (insertError) throw insertError

    if (body.role === 'student') {
      await supabase.from('transactions').insert({
        id: `seed-recharge-${userId}`,
        student_id: userId,
        date: new Date().toISOString().split('T')[0],
        description: 'Opening Wallet Balance',
        amount: initialBalance,
        type: 'credit',
        category: 'recharge',
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: userId,
        name: body.name,
        email: body.email,
        role: body.role,
        message: `Account created successfully for ${body.name}`,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
