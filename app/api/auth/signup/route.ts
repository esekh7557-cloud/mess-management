import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

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

    // Get current student count to generate ID
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')

    const studentCount = count || 0
    const userId = `STU${String(studentCount + 1).padStart(3, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const initialBalance = 5000 // Default signup bonus balance

    // Insert user
    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      name,
      email,
      password,
      role: 'student',
      hostel,
      room,
      semester: Number(semester),
      balance: initialBalance,
    })

    if (insertError) throw insertError

    // Insert initial transaction
    await supabase.from('transactions').insert({
      id: `tx-init-${Date.now()}`,
      student_id: userId,
      date: new Date().toISOString().split('T')[0],
      description: 'Opening Wallet Balance',
      amount: initialBalance,
      type: 'credit',
      category: 'recharge',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email,
        role: 'student',
        hostel,
        room,
        semester: Number(semester),
        balance: initialBalance,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
