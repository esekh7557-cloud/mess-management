import { NextRequest, NextResponse } from 'next/server'
import {
  getStudentById,
  getStudentVisibleNotifications,
  readStore,
  updateStore,
  upsertStudentNotificationState,
} from '@/lib/server-store'

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get('student_id')

  if (!studentId) {
    return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
  }

  const state = await readStore()

  if (!getStudentById(state, studentId)) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: getStudentVisibleNotifications(state, studentId),
  })
}

export async function PATCH(request: NextRequest) {
  try {
    const { student_id: studentId, action, notificationId } = await request.json()

    if (!studentId || !action) {
      return NextResponse.json({ error: 'student_id and action are required' }, { status: 400 })
    }

    const result = await updateStore((state) => {
      if (!getStudentById(state, studentId)) {
        return { status: 404 as const, body: { error: 'Student not found' } }
      }

      const studentState = upsertStudentNotificationState(state, studentId)

      if (action === 'markRead' && notificationId) {
        if (!studentState.readIds.includes(notificationId)) {
          studentState.readIds.push(notificationId)
        }
      }

      if (action === 'markAllRead') {
        const visibleNotifications = getStudentVisibleNotifications(state, studentId)
        studentState.readIds = Array.from(new Set(visibleNotifications.map((notification) => notification.id)))
      }

      if (action === 'delete' && notificationId) {
        if (!studentState.deletedIds.includes(notificationId)) {
          studentState.deletedIds.push(notificationId)
        }
      }

      return {
        status: 200 as const,
        body: {
          success: true,
          data: getStudentVisibleNotifications(state, studentId),
        },
      }
    })

    return NextResponse.json(result.body, { status: result.status })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
