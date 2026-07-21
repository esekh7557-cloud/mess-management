import 'server-only'

export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type MealCategory = 'veg' | 'nonveg'
export type UserRole = 'student' | 'admin'

export interface UserAccount {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  hostel?: string
  room?: string
  semester?: number
  balance?: number
}

export interface MealMarkingRecord {
  id: string
  student_id: string
  student_name: string
  meal_type: MealType
  meal_category: MealCategory
  meal_price: number
  marked_at: string
  completed: boolean
}

export interface Notification {
  id: string
  title: string
  message: string
  date: string
  type: 'info' | 'warning' | 'success' | 'error'
  read?: boolean
}

const LOW_BALANCE_THRESHOLD = 500

export function getLowBalanceNotification(studentName: string, remainingBalance: number): Notification {
  return {
    id: `notif-low-balance-${Date.now()}`,
    title: 'Balance Low Alert',
    message: `${studentName}'s wallet is low. Remaining balance is Rs. ${remainingBalance}.`,
    date: new Date().toISOString().split('T')[0],
    type: 'warning',
    read: false,
  }
}

export function shouldCreateLowBalanceAlert(remainingBalance: number) {
  return remainingBalance > 0 && remainingBalance <= LOW_BALANCE_THRESHOLD
}

