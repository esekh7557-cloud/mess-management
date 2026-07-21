// In a real application, these types would likely be in a shared library.

export interface Student {
    id: string
    name: string
    email: string
    hostel: string
    room: string
    semester: number
    balance: number
    avatar?: string
  }
  
  export interface StudentBalance {
    student_id: string
    total_balance: number
    used_balance: number
    remaining_balance: number
  }
  
  export interface MealAttendance {
    id: string
    student_id: string
    meal_type: 'breakfast' | 'lunch' | 'dinner'
    meal_category: 'veg' | 'nonveg'
    meal_price: number
    date: string
    marked_at: string
  }
  
  
  export interface MenuItem {
    id: string
    name: string
    type: 'veg' | 'non-veg'
  }
  
  export interface DayMenu {
    day: string
    breakfast: MenuItem[]
    lunch: MenuItem[]
    dinner: MenuItem[]
  }
  
  export interface MealSelection {
    day: string
    breakfast: boolean
    lunch: boolean
    dinner: boolean
  }
  
  export interface ExtraItem {
    id: string
    name: string
    price: number
    available: boolean
    category: 'dairy' | 'beverage' | 'snack' | 'fruit'
  }
  
  export interface Transaction {
    id: string
    date: string
    description: string
    amount: number
    type: 'debit' | 'credit'
    category: 'meal' | 'extra' | 'recharge' | 'refund'
  }
  
  export interface Notification {
    id: string
    title: string
    message: string
    date: string
    type: 'info' | 'warning' | 'success'
    read: boolean
  }
  
