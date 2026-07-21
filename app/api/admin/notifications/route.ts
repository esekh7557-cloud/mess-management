import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createAdminClient()

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: notifications || [],
  })
}

export async function POST(request: NextRequest) {
  try {
    const { title, message, type } = await request.json()

    if (!title || !message || !type) {
      return NextResponse.json({ error: 'title, message, and type are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const newNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      date: new Date().toISOString(), // Use full ISO for better sorting
    }

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(newNotification)

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    // Refetch to return list
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .order('date', { ascending: false })

    return NextResponse.json({
      success: true,
      data: notifications || [],
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error: deleteError } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }

  // Refetch to return list
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('date', { ascending: false })

  return NextResponse.json({
    success: true,
    data: notifications || [],
  })
}
