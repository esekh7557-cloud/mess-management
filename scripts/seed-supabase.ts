// Run this script with: npx tsx --env-file=.env.local scripts/seed-supabase.ts
import { createClient } from '@supabase/supabase-js'
import {
  students as mockStudents,
  studentBalancesRecord,
  transactions as mockTransactions,
  extraItems as mockExtraItems,
  notifications as mockNotifications,
  weeklyMenu as mockWeeklyMenu,
  defaultMealSelectionTimings,
} from '../lib/mock-data'

// We need the service role key to bypass RLS and insert data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  console.error('Make sure they are defined in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seed() {
  console.log('Seeding database to:', supabaseUrl)
  
  // 1. Seed Users (Students and Admins)
  console.log('Seeding Users...')
  
  // Create admin user
  const adminUser = {
    id: 'ADM001',
    name: 'Admin User',
    email: 'admin@college.edu',
    password: 'password', // In a real app, this should be hashed
    role: 'admin',
  }

  // Map mock students to the users table schema
  const usersToInsert = mockStudents.map(student => ({
    id: student.id,
    name: student.name,
    email: student.email,
    password: 'password', // Default password
    role: 'student',
    hostel: student.hostel,
    room: student.room,
    semester: student.semester,
    balance: studentBalancesRecord[student.id]?.remaining_balance || 0,
  }))

  const { error: usersError } = await supabase
    .from('users')
    .upsert([adminUser, ...usersToInsert])

  if (usersError) console.error('Error inserting users:', usersError)
  else console.log('✅ Users seeded')

  // 2. Seed Extra Items
  console.log('Seeding Extra Items...')
  const { error: extraItemsError } = await supabase
    .from('extra_items')
    .upsert(mockExtraItems)

  if (extraItemsError) console.error('Error inserting extra items:', extraItemsError)
  else console.log('✅ Extra Items seeded')

  // 3. Seed Notifications
  console.log('Seeding Notifications...')
  // Remove the 'read' property from mock notifications (tracked in student_notifications instead)
  const notificationsToInsert = mockNotifications.map(({ read, ...rest }) => rest)
  const { error: notifError } = await supabase
    .from('notifications')
    .upsert(notificationsToInsert)

  if (notifError) console.error('Error inserting notifications:', notifError)
  else console.log('✅ Notifications seeded')

  // 4. Seed Transactions
  console.log('Seeding Transactions...')
  const transactionsToInsert = mockTransactions.map(t => ({
    id: t.id,
    student_id: 'STU001', // Mock data doesn't have student_id on the transaction itself, assuming STU001 for the seeded one
    date: t.date,
    description: t.description,
    amount: t.amount,
    type: t.type,
    category: t.category,
  }))
  
  const { error: txnError } = await supabase
    .from('transactions')
    .upsert(transactionsToInsert)

  if (txnError) console.error('Error inserting transactions:', txnError)
  else console.log('✅ Transactions seeded')

  // 5. Seed Weekly Menu
  console.log('Seeding Weekly Menu...')
  const { error: menuError } = await supabase
    .from('weekly_menu')
    .upsert(mockWeeklyMenu)

  if (menuError) console.error('Error inserting weekly menu:', menuError)
  else console.log('✅ Weekly Menu seeded')

  // 6. Seed App Settings (Timings)
  console.log('Seeding App Settings...')
  const { error: settingsError } = await supabase
    .from('app_settings')
    .upsert({
      key: 'meal_timings',
      value: defaultMealSelectionTimings
    })

  if (settingsError) console.error('Error inserting settings:', settingsError)
  else console.log('✅ App Settings seeded')

  console.log('🎉 Database seeding complete!')
}

seed().catch((error) => {
  console.error('Unhandled error during seeding:', error)
  process.exit(1)
})
