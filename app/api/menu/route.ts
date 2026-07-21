import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createAdminClient()
  
  // Define days array to ensure correct sorting later if needed
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const { data: menu, error } = await supabase.from('weekly_menu').select('*')

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch menu' }, { status: 500 })
  }

  // Sort menu by daysOrder
  const sortedMenu = menu?.sort((a, b) => daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day)) || []

  return NextResponse.json({
    success: true,
    data: sortedMenu,
  })
}

export async function PUT(request: NextRequest) {
  try {
    const { menu } = await request.json()

    if (!Array.isArray(menu)) {
      return NextResponse.json({ error: 'menu must be an array' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase.from('weekly_menu').upsert(menu)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: menu,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
