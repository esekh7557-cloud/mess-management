import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createAdminClient()

  const { data: extraItems, error } = await supabase
    .from('extra_items')
    .select('*')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch extra items' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: extraItems || [],
  })
}

export async function PUT(request: NextRequest) {
  try {
    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items must be an array' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Since we are replacing all extra items, first delete existing ones
    // We use .not('id', 'is', null) to match all rows
    await supabase.from('extra_items').delete().not('id', 'is', null)

    if (items.length > 0) {
      const { error: insertError } = await supabase
        .from('extra_items')
        .insert(items)

      if (insertError) {
        return NextResponse.json({ error: 'Failed to save extra items' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      data: items,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
