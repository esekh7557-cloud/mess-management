import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { markingId } = body

    if (!markingId) {
      return NextResponse.json({ error: 'markingId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: updatedMarking, error } = await supabase
      .from('meal_markings')
      .update({ completed: true })
      .eq('id', markingId)
      .select()
      .single()

    if (error) {
      console.error('Error marking meal as completed:', error)
      return NextResponse.json({ error: 'Failed to mark meal as completed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        marking: updatedMarking,
      },
    })
  } catch (error) {
    console.error('Error in request:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
