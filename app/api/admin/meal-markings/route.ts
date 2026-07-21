import { NextRequest, NextResponse } from 'next/server'
import { getTodayMealMarkings, updateStore } from '@/lib/server-store'

export async function PATCH(request: NextRequest) {
  try {
    const { mealId, completed } = await request.json()

    if (!mealId || typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'mealId and completed are required' }, { status: 400 })
    }

    const result = await updateStore((state) => {
      const marking = state.mealMarkings.find((item) => item.id === mealId)

      if (!marking) {
        return { status: 404 as const, body: { error: 'Meal marking not found' } }
      }

      marking.completed = completed

      return {
        status: 200 as const,
        body: {
          success: true,
          data: getTodayMealMarkings(state),
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
