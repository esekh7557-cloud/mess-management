import { NextRequest, NextResponse } from 'next/server'
import { readStore, updateStore } from '@/lib/server-store'

export async function GET() {
  const state = await readStore()

  return NextResponse.json({
    success: true,
    data: state.weeklyMenu,
  })
}

export async function PUT(request: NextRequest) {
  try {
    const { menu } = await request.json()

    if (!Array.isArray(menu)) {
      return NextResponse.json({ error: 'menu must be an array' }, { status: 400 })
    }

    const result = await updateStore((state) => {
      state.weeklyMenu = menu

      return {
        status: 200 as const,
        body: {
          success: true,
          data: state.weeklyMenu,
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
