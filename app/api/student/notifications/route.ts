import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get('student_id')

  if (!studentId) {
    return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1. Check if student exists
  const { data: student, error: studentError } = await supabase
    .from('users')
    .select('id')
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // 2. Fetch all global notifications
  const { data: globalNotifications } = await supabase
    .from('notifications')
    .select('*')
    .order('date', { ascending: false })

  // 3. Fetch student's notification states (is_read, is_deleted)
  const { data: studentStates } = await supabase
    .from('student_notifications')
    .select('*')
    .eq('student_id', studentId)

  // 4. Map them together, filter out deleted ones
  const stateMap = new Map((studentStates || []).map(s => [s.notification_id, s]))

  const visibleNotifications = (globalNotifications || [])
    .filter(notif => {
      const state = stateMap.get(notif.id)
      return !state?.is_deleted
    })
    .map(notif => {
      const state = stateMap.get(notif.id)
      return {
        ...notif,
        read: state?.is_read || false
      }
    })

  return NextResponse.json({
    success: true,
    data: visibleNotifications,
  })
}

export async function PATCH(request: NextRequest) {
  try {
    const { student_id: studentId, action, notificationId } = await request.json()

    if (!studentId || !action) {
      return NextResponse.json({ error: 'student_id and action are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Check if student exists
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (action === 'markRead' && notificationId) {
      // Upsert student_notifications to set is_read = true
      await supabase.from('student_notifications').upsert({
        student_id: studentId,
        notification_id: notificationId,
        is_read: true,
      }, { onConflict: 'student_id,notification_id' })
    }

    if (action === 'delete' && notificationId) {
      // Upsert student_notifications to set is_deleted = true
      await supabase.from('student_notifications').upsert({
        student_id: studentId,
        notification_id: notificationId,
        is_deleted: true,
      }, { onConflict: 'student_id,notification_id' })
    }

    if (action === 'markAllRead') {
      // Find all notifications that aren't deleted and insert/update them to is_read = true
      const { data: globalNotifications } = await supabase.from('notifications').select('id')
      const { data: studentStates } = await supabase.from('student_notifications').select('*').eq('student_id', studentId)
      
      const stateMap = new Map((studentStates || []).map(s => [s.notification_id, s]))
      
      const toUpsert = (globalNotifications || [])
        .filter(notif => {
          const state = stateMap.get(notif.id)
          return !state?.is_deleted
        })
        .map(notif => {
          const state = stateMap.get(notif.id)
          return {
            student_id: studentId,
            notification_id: notif.id,
            is_read: true,
            is_deleted: state?.is_deleted || false
          }
        })
      
      if (toUpsert.length > 0) {
        await supabase.from('student_notifications').upsert(toUpsert, { onConflict: 'student_id,notification_id' })
      }
    }

    // Return the updated visible notifications
    // Fetch all global notifications
    const { data: globalNotifications } = await supabase
      .from('notifications')
      .select('*')
      .order('date', { ascending: false })

    // Fetch updated student's notification states
    const { data: updatedStates } = await supabase
      .from('student_notifications')
      .select('*')
      .eq('student_id', studentId)

    const updatedStateMap = new Map((updatedStates || []).map(s => [s.notification_id, s]))

    const visibleNotifications = (globalNotifications || [])
      .filter(notif => {
        const state = updatedStateMap.get(notif.id)
        return !state?.is_deleted
      })
      .map(notif => {
        const state = updatedStateMap.get(notif.id)
        return {
          ...notif,
          read: state?.is_read || false
        }
      })

    return NextResponse.json({
      success: true,
      data: visibleNotifications,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
