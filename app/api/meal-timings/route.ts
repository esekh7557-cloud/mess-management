import { NextRequest, NextResponse } from 'next/server'
import { readStore, updateStore } from '@/lib/server-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const state = await readStore()

  return NextResponse.json({
    success: true,
    data: state.mealTimings,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { removeTimeFrame } = body

    const result = await updateStore((state) => {
      if (state.mealTimings) {
        state.mealTimings.removeTimeFrame = removeTimeFrame
      }

      return {
        status: 200 as const,
        body: {
          success: true,
          data: state.mealTimings,
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error('Error updating meal timings:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const timings = await request.json()

    const result = await updateStore((state) => {
      state.mealTimings = timings

      return {
        status: 200 as const,
        body: {
          success: true,
          data: state.mealTimings,
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
