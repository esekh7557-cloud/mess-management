import { NextRequest, NextResponse } from 'next/server'
import { readStore, updateStore } from '@/lib/server-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { markingId } = body

    if (!markingId) {
      return NextResponse.json({ error: 'markingId is required' }, { status: 400 })
    }

    const result = await updateStore((state) => {
      // Find and update the meal marking
      const marking = state.mealMarkings.find((m: any) => m.id === markingId)
      if (marking) {
        marking.completed = true
      }

      return {
        status: 200 as const,
        body: {
          success: true,
          data: {
            marking: marking,
          },
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('Error marking meal as completed:', error)
    return NextResponse.json({ error: 'Failed to mark meal as completed' }, { status: 500 })
  }
}
