// Types
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

export interface MealSelectionTimings {
  breakfast: {
    startTime: string
    endTime: string
  }
  lunch: {
    startTime: string
    endTime: string
  }
  dinner: {
    startTime: string
    endTime: string
  }
  removeTimeFrame: boolean
}

// Sample Data
const hostelOneStudents: Student[] = [
  {
    id: 'STU001',
    name: 'Sujal Gaonkar',
    email: 'sujal@hostel1.edu',
    hostel: 'Hostel 1 - Block A',
    room: 'H1-101',
    semester: 4,
    balance: 5000,
  },
  {
    id: 'STU002',
    name: 'Aarav Sharma',
    email: 'aarav@hostel1.edu',
    hostel: 'Hostel 1 - Block A',
    room: 'H1-102',
    semester: 3,
    balance: 5000,
  },
  {
    id: 'STU003',
    name: 'Neha Patel',
    email: 'neha@hostel1.edu',
    hostel: 'Hostel 1 - Block A',
    room: 'H1-103',
    semester: 5,
    balance: 5000,
  },
  {
    id: 'STU004',
    name: 'Rohan Das',
    email: 'rohan@hostel1.edu',
    hostel: 'Hostel 1 - Block A',
    room: 'H1-104',
    semester: 2,
    balance: 5000,
  },
  {
    id: 'STU005',
    name: 'Priya Singh',
    email: 'priya@hostel1.edu',
    hostel: 'Hostel 1 - Block A',
    room: 'H1-105',
    semester: 6,
    balance: 5000,
  },
  {
    id: 'STU006',
    name: 'Karan Mehta',
    email: 'karan@hostel1.edu',
    hostel: 'Hostel 1 - Block A',
    room: 'H1-106',
    semester: 1,
    balance: 5000,
  },
  {
    id: 'STU007',
    name: 'Ananya Iyer',
    email: 'ananya@hostel1.edu',
    hostel: 'Hostel 1 - Block A',
    room: 'H1-107',
    semester: 4,
    balance: 5000,
  },
  {
    id: 'STU008',
    name: 'Vikram Rao',
    email: 'vikram@hostel1.edu',
    hostel: 'Hostel 1 - Block A',
    room: 'H1-108',
    semester: 7,
    balance: 5000,
  },
  {
    id: 'STU009',
    name: 'Simran Khan',
    email: 'simran@hostel1.edu',
    hostel: 'Hostel 1 - Block A',
    room: 'H1-109',
    semester: 2,
    balance: 5000,
  },
  {
    id: 'STU010',
    name: 'Aditya Joshi',
    email: 'aditya@hostel1.edu',
    hostel: 'Hostel 1 - Block A',
    room: 'H1-110',
    semester: 8,
    balance: 5000,
  },
]

export const currentStudent: Student = hostelOneStudents[0]

export const students: Student[] = hostelOneStudents

export const studentBalances: StudentBalance[] = hostelOneStudents.map((student) => ({
  student_id: student.id,
  total_balance: 10000,
  used_balance: 5000,
  remaining_balance: 5000,
}))

// Convert studentBalances array to Record for easier access
export const studentBalancesRecord: Record<string, StudentBalance> = studentBalances.reduce(
  (acc, balance) => {
    acc[balance.student_id] = balance
    return acc
  },
  {} as Record<string, StudentBalance>
)

export const mealMarkings: MealAttendance[] = []

// Export as empty array with correct structure for server-store
export const mealMarkingsRecords: Array<{
  id: string
  student_id: string
  student_name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner'
  meal_category: 'veg' | 'nonveg'
  meal_price: number
  marked_at: string
  completed: boolean
}> = []

export const extraItems: ExtraItem[] = [
  {
    id: 'EXT001',
    name: 'Milk',
    price: 30,
    available: true,
    category: 'dairy',
  },
  {
    id: 'EXT002',
    name: 'Tea',
    price: 20,
    available: true,
    category: 'beverage',
  },
  {
    id: 'EXT003',
    name: 'Cookies',
    price: 50,
    available: true,
    category: 'snack',
  },
]

export const notifications: Notification[] = [
  {
    id: 'NTF001',
    title: 'Balance Low',
    message: 'Your balance is running low. Please recharge.',
    date: new Date().toISOString(),
    type: 'warning',
    read: false,
  },
]


export const transactions: Transaction[] = [
  {
    id: 'TRN001',
    date: new Date().toISOString(),
    description: 'Breakfast - Veg',
    amount: 40,
    type: 'debit',
    category: 'meal',
  },
]

export const weeklyMenu: DayMenu[] = [
  {
    day: 'Monday',
    breakfast: [
      { id: 'M-B1', name: 'Idli Sambar', type: 'veg' },
      { id: 'M-B2', name: 'Medu Vada', type: 'veg' },
    ],
    lunch: [
      { id: 'M-L1', name: 'Rajma Chawal', type: 'veg' },
      { id: 'M-L2', name: 'Chicken Curry', type: 'non-veg' },
    ],
    dinner: [
      { id: 'M-D1', name: 'Paneer Butter Masala', type: 'veg' },
      { id: 'M-D2', name: 'Roti & Dal', type: 'veg' },
    ],
  },
  {
    day: 'Tuesday',
    breakfast: [
      { id: 'T-B1', name: 'Poha', type: 'veg' },
      { id: 'T-B2', name: 'Jalebi', type: 'veg' },
    ],
    lunch: [
      { id: 'T-L1', name: 'Chole Bhature', type: 'veg' },
      { id: 'T-L2', name: 'Egg Curry', type: 'non-veg' },
    ],
    dinner: [
      { id: 'T-D1', name: 'Veg Pulao', type: 'veg' },
      { id: 'T-D2', name: 'Dal Tadka', type: 'veg' },
    ],
  },
  {
    day: 'Wednesday',
    breakfast: [
      { id: 'W-B1', name: 'Aloo Paratha', type: 'veg' },
      { id: 'W-B2', name: 'Curd', type: 'veg' },
    ],
    lunch: [
      { id: 'W-L1', name: 'Veg Biryani', type: 'veg' },
      { id: 'W-L2', name: 'Chicken Biryani', type: 'non-veg' },
    ],
    dinner: [
      { id: 'W-D1', name: 'Malai Kofta', type: 'veg' },
      { id: 'W-D2', name: 'Naan', type: 'veg' },
    ],
  },
  {
    day: 'Thursday',
    breakfast: [
      { id: 'Th-B1', name: 'Upma', type: 'veg' },
      { id: 'Th-B2', name: 'Banana', type: 'veg' },
    ],
    lunch: [
      { id: 'Th-L1', name: 'Kadhi Pakora', type: 'veg' },
      { id: 'Th-L2', name: 'Fish Fry', type: 'non-veg' },
    ],
    dinner: [
      { id: 'Th-D1', name: 'Mixed Veg', type: 'veg' },
      { id: 'Th-D2', name: 'Dal Makhani', type: 'veg' },
    ],
  },
  {
    day: 'Friday',
    breakfast: [
      { id: 'F-B1', name: 'Puri Bhaji', type: 'veg' },
      { id: 'F-B2', name: 'Tea', type: 'veg' },
    ],
    lunch: [
      { id: 'F-L1', name: 'Dal Bati Churma', type: 'veg' },
      { id: 'F-L2', name: 'Mutton Curry', type: 'non-veg' },
    ],
    dinner: [
      { id: 'F-D1', name: 'Palak Paneer', type: 'veg' },
      { id: 'F-D2', name: 'Jeera Rice', type: 'veg' },
    ],
  },
  {
    day: 'Saturday',
    breakfast: [
      { id: 'S-B1', name: 'Masala Dosa', type: 'veg' },
      { id: 'S-B2', name: 'Filter Coffee', type: 'veg' },
    ],
    lunch: [
      { id: 'S-L1', name: 'Pav Bhaji', type: 'veg' },
      { id: 'S-L2', name: 'Chicken Tikka', type: 'non-veg' },
    ],
    dinner: [
      { id: 'S-D1', name: 'Veg Fried Rice', type: 'veg' },
      { id: 'S-D2', name: 'Chilli Paneer', type: 'veg' },
    ],
  },
  {
    day: 'Sunday',
    breakfast: [
      { id: 'Su-B1', name: 'Chocos & Milk', type: 'veg' },
      { id: 'Su-B2', name: 'Boiled Eggs', type: 'non-veg' },
    ],
    lunch: [
      { id: 'Su-L1', name: 'South Indian Thali', type: 'veg' },
      { id: 'Su-L2', name: 'Fish Curry', type: 'non-veg' },
    ],
    dinner: [
      { id: 'Su-D1', name: 'Mushroom Masala', type: 'veg' },
      { id: 'Su-D2', name: 'Tandoori Roti', type: 'veg' },
    ],
  },
]

export const defaultMealSelectionTimings: MealSelectionTimings = {
  breakfast: {
    startTime: '06:00',
    endTime: '10:00',
  },
  lunch: {
    startTime: '11:00',
    endTime: '14:00',
  },
  dinner: {
    startTime: '18:00',
    endTime: '21:00',
  },
  removeTimeFrame: false,
}
