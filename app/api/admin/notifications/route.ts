import { NextRequest, NextResponse } from 'next/server'
import { readStore, updateStore } from '@/lib/server-store'

export async function GET() {
  const state = await readStore()

  return NextResponse.json({
    success: true,
    data: state.notifications,
  })
}

export async function POST(request: NextRequest) {
  try {
    const { title, message, type } = await request.json()

    if (!title || !message || !type) {
      return NextResponse.json({ error: 'title, message, and type are required' }, { status: 400 })
    }

    const result = await updateStore((state) => {
      const notification = {
        id: `notif-${Date.now()}`,
        title,
        message,
        type,
        date: new Date().toISOString().split('T')[0],
        read: false,
      }

      state.notifications.unshift(notification)

      return {
        status: 200 as const,
        body: {
          success: true,
          data: state.notifications,
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const result = await updateStore((state) => {
    state.notifications = state.notifications.filter((notification) => notification.id !== id)

    for (const studentState of Object.values(state.notificationStateByStudent)) {
      studentState.readIds = studentState.readIds.filter((notificationId) => notificationId !== id)
      studentState.deletedIds = studentState.deletedIds.filter((notificationId) => notificationId !== id)
    }

    return {
      status: 200 as const,
      body: {
        success: true,
        data: state.notifications,
      },
    }
  })

  return NextResponse.json(result.body, { status: result.status })
}
