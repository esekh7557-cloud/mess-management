import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getCurrentIST, getUTCBoundsForISTDate } from '@/lib/meal-marking'

export async function PATCH(request: NextRequest) {
  try {
    const { mealId, completed } = await request.json()

    if (!mealId || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'mealId and completed are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error: updateError } = await supabase
      .from('meal_markings')
      .update({ completed })
      .eq('id', mealId)

    if (updateError) {
      return NextResponse.json({ error: 'Meal marking not found or update failed' }, { status: 404 })
    }

    const { isoDate: today } = getCurrentIST()
    const { start: utcStart, end: utcEnd } = getUTCBoundsForISTDate(today)

    // Get today's markings to return
    const { data: todayMarkings } = await supabase
      .from('meal_markings')
      .select('*')
      .gte('marked_at', utcStart)
      .lte('marked_at', utcEnd)
      .order('marked_at', { ascending: false })

    return NextResponse.json({
      success: true,
      data: todayMarkings || [],
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
