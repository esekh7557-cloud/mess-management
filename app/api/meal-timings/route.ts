import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { defaultMealSelectionTimings } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'meal_timings')
    .single()

  if (error || !data) {
    return NextResponse.json({ success: true, data: defaultMealSelectionTimings })
  }

  return NextResponse.json({ success: true, data: data.value })
}

export async function POST(request: NextRequest) {
  try {
    const { removeTimeFrame } = await request.json()
    const supabase = createAdminClient()
    
    const { data: current } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'meal_timings')
      .single()

    const timings = current ? current.value : defaultMealSelectionTimings
    timings.removeTimeFrame = removeTimeFrame

    const { error: updateError } = await supabase
      .from('app_settings')
      .upsert({ key: 'meal_timings', value: timings })

    if (updateError) throw updateError

    return NextResponse.json({ success: true, data: timings })
  } catch (error) {
    console.error('Error updating meal timings:', error)
    return NextResponse.json({ error: 'Failed to update timings' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const timings = await request.json()
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'meal_timings', value: timings })

    if (error) throw error

    return NextResponse.json({ success: true, data: timings })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update timings' }, { status: 400 })
  }
}
